import { t, getLanguage } from '../utils/i18n';
import { modalManager } from '../utils/modalManager';
import { resolvePinCity } from '../utils/cities';
import { processPotholeImage } from '../utils/imageProcessor';
import { attachPhotoToPin, uploadPotholePhoto, isPinPhotoApproved, fetchPinComments, addPinComment, deduplicateComments } from '../services/firebase';
import { showToast } from './Toast';
import { openPhotoLightbox } from './PhotoLightbox';
import { hasUserReportedOrUpvoted, hasUserUpvoted, getActionQuota, recordLocalCountedAction } from '../utils/upvoteStorage';
import { getModalParentContainer, isMapFullscreen } from '../utils/domUtils';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return t('timeJustNow');
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return t('timeJustNow');
  if (diffSec < 3600) return t('timeMinutesAgo', { n: Math.floor(diffSec / 60) });
  if (diffSec < 86400) return t('timeHoursAgo', { n: Math.floor(diffSec / 3600) });
  return t('timeDaysAgo', { n: Math.floor(diffSec / 86400) });
}

export function openPinDetailModal(pin) {
  if (!pin) return;
  if (window.__khaddaClosePanels) {
    window.__khaddaClosePanels();
  }

  const parent = getModalParentContainer();
  const isFs = isMapFullscreen();

  let container = document.getElementById('pin-detail-modal-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pin-detail-modal-container';
  }
  container.className = isFs ? 'z-[100005] relative' : 'z-[1200] relative';
  if (container.parentElement !== parent) {
    parent.appendChild(container);
  }

  const isHindi = getLanguage() === 'hindi';
  const safeLandmark = escapeHtml(pin.landmark || t('defaultLandmark'));
  const cityName = resolvePinCity(pin, isHindi);
  const reportCount = pin.reportCount || 1;
  const upvoteCount = pin.upvotes || 0;
  const isLiked = hasUserReportedOrUpvoted(pin.id);
  const timeStr = formatRelativeTime(pin.createdAt || pin.lastReportedAt);
  const resolvedRank = pin.rank || (window.__khaddaGetPinRank ? window.__khaddaGetPinRank(pin.id) : null);

  // Collect all uploaded photos
  const allImages = [];
  if (Array.isArray(pin.images)) {
    pin.images.forEach((img) => {
      if (img && typeof img === 'string' && !allImages.includes(img)) allImages.push(img);
    });
  }
  if (Array.isArray(pin.photos)) {
    pin.photos.forEach((p) => {
      const url = typeof p === 'string' ? p : (p.url || p.imageUrl);
      if (url && !allImages.includes(url)) allImages.push(url);
    });
  }
  if (pin.imageUrl && !allImages.includes(pin.imageUrl)) {
    allImages.unshift(pin.imageUrl);
  }
  if (pin.thumbnailUrl && !allImages.includes(pin.thumbnailUrl)) {
    if (allImages.length === 0) allImages.push(pin.thumbnailUrl);
  }

  let activePhotoIndex = 0;
  const photoApproved = isPinPhotoApproved(pin);
  const isPendingPhoto = !photoApproved && (allImages.length > 0 || pin.photoStatus === 'pending');
  const isRejectedPhoto = pin.photoStatus === 'rejected';

  // Generate deep-link share URL for this pin
  const origin = window.location.origin;
  const sharePinUrl = `${origin}/#pin=${pin.id}`;
  const whatsappText = t('whatsappShareTemplate', {
    landmark: safeLandmark,
    count: reportCount,
    url: sharePinUrl
  });
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  const isSevere = reportCount >= 3;
  const backdropZClass = isFs ? 'z-[100005]' : 'z-[1200]';
  const topPaddingClass = isFs ? 'pt-4 sm:pt-6' : 'pt-[calc(var(--header-h,80px)+12px)]';

  container.innerHTML = `
    <!-- Center Modal Overlay -->
    <div id="pin-modal-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-xs ${backdropZClass} flex items-center justify-center ${topPaddingClass} pb-4 px-3 sm:px-6 transition-opacity duration-200">
      <!-- Centered Card (Reduced 20% in size & constrained below header) -->
      <div
        id="pin-modal-card"
        class="relative w-full max-w-[315px] sm:max-w-[350px] max-h-[75dvh] sm:max-h-[78dvh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 text-[var(--text)]"
        onclick="event.stopPropagation()"
      >
        <!-- Floating Close Button (Fallback when no approved photo container is shown) -->
        ${!(photoApproved && allImages.length > 0) ? `
          <button
            id="btn-close-pin-modal"
            type="button"
            class="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-slate-900/90 text-white border border-white/30 hover:bg-rose-600 hover:border-rose-400 flex items-center justify-center transition-all duration-200 shadow-lg z-40 cursor-pointer active:scale-90"
            aria-label="Close"
            title="Close"
          >
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        ` : ''}

        <!-- Scrollable Content -->
        <div class="overflow-y-auto overscroll-contain p-3.5 sm:p-4 space-y-3">
          <!-- Photo Gallery / Moderation Status Section -->
          ${photoApproved && allImages.length > 0 ? `
            <div class="space-y-2">
              <div id="gallery-main-container" class="w-full h-48 sm:h-52 rounded-2xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] relative shadow-inner flex items-center justify-center select-none cursor-zoom-in group">
                <img
                  id="gallery-main-img"
                  src="${allImages[0]}"
                  alt="Pothole Photo"
                  loading="eager"
                  decoding="async"
                  class="w-full h-full object-cover transition-all duration-200 group-hover:scale-105"
                  onerror="this.parentElement.style.display='none'"
                />

                <!-- Unified Right Action Column: Close, Like & Comments with Equal Vertical Spacing -->
                <div class="absolute inset-y-3 right-3 flex flex-col items-center justify-between z-30 pointer-events-auto">
                  <!-- Close Button -->
                  <div class="flex flex-col items-center pb-1">
                    <button
                      id="btn-close-pin-modal"
                      type="button"
                      class="w-9 h-9 rounded-full bg-black/75 hover:bg-rose-600 backdrop-blur-md text-white border border-white/30 hover:border-rose-400 flex items-center justify-center transition-all duration-200 shadow-lg cursor-pointer active:scale-90"
                      aria-label="Close"
                      title="Close"
                    >
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  <!-- Reel Like Button & Count -->
                  <div class="flex flex-col items-center">
                    <button
                      id="photo-reel-like-btn"
                      type="button"
                      title="${isLiked ? (isHindi ? 'पसंद किया (Liked)' : 'Liked') : (isHindi ? 'लाइक करें' : 'Like')}"
                      class="w-9 h-9 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md border flex items-center justify-center transition-all duration-200 shadow-lg cursor-pointer active:scale-85 group ${isLiked ? 'text-rose-500 border-rose-500/60 bg-rose-950/70' : 'text-white border-white/30'}"
                    >
                      <svg class="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 ${isLiked ? 'fill-rose-500 text-rose-500 stroke-rose-500' : 'fill-none stroke-current'}" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>
                    <span id="photo-reel-like-count" class="text-[10px] font-heading font-extrabold text-white drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)] mt-0.5 tabular-nums leading-none">
                      ${upvoteCount}
                    </span>
                  </div>

                  <!-- Reel Comments Button & Label -->
                  <div class="flex flex-col items-center">
                    <button
                      id="photo-reel-comment-btn"
                      type="button"
                      title="${isHindi ? 'कमेंट्स देखें' : 'View Comments'}"
                      class="w-9 h-9 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all duration-200 shadow-lg cursor-pointer active:scale-85 group text-white"
                    >
                      <svg class="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    <span id="photo-reel-comment-count" class="text-[10px] font-heading font-extrabold text-white drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)] mt-0.5 tabular-nums leading-none">
                      1
                    </span>
                  </div>
                </div>

                <!-- Zoom Hint Badge (Bottom Left) -->
                <div class="absolute bottom-2.5 left-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[10px] font-heading font-bold border border-white/20 flex items-center gap-1.5 shadow-md pointer-events-none transition group-hover:scale-105">
                  <svg class="w-3.5 h-3.5 text-[var(--primary-ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/></svg>
                  <span>${isHindi ? 'बड़ा देखें' : 'Zoom'}</span>
                </div>

                <!-- Multi-Photo Count Badge -->
                ${allImages.length > 1 ? `
                  <div class="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full text-[11px] font-heading font-bold text-white flex items-center gap-1.5 shadow-md z-10 pointer-events-none">
                    <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3" stroke-width="2"/></svg>
                    <span id="gallery-counter">1 / ${allImages.length} ${isHindi ? 'फ़ोटो' : 'Photos'}</span>
                  </div>

                  <!-- Prev Arrow Button -->
                  <button
                    id="btn-gallery-prev"
                    type="button"
                    aria-label="Previous photo"
                    class="absolute left-2.5 bottom-10 w-7 h-7 rounded-full bg-black/60 hover:bg-[var(--primary)] text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition shadow-lg z-20 cursor-pointer active:scale-90"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
                  </button>

                  <!-- Next Arrow Button -->
                  <button
                    id="btn-gallery-next"
                    type="button"
                    aria-label="Next photo"
                    class="absolute left-11 bottom-10 w-7 h-7 rounded-full bg-black/60 hover:bg-[var(--primary)] text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition shadow-lg z-20 cursor-pointer active:scale-90"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                  </button>
                ` : ''}
              </div>

              <!-- Multi-Photo Thumbnail Strip -->
              ${allImages.length > 1 ? `
                <div class="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
                  ${allImages.map((imgUrl, idx) => `
                    <button
                      type="button"
                      data-thumb-idx="${idx}"
                      class="gallery-thumb-btn flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${idx === 0 ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/40 scale-105' : 'border-[var(--border)] opacity-60 hover:opacity-100'}"
                    >
                      <img src="${imgUrl}" alt="thumb ${idx + 1}" class="w-full h-full object-cover" />
                    </button>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          ` : isPendingPhoto ? `
            <!-- Photo Under Review Card -->
            <div class="w-full p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center text-center gap-2.5 relative overflow-hidden shadow-inner">
              <div class="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center text-2xl animate-pulse">
                <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div class="space-y-1">
                <div class="text-sm font-heading font-bold text-amber-600 dark:text-amber-400">
                  ${t('photoUnderReviewTitle')}
                </div>
                <div class="text-[11px] text-[var(--muted)] max-w-xs leading-relaxed">
                  ${t('photoUnderReviewDesc')}
                </div>
              </div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/40">
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>${t('photoUnderReviewBadge')}</span>
              </div>
            </div>
          ` : isRejectedPhoto ? `
            <!-- Photo Rejected Card -->
            <div class="w-full p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-left">
              <div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center text-lg shrink-0">
                <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </div>
              <div>
                <div class="text-xs sm:text-sm font-heading font-bold text-rose-600 dark:text-rose-400">
                  ${t('photoRejectedTitle')}
                </div>
                <div class="text-[11px] text-[var(--muted)] mt-0.5">
                  ${pin.photoRejectedReason || t('photoRejectedDesc')}
                </div>
              </div>
            </div>
          ` : `
            <div class="w-full h-28 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col items-center justify-center text-[var(--muted)] gap-1">
              <svg class="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span class="text-xs font-medium">${isHindi ? 'फ़ोटो उपलब्ध नहीं है' : 'No photo uploaded'}</span>
            </div>
          `}

          <!-- Header Badges: Location + Time -->
          <div class="flex items-center justify-between gap-2">
            <button
              id="pin-modal-location-btn"
              type="button"
              title="${isHindi ? 'मैप पर स्थान देखें' : 'View location on map'}"
              aria-label="${isHindi ? 'मैप पर स्थान देखें' : 'View location on map'}"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] transition cursor-pointer active:scale-95 group shadow-xs"
            >
              <svg class="w-3.5 h-3.5 text-[var(--primary-ink)] group-hover:scale-110 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>${cityName}</span>
              ${resolvedRank ? `
                <span class="ml-0.5 px-1.5 py-0.2 rounded-md bg-[var(--primary)] text-[var(--primary-ink)] font-bold text-[10px] font-mono tabular-nums">
                  #${resolvedRank}
                </span>
              ` : ''}
            </button>

            <span class="text-[11px] text-[var(--muted)] font-mono font-medium">${timeStr}</span>
          </div>


          <!-- Actions: Add Photo & WhatsApp Share (Flag button removed) -->
          <div class="pt-2 border-t border-[var(--border)] flex items-center gap-2">
            <!-- Add Photo Button -->
            <input type="file" id="modal-add-photo-input" accept="image/jpeg,image/png,image/webp" capture="environment" class="hidden" />
            <button
              id="pin-modal-add-photo-btn"
              type="button"
              class="btn-secondary flex-1 py-2.5 px-3 font-heading font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 text-center cursor-pointer shadow-xs"
            >
              <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3" stroke-width="2"/></svg>
              <span>${isHindi ? '+ फ़ोटो जोड़ें' : '+ Add Photo'}</span>
            </button>

            <!-- WhatsApp Share Button -->
            <a
              href="${whatsappShareUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary flex-1 py-2.5 px-3 font-heading font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 text-center cursor-pointer shadow-xs"
            >
              <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              <span>${t('shareWhatsapp')}</span>
            </a>
          </div>
        </div>

        <!-- Instagram Reel-Style Comments Overlay (Opened on clicking Comments) -->
        <div
          id="pin-comments-overlay"
          class="hidden absolute inset-0 z-50 bg-[var(--surface)] flex flex-col rounded-2xl animate-in slide-in-from-bottom-5 duration-200"
        >
          <!-- Top Bar / Header -->
          <div class="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)] shrink-0">
            <div class="flex items-center gap-2 min-w-0">
              <svg class="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 class="font-heading font-extrabold text-sm text-[var(--text)]">
                ${isHindi ? 'कमेंट्स' : 'Comments'}
              </h3>
              <span id="overlay-comments-count-badge" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] tabular-nums">
                1
              </span>
            </div>
            <button
              id="btn-close-comments-overlay"
              type="button"
              class="w-7 h-7 rounded-full bg-[var(--surface)] hover:bg-rose-500 hover:text-white text-[var(--muted)] border border-[var(--border)] flex items-center justify-center transition cursor-pointer active:scale-95"
              aria-label="Close comments"
              title="Close"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Scrollable Comments Feed -->
          <div id="comments-list-container" class="flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-3">
            <!-- Pinned Original Report Description (Top Comment) -->
            <div class="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5 shadow-xs">
              <div class="flex items-center justify-between text-[11px]">
                <span class="inline-flex items-center gap-1.5 font-bold text-[var(--accent)] font-heading">
                  <span class="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
                  ${isHindi ? 'नागरिक रिपोर्ट (मूल विवरण)' : 'Original Report'}
                </span>
                <span class="text-[10px] text-[var(--muted)] font-mono">${timeStr}</span>
              </div>
              <p class="text-xs sm:text-sm text-[var(--text)] leading-relaxed font-semibold">
                ${safeLandmark}
              </p>
            </div>

            <!-- Dynamic List of User Comments -->
            <div id="dynamic-comments-list" class="space-y-2.5"></div>
          </div>

          <!-- Sticky Bottom Input Bar -->
          <form id="reel-comment-form" class="p-2.5 border-t border-[var(--border)] bg-[var(--surface-2)]/95 flex items-center gap-2 shrink-0">
            <div class="relative flex-1 flex items-center">
              <input
                id="reel-comment-input"
                type="text"
                autocomplete="off"
                placeholder="${isHindi ? 'कमेंट लिखें (अधिकतम 50 अक्षर)...' : 'Add a comment (max 50 chars)...'}"
                maxlength="50"
                class="w-full pl-3 pr-11 py-2 text-xs rounded-xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] placeholder:text-[var(--muted)] transition"
              />
              <span id="reel-comment-char-count" class="absolute right-2.5 text-[10px] font-mono text-[var(--muted)] pointer-events-none tabular-nums">
                0/50
              </span>
            </div>
            <button
              id="btn-submit-reel-comment"
              type="submit"
              class="w-8 h-8 rounded-xl bg-[var(--primary)] text-[var(--primary-ink)] flex items-center justify-center font-bold active:scale-90 transition cursor-pointer shrink-0 disabled:opacity-40 shadow-xs"
              title="${isHindi ? 'भेजें' : 'Send'}"
            >
              <svg class="w-4 h-4 rotate-90" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m-7 7l7-7 7 7"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  const backdrop = document.getElementById('pin-modal-backdrop');
  const closeBtn = document.getElementById('btn-close-pin-modal');
  const addPhotoInput = container.querySelector('#modal-add-photo-input');
  const addPhotoBtn = container.querySelector('#pin-modal-add-photo-btn');

  // Add Photo Listener with Rate Limit Check
  addPhotoBtn?.addEventListener('click', () => {
    const quota = getActionQuota();
    if (quota.isLimitReached) {
      showToast(t('nextReportAvailable', { time: quota.waitFormatted || '24 घंटे' }), 'warning', 6000);
      return;
    }
    addPhotoInput?.click();
  });

  addPhotoInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const quota = getActionQuota();
    if (quota.isLimitReached) {
      showToast(t('nextReportAvailable', { time: quota.waitFormatted || '24 घंटे' }), 'warning', 6000);
      return;
    }

    showToast(isHindi ? 'फ़ोटो तैयार हो रही है...' : 'Processing photo...', 'info', 2000);
    try {
      const processed = await processPotholeImage(file);
      let imgUrl = null;
      try {
        imgUrl = await uploadPotholePhoto(null, processed.mainBlob, false);
      } catch (upErr) {
        console.warn('Storage notice:', upErr);
      }
      if (!imgUrl && processed.mainDataUrl) {
        imgUrl = processed.mainDataUrl;
      }

      if (imgUrl) {
        if (!Array.isArray(pin.images)) {
          pin.images = pin.imageUrl ? [pin.imageUrl] : [];
        }
        pin.images.unshift(imgUrl);
        pin.imageUrl = imgUrl;
        pin.photoStatus = 'pending';
        pin.photoApproved = false;
        pin.reportCount = (pin.reportCount || 1) + 1;

        // Record locally counted action
        recordLocalCountedAction(pin.id);

        // Persist to Firestore
        await attachPhotoToPin(pin.id, imgUrl, imgUrl);
        showToast(isHindi ? 'फ़ोटो समीक्षा के लिए भेज दी गई है (एडमिन अप्रूवल पेंडिंग)' : 'Photo submitted for admin approval!', 'info', 4000);
        
        // Re-render pins so blinking/badges update immediately if 5+ photos/reports
        if (window.__khaddaReRenderPins) {
          window.__khaddaReRenderPins();
        }

        openPinDetailModal(pin);
      }
    } catch (err) {
      console.error('Error adding photo:', err);
      showToast(isHindi ? 'फ़ोटो जोड़ने में त्रुटि हुई' : 'Failed to add photo', 'error');
    }
  });

  // Carousel interactive controls
  if (allImages.length > 1) {
    const mainImg = document.getElementById('gallery-main-img');
    const counterText = document.getElementById('gallery-counter');
    const prevBtn = document.getElementById('btn-gallery-prev');
    const nextBtn = document.getElementById('btn-gallery-next');
    const thumbBtns = container.querySelectorAll('.gallery-thumb-btn');
    const galleryContainer = document.getElementById('gallery-main-container');

    const updateGalleryPhoto = (newIdx) => {
      if (newIdx < 0) newIdx = allImages.length - 1;
      if (newIdx >= allImages.length) newIdx = 0;
      activePhotoIndex = newIdx;

      if (mainImg) {
        mainImg.style.opacity = '0.3';
        setTimeout(() => {
          mainImg.src = allImages[activePhotoIndex];
          mainImg.style.opacity = '1';
        }, 100);
      }

      if (counterText) {
        counterText.innerText = `${activePhotoIndex + 1} / ${allImages.length} ${isHindi ? 'फ़ोटो' : 'Photos'}`;
      }

      thumbBtns.forEach((btn, idx) => {
        if (idx === activePhotoIndex) {
          btn.className = 'gallery-thumb-btn flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-400 ring-2 ring-amber-400/40 scale-105 transition-all';
        } else {
          btn.className = 'gallery-thumb-btn flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-700 opacity-60 hover:opacity-100 transition-all';
        }
      });
    };

    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      updateGalleryPhoto(activePhotoIndex - 1);
    });

    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      updateGalleryPhoto(activePhotoIndex + 1);
    });

    thumbBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.getAttribute('data-thumb-idx'));
        updateGalleryPhoto(idx);
      });
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    galleryContainer?.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    galleryContainer?.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (diff > 40) {
        updateGalleryPhoto(activePhotoIndex - 1);
      } else if (diff < -40) {
        updateGalleryPhoto(activePhotoIndex + 1);
      }
    }, { passive: true });
  }

  // --- Instagram Reels-Style Comments Sheet Logic ---
  const commentsOverlay = container.querySelector('#pin-comments-overlay');
  const closeCommentsOverlayBtn = container.querySelector('#btn-close-comments-overlay');
  const dynamicCommentsList = container.querySelector('#dynamic-comments-list');
  const reelCommentForm = container.querySelector('#reel-comment-form');
  const reelCommentInput = container.querySelector('#reel-comment-input');
  const reelCommentSubmitBtn = container.querySelector('#btn-submit-reel-comment');
  const overlayCommentsCountBadge = container.querySelector('#overlay-comments-count-badge');
  const photoReelCommentCount = container.querySelector('#photo-reel-comment-count');
  const commentsListContainer = container.querySelector('#comments-list-container');

  let cachedComments = [];
  let isCommentsLoaded = false;

  const updateCommentsCountBadges = (count) => {
    const text = String(count);
    if (overlayCommentsCountBadge) overlayCommentsCountBadge.textContent = text;
    if (photoReelCommentCount) photoReelCommentCount.textContent = text;
  };

  const renderCommentsList = (comments) => {
    if (!dynamicCommentsList) return;
    if (!comments || comments.length === 0) {
      dynamicCommentsList.innerHTML = `
        <div id="no-comments-placeholder" class="py-4 text-center text-xs text-[var(--muted)]">
          ${isHindi ? 'अभी कोई अन्य कमेंट नहीं है। पहला कमेंट जोड़ें!' : 'No comments yet. Be the first to comment!'}
        </div>
      `;
      return;
    }

    dynamicCommentsList.innerHTML = comments.map(c => `
      <div class="p-2.5 rounded-xl bg-[var(--surface-2)]/70 border border-[var(--border)] space-y-1 text-left animate-in fade-in duration-150">
        <div class="flex items-center justify-between text-[10px]">
          <span class="inline-flex items-center gap-1 font-semibold text-[var(--muted)]">
            <svg class="w-3 h-3 text-[var(--muted)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <span>${isHindi ? 'नागरिक' : 'Citizen'}</span>
          </span>
          <span class="text-[10px] text-[var(--muted)] font-mono">${formatRelativeTime(c.createdAt)}</span>
        </div>
        <p class="text-xs text-[var(--text)] leading-relaxed break-words font-medium">
          ${escapeHtml(c.text)}
        </p>
      </div>
    `).join('');
  };

  let loadCommentsPromise = null;
  const loadComments = async () => {
    if (loadCommentsPromise) return loadCommentsPromise;
    loadCommentsPromise = (async () => {
      try {
        const comments = await fetchPinComments(pin.id);
        cachedComments = deduplicateComments(comments);
        isCommentsLoaded = true;
        renderCommentsList(cachedComments);
        // Total count = 1 (original landmark description) + cachedComments.length
        updateCommentsCountBadges(1 + cachedComments.length);
      } catch (err) {
        console.warn('Error loading comments:', err);
      } finally {
        loadCommentsPromise = null;
      }
    })();
    return loadCommentsPromise;
  };

  // Eagerly pre-load comments so counts are accurate immediately
  loadComments();

  const openCommentsOverlay = async () => {
    if (!commentsOverlay) return;
    commentsOverlay.classList.remove('hidden');
    if (!isCommentsLoaded) {
      await loadComments();
    }
    setTimeout(() => {
      reelCommentInput?.focus();
    }, 150);
  };

  const closeCommentsOverlay = () => {
    if (!commentsOverlay) return;
    commentsOverlay.classList.add('hidden');
  };

  // Trigger for opening comments (Photo Reels Comment button)
  const photoCommentBtn = container.querySelector('#photo-reel-comment-btn');

  photoCommentBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openCommentsOverlay();
  });

  closeCommentsOverlayBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCommentsOverlay();
  });

  // Enforce 50-character limit & update live counter
  const reelCommentCharCount = container.querySelector('#reel-comment-char-count');
  reelCommentInput?.addEventListener('input', () => {
    if (reelCommentInput.value.length > 50) {
      reelCommentInput.value = reelCommentInput.value.slice(0, 50);
    }
    if (reelCommentCharCount) {
      reelCommentCharCount.textContent = `${reelCommentInput.value.length}/50`;
    }
  });

  // Handle posting new comment with rapid double-click guard & deduplication
  let isSubmittingComment = false;
  reelCommentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmittingComment) return;

    const text = reelCommentInput?.value?.trim().slice(0, 50);
    if (!text) return;

    isSubmittingComment = true;
    if (reelCommentSubmitBtn) reelCommentSubmitBtn.disabled = true;

    try {
      const newComment = await addPinComment(pin.id, text);
      if (reelCommentInput) reelCommentInput.value = '';
      if (reelCommentCharCount) reelCommentCharCount.textContent = '0/50';

      if (newComment) {
        // Deduplicate immediately against existing cached comments
        cachedComments = deduplicateComments([...cachedComments, newComment]);
        renderCommentsList(cachedComments);
        updateCommentsCountBadges(1 + cachedComments.length);

        // Scroll to latest comment
        setTimeout(() => {
          if (commentsListContainer) {
            commentsListContainer.scrollTop = commentsListContainer.scrollHeight;
          }
        }, 50);

        showToast(isHindi ? 'कमेंट पोस्ट हो गया!' : 'Comment posted!', 'success', 2500);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      showToast(isHindi ? 'कमेंट पोस्ट करने में त्रुटि हुई' : 'Failed to post comment', 'error', 3000);
    } finally {
      isSubmittingComment = false;
      if (reelCommentSubmitBtn) reelCommentSubmitBtn.disabled = false;
    }
  });

  // Reel Like button listener (Strict 1 like per user per report)
  const photoLikeBtn = container.querySelector('#photo-reel-like-btn');
  const photoLikeCountEl = container.querySelector('#photo-reel-like-count');
  let isLikeClicked = isLiked;

  photoLikeBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (isLikeClicked || hasUserReportedOrUpvoted(pin.id)) {
      showToast(t('alreadyReportedAlert'), 'warning');
      return;
    }

    isLikeClicked = true;

    // Immediate optimistic UI update so repeat taps are visually & functionally locked
    photoLikeBtn.classList.remove('text-white', 'border-white/30');
    photoLikeBtn.classList.add('text-rose-500', 'border-rose-500/50', 'bg-rose-950/60');
    const heartSvg = photoLikeBtn.querySelector('svg');
    if (heartSvg) {
      heartSvg.classList.remove('fill-none', 'stroke-current');
      heartSvg.classList.add('fill-rose-500', 'text-rose-500', 'stroke-rose-500');
    }
    if (photoLikeCountEl) {
      photoLikeCountEl.textContent = String(upvoteCount + 1);
    }

    if (window.__khaddaUpvotePin) {
      await window.__khaddaUpvotePin(pin.id, pin);
    }
  });

  // Open Fullscreen Photo Lightbox on Photo Click (excluding controls & reel buttons)
  const galleryMainContainer = document.getElementById('gallery-main-container');
  galleryMainContainer?.addEventListener('click', (e) => {
    if (
      e.target.closest('#btn-close-pin-modal') ||
      e.target.closest('#btn-gallery-prev') ||
      e.target.closest('#btn-gallery-next') ||
      e.target.closest('#photo-reel-like-btn') ||
      e.target.closest('#photo-reel-comment-btn')
    ) {
      return;
    }
    if (allImages.length > 0) {
      openPhotoLightbox(allImages, activePhotoIndex, safeLandmark);
    }
  });

  const closeModal = (notifyManager = true) => {
    window.removeEventListener('keydown', handleKeyDown);
    container.innerHTML = '';
    if (notifyManager) {
      modalManager.notifyClosed('pin-detail-modal');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (commentsOverlay && !commentsOverlay.classList.contains('hidden')) {
        e.stopPropagation();
        closeCommentsOverlay();
        return;
      }
      closeModal(true);
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  modalManager.openModal('pin-detail-modal', () => closeModal(false));

  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeModal(true);
    }
  });

  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal(true);
  });

  const locationBtn = container.querySelector('#pin-modal-location-btn');
  locationBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
    if (pin.latitude && pin.longitude) {
      if (window.__khaddaFocusPinOnMap) {
        window.__khaddaFocusPinOnMap(pin, resolvedRank);
      } else if (window.__khaddaFlyToPin) {
        window.__khaddaFlyToPin(pin.id, resolvedRank);
      }
    }
  });
}

export function closePinDetailModal() {
  const container = document.getElementById('pin-detail-modal-container');
  if (container) {
    container.innerHTML = '';
  }
  modalManager.notifyClosed('pin-detail-modal');
}

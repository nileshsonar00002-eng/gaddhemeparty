import { t, getLanguage } from '../utils/i18n';
import { modalManager } from '../utils/modalManager';
import { resolvePinCity } from '../utils/cities';
import { processPotholeImage } from '../utils/imageProcessor';
import { attachPhotoToPin, uploadPotholePhoto } from '../services/firebase';
import { showToast } from './Toast';
import { openPhotoLightbox } from './PhotoLightbox';
import { hasUserReportedOrUpvoted, hasUserUpvoted, getActionQuota, recordLocalCountedAction } from '../utils/upvoteStorage';

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
  let container = document.getElementById('pin-detail-modal-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pin-detail-modal-container';
    container.className = 'z-[1200]';
    document.getElementById('app')?.appendChild(container);
  } else {
    container.className = 'z-[1200]';
  }

  const isHindi = getLanguage() === 'hindi';
  const safeLandmark = escapeHtml(pin.landmark || t('defaultLandmark'));
  const cityName = resolvePinCity(pin, isHindi);
  const reportCount = pin.reportCount || 1;
  const upvoteCount = pin.upvotes || 0;
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

  container.innerHTML = `
    <!-- Center Modal Overlay -->
    <div id="pin-modal-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-xs z-[1200] flex items-center justify-center p-4 sm:p-6 transition-opacity duration-200">
      <!-- Centered Card -->
      <div
        id="pin-modal-card"
        class="relative w-full max-w-[360px] sm:max-w-[420px] max-h-[90dvh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onclick="event.stopPropagation()"
      >
        <!-- Floating Close Button (Top Right) -->
        <button
          id="btn-close-pin-modal"
          type="button"
          class="absolute top-3 right-3 w-9 h-9 rounded-full bg-[var(--surface-2)] hover:bg-rose-600 text-[var(--text)] hover:text-white border border-[var(--border)] backdrop-blur-md flex items-center justify-center transition shadow-xl z-30 cursor-pointer active:scale-90"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Scrollable Content -->
        <div class="overflow-y-auto overscroll-contain p-4 space-y-3.5">
          <!-- Photo Gallery / Carousel Section -->
          ${allImages.length > 0 ? `
            <div class="space-y-2">
              <div id="gallery-main-container" class="w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] relative shadow-inner flex items-center justify-center select-none cursor-zoom-in group">
                <img
                  id="gallery-main-img"
                  src="${allImages[0]}"
                  alt="Pothole Photo"
                  loading="eager"
                  decoding="async"
                  class="w-full h-full object-cover transition-all duration-200 group-hover:scale-105"
                  onerror="this.parentElement.style.display='none'"
                />

                <!-- Zoom Hint Badge -->
                <div class="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[10px] font-heading font-bold border border-white/20 flex items-center gap-1.5 shadow-md pointer-events-none transition group-hover:scale-105">
                  <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/></svg>
                  <span>${isHindi ? 'बड़ा देखें' : 'Zoom'}</span>
                </div>

                <!-- Multi-Photo Count Badge -->
                ${allImages.length > 1 ? `
                  <div class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 rounded-full text-[11px] font-heading font-extrabold text-amber-300 flex items-center gap-1.5 shadow-md z-10 pointer-events-none">
                    <span>📸</span>
                    <span id="gallery-counter">1 / ${allImages.length} ${isHindi ? 'फ़ोटो' : 'Photos'}</span>
                  </div>

                  <!-- Prev Arrow Button -->
                  <button
                    id="btn-gallery-prev"
                    type="button"
                    aria-label="Previous photo"
                    class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/75 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700/80 backdrop-blur-md flex items-center justify-center transition shadow-lg z-20 cursor-pointer active:scale-90"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
                  </button>

                  <!-- Next Arrow Button -->
                  <button
                    id="btn-gallery-next"
                    type="button"
                    aria-label="Next photo"
                    class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/75 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700/80 backdrop-blur-md flex items-center justify-center transition shadow-lg z-20 cursor-pointer active:scale-90"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
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
                      class="gallery-thumb-btn flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${idx === 0 ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105' : 'border-[var(--border)] opacity-60 hover:opacity-100'}"
                    >
                      <img src="${imgUrl}" alt="thumb ${idx + 1}" class="w-full h-full object-cover" />
                    </button>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="w-full h-28 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col items-center justify-center text-[var(--muted)] gap-1">
              <span class="text-3xl">🕳️</span>
              <span class="text-xs font-medium">${isHindi ? 'फ़ोटो उपलब्ध नहीं है' : 'No photo uploaded'}</span>
            </div>
          `}

          <!-- Header Badges: Severity + Time + City -->
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-extrabold ${isSevere ? 'bg-rose-500/20 text-rose-400 dark:text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-[var(--accent)] border border-amber-500/40'}">
                <span class="w-2 h-2 rounded-full ${isSevere ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}"></span>
                ${reportCount > 1 ? t('reportedByCount', { count: reportCount }) : t('reportedBySingle')}
              </span>

              <button
                id="pin-modal-location-btn"
                type="button"
                title="${isHindi ? 'मैप पर स्थान देखें' : 'View location on map'}"
                aria-label="${isHindi ? 'मैप पर स्थान देखें' : 'View location on map'}"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--surface-2)] hover:bg-amber-500/20 text-[var(--text)] hover:text-[var(--accent)] border border-[var(--border)] hover:border-amber-500/40 transition cursor-pointer active:scale-95 group shadow-sm"
              >
                <span class="group-hover:scale-110 transition">📍</span>
                <span>${cityName}</span>
                ${resolvedRank ? `
                  <span class="ml-0.5 px-1.5 py-0.2 rounded-md ${resolvedRank === 1 ? 'bg-amber-500 text-slate-950 font-black' : (resolvedRank === 2 ? 'bg-slate-300 text-slate-950 font-black' : (resolvedRank === 3 ? 'bg-amber-700 text-white font-bold' : 'bg-amber-500/20 text-amber-400 font-bold'))} text-[10px] font-mono tabular-nums">
                    #${resolvedRank}
                  </span>
                ` : ''}
              </button>
            </div>

            <span class="text-[11px] text-[var(--muted)] font-mono font-medium">${timeStr}</span>
          </div>

          <!-- Landmark & Location Description -->
          <div class="bg-[var(--surface)] p-3 rounded-2xl border border-[var(--border)]">
            <p class="text-xs sm:text-sm font-semibold text-[var(--text)] leading-relaxed">
              ${safeLandmark}
            </p>
          </div>

          <!-- Actions: +1 Upvote & WhatsApp Share -->
          <div class="pt-2 border-t border-[var(--border)] flex flex-col gap-2.5">
            <!-- +1 Upvote Button -->
            ${hasUserReportedOrUpvoted(pin.id) ? `
              <button
                id="pin-modal-upvote-btn"
                type="button"
                disabled
                class="w-full py-3 px-4 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 font-heading font-extrabold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-default disabled:opacity-90"
              >
                <span class="text-base font-bold">✓</span>
                <span>${t('alreadyReportedButton')}</span>
                ${upvoteCount > 0 ? `<span class="bg-emerald-950/60 text-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-500/30">${upvoteCount}</span>` : ''}
              </button>
            ` : `
              <button
                id="pin-modal-upvote-btn"
                type="button"
                class="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-heading font-extrabold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span class="text-base">👍</span>
                <span>${t('upvoteBtn')}</span>
                ${upvoteCount > 0 ? `<span class="bg-slate-950/25 px-2.5 py-0.5 rounded-full text-xs font-bold">${upvoteCount}</span>` : ''}
              </button>
            `}

            <div class="flex items-center gap-2 flex-wrap">
              <!-- Add Photo Button -->
              <input type="file" id="modal-add-photo-input" accept="image/jpeg,image/png,image/webp" capture="environment" class="hidden" />
              <button
                id="pin-modal-add-photo-btn"
                type="button"
                class="flex-1 py-2.5 px-3 bg-[var(--surface)] hover:bg-[var(--bg-card-hover)] text-[var(--accent)] border border-amber-500/30 font-heading font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 text-center cursor-pointer shadow-sm"
              >
                <span>📸</span>
                <span>${isHindi ? '+ फ़ोटो जोड़ें' : '+ Add Photo'}</span>
              </button>

              <!-- WhatsApp Share Button -->
              <a
                href="${whatsappShareUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 py-2.5 px-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 font-heading font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 text-center"
              >
                <span class="text-sm">💬</span>
                <span>${t('shareWhatsapp')}</span>
              </a>

              <!-- Flag Spam Button -->
              <button
                id="pin-modal-flag-btn"
                type="button"
                title="${t('flagBtn')}"
                class="p-2.5 text-[var(--muted)] hover:text-rose-500 bg-[var(--surface)] hover:bg-[var(--bg-card-hover)] rounded-xl border border-[var(--border)] active:scale-95 transition cursor-pointer flex-shrink-0"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const backdrop = document.getElementById('pin-modal-backdrop');
  const closeBtn = document.getElementById('btn-close-pin-modal');
  const upvoteBtn = document.getElementById('pin-modal-upvote-btn');
  const flagBtn = document.getElementById('pin-modal-flag-btn');
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
        pin.reportCount = (pin.reportCount || 1) + 1;

        // Record locally counted action
        recordLocalCountedAction(pin.id);

        // Persist to Firestore
        await attachPhotoToPin(pin.id, imgUrl, imgUrl);
        showToast(isHindi ? '✅ नई फ़ोटो सफलतापूर्वक जुड़ गई!' : '✅ Photo added successfully!', 'success');
        
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

  // Open Fullscreen Photo Lightbox on Photo Click
  const galleryMainContainer = document.getElementById('gallery-main-container');
  galleryMainContainer?.addEventListener('click', (e) => {
    if (e.target.closest('#btn-gallery-prev') || e.target.closest('#btn-gallery-next')) {
      return;
    }
    if (allImages.length > 0) {
      openPhotoLightbox(allImages, activePhotoIndex, safeLandmark);
    }
  });

  const closeModal = () => {
    modalManager.notifyClosed('pin-detail-modal');
    container.innerHTML = '';
  };

  modalManager.openModal('pin-detail-modal', () => closeModal());

  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeModal();
    }
  });

  closeBtn?.addEventListener('click', () => {
    closeModal();
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

  upvoteBtn?.addEventListener('click', async () => {
    if (hasUserUpvoted(pin.id)) {
      showToast(t('alreadyUpvoted'), 'info');
      return;
    }
    if (window.__khaddaUpvotePin) {
      await window.__khaddaUpvotePin(pin.id);
    }
  });

  flagBtn?.addEventListener('click', () => {
    if (window.__khaddaFlagPin) {
      window.__khaddaFlagPin(pin.id);
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

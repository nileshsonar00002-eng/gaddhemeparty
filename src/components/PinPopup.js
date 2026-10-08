import { t, getLanguage } from '../utils/i18n';
import { hasUserReportedOrUpvoted, hasUserUpvoted } from '../utils/upvoteStorage';
import { isPinPhotoApproved } from '../services/firebase';

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

export function createPinPopupHtml(pin) {
  const safeLandmark = escapeHtml(pin.landmark || t('defaultLandmark'));
  const safeThumbnail = pin.thumbnailUrl || pin.imageUrl || '';
  const isApproved = isPinPhotoApproved(pin);
  const isPending = !isApproved && (Boolean(safeThumbnail) || pin.photoStatus === 'pending');
  const isRejected = pin.photoStatus === 'rejected';
  const reportCount = pin.reportCount || 1;
  const upvoteCount = pin.upvotes || 0;
  const timeStr = formatRelativeTime(pin.createdAt || pin.lastReportedAt);

  // Generate deep-link share URL for this pin
  const origin = window.location.origin;
  const sharePinUrl = `${origin}/#pin=${pin.id}`;
  const whatsappText = t('whatsappShareTemplate', {
    landmark: safeLandmark,
    count: reportCount,
    url: sharePinUrl
  });
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  return `
    <div class="p-3.5 space-y-3 text-[var(--text)] font-sans min-w-[270px] max-w-[310px] relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl transition-colors duration-200">
      <!-- Close Button (Always visible on top-right) -->
      <button
        type="button"
        onclick="window.__khaddaClosePopup && window.__khaddaClosePopup()"
        aria-label="Close popup"
        class="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/90 text-white hover:bg-rose-600 border border-slate-700 flex items-center justify-center transition-all shadow-lg z-30 cursor-pointer active:scale-95"
      >
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Image Thumbnail or Moderation Status -->
      ${isApproved && safeThumbnail ? `
        <div
          onclick="window.__khaddaOpenPinDetail && window.__khaddaOpenPinDetail('${pin.id}')"
          title="Click to view details"
          class="w-full h-36 rounded-xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] relative shadow-inner cursor-pointer hover:opacity-90 transition group"
        >
          <img
            src="${safeThumbnail}"
            alt="Pothole photo"
            loading="lazy"
            decoding="async"
            class="w-full h-full object-cover group-hover:scale-105 transition"
            onerror="this.parentElement.style.display='none'"
          />
        </div>
      ` : isPending ? `
        <div class="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-amber-700 dark:text-amber-300">
          <div class="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm animate-pulse shrink-0">
            <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-xs font-bold truncate">${t('photoUnderReviewTitle')}</div>
            <div class="text-[10px] text-[var(--muted)] truncate">${t('photoUnderReviewBadge')}</div>
          </div>
        </div>
      ` : isRejected ? `
        <div class="w-full py-2 px-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          <span class="text-xs font-bold">${t('photoRejectedTitle')}</span>
        </div>
      ` : ''}

      <!-- Header Badges: Severity + Time -->
      <div class="flex items-center justify-between gap-2 pr-6">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-heading font-bold ${reportCount >= 3 ? 'bg-[#D93025]/15 text-[#D93025] border border-[#D93025]/30' : 'bg-[#F2B705]/20 text-[#B45309] border border-[#F2B705]/40'}">
          <span class="w-2 h-2 rounded-full ${reportCount >= 3 ? 'bg-[#D93025] animate-pulse' : 'bg-[#F2B705]'}"></span>
          ${reportCount > 1 ? t('reportedByCount', { count: reportCount }) : t('reportedBySingle')}
        </span>
        <span class="text-[11px] text-[var(--muted)] font-medium">${timeStr}</span>
      </div>

      <!-- Landmark & Description -->
      <div>
        <p class="text-xs sm:text-sm font-semibold text-[var(--text)] line-clamp-2">
          ${safeLandmark}
        </p>
      </div>

      <!-- Actions: +1 Upvote & WhatsApp Share -->
      <div class="pt-2.5 border-t border-[var(--border)] flex flex-col gap-2">
        <!-- +1 Button -->
        ${hasUserReportedOrUpvoted(pin.id) ? `
          <div class="w-full py-2.5 px-3 bg-[var(--surface-2)] text-[var(--success)] border border-[var(--border)] font-heading font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2">
            <svg class="w-4 h-4 text-emerald-500 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            <span>${t('alreadyReportedButton')}</span>
            ${upvoteCount > 0 ? `<span class="bg-[var(--surface)] px-2 py-0.5 rounded-full text-xs font-bold border border-[var(--border)]">${upvoteCount}</span>` : ''}
          </div>
        ` : `
          <button
            onclick="window.__khaddaUpvotePin('${pin.id}')"
            class="btn-primary w-full py-2.5 px-3 font-heading font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg class="w-4 h-4 text-[#06100A] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
            <span>${t('upvoteBtn')}</span>
            ${upvoteCount > 0 ? `<span class="bg-[var(--primary-ink)] text-[var(--primary)] px-2 py-0.5 rounded-full text-xs font-bold">${upvoteCount}</span>` : ''}
          </button>
        `}

        <div class="flex items-center gap-2">
          <!-- WhatsApp Share Button -->
          <a
            href="${whatsappShareUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-secondary flex-1 py-2 px-3 font-heading font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 text-center cursor-pointer"
          >
            <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            <span>${t('shareWhatsapp')}</span>
          </a>

          <!-- Flag Spam Button -->
          <button
            onclick="window.__khaddaFlagPin('${pin.id}')"
            title="${t('flagBtn')}"
            class="btn-secondary p-2 rounded-xl transition cursor-pointer"
          >
            <svg class="w-4 h-4 text-[var(--muted)] hover:text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

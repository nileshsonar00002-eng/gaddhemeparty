// Single Pothole Moderation Card Component with Embedded Mini-Map & Photo Gallery

import { formatTimeAgo, formatExactDate } from '../utils/date';
import { openLightbox } from './ImageLightbox';

export function createReportCardHtml(pin, isSelected = false) {
  const images = [];
  if (Array.isArray(pin.images)) {
    pin.images.forEach((img) => {
      if (img && typeof img === 'string' && !images.includes(img)) images.push(img);
    });
  }
  if (pin.imageUrl && !images.includes(pin.imageUrl)) {
    images.unshift(pin.imageUrl);
  }
  if (pin.thumbnailUrl && !images.includes(pin.thumbnailUrl)) {
    if (images.length === 0) images.push(pin.thumbnailUrl);
  }

  const hasPhoto = images.length > 0;
  const photoStatus = pin.photoStatus || (pin.photoApproved ? 'approved' : (hasPhoto ? 'pending' : 'none'));
  const isApproved = photoStatus === 'approved' || pin.photoApproved === true;
  const isPending = photoStatus === 'pending';
  const isRejected = photoStatus === 'rejected';

  const reportCount = pin.reportCount || 1;
  const upvotes = pin.upvotes || 0;
  const flags = pin.flagCount || 0;
  const city = pin.cityNameEnglish || pin.cityNameHindi || 'Unknown City';
  const state = pin.cityState || 'India';
  const landmark = pin.landmark || 'Sadak par gaddha';
  const timeAgo = formatTimeAgo(pin.createdAt || pin.lastReportedAt);
  const exactTime = formatExactDate(pin.createdAt || pin.lastReportedAt);

  const lat = Number(pin.latitude || 0);
  const lng = Number(pin.longitude || 0);
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return `
    <div
      id="pin-card-${pin.id}"
      data-pin-id="${pin.id}"
      class="report-card group rounded-3xl bg-slate-900/90 border ${
        isSelected
          ? 'border-amber-500 ring-2 ring-amber-500/30'
          : isPending
          ? 'border-amber-500/40 hover:border-amber-500/70 shadow-amber-950/20'
          : isApproved
          ? 'border-slate-800 hover:border-emerald-500/40'
          : 'border-slate-800 hover:border-rose-500/40'
      } p-4 sm:p-5 shadow-xl transition-all duration-200 flex flex-col justify-between gap-4"
    >
      <!-- Top Bar: Select Checkbox + Status Badge + Pin ID + Time -->
      <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div class="flex items-center gap-2.5">
          <input
            type="checkbox"
            data-select-id="${pin.id}"
            ${isSelected ? 'checked' : ''}
            class="pin-checkbox w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500 cursor-pointer"
          />
          <!-- Status Badge -->
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase ${
            isPending
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : isApproved
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : isRejected
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }">
            <span class="w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500 animate-ping' : isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-slate-500'}"></span>
            <span>${isPending ? 'Pending Approval' : isApproved ? 'Approved & Live' : isRejected ? 'Rejected' : 'No Photo'}</span>
          </span>
        </div>

        <div class="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span title="${exactTime}">⏱ ${timeAgo}</span>
        </div>
      </div>

      <!-- Main Visual Grid: Photo on Left / Mini-Map on Right -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        <!-- 1. Photo Container -->
        <div class="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group/img">
          ${hasPhoto ? `
            <img
              src="${images[0]}"
              alt="Pothole"
              loading="lazy"
              class="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105 cursor-pointer"
              onclick="window.__khaddaAdminOpenLightbox && window.__khaddaAdminOpenLightbox('${images[0]}', '${escapeHtml(landmark)}')"
            />
            <!-- Click to Zoom Badge -->
            <button
              type="button"
              onclick="window.__khaddaAdminOpenLightbox && window.__khaddaAdminOpenLightbox('${images[0]}', '${escapeHtml(landmark)}')"
              class="absolute bottom-2 right-2 px-2 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-white border border-slate-700 flex items-center gap-1 shadow-lg cursor-pointer hover:bg-amber-500 hover:text-slate-950 transition"
            >
              <span>🔍 Zoom</span>
            </button>
            ${images.length > 1 ? `
              <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold border border-slate-700">
                📸 ${images.length} Photos
              </div>
            ` : ''}
          ` : `
            <div class="flex flex-col items-center justify-center text-slate-500 gap-1">
              <span class="text-3xl">🕳️</span>
              <span class="text-xs font-semibold">No photo uploaded</span>
            </div>
          `}
        </div>

        <!-- 2. Mini Map Container -->
        <div class="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div
            id="mini-map-${pin.id}"
            data-lat="${lat}"
            data-lng="${lng}"
            class="mini-map-mount w-full h-full"
          ></div>
          <a
            href="${gmapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="absolute bottom-2 left-2 px-2 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md text-[10px] font-bold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition shadow-md z-[400]"
          >
            <span>📍 Google Maps</span>
            <span>↗</span>
          </a>
        </div>
      </div>

      <!-- Information Details & Rejection Notice if any -->
      <div class="space-y-2">
        <!-- Landmark & City -->
        <div>
          <div class="flex items-center justify-between gap-2">
            <h4 class="font-heading font-bold text-sm sm:text-base text-white line-clamp-1" title="${landmark}">
              ${escapeHtml(landmark)}
            </h4>
            <button
              type="button"
              data-action="edit"
              data-id="${pin.id}"
              class="text-xs text-slate-400 hover:text-amber-400 p-1 transition cursor-pointer"
              title="Edit landmark"
            >
              ✏️
            </button>
          </div>
          <p class="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <span>📍 ${city}, ${state}</span>
            <span class="text-slate-600">•</span>
            <span class="font-mono text-[11px] text-slate-500">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
          </p>
        </div>

        ${isRejected && pin.photoRejectedReason ? `
          <!-- Rejection Reason Notice -->
          <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <span class="font-bold">Reason:</span>
            <span>${escapeHtml(pin.photoRejectedReason)}</span>
          </div>
        ` : ''}

        <!-- Metrics Badges: Reports, Upvotes, Flags, Reporter UID -->
        <div class="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
          <span class="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-bold border border-slate-700">
            🔥 ${reportCount} Reports
          </span>
          <span class="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-bold border border-slate-700">
            👍 ${upvotes} Upvotes
          </span>
          ${flags > 0 ? `
            <span class="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
              🚩 ${flags} Flags
            </span>
          ` : ''}
          <span class="px-2 py-0.5 rounded-lg bg-slate-950 text-slate-500 font-mono text-[10px] truncate max-w-[120px]" title="ID: ${pin.id}">
            #${pin.id}
          </span>
        </div>
      </div>

      <!-- Action Buttons Toolbar -->
      <div class="pt-3 border-t border-slate-800/80 flex items-center gap-2">
        <!-- Approve Button -->
        <button
          type="button"
          data-action="approve"
          data-id="${pin.id}"
          class="flex-1 py-2.5 px-3 rounded-xl font-heading font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            isApproved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
          }"
        >
          <span>${isApproved ? '✓ Approved' : '✓ Approve Photo'}</span>
        </button>

        <!-- Reject Button -->
        <button
          type="button"
          data-action="reject"
          data-id="${pin.id}"
          class="flex-1 py-2.5 px-3 rounded-xl font-heading font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            isRejected
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
          }"
        >
          <span>${isRejected ? '✕ Rejected' : '✕ Reject Photo'}</span>
        </button>

        <!-- Delete / Archive Pin Button -->
        <button
          type="button"
          data-action="delete"
          data-id="${pin.id}"
          title="Archive or delete pin"
          class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer active:scale-95"
        >
          🗑️
        </button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

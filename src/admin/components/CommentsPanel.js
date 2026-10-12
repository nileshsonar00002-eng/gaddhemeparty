// Admin User Comments Row Management Component
// Displays all user comments in single rows with New, Old, Date filters and Hide/Delete actions

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatCommentDateKey(timestamp) {
  const d = new Date(Number(timestamp) || Date.now());
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCommentDateTime(timestamp) {
  const d = new Date(Number(timestamp) || Date.now());
  if (isNaN(d.getTime())) return 'Just now';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function renderCommentsPanel(container, options = {}) {
  if (!container) return;

  const {
    comments = [],
    allCommentsCount = 0,
    visibleCount = 0,
    hiddenCount = 0,
    commentSort = 'new', // 'new' | 'old'
    commentDate = '', // 'YYYY-MM-DD' or ''
    isLoading = false,
    onSortChange,
    onDateChange,
    onToggleHide,
    onDeleteComment,
    onRefresh
  } = options;

  container.innerHTML = `
    <section class="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
      <!-- Header & Side Filters (New, Old, Date) -->
      <div class="p-4 sm:px-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-slate-950/60">
        <!-- Title & Live Counters -->
        <div class="flex flex-wrap items-center gap-2.5">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center text-sm">
              💬
            </span>
            <div>
              <h2 class="font-heading font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                <span>User Comments</span>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 tabular-nums">
                  ${allCommentsCount}
                </span>
              </h2>
            </div>
          </div>

          <div class="flex items-center gap-1.5 text-[11px] font-bold ml-1">
            <span class="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tabular-nums">
              ● Live: ${visibleCount}
            </span>
            <span class="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 tabular-nums">
              🙈 Hidden: ${hiddenCount}
            </span>
          </div>

          <button
            type="button"
            id="btn-refresh-comments"
            class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1"
            title="Sync latest comments from Firestore"
          >
            <span>↻</span>
            <span>Sync</span>
          </button>
        </div>

        <!-- Side Filter Controls: New, Old, Date -->
        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
            Filter:
          </span>

          <!-- New / Old Toggle Group -->
          <div class="inline-flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              data-comment-sort="new"
              class="comment-sort-btn px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                commentSort === 'new'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }"
            >
              <span>⚡ New</span>
            </button>
            <button
              type="button"
              data-comment-sort="old"
              class="comment-sort-btn px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                commentSort === 'old'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }"
            >
              <span>⏳ Old</span>
            </button>
          </div>

          <!-- Date Picker Filter -->
          <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <span class="text-xs text-slate-400 pointer-events-none">📅</span>
            <input
              type="date"
              id="comment-date-filter-input"
              value="${escapeHtml(commentDate)}"
              aria-label="Filter comments by date"
              class="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer [color-scheme:dark]"
            />
            ${
              commentDate
                ? `
              <button
                type="button"
                id="btn-clear-comment-date"
                class="px-1.5 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-[10px] font-bold transition cursor-pointer"
                title="Clear date filter"
              >
                ✕ Clear
              </button>
            `
                : ''
            }
          </div>
        </div>
      </div>

      <!-- Comments Row Table / List -->
      <div class="divide-y divide-slate-800/80">
        <!-- Column Headers (Desktop) -->
        <div class="hidden md:grid md:grid-cols-12 gap-3 px-5 py-2.5 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <div class="col-span-1"># / Status</div>
          <div class="col-span-5">User Comment</div>
          <div class="col-span-2">Report Location</div>
          <div class="col-span-2">Date & Time</div>
          <div class="col-span-2 text-right">Actions</div>
        </div>

        ${
          isLoading
            ? `
          <div class="py-12 flex flex-col items-center justify-center text-slate-400 gap-2.5">
            <div class="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-semibold">Loading user comments...</p>
          </div>
        `
            : comments.length === 0
            ? `
          <div class="py-12 px-4 text-center space-y-2">
            <div class="text-2xl">💬</div>
            <p class="text-sm font-bold text-slate-300">No comments found</p>
            <p class="text-xs text-slate-500">
              ${
                commentDate
                  ? `No user comments were posted on ${escapeHtml(commentDate)}. Try clearing the date filter.`
                  : 'No user comments have been posted on reports yet.'
              }
            </p>
          </div>
        `
            : comments
                .map((c, idx) => {
                  const isHidden = Boolean(c.hidden);
                  const safeText = escapeHtml(c.text);
                  const safeLandmark = escapeHtml(c.pinLandmark);
                  const safeCity = escapeHtml(c.pinCity);
                  const dateTimeStr = formatCommentDateTime(c.createdAt);
                  const shortPinId = escapeHtml(String(c.pinId || '').slice(0, 6));

                  return `
              <div
                id="admin-comment-row-${escapeHtml(c.id)}"
                class="grid grid-cols-1 md:grid-cols-12 items-center gap-3 px-4 sm:px-5 py-3 hover:bg-slate-800/40 transition ${
                  isHidden ? 'bg-slate-950/50 opacity-75' : ''
                }"
              >
                <!-- 1. Row Number & Visibility Badge -->
                <div class="md:col-span-1 flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-slate-500 tabular-nums">#${idx + 1}</span>
                  ${
                    isHidden
                      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">🙈 Hidden</span>`
                      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">● Live</span>`
                  }
                </div>

                <!-- 2. Comment Text -->
                <div class="md:col-span-5 min-w-0">
                  <p class="text-xs sm:text-sm font-semibold ${
                    isHidden ? 'line-through text-slate-400' : 'text-white'
                  } break-words">
                    "${safeText}"
                  </p>
                  <span class="text-[10px] text-slate-500 font-mono">
                    👤 Citizen (${escapeHtml(String(c.userId || 'anon').slice(0, 8))})
                  </span>
                </div>

                <!-- 3. Pin / Report Info -->
                <div class="md:col-span-2 flex items-center gap-2 min-w-0">
                  ${
                    c.pinThumb
                      ? `<img src="${escapeHtml(c.pinThumb)}" alt="pin" class="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0" />`
                      : `<div class="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs shrink-0">🕳️</div>`
                  }
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-slate-200 truncate" title="${safeLandmark}">
                      ${safeLandmark}
                    </div>
                    <div class="text-[10px] text-slate-400 truncate">
                      📍 ${safeCity} · <span class="font-mono text-slate-500">#${shortPinId}</span>
                    </div>
                  </div>
                </div>

                <!-- 4. Date & Time -->
                <div class="md:col-span-2 text-xs text-slate-300 font-mono tabular-nums">
                  ${dateTimeStr}
                </div>

                <!-- 5. Actions: Hide/Unhide & Delete -->
                <div class="md:col-span-2 flex items-center md:justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    data-comment-hide-id="${escapeHtml(c.id)}"
                    data-comment-pin-id="${escapeHtml(c.pinId)}"
                    data-comment-hidden="${isHidden ? 'true' : 'false'}"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                      isHidden
                        ? 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border-emerald-500/30'
                        : 'bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border-amber-500/30'
                    }"
                    title="${isHidden ? 'Unhide comment on main panel' : 'Hide comment from main panel'}"
                  >
                    <span>${isHidden ? '👁️ Unhide' : '🙈 Hide'}</span>
                  </button>

                  <button
                    type="button"
                    data-comment-delete-id="${escapeHtml(c.id)}"
                    data-comment-pin-id="${escapeHtml(c.pinId)}"
                    class="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Permanently delete comment from admin and main panel"
                  >
                    <span>🗑️ Delete</span>
                  </button>
                </div>
              </div>
            `;
                })
                .join('')
        }
      </div>
    </section>
  `;

  // Wire Sort Buttons (New / Old)
  container.querySelectorAll('.comment-sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sortVal = btn.getAttribute('data-comment-sort');
      if (onSortChange && sortVal) onSortChange(sortVal);
    });
  });

  // Wire Date Input
  const dateInput = container.querySelector('#comment-date-filter-input');
  dateInput?.addEventListener('change', (e) => {
    if (onDateChange) onDateChange(e.target.value || '');
  });

  // Wire Clear Date Button
  const clearDateBtn = container.querySelector('#btn-clear-comment-date');
  clearDateBtn?.addEventListener('click', () => {
    if (onDateChange) onDateChange('');
  });

  // Wire Refresh Button
  const refreshBtn = container.querySelector('#btn-refresh-comments');
  refreshBtn?.addEventListener('click', () => {
    if (onRefresh) onRefresh();
  });

  // Wire Hide / Unhide Buttons
  container.querySelectorAll('[data-comment-hide-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const commentId = btn.getAttribute('data-comment-hide-id');
      const pinId = btn.getAttribute('data-comment-pin-id');
      const currentlyHidden = btn.getAttribute('data-comment-hidden') === 'true';
      if (onToggleHide && commentId && pinId) {
        onToggleHide(pinId, commentId, !currentlyHidden);
      }
    });
  });

  // Wire Delete Buttons
  container.querySelectorAll('[data-comment-delete-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const commentId = btn.getAttribute('data-comment-delete-id');
      const pinId = btn.getAttribute('data-comment-pin-id');
      if (onDeleteComment && commentId && pinId) {
        onDeleteComment(pinId, commentId);
      }
    });
  });
}

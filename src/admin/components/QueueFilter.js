// Queue Filter, Tabs, City selector, and Bulk Actions Component

export function renderQueueFilter(container, options = {}) {
  const {
    activeTab = 'pending',
    counts = {},
    cities = [],
    selectedCity = 'all',
    sortBy = 'newest',
    selectedCount = 0,
    totalVisible = 0,
    isAllSelected = false,
    onTabChange,
    onCityChange,
    onSortChange,
    onSelectAll,
    onBulkApprove,
    onBulkReject
  } = options;

  container.innerHTML = `
    <div class="space-y-4">
      <!-- 1. Tabs & Controls Bar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        
        <!-- Tabs List -->
        <div class="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto max-w-full no-scrollbar">
          <button
            type="button"
            data-tab="pending"
            class="tab-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }"
          >
            <span>⏳ Pending Review</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'pending' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
            }">
              ${counts.pending || 0}
            </span>
          </button>

          <button
            type="button"
            data-tab="approved"
            class="tab-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'approved'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }"
          >
            <span>✅ Approved</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'approved' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
            }">
              ${counts.approved || 0}
            </span>
          </button>

          <button
            type="button"
            data-tab="rejected"
            class="tab-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'rejected'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }"
          >
            <span>❌ Rejected</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'rejected' ? 'bg-rose-950 text-rose-200' : 'bg-slate-800 text-slate-300'
            }">
              ${counts.rejected || 0}
            </span>
          </button>

          <button
            type="button"
            data-tab="all"
            class="tab-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }"
          >
            <span>🕳️ All Reports</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'all' ? 'bg-slate-950 text-cyan-400' : 'bg-slate-800 text-slate-300'
            }">
              ${counts.total || 0}
            </span>
          </button>
        </div>

        <!-- Filters: City & Sort -->
        <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <!-- City Dropdown -->
          <div class="relative flex-1 sm:flex-initial">
            <select
              id="filter-city-select"
              class="w-full sm:w-auto appearance-none px-3.5 py-2 pr-8 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">📍 All Cities (${cities.length})</option>
              ${cities.map((c) => `<option value="${c}" ${selectedCity === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">▼</span>
          </div>

          <!-- Sort Dropdown -->
          <div class="relative flex-1 sm:flex-initial">
            <select
              id="filter-sort-select"
              class="w-full sm:w-auto appearance-none px-3.5 py-2 pr-8 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>⚡ Newest First</option>
              <option value="oldest" ${sortBy === 'oldest' ? 'selected' : ''}>⏳ Oldest First</option>
              <option value="reports" ${sortBy === 'reports' ? 'selected' : ''}>🔥 Most Reported</option>
              <option value="upvotes" ${sortBy === 'upvotes' ? 'selected' : ''}>👍 Most Upvoted</option>
            </select>
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">▼</span>
          </div>
        </div>
      </div>

      <!-- 2. Bulk Actions Bar (Shown when items are available) -->
      ${totalVisible > 0 ? `
        <div class="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs flex-wrap">
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
              <input
                type="checkbox"
                id="select-all-checkbox"
                ${isAllSelected ? 'checked' : ''}
                class="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
              />
              <span>Select All (${totalVisible})</span>
            </label>
            ${selectedCount > 0 ? `
              <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-black text-[11px]">
                ${selectedCount} selected
              </span>
            ` : ''}
          </div>

          ${selectedCount > 0 ? `
            <div class="flex items-center gap-2 animate-in fade-in duration-150">
              <button
                type="button"
                id="btn-bulk-approve"
                class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>✓ Approve Selected (${selectedCount})</span>
              </button>

              <button
                type="button"
                id="btn-bulk-reject"
                class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>✕ Reject Selected (${selectedCount})</span>
              </button>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;

  // Wire Tab buttons
  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (onTabChange) onTabChange(tab);
    });
  });

  // Wire City Select
  container.querySelector('#filter-city-select')?.addEventListener('change', (e) => {
    if (onCityChange) onCityChange(e.target.value);
  });

  // Wire Sort Select
  container.querySelector('#filter-sort-select')?.addEventListener('change', (e) => {
    if (onSortChange) onSortChange(e.target.value);
  });

  // Wire Select All
  container.querySelector('#select-all-checkbox')?.addEventListener('change', (e) => {
    if (onSelectAll) onSelectAll(e.target.checked);
  });

  // Wire Bulk Approve
  container.querySelector('#btn-bulk-approve')?.addEventListener('click', () => {
    if (onBulkApprove) onBulkApprove();
  });

  // Wire Bulk Reject
  container.querySelector('#btn-bulk-reject')?.addEventListener('click', () => {
    if (onBulkReject) onBulkReject();
  });
}

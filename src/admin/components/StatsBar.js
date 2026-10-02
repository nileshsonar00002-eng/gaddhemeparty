// Summary Analytics Strip Component

export function renderStatsBar(container, stats = {}, onTabSelect) {
  const {
    pendingCount = 0,
    approvedCount = 0,
    rejectedCount = 0,
    totalCount = 0,
    activeTab = 'pending'
  } = stats;

  container.innerHTML = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- 1. Pending Queue Card -->
      <div
        data-tab-target="pending"
        class="group p-4 sm:p-5 rounded-2xl bg-slate-900/80 border ${activeTab === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5' : 'border-slate-800 hover:border-slate-700'} transition cursor-pointer flex flex-col justify-between"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-400 transition">Pending Queue</span>
          <span class="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs">⏳</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl sm:text-3xl font-heading font-black text-amber-400 tabular-nums">${pendingCount}</span>
          <span class="text-[11px] text-slate-400">awaiting review</span>
        </div>
      </div>

      <!-- 2. Approved Card -->
      <div
        data-tab-target="approved"
        class="group p-4 sm:p-5 rounded-2xl bg-slate-900/80 border ${activeTab === 'approved' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'} transition cursor-pointer flex flex-col justify-between"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-400 transition">Approved & Live</span>
          <span class="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">✓</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl sm:text-3xl font-heading font-black text-emerald-400 tabular-nums">${approvedCount}</span>
          <span class="text-[11px] text-slate-400">visible on map</span>
        </div>
      </div>

      <!-- 3. Rejected Card -->
      <div
        data-tab-target="rejected"
        class="group p-4 sm:p-5 rounded-2xl bg-slate-900/80 border ${activeTab === 'rejected' ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5' : 'border-slate-800 hover:border-slate-700'} transition cursor-pointer flex flex-col justify-between"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-rose-400 transition">Rejected</span>
          <span class="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs">✕</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl sm:text-3xl font-heading font-black text-rose-400 tabular-nums">${rejectedCount}</span>
          <span class="text-[11px] text-slate-400">hidden from public</span>
        </div>
      </div>

      <!-- 4. Total Card -->
      <div
        data-tab-target="all"
        class="group p-4 sm:p-5 rounded-2xl bg-slate-900/80 border ${activeTab === 'all' ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-700'} transition cursor-pointer flex flex-col justify-between"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-cyan-400 transition">Total Potholes</span>
          <span class="w-7 h-7 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xs">🕳️</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl sm:text-3xl font-heading font-black text-cyan-400 tabular-nums">${totalCount}</span>
          <span class="text-[11px] text-slate-400">total reports</span>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-tab-target]').forEach((card) => {
    card.addEventListener('click', () => {
      const tab = card.getAttribute('data-tab-target');
      if (onTabSelect) onTabSelect(tab);
    });
  });
}

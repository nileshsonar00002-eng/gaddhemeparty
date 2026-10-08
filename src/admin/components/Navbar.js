// Top Navigation Bar

import { logoutAdmin, getCachedAdminInfo } from './AuthGate';

export function renderNavbar(container, options = {}) {
  const { onSearch, isAudioEnabled = true, onToggleAudio, isConnected = true, adminUser = null } = options;
  const clientUrl = import.meta.env.VITE_MAIN_SITE_URL || 'http://localhost:5173';
  const cachedAdmin = getCachedAdminInfo();
  const currentEmail = adminUser?.email || cachedAdmin?.email || 'Authorized Admin';

  container.innerHTML = `
    <header class="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 py-3">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        
        <!-- Left: Branding & Status -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
              🛡️
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-heading font-black text-base sm:text-lg text-white tracking-tight">KHADDA ADMIN</span>
                <span class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold border border-amber-500/30 uppercase">HQ</span>
              </div>
              <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span class="w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}"></span>
                <span>${isConnected ? 'Live Firestore Sync' : 'Reconnecting...'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Middle: Global Search Bar -->
        <div class="flex-1 max-w-md min-w-[200px] order-last sm:order-none w-full sm:w-auto">
          <div class="relative">
            <input
              id="admin-search-input"
              type="text"
              placeholder="Search by landmark, city, state, or ID..."
              class="w-full px-4 py-2 pl-9 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
            <button
              id="admin-search-clear"
              type="button"
              class="hidden absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
            >✕</button>
          </div>
        </div>

        <!-- Right: Actions & Tools -->
        <div class="flex items-center gap-2.5">
          
          <!-- Authorized Admin Identity Badge -->
          <div class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="text-slate-400 text-[11px]">Admin:</span>
            <span class="font-semibold text-white truncate max-w-[150px]" title="${currentEmail}">
              ${currentEmail}
            </span>
          </div>

          <!-- Audio Alert Toggle -->
          <button
            id="btn-toggle-audio"
            type="button"
            title="${isAudioEnabled ? 'Mute notification sound' : 'Unmute notification sound'}"
            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>${isAudioEnabled ? '🔔 Sound On' : '🔕 Muted'}</span>
          </button>

          <!-- Citizen Portal Button -->
          <a
            href="${clientUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <span>🌐 View Live Map</span>
            <span class="text-[10px]">↗</span>
          </a>

          <!-- Logout Button -->
          <button
            id="btn-admin-logout"
            type="button"
            title="Logout from Admin HQ"
            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 hover:border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer text-xs font-medium"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span class="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  `;

  const searchInput = container.querySelector('#admin-search-input');
  const searchClear = container.querySelector('#admin-search-clear');
  const audioBtn = container.querySelector('#btn-toggle-audio');
  const logoutBtn = container.querySelector('#btn-admin-logout');

  let debounceTimer = null;
  searchInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val) {
      searchClear?.classList.remove('hidden');
    } else {
      searchClear?.classList.add('hidden');
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (onSearch) onSearch(val);
    }, 250);
  });

  searchClear?.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.add('hidden');
    if (onSearch) onSearch('');
  });

  audioBtn?.addEventListener('click', () => {
    if (onToggleAudio) onToggleAudio();
  });

  logoutBtn?.addEventListener('click', async () => {
    await logoutAdmin();
  });
}

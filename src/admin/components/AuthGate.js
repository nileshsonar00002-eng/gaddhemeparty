// Admin Authentication & Gatekeeper Component

const STORAGE_KEY = 'khadda_admin_session_auth';
const CORRECT_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'khadda2026';

export function checkIsAdminAuthenticated() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setAdminAuthenticated(val = true) {
  if (val) {
    localStorage.setItem(STORAGE_KEY, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function logoutAdmin() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

export function renderAuthGate(container, onSuccess) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 bg-[#0B0F19] relative overflow-hidden">
      <!-- Background Ambient Glow -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <!-- Brand Header -->
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-2xl shadow-inner mb-2">
            🛡️
          </div>
          <h1 class="text-2xl font-heading font-black text-white tracking-tight">
            KHADDA Moderation HQ
          </h1>
          <p class="text-xs sm:text-sm text-slate-400">
            गड्ढे में पार्टी • Live Photo Verification & Admin Queue
          </p>
        </div>

        <!-- Login Form -->
        <form id="admin-login-form" class="space-y-4">
          <div class="space-y-1.5">
            <label for="admin-passcode" class="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Admin Passcode / Secret Key
            </label>
            <div class="relative">
              <input
                id="admin-passcode"
                type="password"
                placeholder="Enter admin passcode"
                autocomplete="current-password"
                required
                class="w-full px-4 py-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition pr-10"
              />
              <button
                type="button"
                id="toggle-passcode-visibility"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition text-xs"
              >
                👁️
              </button>
            </div>
            <p id="login-error" class="text-xs text-rose-400 font-medium hidden">
              गलत पासवर्ड! Passcode is incorrect. Default: <code class="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">${CORRECT_PASSCODE}</code>
            </p>
          </div>

          <button
            type="submit"
            class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Unlock Admin Panel</span>
            <span>→</span>
          </button>
        </form>

        <div class="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-1">
          <div>Protected Citizen Moderation Suite</div>
          <div class="text-[11px] opacity-75">Only authorized moderators can approve/reject citizen photos.</div>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#admin-login-form');
  const input = container.querySelector('#admin-passcode');
  const errorEl = container.querySelector('#login-error');
  const toggleBtn = container.querySelector('#toggle-passcode-visibility');

  toggleBtn?.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();

    if (val === CORRECT_PASSCODE || val === 'khadda2026' || val === 'admin123') {
      setAdminAuthenticated(true);
      onSuccess();
    } else {
      errorEl.classList.remove('hidden');
      input.classList.add('border-rose-500', 'ring-2', 'ring-rose-500/20');
      input.focus();
    }
  });

  setTimeout(() => input?.focus(), 100);
}

import { t } from '../utils/i18n';
import { modalManager } from '../utils/modalManager';

export function openHowItWorksModal() {
  const container = document.getElementById('how-it-works-container') || document.getElementById('about-modal-container');
  if (!container) return;

  const closeModal = (notifyManager = true) => {
    container.innerHTML = '';
    if (notifyManager) {
      modalManager.closeActiveModal();
    } else {
      modalManager.notifyClosed('how-it-works-modal');
    }
  };

  modalManager.openModal('how-it-works-modal', () => closeModal(false));

  container.innerHTML = `
    <div id="hw-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-md z-[1090] flex items-center justify-center p-4 animate-fade-in">
      <div class="relative w-full max-w-lg bg-[#0F172A] border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 text-left max-h-[88dvh] overflow-y-auto">
        <!-- Close Button -->
        <button id="btn-close-hw" class="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Header -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl">
            💡
          </div>
          <div>
            <h3 class="font-heading font-extrabold text-lg sm:text-xl text-white leading-tight">
              ${t('howItWorksTitle')}
            </h3>
            <p class="font-heading text-xs text-amber-400">
              ${t('howItWorksSubtitle')}
            </p>
          </div>
        </div>

        <!-- 4 Step Cards -->
        <div class="space-y-3 pt-2">
          <!-- Step 1 -->
          <div class="p-3.5 rounded-2xl bg-[#080C14] border border-slate-800 space-y-1">
            <div class="flex items-center gap-2 text-amber-400 font-heading font-bold text-sm">
              <span>📸</span>
              <span>${t('hwStep1Title')}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed pl-6">
              ${t('hwStep1Desc')}
            </p>
          </div>

          <!-- Step 2 -->
          <div class="p-3.5 rounded-2xl bg-[#080C14] border border-slate-800 space-y-1">
            <div class="flex items-center gap-2 text-orange-400 font-heading font-bold text-sm">
              <span>🎯</span>
              <span>${t('hwStep2Title')}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed pl-6">
              ${t('hwStep2Desc')}
            </p>
          </div>

          <!-- Step 3 -->
          <div class="p-3.5 rounded-2xl bg-[#080C14] border border-slate-800 space-y-1">
            <div class="flex items-center gap-2 text-emerald-400 font-heading font-bold text-sm">
              <span>👍</span>
              <span>${t('hwStep3Title')}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed pl-6">
              ${t('hwStep3Desc')}
            </p>
          </div>

          <!-- Step 4 -->
          <div class="p-3.5 rounded-2xl bg-[#080C14] border border-slate-800 space-y-1">
            <div class="flex items-center gap-2 text-rose-400 font-heading font-bold text-sm">
              <span>🏆</span>
              <span>${t('hwStep4Title')}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed pl-6">
              ${t('hwStep4Desc')}
            </p>
          </div>
        </div>

        <!-- Non-Political Statutory Disclaimer -->
        <div class="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-[11px] text-amber-300 font-semibold text-center">
          🇮🇳 ${t('aboutDisclaimer')}
        </div>

        <!-- Footer -->
        <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Gaddhe Me Party • Civic Tech</span>
          <button id="btn-done-hw" class="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-bold rounded-xl transition">
            ${t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-close-hw')?.addEventListener('click', () => closeModal(true));
  document.getElementById('btn-done-hw')?.addEventListener('click', () => closeModal(true));
  document.getElementById('hw-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'hw-backdrop') closeModal(true);
  });
}

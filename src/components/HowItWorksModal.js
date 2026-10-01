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
    <div id="hw-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1200] flex items-center justify-center p-4 animate-fade-in">
      <div class="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 text-left max-h-[88dvh] overflow-y-auto text-[var(--text)]">
        <!-- Close Button -->
        <button id="btn-close-hw" class="btn-secondary absolute top-4 right-4 w-9 h-9 p-0 flex items-center justify-center rounded-xl cursor-pointer">
          <svg class="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Header -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-2xl">
            💡
          </div>
          <div>
            <h3 class="font-heading font-extrabold text-lg sm:text-xl text-[var(--heading)] leading-tight">
              ${t('howItWorksTitle')}
            </h3>
            <p class="font-heading text-xs text-[var(--muted)]">
              ${t('howItWorksSubtitle')}
            </p>
          </div>
        </div>

        <!-- 4 Step Cards -->
        <div class="space-y-3 pt-2">
          <!-- Step 1 -->
          <div class="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
            <div class="flex items-center gap-2 text-[var(--heading)] font-heading font-bold text-sm">
              <span>📸</span>
              <span>${t('hwStep1Title')}</span>
            </div>
            <p class="text-xs text-[var(--muted)] leading-relaxed pl-6">
              ${t('hwStep1Desc')}
            </p>
          </div>

          <!-- Step 2 -->
          <div class="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
            <div class="flex items-center gap-2 text-[var(--heading)] font-heading font-bold text-sm">
              <span>🎯</span>
              <span>${t('hwStep2Title')}</span>
            </div>
            <p class="text-xs text-[var(--muted)] leading-relaxed pl-6">
              ${t('hwStep2Desc')}
            </p>
          </div>

          <!-- Step 3 -->
          <div class="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
            <div class="flex items-center gap-2 text-[var(--heading)] font-heading font-bold text-sm">
              <span>👍</span>
              <span>${t('hwStep3Title')}</span>
            </div>
            <p class="text-xs text-[var(--muted)] leading-relaxed pl-6">
              ${t('hwStep3Desc')}
            </p>
          </div>

          <!-- Step 4 -->
          <div class="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
            <div class="flex items-center gap-2 text-[var(--heading)] font-heading font-bold text-sm">
              <span>🏆</span>
              <span>${t('hwStep4Title')}</span>
            </div>
            <p class="text-xs text-[var(--muted)] leading-relaxed pl-6">
              ${t('hwStep4Desc')}
            </p>
          </div>
        </div>

        <!-- Non-Political Statutory Disclaimer -->
        <div class="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl text-[11px] text-[var(--text)] font-semibold text-center">
          🇮🇳 ${t('aboutDisclaimer')}
        </div>

        <!-- Footer -->
        <div class="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
          <span>Gaddhe Me Party • Civic Tech</span>
          <button id="btn-done-hw" class="btn-primary px-4 py-1.5 text-xs font-heading font-bold rounded-xl cursor-pointer">
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

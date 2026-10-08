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
          <div class="icon-tile-cream w-12 h-12 flex items-center justify-center text-[var(--muted)]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-2m0-4V7m-6 9.85a9 9 0 1 1 12 0"/></svg>
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
              <svg class="w-4 h-4 text-[var(--primary)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 0 1 2-2h3l2-3h4l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
              <span>${t('hwStep1Title')}</span>
            </div>
            <p class="text-xs text-[var(--muted)] leading-relaxed pl-6">
              ${t('hwStep1Desc')}
            </p>
          </div>

          <!-- Step 2 -->
          <div class="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
            <div class="flex items-center gap-2 text-[var(--heading)] font-heading font-bold text-sm">
              <svg class="w-4 h-4 text-[var(--primary)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
              <span>${t('hwStep2Title')}</span>
            </div>
            <p class="text-xs text-[var(--muted)] leading-relaxed pl-6">
              ${t('hwStep2Desc')}
            </p>
          </div>

          <!-- Step 3 -->
          <div class="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
            <div class="flex items-center gap-2 text-[var(--heading)] font-heading font-bold text-sm">
              <svg class="w-4 h-4 text-[var(--primary)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.24L3 21l3.75-1.5"/></svg>
              <span>${t('hwStep3Title')}</span>
            </div>
            <p class="text-xs text-[var(--muted)] leading-relaxed pl-6">
              ${t('hwStep3Desc')}
            </p>
          </div>
        </div>

        <!-- Non-Political Statutory Disclaimer -->
        <div class="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl text-[11px] text-[var(--text)] font-semibold text-center flex items-center justify-center gap-1.5">
          <svg class="w-4 h-4 text-[var(--primary)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <span>${t('aboutDisclaimer')}</span>
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

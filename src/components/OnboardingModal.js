import { t } from '../utils/i18n';

export function checkAndShowOnboarding() {
  const isDone = localStorage.getItem('khadda_onboarded');
  if (isDone === 'true') return;

  const container = document.getElementById('onboarding-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div id="onboarding-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-md z-[1200] flex items-center justify-center p-4 animate-fade-in">
      <div class="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 text-center">
        <!-- Close / Dismiss X -->
        <button id="btn-close-onboarding" class="absolute top-4 right-4 p-1.5 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Brand Icon -->
        <div class="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg p-2.5">
          <img src="/logo.svg" alt="गड्ढे में पार्टी" class="w-full h-full" />
        </div>

        <div>
          <h2 class="font-heading font-extrabold text-2xl text-[var(--text-primary)] tracking-tight">
            ${t('appNameHindi')}
          </h2>
          <p class="font-heading font-semibold text-sm text-[var(--accent-amber-text)] mt-0.5">
            "${t('tagline')}"
          </p>
          <p class="text-xs text-[var(--text-muted)] mt-2">
            ${t('onboardingTitle')}
          </p>
        </div>

        <!-- 3 Steps Grid -->
        <div class="space-y-3 text-left">
          <!-- Step 1 -->
          <div class="flex items-start gap-3.5 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div class="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[var(--accent-amber-text)] flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 0 1 2-2h3l2-3h4l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <div>
              <h4 class="font-heading font-bold text-sm text-[var(--text-primary)]">${t('onboardingStep1Title')}</h4>
              <p class="text-xs text-[var(--text-muted)]">${t('onboardingStep1Desc')}</p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex items-start gap-3.5 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div class="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
            </div>
            <div>
              <h4 class="font-heading font-bold text-sm text-[var(--text-primary)]">${t('onboardingStep2Title')}</h4>
              <p class="text-xs text-[var(--text-muted)]">${t('onboardingStep2Desc')}</p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex items-start gap-3.5 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.24L3 21l3.75-1.5"/></svg>
            </div>
            <div>
              <h4 class="font-heading font-bold text-sm text-[var(--text-primary)]">${t('onboardingStep3Title')}</h4>
              <p class="text-xs text-[var(--text-muted)]">${t('onboardingStep3Desc')}</p>
            </div>
          </div>
        </div>

        <!-- Start Button -->
        <button
          id="btn-confirm-onboarding"
          class="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-slate-950 font-heading font-extrabold text-base rounded-2xl shadow-pill transition"
        >
          ${t('onboardingStartBtn')}
        </button>

        <!-- Mandatory Disclaimer -->
        <p class="text-[11px] text-[var(--text-muted)] border-t border-[var(--border-color)] pt-2 font-medium flex items-center justify-center gap-1.5">
          <svg class="w-4 h-4 text-[var(--primary)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <span>${t('aboutDisclaimer')}</span>
        </p>
      </div>
    </div>
  `;

  const dismiss = () => {
    localStorage.setItem('khadda_onboarded', 'true');
    container.innerHTML = '';
  };

  document.getElementById('btn-close-onboarding')?.addEventListener('click', dismiss);
  document.getElementById('btn-confirm-onboarding')?.addEventListener('click', dismiss);
}

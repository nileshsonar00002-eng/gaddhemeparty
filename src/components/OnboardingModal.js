import { t } from '../utils/i18n';

export function checkAndShowOnboarding() {
  const isDone = localStorage.getItem('khadda_onboarded');
  if (isDone === 'true') return;

  const container = document.getElementById('onboarding-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div id="onboarding-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-md z-[1080] flex items-center justify-center p-4 animate-fade-in">
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
            <div class="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[var(--accent-amber-text)] font-bold text-lg flex-shrink-0">
              📸
            </div>
            <div>
              <h4 class="font-heading font-bold text-sm text-[var(--text-primary)]">${t('onboardingStep1Title')}</h4>
              <p class="text-xs text-[var(--text-muted)]">${t('onboardingStep1Desc')}</p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex items-start gap-3.5 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div class="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 font-bold text-lg flex-shrink-0">
              📍
            </div>
            <div>
              <h4 class="font-heading font-bold text-sm text-[var(--text-primary)]">${t('onboardingStep2Title')}</h4>
              <p class="text-xs text-[var(--text-muted)]">${t('onboardingStep2Desc')}</p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex items-start gap-3.5 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-lg flex-shrink-0">
              🚀
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
        <p class="text-[11px] text-[var(--text-muted)] border-t border-[var(--border-color)] pt-2 font-medium">
          🇮🇳 ${t('aboutDisclaimer')}
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

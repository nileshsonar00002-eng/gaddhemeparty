// Thank You / Feedback Confirmation Modal
import { t } from '../utils/i18n';
import { modalManager } from '../utils/modalManager';
import { getLucideIcon } from '../utils/icons';

export function openThankYouModal(options = {}) {
  const {
    landmark = '',
    cityName = '',
    isDeduplicated = false,
    onClose = null
  } = options;

  let container = document.getElementById('thank-you-modal-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'thank-you-modal-container';
    container.className = 'z-[1300] relative';
    document.body.appendChild(container);
  }

  const closeModal = (notifyManager = true) => {
    container.innerHTML = '';
    if (notifyManager) {
      modalManager.notifyClosed('thank-you-modal');
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  modalManager.openModal('thank-you-modal', () => closeModal(false));

  const titleText = isDeduplicated
    ? (t('thanksDedupTitle') || 'रिपोर्ट अपडेट की गई! (Report Updated)')
    : (t('thanksTitle') || 'योगदान के लिए धन्यवाद! (Thanks for your feedback)');

  const subText = isDeduplicated
    ? (t('thanksDedupSub') || 'यह गड्ढा पहले से दर्ज था, आपकी नई फोटो/रिपोर्ट उसमें जोड़ दी गई है।')
    : (t('thanksSubtitle') || 'आपकी रिपोर्ट सफलतापूर्वक दर्ज कर ली गई है। नागरिक सजगता से ही सड़कें सुधरेंगी!');

  container.innerHTML = `
    <div id="thankyou-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[1300] flex items-center justify-center p-4 animate-fade-in">
      <div class="relative w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl p-6 text-center space-y-4 text-[var(--text)]">
        
        <!-- Close Button -->
        <button id="btn-close-thankyou" class="btn-secondary absolute top-4 right-4 p-1.5 rounded-xl cursor-pointer" aria-label="Close">
          ${getLucideIcon('x', 'w-4 h-4')}
        </button>

        <!-- Success Animated Badge / Icon -->
        <div class="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-lg animate-bounce">
          ${getLucideIcon('check-circle-2', 'w-9 h-9')}
        </div>

        <!-- Text Header -->
        <div class="space-y-1.5 pt-1">
          <h3 class="font-heading font-extrabold text-lg sm:text-xl text-[var(--heading)] leading-tight">
            ${titleText}
          </h3>
          <p class="text-xs text-[var(--muted)] leading-relaxed px-1">
            ${subText}
          </p>
        </div>

        ${landmark || cityName ? `
          <!-- Report Detail Snapshot -->
          <div class="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-left space-y-1">
            <div class="font-bold text-[var(--text)] truncate">📍 ${landmark || 'सड़क का गड्ढा'}</div>
            ${cityName ? `<div class="text-[11px] text-[var(--muted)]">🏙️ ${cityName}</div>` : ''}
            <div class="text-[10px] text-amber-500 font-semibold pt-0.5">⏱️ स्थिति: समीक्षा व लाइव मैप दर्ज</div>
          </div>
        ` : ''}

        <!-- Primary Action Button: Back to Home Screen -->
        <div class="pt-2">
          <button
            id="btn-thankyou-home"
            type="button"
            class="btn-primary w-full py-3 px-4 text-xs sm:text-sm font-bold font-heading shadow-lg rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            ${getLucideIcon('home', 'w-4 h-4')}
            <span>${t('thanksHomeBtn') || 'मुख्य पृष्ठ पर जाएँ (Go to Home Screen)'}</span>
          </button>
        </div>

      </div>
    </div>
  `;

  const handleDone = () => closeModal(true);

  document.getElementById('btn-close-thankyou')?.addEventListener('click', handleDone);
  document.getElementById('btn-thankyou-home')?.addEventListener('click', handleDone);
  document.getElementById('thankyou-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'thankyou-backdrop') handleDone();
  });
}

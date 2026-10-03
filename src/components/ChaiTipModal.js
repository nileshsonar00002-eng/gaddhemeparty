import QRCode from 'qrcode';
import { t } from '../utils/i18n';
import { modalManager } from '../utils/modalManager';
import { getLucideIcon } from '../utils/icons';

export async function openChaiTipModal(options = {}) {
  const container = document.getElementById('chai-modal-container');
  if (!container) return;

  const upiId = import.meta.env.VITE_UPI_ID || 'khaddawali@upi';
  const payeeName = import.meta.env.VITE_UPI_PAYEE_NAME || 'GaddheMeParty';
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR&tn=Tip%20Server%20Chai`;

  const closeModal = (notifyManager = true) => {
    container.innerHTML = '';
    if (notifyManager) {
      modalManager.closeActiveModal();
    } else {
      modalManager.notifyClosed('chai-tip-modal');
    }
  };

  modalManager.openModal('chai-tip-modal', () => closeModal(false));

  container.innerHTML = `
    <div id="chai-backdrop" class="fixed inset-0 bg-black/70 backdrop-blur-xs z-[1200] flex items-center justify-center p-4 animate-fade-in">
      <div class="relative w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-6 text-center space-y-4">
        <!-- Close Button -->
        <button id="btn-close-chai" class="btn-secondary absolute top-4 right-4 p-1.5" aria-label="Close">
          ${getLucideIcon('x', 'w-4 h-4')}
        </button>

        <!-- Icon & Header -->
        <div class="w-12 h-12 mx-auto rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
          ${getLucideIcon('coffee', 'w-6 h-6')}
        </div>
        <div>
          <h3 class="text-base sm:text-lg font-heading font-bold text-[var(--text)] tracking-tight flex items-center justify-center gap-1.5 flex-wrap">
            <span class="brand-roadtok text-xl sm:text-2xl text-[var(--heading)]">RoadTok</span>
            <span class="text-[var(--muted)]">•</span>
            <span>${t('tipChaiModalTitle')}</span>
          </h3>
          <p class="text-xs text-[var(--muted)] mt-1">${t('tipChaiDesc')}</p>
        </div>

        <!-- Mobile: Direct UPI Deep Link -->
        <div class="pt-1">
          <a
            href="${upiDeepLink}"
            class="btn-primary w-full py-2.5 px-4 text-sm font-semibold"
          >
            ${getLucideIcon('coffee', 'w-4 h-4 text-inherit')}
            <span>${t('payViaUpi')}</span>
          </a>
        </div>

        <!-- Desktop QR Code Fallback -->
        <div class="pt-2 border-t border-[var(--border)] space-y-2">
          <p class="text-[11px] font-medium text-[var(--muted)]">${t('scanQr')}</p>
          <div class="bg-white p-2.5 rounded-xl inline-block shadow-xs border border-[var(--border)]">
            <canvas id="upi-qr-canvas" class="w-32 h-32 mx-auto"></canvas>
          </div>
          <div class="text-[10px] font-mono text-[var(--muted)]">
            UPI: <span class="text-[var(--text)] font-semibold">${upiId}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Generate QR Code on canvas
  const canvas = document.getElementById('upi-qr-canvas');
  if (canvas) {
    QRCode.toCanvas(canvas, upiDeepLink, {
      width: 128,
      margin: 1,
      color: {
        dark: '#0B0F14',
        light: '#FFFFFF'
      }
    });
  }

  document.getElementById('btn-close-chai')?.addEventListener('click', () => closeModal(true));
  document.getElementById('chai-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'chai-backdrop') closeModal(true);
  });
}

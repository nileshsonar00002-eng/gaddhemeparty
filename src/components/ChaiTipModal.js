import QRCode from 'qrcode';
import { t } from '../utils/i18n';
import { modalManager } from '../utils/modalManager';

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
    <div id="chai-backdrop" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1100] flex items-center justify-center p-4 animate-fade-in">
      <div class="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6 text-center space-y-4">
        <!-- Close Button -->
        <button id="btn-close-chai" class="absolute top-4 right-4 p-1.5 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Icon & Header -->
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner">
          ☕
        </div>
        <div>
          <h3 class="text-lg font-black text-[var(--text-primary)] tracking-tight">${t('tipChaiModalTitle')}</h3>
          <p class="text-xs text-[var(--text-muted)] mt-1">${t('tipChaiDesc')}</p>
        </div>

        <!-- Mobile: Direct UPI Deep Link -->
        <div class="pt-1">
          <a
            href="${upiDeepLink}"
            class="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition"
          >
            <span>📱</span>
            <span>${t('payViaUpi')}</span>
          </a>
        </div>

        <!-- Desktop QR Code Fallback -->
        <div class="pt-2 border-t border-[var(--border-color)] space-y-2">
          <p class="text-[11px] font-semibold text-[var(--text-muted)]">${t('scanQr')}</p>
          <div class="bg-white p-3 rounded-2xl inline-block shadow-md">
            <canvas id="upi-qr-canvas" class="w-36 h-36 mx-auto"></canvas>
          </div>
          <div class="text-[10px] font-mono text-[var(--text-muted)]">
            UPI: <span class="text-[var(--accent-amber-text)] font-bold">${upiId}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Generate QR Code on canvas
  const canvas = document.getElementById('upi-qr-canvas');
  if (canvas) {
    QRCode.toCanvas(canvas, upiDeepLink, {
      width: 144,
      margin: 1,
      color: {
        dark: '#0B0F19',
        light: '#FFFFFF'
      }
    });
  }

  document.getElementById('btn-close-chai')?.addEventListener('click', () => closeModal(true));
  document.getElementById('chai-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'chai-backdrop') closeModal(true);
  });
}

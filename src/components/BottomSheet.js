// Touch-draggable Mobile Bottom Sheet Drawer Component
import { modalManager } from '../utils/modalManager';

export class BottomSheet {
  constructor(containerId = 'bottom-sheet-container') {
    this.container = document.getElementById(containerId);
    this.isOpen = false;
    this.onCloseCallbacks = [];
    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div id="sheet-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1040] opacity-0 pointer-events-none transition-opacity duration-300"></div>
      <div id="sheet-drawer" class="fixed bottom-0 left-0 right-0 z-[1050] max-h-[90dvh] bg-[var(--bg-surface)] border-t border-[var(--border-color)] rounded-t-3xl shadow-2xl transform translate-y-full transition-transform duration-300 ease-out flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom,16px)]">
        <!-- Top Center Drag Handle & Close Button -->
        <div class="w-full pt-2.5 pb-1.5 flex items-center justify-center relative select-none">
          <button
            id="sheet-top-close-btn"
            type="button"
            class="group flex items-center gap-1.5 px-4 py-1 rounded-full bg-[var(--bg-card-hover)] hover:bg-amber-500/20 active:scale-95 text-[var(--text-secondary)] hover:text-amber-400 border border-[var(--border-color)] hover:border-amber-500/40 shadow-sm transition-all duration-150 cursor-pointer focus:outline-none"
            title="बंद करें (Close)"
            aria-label="Close Report Window"
          >
            <svg class="w-4 h-4 text-amber-500 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
            </svg>
            <span class="text-xs font-heading font-bold tracking-wide">बंद करें / Close</span>
          </button>
        </div>
        <!-- Content Container -->
        <div id="sheet-content" class="px-5 pb-6 overflow-y-auto max-h-[82dvh] overscroll-contain"></div>
      </div>
    `;

    this.backdrop = document.getElementById('sheet-backdrop');
    this.drawer = document.getElementById('sheet-drawer');
    this.content = document.getElementById('sheet-content');

    // Top center close button click
    document.getElementById('sheet-top-close-btn')?.addEventListener('click', () => this.close());

    // Click outside to close
    this.backdrop?.addEventListener('click', () => this.close());

    // Touch Swipe down gesture support
    let startY = 0;
    let currentY = 0;

    this.drawer?.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    this.drawer?.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 0) {
        // Dragging down
        this.drawer.style.transform = `translateY(${diff}px)`;
      }
    }, { passive: true });

    this.drawer?.addEventListener('touchend', () => {
      const diff = currentY - startY;
      if (diff > 120) {
        this.close();
      } else {
        this.drawer.style.transform = 'translateY(0)';
      }
      startY = 0;
      currentY = 0;
    });
  }

  open(htmlContent) {
    if (!this.drawer || !this.backdrop) return;
    this.content.innerHTML = htmlContent;
    this.isOpen = true;

    modalManager.openModal('report-bottom-sheet', () => this.close(false));

    this.backdrop.classList.remove('opacity-0', 'pointer-events-none');
    this.backdrop.classList.add('opacity-100', 'pointer-events-auto');

    this.drawer.classList.remove('translate-y-full');
    this.drawer.style.transform = 'translateY(0)';
  }

  close(notifyManager = true) {
    if (!this.drawer || !this.backdrop) return;
    this.isOpen = false;

    if (notifyManager) {
      modalManager.closeActiveModal();
    } else {
      modalManager.notifyClosed('report-bottom-sheet');
    }

    this.backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    this.backdrop.classList.add('opacity-0', 'pointer-events-none');

    this.drawer.classList.add('translate-y-full');
    this.drawer.style.transform = 'translateY(100%)';

    this.onCloseCallbacks.forEach((fn) => fn());
  }

  onClose(cb) {
    this.onCloseCallbacks.push(cb);
  }
}

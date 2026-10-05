// Responsive Report Drawer / Bottom Sheet Component
// Desktop (>= 768px): Right-side docked non-modal panel (440px wide, no backdrop, map interactive)
// Mobile (< 768px): Modal Bottom Sheet (max-h 85dvh, backdrop, drag handle, swipe-to-close)
// Fullscreen Support: Dynamically docks over the map in both normal and fullscreen modes

import { modalManager } from '../utils/modalManager';

export class BottomSheet {
  constructor(containerId = 'bottom-sheet-container') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.isOpen = false;
    this.onCloseCallbacks = [];
    this.onOpenCallbacks = [];
    this.lastFocusedElement = null;
    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDragging = false;
    this.init();
  }

  init() {
    if (!this.container) {
      let root = document.getElementById(this.containerId);
      if (!root) {
        root = document.createElement('div');
        root.id = this.containerId;
        root.className = 'z-[1050]';
        document.body.appendChild(root);
      }
      this.container = root;
    }

    this.container.innerHTML = `
      <!-- Modal Backdrop (Active ONLY on Mobile < 768px; md:hidden keeps desktop non-modal) -->
      <div
        id="sheet-backdrop"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1040] md:hidden opacity-0 pointer-events-none transition-opacity duration-250 ease-out"
        aria-hidden="true"
      ></div>

      <!-- Drawer / Panel Container -->
      <div
        id="sheet-drawer"
        role="dialog"
        aria-modal="false"
        aria-labelledby="report-panel-title"
        class="fixed z-[1050] bg-[var(--surface)] text-[var(--text)] border-[var(--border)] shadow-2xl flex flex-col transition-transform duration-250 ease-out pointer-events-none
               /* Mobile: Bottom Sheet */
               bottom-0 left-0 right-0 max-h-[85dvh] rounded-t-3xl border-t translate-y-full pb-[env(safe-area-inset-bottom,12px)]
               /* Desktop / Tablet (>= 768px): Right Docked Panel */
               md:top-16 md:right-0 md:bottom-0 md:left-auto md:w-[440px] md:max-w-[440px] md:h-[calc(100dvh-4rem)] md:max-h-none md:rounded-none md:border-t-0 md:border-r-0 md:border-b-0 md:border-l md:translate-y-0 md:translate-x-full md:pb-0"
      >
        <!-- Mobile Top Drag Handle Bar -->
        <div id="sheet-drag-handle" class="md:hidden w-full pt-2.5 pb-1 flex items-center justify-center cursor-grab active:cursor-grabbing select-none flex-shrink-0">
          <div class="w-10 h-1.5 rounded-full bg-[var(--border)] opacity-80"></div>
        </div>

        <!-- Scrollable Content Mount -->
        <div id="sheet-content" class="flex-1 flex flex-col min-h-0 overflow-hidden w-full max-w-[460px] mx-auto"></div>
      </div>
    `;

    this.backdrop = document.getElementById('sheet-backdrop');
    this.drawer = document.getElementById('sheet-drawer');
    this.content = document.getElementById('sheet-content');
    this.dragHandle = document.getElementById('sheet-drag-handle');

    // Click backdrop to close (mobile only)
    this.backdrop?.addEventListener('click', () => this.close());

    // Setup Mobile Swipe Down Gestures
    this.setupMobileSwipe();

    // Setup Global Escape Key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    });

    // Handle screen resize to sync modal / non-modal states
    window.addEventListener('resize', () => {
      if (this.isOpen) {
        const isDesktop = window.innerWidth >= 768;
        this.drawer?.setAttribute('aria-modal', isDesktop ? 'false' : 'true');
        if (isDesktop) {
          this.backdrop?.classList.remove('opacity-100', 'pointer-events-auto');
          this.backdrop?.classList.add('opacity-0', 'pointer-events-none');
        } else {
          this.backdrop?.classList.remove('opacity-0', 'pointer-events-none');
          this.backdrop?.classList.add('opacity-100', 'pointer-events-auto');
        }
      }
      this.syncFullscreenMount();
    });

    // Handle Fullscreen state transitions to ensure panel is always above map
    const handleFsChange = () => this.syncFullscreenMount();
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
  }

  syncFullscreenMount() {
    const card = document.getElementById('map-card-container');
    const isFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      card?.classList.contains('is-fullscreen')
    );

    if (isFs && card) {
      if (this.container && this.container.parentElement !== card) {
        card.appendChild(this.container);
      }
      this.drawer?.classList.add('is-map-fullscreen');
    } else {
      const appRoot = document.getElementById('app') || document.body;
      if (this.container && this.container.parentElement !== appRoot && this.container.parentElement !== document.body) {
        appRoot.appendChild(this.container);
      }
      this.drawer?.classList.remove('is-map-fullscreen');
    }
  }

  setupMobileSwipe() {
    if (!this.drawer) return;

    const handleTouchStart = (e) => {
      if (window.innerWidth >= 768) return;
      this.touchStartY = e.touches[0].clientY;
      this.touchCurrentY = this.touchStartY;
      this.isDragging = true;
    };

    const handleTouchMove = (e) => {
      if (!this.isDragging || window.innerWidth >= 768) return;
      this.touchCurrentY = e.touches[0].clientY;
      const deltaY = this.touchCurrentY - this.touchStartY;
      if (deltaY > 0) {
        this.drawer.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!this.isDragging || window.innerWidth >= 768) return;
      this.isDragging = false;
      const deltaY = this.touchCurrentY - this.touchStartY;
      if (deltaY > 100) {
        this.close();
      } else {
        this.drawer.style.transform = '';
      }
      this.touchStartY = 0;
      this.touchCurrentY = 0;
    };

    this.dragHandle?.addEventListener('touchstart', handleTouchStart, { passive: true });
    this.dragHandle?.addEventListener('touchmove', handleTouchMove, { passive: true });
    this.dragHandle?.addEventListener('touchend', handleTouchEnd);
  }

  open(htmlContent = '') {
    if (!this.drawer) return;
    this.syncFullscreenMount();

    if (htmlContent && this.content) {
      this.content.innerHTML = htmlContent;
    }

    this.isOpen = true;
    this.lastFocusedElement = document.activeElement;

    const isDesktop = window.innerWidth >= 768;
    this.drawer.setAttribute('aria-modal', isDesktop ? 'false' : 'true');

    // On mobile, register with modalManager for back-button & focus management
    if (!isDesktop) {
      modalManager.openModal('report-bottom-sheet', () => this.close(false));
      this.backdrop?.classList.remove('opacity-0', 'pointer-events-none');
      this.backdrop?.classList.add('opacity-100', 'pointer-events-auto');
    } else {
      this.backdrop?.classList.remove('opacity-100', 'pointer-events-auto');
      this.backdrop?.classList.add('opacity-0', 'pointer-events-none');
    }

    // Open Animation
    this.drawer.classList.remove('pointer-events-none', 'translate-y-full', 'md:translate-x-full');
    this.drawer.classList.add('pointer-events-auto', 'translate-y-0', 'md:translate-x-0');
    this.drawer.style.transform = '';

    this.onOpenCallbacks.forEach((fn) => fn());
  }

  close(notifyManager = true) {
    if (!this.isOpen && !this.drawer) return;
    this.isOpen = false;

    const isDesktop = window.innerWidth >= 768;

    if (notifyManager) {
      modalManager.notifyClosed('report-bottom-sheet');
    }

    this.backdrop?.classList.remove('opacity-100', 'pointer-events-auto');
    this.backdrop?.classList.add('opacity-0', 'pointer-events-none');

    // Close Animation
    this.drawer.classList.remove('pointer-events-auto', 'translate-y-0', 'md:translate-x-0');
    this.drawer.classList.add('pointer-events-none', 'translate-y-full', 'md:translate-x-full');
    this.drawer.style.transform = '';

    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      try { this.lastFocusedElement.focus(); } catch (_) {}
    }

    this.onCloseCallbacks.forEach((fn) => fn());
  }

  onOpen(cb) {
    this.onOpenCallbacks.push(cb);
  }

  onClose(cb) {
    this.onCloseCallbacks.push(cb);
  }
}

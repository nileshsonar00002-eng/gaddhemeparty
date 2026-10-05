// Centralized Modal, Sheet & Panel Coordinator
// Ensures hardware/browser Back button closes active modals/panels step-by-step returning to home screen instead of exiting site.

class ModalManager {
  constructor() {
    this.stack = [];
    this.isProgrammaticPop = false;
    this.initListeners();
  }

  initListeners() {
    // Browser / Mobile Device Hardware Back button listener
    window.addEventListener('popstate', () => {
      if (this.isProgrammaticPop) {
        this.isProgrammaticPop = false;
        return;
      }

      if (this.stack.length > 0) {
        const topModal = this.stack.pop();
        if (topModal && typeof topModal.closeFn === 'function') {
          topModal.closeFn(false); // Close UI cleanly without triggering extra history.back()
        }
      }
    });

    // Global ESC key listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.stack.length > 0) {
        this.closeActiveModal();
      }
    });
  }

  openModal(modalId, closeFn) {
    if (!modalId) return;

    // Avoid duplicate push if already top of stack
    if (this.stack.length > 0 && this.stack[this.stack.length - 1].id === modalId) {
      return;
    }

    this.stack.push({ id: modalId, closeFn });

    // Push history state so back button closes modal/panel
    try {
      window.history.pushState({ khaddaModal: modalId, depth: this.stack.length }, '', window.location.href);
    } catch (e) {
      // Ignore if sandboxed
    }
  }

  closeActiveModal(shouldPopHistory = true) {
    if (this.stack.length === 0) return;
    const topModal = this.stack.pop();

    if (topModal && typeof topModal.closeFn === 'function') {
      topModal.closeFn(false);
    }

    if (shouldPopHistory && window.history.state?.khaddaModal) {
      this.isProgrammaticPop = true;
      try {
        window.history.back();
      } catch (e) {
        this.isProgrammaticPop = false;
      }
    }
  }

  notifyClosed(modalId) {
    const idx = this.stack.findIndex((m) => m.id === modalId);
    if (idx !== -1) {
      this.stack.splice(idx, 1);
      if (window.history.state?.khaddaModal) {
        this.isProgrammaticPop = true;
        try {
          window.history.back();
        } catch (e) {
          this.isProgrammaticPop = false;
        }
      }
    }
  }

  isAnyModalOpen() {
    return this.stack.length > 0;
  }
}

export const modalManager = new ModalManager();

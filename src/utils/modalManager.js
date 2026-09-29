// Centralized Modal & Sheet Coordinator
// Ensures only ONE modal/sheet is open at a time, and wires Escape + Browser Back button (popstate).

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.isHandlingPopState = false;
    this.initListeners();
  }

  initListeners() {
    // Browser Back button listener
    window.addEventListener('popstate', () => {
      if (this.activeModal) {
        const { closeFn } = this.activeModal;
        this.activeModal = null;
        if (typeof closeFn === 'function') {
          closeFn(false); // Do not call history.back again
        }
      }
    });

    // Global ESC key listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeActiveModal();
      }
    });
  }

  openModal(modalId, closeFn) {
    // If another modal is open, close it cleanly first
    if (this.activeModal && this.activeModal.id !== modalId) {
      const prevClose = this.activeModal.closeFn;
      this.activeModal = null;
      if (typeof prevClose === 'function') {
        prevClose(false);
      }
    }

    this.activeModal = { id: modalId, closeFn };

    // Push history state so back button closes modal
    try {
      window.history.pushState({ khaddaModal: modalId }, '', window.location.href);
    } catch (e) {
      // Ignore if iframe/sandboxed
    }
  }

  closeActiveModal(shouldPopHistory = true) {
    if (!this.activeModal) return;
    const { closeFn } = this.activeModal;
    this.activeModal = null;

    if (typeof closeFn === 'function') {
      closeFn(false);
    }

    if (shouldPopHistory && window.history.state?.khaddaModal) {
      try {
        window.history.back();
      } catch (e) {}
    }
  }

  notifyClosed(modalId) {
    if (this.activeModal && this.activeModal.id === modalId) {
      this.activeModal = null;
    }
  }

  isAnyModalOpen() {
    return this.activeModal !== null;
  }
}

export const modalManager = new ModalManager();

import { modalManager } from '../utils/modalManager';

export function openPhotoLightbox(images = [], initialIndex = 0, caption = '') {
  const photoList = Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []);
  if (photoList.length === 0) return;

  let currentIndex = Math.max(0, Math.min(initialIndex, photoList.length - 1));
  let root = document.getElementById('photo-lightbox-container');
  if (!root) {
    root = document.createElement('div');
    root.id = 'photo-lightbox-container';
    document.body.appendChild(root);
  }

  const render = () => {
    root.innerHTML = `
      <div
        id="lightbox-backdrop"
        class="fixed inset-0 z-[100005] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
      >
        <!-- Top Action Bar -->
        <div class="flex items-center justify-between z-20 gap-3">
          <div class="flex items-center gap-2.5 text-white/90">
            <span class="text-lg">📸</span>
            <div class="min-w-0">
              ${photoList.length > 1 ? `
                <span class="text-xs sm:text-sm font-mono font-bold bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                  ${currentIndex + 1} / ${photoList.length}
                </span>
              ` : ''}
              ${caption ? `
                <span class="text-xs sm:text-sm text-slate-300 ml-2 truncate max-w-[200px] sm:max-w-md inline-block align-middle font-medium">
                  ${caption}
                </span>
              ` : ''}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Open in New Tab Button -->
            <a
              href="${photoList[currentIndex]}"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 border border-white/10 shadow-lg"
              title="Open full resolution"
              aria-label="Open full resolution"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>

            <!-- Close Button -->
            <button
              id="lightbox-btn-close"
              type="button"
              class="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition active:scale-95 border border-white/10 shadow-lg cursor-pointer"
              title="Close image"
              aria-label="Close image"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Center Image Viewport -->
        <div id="lightbox-viewport" class="relative flex-1 flex items-center justify-center overflow-hidden my-2">
          <!-- Previous Button -->
          ${photoList.length > 1 ? `
            <button
              id="lightbox-btn-prev"
              type="button"
              class="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition shadow-2xl active:scale-90 cursor-pointer"
              aria-label="Previous image"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>
          ` : ''}

          <!-- Main Image -->
          <img
            id="lightbox-active-img"
            src="${photoList[currentIndex]}"
            alt="Pothole full photo"
            class="max-w-[95vw] sm:max-w-[90vw] max-h-[75vh] sm:max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 transition-transform duration-200"
          />

          <!-- Next Button -->
          ${photoList.length > 1 ? `
            <button
              id="lightbox-btn-next"
              type="button"
              class="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition shadow-2xl active:scale-90 cursor-pointer"
              aria-label="Next image"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>
          ` : ''}
        </div>

        <!-- Bottom Thumbnails (if multiple photos) -->
        ${photoList.length > 1 ? `
          <div class="flex items-center justify-center gap-2 overflow-x-auto py-2 px-1 z-20 max-w-xl mx-auto">
            ${photoList.map((img, i) => `
              <button
                type="button"
                data-lb-thumb="${i}"
                class="lightbox-thumb flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${i === currentIndex ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105' : 'border-white/20 opacity-50 hover:opacity-100'}"
              >
                <img src="${img}" alt="thumbnail ${i + 1}" class="w-full h-full object-cover" />
              </button>
            `).join('')}
          </div>
        ` : '<div></div>'}
      </div>
    `;

    attachHandlers();
  };

  const closeLightbox = () => {
    modalManager.notifyClosed('photo-lightbox');
    window.removeEventListener('keydown', handleKeyDown);
    root.innerHTML = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'ArrowLeft' && photoList.length > 1) {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + photoList.length) % photoList.length;
      render();
    } else if (e.key === 'ArrowRight' && photoList.length > 1) {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % photoList.length;
      render();
    }
  };

  const attachHandlers = () => {
    const backdrop = root.querySelector('#lightbox-backdrop');
    const closeBtn = root.querySelector('#lightbox-btn-close');
    const prevBtn = root.querySelector('#lightbox-btn-prev');
    const nextBtn = root.querySelector('#lightbox-btn-next');
    const viewport = root.querySelector('#lightbox-viewport');

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeLightbox();
    });

    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop || e.target === viewport) {
        closeLightbox();
      }
    });

    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentIndex = (currentIndex - 1 + photoList.length) % photoList.length;
      render();
    });

    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentIndex = (currentIndex + 1) % photoList.length;
      render();
    });

    root.querySelectorAll('.lightbox-thumb').forEach((thumbBtn) => {
      thumbBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(thumbBtn.getAttribute('data-lb-thumb'));
        if (!isNaN(idx)) {
          currentIndex = idx;
          render();
        }
      });
    });

    // Touch swipe gestures
    let touchStartX = 0;
    let touchStartY = 0;

    viewport?.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].screenX;
      touchStartY = e.touches[0].screenY;
    }, { passive: true });

    viewport?.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
        if (diffX > 0 && photoList.length > 1) {
          currentIndex = (currentIndex - 1 + photoList.length) % photoList.length;
          render();
        } else if (diffX < 0 && photoList.length > 1) {
          currentIndex = (currentIndex + 1) % photoList.length;
          render();
        }
      } else if (Math.abs(diffY) > 90) {
        closeLightbox();
      }
    }, { passive: true });
  };

  modalManager.openModal('photo-lightbox', () => closeLightbox());
  window.addEventListener('keydown', handleKeyDown);
  render();
}

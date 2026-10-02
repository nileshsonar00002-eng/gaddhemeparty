// Image Fullscreen Lightbox with Multi-Photo Gallery & Zoom Support

export function openLightbox(imagesInput, title = 'Pothole Image', initialIndex = 0) {
  let images = [];
  if (Array.isArray(imagesInput)) {
    images = imagesInput.filter((img) => img && typeof img === 'string');
  } else if (imagesInput && typeof imagesInput === 'string') {
    images = [imagesInput];
  }

  if (images.length === 0) return;

  let currentIndex = Math.max(0, Math.min(initialIndex, images.length - 1));

  let modal = document.getElementById('admin-lightbox-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'admin-lightbox-modal';
  modal.className = 'fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none animate-in fade-in duration-200';

  const render = () => {
    const currentImg = images[currentIndex];
    modal.innerHTML = `
      <!-- Top Bar -->
      <div class="w-full flex items-center justify-between z-20 text-white">
        <div class="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700 backdrop-blur-md text-xs font-medium max-w-[70vw] truncate">
          <span>📸</span>
          <span class="truncate">${title}</span>
          ${images.length > 1 ? `<span class="ml-1.5 font-mono text-amber-400 bg-slate-800 px-2 py-0.5 rounded-full text-[11px] border border-slate-700">${currentIndex + 1} / ${images.length}</span>` : ''}
        </div>
        <div class="flex items-center gap-2">
          <a
            href="${currentImg}"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 transition"
          >
            Open Original ↗
          </a>
          <button
            id="btn-close-lightbox"
            type="button"
            class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Main Image Viewport -->
      <div id="lightbox-viewport" class="relative max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center p-2 my-auto">
        ${images.length > 1 ? `
          <button
            id="btn-prev-lightbox"
            type="button"
            class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700 flex items-center justify-center transition shadow-2xl active:scale-95 cursor-pointer font-bold text-lg"
            title="Previous photo (Left Arrow)"
          >
            ❮
          </button>
        ` : ''}

        <img
          src="${currentImg}"
          alt="${title}"
          class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-slate-800 transition-all duration-200"
        />

        ${images.length > 1 ? `
          <button
            id="btn-next-lightbox"
            type="button"
            class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700 flex items-center justify-center transition shadow-2xl active:scale-95 cursor-pointer font-bold text-lg"
            title="Next photo (Right Arrow)"
          >
            ❯
          </button>
        ` : ''}
      </div>

      <!-- Bottom Thumbnails if multiple images -->
      ${images.length > 1 ? `
        <div class="flex items-center justify-center gap-2 overflow-x-auto py-2 px-1 z-20 max-w-xl mx-auto no-scrollbar">
          ${images.map((img, i) => `
            <button
              type="button"
              data-thumb-idx="${i}"
              class="admin-lb-thumb flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition cursor-pointer ${i === currentIndex ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105' : 'border-slate-800 opacity-50 hover:opacity-100'}"
            >
              <img src="${img}" alt="Thumb ${i + 1}" class="w-full h-full object-cover" />
            </button>
          `).join('')}
        </div>
      ` : '<div></div>'}
    `;

    attachListeners();
  };

  const close = () => {
    modal.classList.add('opacity-0');
    setTimeout(() => modal.remove(), 150);
    window.removeEventListener('keydown', onKey);
  };

  const attachListeners = () => {
    modal.querySelector('#btn-close-lightbox')?.addEventListener('click', close);

    modal.querySelector('#btn-prev-lightbox')?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      render();
    });

    modal.querySelector('#btn-next-lightbox')?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentIndex = (currentIndex + 1) % images.length;
      render();
    });

    modal.querySelectorAll('.admin-lb-thumb').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.getAttribute('data-thumb-idx'));
        if (!isNaN(idx)) {
          currentIndex = idx;
          render();
        }
      });
    });

    modal.addEventListener('click', (e) => {
      const viewport = modal.querySelector('#lightbox-viewport');
      if (e.target === modal || e.target === viewport) {
        close();
      }
    });
  };

  const onKey = (e) => {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowLeft' && images.length > 1) {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      render();
    } else if (e.key === 'ArrowRight' && images.length > 1) {
      currentIndex = (currentIndex + 1) % images.length;
      render();
    }
  };

  document.body.appendChild(modal);
  window.addEventListener('keydown', onKey);
  render();
}


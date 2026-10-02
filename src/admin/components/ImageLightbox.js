// Image Fullscreen Lightbox with Zoom

export function openLightbox(imageUrl, title = 'Pothole Image') {
  if (!imageUrl) return;

  let modal = document.getElementById('admin-lightbox-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'admin-lightbox-modal';
  modal.className = 'fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200';

  modal.innerHTML = `
    <!-- Top Bar -->
    <div class="absolute top-4 left-4 right-4 flex items-center justify-between z-20 text-white">
      <div class="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700 backdrop-blur-md text-xs font-medium max-w-[70vw] truncate">
        <span>📸</span>
        <span class="truncate">${title}</span>
      </div>
      <div class="flex items-center gap-2">
        <a
          href="${imageUrl}"
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

    <!-- Image Container -->
    <div class="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center p-2">
      <img
        src="${imageUrl}"
        alt="${title}"
        class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-slate-800"
      />
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => {
    modal.classList.add('opacity-0');
    setTimeout(() => modal.remove(), 150);
  };

  modal.querySelector('#btn-close-lightbox')?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.tagName === 'DIV') {
      close();
    }
  });

  const onKey = (e) => {
    if (e.key === 'Escape') {
      close();
      window.removeEventListener('keydown', onKey);
    }
  };
  window.addEventListener('keydown', onKey);
}

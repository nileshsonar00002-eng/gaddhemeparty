// Modern Toast Notification Utility

export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-6 right-6 z-[99999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto transform translate-y-4 opacity-0 transition-all duration-300 ease-out flex items-center gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md border text-sm font-medium ${
    type === 'success'
      ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50'
      : type === 'error'
      ? 'bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50'
      : type === 'warning'
      ? 'bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-amber-950/50'
      : 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-black/50'
  }`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ️';

  toast.innerHTML = `
    <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
      type === 'success'
        ? 'bg-emerald-500 text-slate-950'
        : type === 'error'
        ? 'bg-rose-500 text-white'
        : type === 'warning'
        ? 'bg-amber-500 text-slate-950'
        : 'bg-slate-700 text-white'
    }">
      ${icon}
    </div>
    <div class="flex-1 leading-snug break-words">${message}</div>
    <button type="button" class="text-xs opacity-60 hover:opacity-100 transition cursor-pointer p-1">✕</button>
  `;

  const closeBtn = toast.querySelector('button');
  closeBtn.onclick = () => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 250);
  };

  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 250);
    }
  }, duration);
}

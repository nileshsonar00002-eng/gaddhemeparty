// Toast notifications system

export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    info: 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-primary)] shadow-lg',
    success: 'bg-emerald-950/90 dark:bg-emerald-950/90 bg-emerald-900 border-emerald-500/50 text-emerald-100 dark:text-emerald-200',
    warning: 'bg-amber-950/90 dark:bg-amber-950/90 bg-amber-900 border-amber-500/50 text-amber-100 dark:text-amber-200',
    error: 'bg-rose-950/90 dark:bg-rose-950/90 bg-rose-900 border-rose-500/50 text-rose-100 dark:text-rose-200'
  };

  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs sm:text-sm font-semibold transition-all duration-300 transform translate-y-2 opacity-0 ${typeStyles[type] || typeStyles.info}`;
  toast.innerHTML = `
    <span>${icons[type] || '🔔'}</span>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  // Auto dismiss
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('-translate-y-2', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// Toast notifications system

export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    info: 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] shadow-lg',
    success: 'bg-[var(--surface)] border-[var(--success)] text-[var(--success)] shadow-lg',
    warning: 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] shadow-lg',
    error: 'bg-[var(--surface)] border-[var(--danger)] text-[var(--danger)] shadow-lg'
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

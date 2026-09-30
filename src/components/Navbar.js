import { t, getLanguage, setLanguage } from '../utils/i18n';
import { router } from '../utils/router';
import { getLucideIcon } from '../utils/icons';

let isScrollListenerAttached = false;

export function createNavbar(options = {}) {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const {
    onChaiTipClick,
    onToggleMapTheme,
    currentTheme = 'dark',
    activeNav = 'map'
  } = options;

  const currentLang = getLanguage();
  const isHindi = currentLang === 'hindi';
  const shareUrl = window.location.origin;
  const shareText = isHindi
    ? `🚗💥 *गड्ढे में पार्टी* (Gaddhe Me Party)\n"जहाँ गड्ढा, वहाँ पार्टी"\n\nसड़कों के गड्ढों को बिना लॉगिन रिपोर्ट और ट्रैक करें! लाइव मैप पर अपने शहर के गड्ढे देखें:\n👉 ${shareUrl}`
    : `🚗💥 *Gaddhe Me Party*\n"Jaha Gaddha, Waha Party"\n\nReport & track road hazards without login across India! Check live pothole map:\n👉 ${shareUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  container.innerHTML = `
    <div class="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between bg-[var(--bg)] border-b border-[var(--border)] relative z-50 transition-colors duration-200">
      <!-- Left: Brand Logo + Titles -->
      <div class="flex items-center gap-2.5 sm:gap-3">
        <!-- Logo Badge -->
        <button type="button" id="nav-brand-btn" class="flex-shrink-0 cursor-pointer focus:outline-none" title="${t('appNameHindi')}">
          <img src="/logo.svg" alt="Logo" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition transform duration-150 hover:scale-105" />
        </button>

        <!-- Titles & Tagline -->
        <div class="flex flex-col justify-center">
          <span class="font-heading font-bold text-sm sm:text-base text-[var(--text)] tracking-tight leading-tight">
            ${t('appNameHindi')}
          </span>
          <p class="font-medium text-[10px] sm:text-xs text-[var(--accent)] tracking-normal leading-none mt-0.5">
            "${t('tagline')}"
          </p>
        </div>
      </div>

      <!-- Center Nav Links (Desktop) -->
      <nav class="hidden lg:flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)] select-none">
        <!-- Map -->
        <button
          type="button"
          data-nav-panel="map"
          class="nav-panel-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${activeNav === 'map' ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}"
        >
          ${getLucideIcon('map', 'w-3.5 h-3.5')}
          <span>${t('navMap')}</span>
        </button>

        <!-- Leaderboard -->
        <button
          type="button"
          data-nav-panel="leaderboard"
          class="nav-panel-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${activeNav === 'leaderboard' ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}"
        >
          ${getLucideIcon('trophy', 'w-3.5 h-3.5')}
          <span>${t('navLeaderboard')}</span>
        </button>

        <!-- Mission -->
        <button
          type="button"
          data-nav-panel="mission"
          class="nav-panel-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${activeNav === 'mission' ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}"
        >
          ${getLucideIcon('target', 'w-3.5 h-3.5')}
          <span>${t('navMission')}</span>
        </button>

        <!-- How It Works -->
        <button
          type="button"
          data-nav-panel="how"
          class="nav-panel-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${activeNav === 'how' || activeNav === 'how-it-works' ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}"
        >
          ${getLucideIcon('zap', 'w-3.5 h-3.5')}
          <span>${t('navHowItWorks')}</span>
        </button>

        <!-- About Us -->
        <button
          type="button"
          data-nav-panel="about"
          class="nav-panel-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${activeNav === 'about' ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}"
        >
          ${getLucideIcon('info', 'w-3.5 h-3.5')}
          <span>${t('navAbout')}</span>
        </button>
      </nav>

      <!-- Right Actions: Theme + Lang + Chai + WhatsApp Share + Mobile Hamburger -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Dark / Light Theme Toggle Button -->
        <button
          id="btn-theme-toggle"
          type="button"
          class="btn-secondary p-2 text-xs"
          title="${currentTheme === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')}"
          aria-label="${currentTheme === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')}"
        >
          ${currentTheme === 'dark' ? getLucideIcon('sun', 'w-4 h-4 text-amber-400') : getLucideIcon('moon', 'w-4 h-4 text-slate-700')}
        </button>

        <!-- Segmented Language Toggle Pill [ हिंदी | EN ] -->
        <div class="flex items-center bg-[var(--surface-2)] p-0.5 rounded-xl border border-[var(--border)]">
          <button
            id="btn-lang-hi"
            type="button"
            class="px-2 py-1 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer ${isHindi ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)]'}"
          >
            हिंदी
          </button>
          <button
            id="btn-lang-en"
            type="button"
            class="px-2 py-1 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer ${!isHindi ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)]'}"
          >
            EN
          </button>
        </div>

        <!-- Chai Tip Button (Secondary button style with Lucide coffee icon) -->
        <button
          id="btn-chai-tip"
          type="button"
          class="btn-secondary px-2.5 sm:px-3 py-1.5 text-xs text-[var(--text)]"
          title="${t('tipChai')}"
          aria-label="${t('tipChai')}"
        >
          ${getLucideIcon('coffee', 'w-3.5 h-3.5 text-[var(--accent)]')}
          <span class="hidden sm:inline">${t('tipChai')}</span>
          <span class="sm:hidden font-medium">${t('tipChaiMobile')}</span>
        </button>

        <!-- WhatsApp Share Button -->
        <a
          href="${whatsappShareUrl}"
          target="_blank"
          rel="noopener noreferrer"
          id="btn-nav-share-whatsapp"
          class="btn-secondary px-2.5 sm:px-3 py-1.5 text-xs"
          title="Share Gaddhe Me Party on WhatsApp"
          aria-label="Share on WhatsApp"
        >
          ${getLucideIcon('share', 'w-3.5 h-3.5 text-[#25D366]')}
          <span class="font-medium tracking-normal hidden xs:inline">Share</span>
        </a>

        <!-- Mobile Hamburger Menu Button -->
        <button
          id="btn-mobile-menu-toggle"
          type="button"
          class="lg:hidden btn-secondary p-2"
          aria-label="Toggle navigation menu"
        >
          ${getLucideIcon('menu', 'w-4 h-4')}
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer Overlay -->
    <div id="mobile-nav-drawer" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1050] hidden transition-opacity duration-200">
      <div class="fixed top-0 right-0 w-4/5 max-w-xs h-full bg-[var(--surface)] border-l border-[var(--border)] p-5 flex flex-col justify-between shadow-xl animate-in slide-in-from-right duration-200">
        <div class="space-y-4">
          <!-- Drawer Header -->
          <div class="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div class="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" class="w-7 h-7 rounded-lg" />
              <span class="font-heading font-bold text-sm text-[var(--text)]">${t('appNameHindi')}</span>
            </div>
            <button id="btn-close-mobile-nav" class="btn-secondary p-1.5" aria-label="Close menu">
              ${getLucideIcon('x', 'w-4 h-4')}
            </button>
          </div>

          <!-- Drawer Navigation Links -->
          <nav class="flex flex-col gap-1.5 pt-2">
            <button type="button" data-nav-panel="map" class="mobile-nav-panel-btn flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition cursor-pointer ${activeNav === 'map' ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}">
              ${getLucideIcon('map', 'w-4 h-4')} <span>${t('navMap')}</span>
            </button>
            <button type="button" data-nav-panel="leaderboard" class="mobile-nav-panel-btn flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition cursor-pointer ${activeNav === 'leaderboard' ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}">
              ${getLucideIcon('trophy', 'w-4 h-4')} <span>${t('navLeaderboard')}</span>
            </button>
            <button type="button" data-nav-panel="mission" class="mobile-nav-panel-btn flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition cursor-pointer ${activeNav === 'mission' ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}">
              ${getLucideIcon('target', 'w-4 h-4')} <span>${t('navMission')}</span>
            </button>
            <button type="button" data-nav-panel="how" class="mobile-nav-panel-btn flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition cursor-pointer ${activeNav === 'how' || activeNav === 'how-it-works' ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}">
              ${getLucideIcon('zap', 'w-4 h-4')} <span>${t('navHowItWorks')}</span>
            </button>
            <button type="button" data-nav-panel="about" class="mobile-nav-panel-btn flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition cursor-pointer ${activeNav === 'about' ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}">
              ${getLucideIcon('info', 'w-4 h-4')} <span>${t('navAbout')}</span>
            </button>
          </nav>
        </div>

        <!-- Drawer Footer -->
        <div class="pt-4 border-t border-[var(--border)] space-y-2.5">
          <!-- Mobile Chai Tip Action Button -->
          <button
            type="button"
            id="btn-mobile-chai-tip"
            class="btn-secondary w-full py-2.5 px-3 flex items-center justify-between text-sm"
          >
            <div class="flex items-center gap-2">
              ${getLucideIcon('coffee', 'w-4 h-4 text-[var(--accent)]')}
              <span>${t('tipChai')}</span>
            </div>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)]">Tip</span>
          </button>

          <a
            href="${whatsappShareUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-secondary w-full py-2.5 px-3 flex items-center justify-center gap-2 text-sm"
          >
            ${getLucideIcon('share', 'w-4 h-4 text-[#25D366]')}
            <span>WhatsApp पर शेयर करें</span>
          </a>

          <p class="text-[11px] text-[var(--muted)] font-normal text-center">
            ${isHindi ? 'नागरिक पहल • 100% Free' : 'Civic Initiative • 100% Free'}
          </p>
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  document.getElementById('nav-brand-btn')?.addEventListener('click', () => {
    router.navigate('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('btn-lang-hi')?.addEventListener('click', () => {
    if (getLanguage() !== 'hindi') setLanguage('hindi');
  });

  document.getElementById('btn-lang-en')?.addEventListener('click', () => {
    if (getLanguage() !== 'english') setLanguage('english');
  });

  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    if (onToggleMapTheme) onToggleMapTheme();
  });

  document.getElementById('btn-chai-tip')?.addEventListener('click', () => {
    if (onChaiTipClick) onChaiTipClick();
  });

  document.getElementById('btn-mobile-chai-tip')?.addEventListener('click', () => {
    closeDrawer();
    if (onChaiTipClick) onChaiTipClick();
  });

  // Mobile Drawer Toggle
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const toggleBtn = document.getElementById('btn-mobile-menu-toggle');
  const closeBtn = document.getElementById('btn-close-mobile-nav');

  const openDrawer = () => mobileDrawer?.classList.remove('hidden');
  const closeDrawer = () => mobileDrawer?.classList.add('hidden');

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  mobileDrawer?.addEventListener('click', (e) => {
    if (e.target === mobileDrawer) closeDrawer();
  });

  // Panel navigation buttons
  container.querySelectorAll('.nav-panel-btn, .mobile-nav-panel-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      closeDrawer();
      const panelId = e.currentTarget.getAttribute('data-nav-panel');
      if (panelId === 'map') {
        router.navigate('');
      } else {
        router.navigate(panelId);
      }
    });
  });

  if (!isScrollListenerAttached) {
    isScrollListenerAttached = true;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        container.classList.add('is-scrolled');
      } else {
        container.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }
}

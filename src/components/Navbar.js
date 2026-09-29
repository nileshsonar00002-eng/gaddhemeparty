import { t, getLanguage, setLanguage } from '../utils/i18n';
import { router } from '../utils/router';

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
    <div class="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between bg-[var(--bg-nav)] backdrop-blur-md relative z-50 transition-colors duration-200">
      <!-- Left: Brand Logo + Titles -->
      <div class="flex items-center gap-2.5 sm:gap-3">
        <!-- Logo Badge -->
        <button type="button" id="nav-brand-btn" class="flex-shrink-0 group cursor-pointer focus:outline-none" title="${t('appNameHindi')}">
          <img src="/logo.svg" alt="Logo" class="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl drop-shadow-md group-hover:scale-105 transition transform duration-200" />
        </button>

        <!-- Titles & Tagline -->
        <div class="flex flex-col justify-center">
          <span class="font-heading font-extrabold text-base sm:text-lg text-[var(--text-primary)] tracking-tight leading-tight">
            ${t('appNameHindi')}
          </span>
          <!-- Tagline -->
          <p class="font-heading font-semibold text-[10px] sm:text-xs text-[var(--accent-amber-text)] tracking-wide leading-none mt-0.5">
            "${t('tagline')}"
          </p>
        </div>
      </div>

      <!-- Center Nav Links (Desktop) -> Triggers Slide-over Panels, NOT Page Scroll -->
      <nav class="hidden lg:flex items-center gap-1 bg-[var(--bg-card-subtle)] p-1 rounded-2xl border border-[var(--border-color)] shadow-inner select-none">
        <!-- Map -->
        <button
          type="button"
          data-nav-panel="map"
          class="nav-panel-btn flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all duration-150 cursor-pointer ${activeNav === 'map' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'}"
        >
          <span>🗺️</span>
          <span>${t('navMap')}</span>
        </button>

        <!-- Leaderboard -->
        <button
          type="button"
          data-nav-panel="leaderboard"
          class="nav-panel-btn flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all duration-150 cursor-pointer ${activeNav === 'leaderboard' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'}"
        >
          <span>🏆</span>
          <span>${t('navLeaderboard')}</span>
        </button>

        <!-- Mission -->
        <button
          type="button"
          data-nav-panel="mission"
          class="nav-panel-btn flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all duration-150 cursor-pointer ${activeNav === 'mission' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'}"
        >
          <span>🎯</span>
          <span>${t('navMission')}</span>
        </button>

        <!-- How It Works -->
        <button
          type="button"
          data-nav-panel="how"
          class="nav-panel-btn flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all duration-150 cursor-pointer ${activeNav === 'how' || activeNav === 'how-it-works' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'}"
        >
          <span>⚡</span>
          <span>${t('navHowItWorks')}</span>
        </button>

        <!-- About Us -->
        <button
          type="button"
          data-nav-panel="about"
          class="nav-panel-btn flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all duration-150 cursor-pointer ${activeNav === 'about' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'}"
        >
          <span>🇮🇳</span>
          <span>${t('navAbout')}</span>
        </button>
      </nav>

      <!-- Right Actions: Theme + Lang + Chai + WhatsApp Share + Mobile Hamburger -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Dark / Light Theme Toggle Button -->
        <button
          id="btn-theme-toggle"
          type="button"
          class="p-2 text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card-hover)] active:scale-90 rounded-xl border border-[var(--border-color)] shadow-sm cursor-pointer transition-all duration-200 flex items-center justify-center select-none"
          title="${currentTheme === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')}"
          aria-label="${currentTheme === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')}"
          aria-pressed="${currentTheme === 'light'}"
        >
          <span class="inline-block transition-transform duration-250 transform">${currentTheme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        <!-- Segmented Language Toggle Pill [ हिंदी | EN ] -->
        <div class="flex items-center bg-[var(--bg-card-subtle)] p-0.5 rounded-xl border border-[var(--border-color)] shadow-inner">
          <button
            id="btn-lang-hi"
            type="button"
            class="px-2 py-1 text-xs font-heading font-bold rounded-lg transition-all duration-150 cursor-pointer ${isHindi ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
          >
            हिंदी
          </button>
          <button
            id="btn-lang-en"
            type="button"
            class="px-2 py-1 text-xs font-sans font-bold rounded-lg transition-all duration-150 cursor-pointer ${!isHindi ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
          >
            EN
          </button>
        </div>

        <!-- Chai Tip Button (With Periodic Sparkle & Attention Pulse) -->
        <button
          id="btn-chai-tip"
          type="button"
          class="tip-sparkle-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-500 bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 rounded-xl border border-amber-500/40 shadow-sm transition cursor-pointer select-none"
          title="${t('tipChai')}"
          aria-label="${t('tipChai')}"
        >
          <span class="tip-shimmer-sweep"></span>
          <span>☕</span>
          <span class="hidden sm:inline">${t('tipChai')}</span>
          <span class="sm:hidden font-extrabold text-amber-500">${t('tipChaiMobile')}</span>
        </button>

        <!-- WhatsApp Share Button (Green with WhatsApp Logo & "Share" text) -->
        <a
          href="${whatsappShareUrl}"
          target="_blank"
          rel="noopener noreferrer"
          id="btn-nav-share-whatsapp"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-extrabold bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#16A34A] dark:text-[#25D366] border border-[#25D366]/40 active:scale-95 rounded-xl shadow-sm transition cursor-pointer"
          title="Share Gaddhe Me Party on WhatsApp"
          aria-label="Share on WhatsApp"
        >
          <svg class="w-4 h-4 text-[#25D366] shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span class="font-extrabold tracking-wide">Share</span>
        </a>

        <!-- Mobile Hamburger Menu Button -->
        <button
          id="btn-mobile-menu-toggle"
          type="button"
          class="lg:hidden p-2 text-[var(--text-primary)] bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card-hover)] active:scale-95 rounded-xl border border-[var(--border-color)] transition flex items-center justify-center cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer Overlay -->
    <div id="mobile-nav-drawer" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1050] hidden transition-opacity duration-200">
      <div class="fixed top-0 right-0 w-4/5 max-w-xs h-full bg-[var(--bg-surface)] border-l border-[var(--border-color)] p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        <div class="space-y-4">
          <!-- Drawer Header -->
          <div class="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div class="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" class="w-8 h-8 rounded-xl" />
              <span class="font-heading font-extrabold text-sm text-[var(--text-primary)]">${t('appNameHindi')}</span>
            </div>
            <button id="btn-close-mobile-nav" class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] cursor-pointer" aria-label="Close menu">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Drawer Navigation Links (Opens Panels) -->
          <nav class="flex flex-col gap-2 pt-2">
            <button type="button" data-nav-panel="map" class="mobile-nav-panel-btn flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-heading font-bold text-left transition cursor-pointer ${activeNav === 'map' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-[var(--text-secondary)] hover:bg-amber-500/20 hover:text-[var(--text-primary)]'}">
              <span>🗺️</span> <span>${t('navMap')}</span>
            </button>
            <button type="button" data-nav-panel="leaderboard" class="mobile-nav-panel-btn flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-heading font-bold text-left transition cursor-pointer ${activeNav === 'leaderboard' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-[var(--text-secondary)] hover:bg-amber-500/20 hover:text-[var(--text-primary)]'}">
              <span>🏆</span> <span>${t('navLeaderboard')}</span>
            </button>
            <button type="button" data-nav-panel="mission" class="mobile-nav-panel-btn flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-heading font-bold text-left transition cursor-pointer ${activeNav === 'mission' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-[var(--text-secondary)] hover:bg-amber-500/20 hover:text-[var(--text-primary)]'}">
              <span>🎯</span> <span>${t('navMission')}</span>
            </button>
            <button type="button" data-nav-panel="how" class="mobile-nav-panel-btn flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-heading font-bold text-left transition cursor-pointer ${activeNav === 'how' || activeNav === 'how-it-works' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-[var(--text-secondary)] hover:bg-amber-500/20 hover:text-[var(--text-primary)]'}">
              <span>⚡</span> <span>${t('navHowItWorks')}</span>
            </button>
            <button type="button" data-nav-panel="about" class="mobile-nav-panel-btn flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-heading font-bold text-left transition cursor-pointer ${activeNav === 'about' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-[var(--text-secondary)] hover:bg-amber-500/20 hover:text-[var(--text-primary)]'}">
              <span>🇮🇳</span> <span>${t('navAbout')}</span>
            </button>
          </nav>
        </div>

        <!-- Drawer Footer -->
        <div class="pt-4 border-t border-[var(--border-color)] space-y-3">
          <!-- Mobile Chai Tip Action Button -->
          <button
            type="button"
            id="btn-mobile-chai-tip"
            class="tip-sparkle-btn w-full py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/50 font-heading font-extrabold text-sm rounded-xl transition flex items-center justify-between active:scale-95 shadow-md cursor-pointer select-none"
          >
            <span class="tip-shimmer-sweep"></span>
            <div class="flex items-center gap-2">
              <span>☕</span>
              <span>${t('tipChai')}</span>
            </div>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-sans shadow-sm">Tip</span>
          </button>

          <a
            href="${whatsappShareUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-2.5 px-4 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#16A34A] dark:text-[#25D366] border border-[#25D366]/40 font-heading font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
          >
            <svg class="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>WhatsApp पर शेयर करें</span>
          </a>

          <p class="text-[11px] text-[var(--text-muted)] font-medium text-center">
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

  // Panel navigation buttons (Desktop + Mobile) -> Do NOT scroll page
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

  // Attach global scroll listener once to add/remove .is-scrolled
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

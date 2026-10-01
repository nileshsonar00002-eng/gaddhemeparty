import { t, getLanguage, setLanguage } from '../utils/i18n';
import { router } from '../utils/router';
import { getLucideIcon } from '../utils/icons';

let isScrollListenerAttached = false;
let isEscListenerAttached = false;

export function createNavbar(options = {}) {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const {
    onChaiTipClick,
    onToggleMapTheme,
    onSetTheme,
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
    <div class="w-full h-full px-3 sm:px-6 lg:px-8 flex items-center justify-between bg-[var(--band)]/88 backdrop-blur-md border-b border-[var(--band-ink)]/15 relative z-50 transition-colors duration-200 flex-nowrap overflow-hidden text-[var(--band-ink)]">
      
      <!-- Left: Brand Logo + Single-line App Name (Tagline hidden on mobile) -->
      <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-1.5 overflow-hidden">
        <button type="button" id="nav-brand-btn" class="shrink-0 cursor-pointer focus:outline-none flex items-center justify-center" title="${t('appNameHindi')}">
          <img src="/logo.svg" alt="Logo" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition transform duration-150 hover:scale-105" />
        </button>

        <div class="flex flex-col justify-center min-w-0 overflow-hidden">
          <span class="font-heading font-bold text-sm sm:text-base text-[var(--band-ink)] tracking-tight leading-tight whitespace-nowrap truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
            ${t('appNameHindi')}
          </span>
          <p class="hidden sm:block font-medium text-[11px] sm:text-xs text-[var(--band-ink)]/80 tracking-normal leading-none mt-0.5 whitespace-nowrap truncate">
            "${t('tagline')}"
          </p>
        </div>
      </div>

      <!-- Center Nav Links (Desktop >= 1024px) -->
      <nav class="hidden lg:flex items-center gap-1 bg-[var(--band)]/60 backdrop-blur-xs p-1 rounded-xl border border-[var(--band-ink)]/25 select-none shrink-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2 z-10">
        <button
          type="button"
          data-nav-panel="map"
          class="nav-panel-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${activeNav === 'map' ? 'bg-[var(--band-ink)] text-[var(--band)] font-bold shadow-xs' : 'text-[var(--band-ink)]/80 hover:text-[var(--band-ink)] hover:bg-[var(--band-ink)]/15'}"
        >
          ${getLucideIcon('map', 'w-3.5 h-3.5')}
          <span>${t('navMap')}</span>
        </button>

        <button
          type="button"
          data-nav-panel="leaderboard"
          class="nav-panel-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${activeNav === 'leaderboard' ? 'bg-[var(--band-ink)] text-[var(--band)] font-bold shadow-xs' : 'text-[var(--band-ink)]/80 hover:text-[var(--band-ink)] hover:bg-[var(--band-ink)]/15'}"
        >
          ${getLucideIcon('trophy', 'w-3.5 h-3.5')}
          <span>${t('navLeaderboard')}</span>
        </button>

        <button
          type="button"
          data-nav-panel="mission"
          class="nav-panel-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${activeNav === 'mission' ? 'bg-[var(--band-ink)] text-[var(--band)] font-bold shadow-xs' : 'text-[var(--band-ink)]/80 hover:text-[var(--band-ink)] hover:bg-[var(--band-ink)]/15'}"
        >
          ${getLucideIcon('target', 'w-3.5 h-3.5')}
          <span>${t('navMission')}</span>
        </button>

        <button
          type="button"
          data-nav-panel="how"
          class="nav-panel-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${activeNav === 'how' || activeNav === 'how-it-works' ? 'bg-[var(--band-ink)] text-[var(--band)] font-bold shadow-xs' : 'text-[var(--band-ink)]/80 hover:text-[var(--band-ink)] hover:bg-[var(--band-ink)]/15'}"
        >
          ${getLucideIcon('zap', 'w-3.5 h-3.5')}
          <span>${t('navHowItWorks')}</span>
        </button>

        <button
          type="button"
          data-nav-panel="about"
          class="nav-panel-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${activeNav === 'about' ? 'bg-[var(--band-ink)] text-[var(--band)] font-bold shadow-xs' : 'text-[var(--band-ink)]/80 hover:text-[var(--band-ink)] hover:bg-[var(--band-ink)]/15'}"
        >
          ${getLucideIcon('info', 'w-3.5 h-3.5')}
          <span>${t('navAbout')}</span>
        </button>
      </nav>

      <!-- Desktop Right Controls (>= 1024px) -->
      <div class="hidden lg:flex items-center gap-2 shrink-0">
        <div class="flex items-center bg-[var(--band)]/70 p-0.5 rounded-xl border border-[var(--band-ink)]/25">
          <button
            id="btn-lang-hi-desktop"
            type="button"
            class="px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer ${isHindi ? 'bg-[var(--band-ink)] text-[var(--band)] font-bold shadow-xs' : 'text-[var(--band-ink)]/80 hover:text-[var(--band-ink)]'}"
          >
            हिंदी
          </button>
          <button
            id="btn-lang-en-desktop"
            type="button"
            class="px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer ${!isHindi ? 'bg-[var(--band-ink)] text-[var(--band)] font-bold shadow-xs' : 'text-[var(--band-ink)]/80 hover:text-[var(--band-ink)]'}"
          >
            EN
          </button>
        </div>

        <button
          id="btn-chai-tip-desktop"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs min-h-[40px] rounded-xl border border-[var(--band-ink)]/35 bg-transparent hover:bg-[var(--band-ink)]/15 text-[var(--band-ink)] transition-all cursor-pointer chai-tip-spark font-medium"
          title="${t('tipChai')}"
          aria-label="${t('tipChai')}"
        >
          ${getLucideIcon('coffee', 'w-4 h-4 text-[var(--band-ink)]')}
          <span>${t('tipChai')}</span>
        </button>

        <a
          href="${whatsappShareUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs min-h-[40px] rounded-xl border border-[var(--band-ink)]/35 bg-transparent hover:bg-[var(--band-ink)]/15 text-[var(--band-ink)] transition-all cursor-pointer font-medium"
          title="Share on WhatsApp"
          aria-label="Share on WhatsApp"
        >
          ${getLucideIcon('share', 'w-4 h-4 text-[#25D366]')}
          <span>Share</span>
        </a>
      </div>

      <!-- Mobile Right Controls (< 1024px): Exactly TWO 40-44px tap targets with 8px gap -->
      <div class="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          id="btn-chai-tip-mobile"
          type="button"
          class="w-10 h-10 min-w-[40px] min-h-[40px] p-0 flex items-center justify-center rounded-xl border border-[var(--band-ink)]/35 bg-transparent text-[var(--band-ink)] hover:bg-[var(--band-ink)]/15 shrink-0 cursor-pointer chai-tip-spark"
          title="${t('tipChai')}"
          aria-label="${t('tipChai')}"
        >
          ${getLucideIcon('coffee', 'w-4 h-4 text-[var(--band-ink)]')}
        </button>

        <button
          id="btn-mobile-menu-toggle"
          type="button"
          class="w-10 h-10 min-w-[40px] min-h-[40px] p-0 flex items-center justify-center rounded-xl border border-[var(--band-ink)]/35 bg-transparent text-[var(--band-ink)] hover:bg-[var(--band-ink)]/15 shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
        >
          ${getLucideIcon('menu', 'w-4 h-4 text-[var(--band-ink)]')}
        </button>
      </div>
    </div>

    <!-- Mobile Full-Height Navigation Drawer Overlay -->
    <div id="mobile-nav-drawer" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1150] hidden transition-opacity duration-200">
      <div
        id="mobile-nav-panel"
        class="fixed top-0 right-0 w-[85%] max-w-sm h-full bg-[var(--surface)] border-l border-[var(--border)] p-5 flex flex-col justify-between shadow-2xl overflow-y-auto transform transition-transform duration-250 ease-out translate-x-full"
      >
        <div class="space-y-5">
          <!-- Drawer Top Header -->
          <div class="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div class="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Logo" class="w-8 h-8 rounded-lg" />
              <div class="flex flex-col">
                <span class="font-heading font-bold text-sm text-[var(--text)]">${t('appNameHindi')}</span>
                <span class="text-[11px] text-[var(--muted)]">"${t('tagline')}"</span>
              </div>
            </div>
            <button id="btn-close-mobile-nav" class="btn-secondary w-10 h-10 min-w-[40px] min-h-[40px] p-0 flex items-center justify-center rounded-xl" aria-label="Close menu">
              ${getLucideIcon('x', 'w-5 h-5')}
            </button>
          </div>

          <!-- Drawer Navigation Rows (Large 48px tap targets with icons) -->
          <nav class="flex flex-col gap-1">
            <button type="button" data-nav-panel="map" class="mobile-nav-panel-btn h-12 min-h-[48px] flex items-center gap-3.5 px-3.5 rounded-xl text-base font-medium text-left transition cursor-pointer ${activeNav === 'map' ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-semibold' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'}">
              ${getLucideIcon('map', 'w-5 h-5 shrink-0')} <span>${t('navMap')}</span>
            </button>
            <button type="button" data-nav-panel="leaderboard" class="mobile-nav-panel-btn h-12 min-h-[48px] flex items-center gap-3.5 px-3.5 rounded-xl text-base font-medium text-left transition cursor-pointer ${activeNav === 'leaderboard' ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-semibold' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'}">
              ${getLucideIcon('trophy', 'w-5 h-5 shrink-0')} <span>${t('navLeaderboard')}</span>
            </button>
            <button type="button" data-nav-panel="mission" class="mobile-nav-panel-btn h-12 min-h-[48px] flex items-center gap-3.5 px-3.5 rounded-xl text-base font-medium text-left transition cursor-pointer ${activeNav === 'mission' ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-semibold' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'}">
              ${getLucideIcon('target', 'w-5 h-5 shrink-0')} <span>${t('navMission')}</span>
            </button>
            <button type="button" data-nav-panel="how" class="mobile-nav-panel-btn h-12 min-h-[48px] flex items-center gap-3.5 px-3.5 rounded-xl text-base font-medium text-left transition cursor-pointer ${activeNav === 'how' || activeNav === 'how-it-works' ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-semibold' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'}">
              ${getLucideIcon('zap', 'w-5 h-5 shrink-0')} <span>${t('navHowItWorks')}</span>
            </button>
            <button type="button" data-nav-panel="about" class="mobile-nav-panel-btn h-12 min-h-[48px] flex items-center gap-3.5 px-3.5 rounded-xl text-base font-medium text-left transition cursor-pointer ${activeNav === 'about' ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-semibold' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'}">
              ${getLucideIcon('info', 'w-5 h-5 shrink-0')} <span>${t('navAbout')}</span>
            </button>
            <button type="button" data-nav-panel="terms" class="mobile-nav-panel-btn h-12 min-h-[48px] flex items-center gap-3.5 px-3.5 rounded-xl text-base font-medium text-left transition cursor-pointer ${activeNav === 'terms' ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-semibold' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'}">
              ${getLucideIcon('flag', 'w-5 h-5 shrink-0')} <span>${t('navTerms')}</span>
            </button>
          </nav>

          <!-- Divider -->
          <div class="h-px bg-[var(--border)] my-1"></div>

          <!-- Controls Section: Language in Drawer -->
          <div class="space-y-3 pt-1">
            <!-- Segmented Language Switcher -->
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-medium text-[var(--muted)]">Language / भाषा</span>
              <div class="grid grid-cols-2 gap-1.5 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)]">
                <button
                  id="btn-lang-hi-drawer"
                  type="button"
                  class="h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${isHindi ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-bold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)]'}"
                >
                  हिंदी
                </button>
                <button
                  id="btn-lang-en-drawer"
                  type="button"
                  class="h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${!isHindi ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-bold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)]'}"
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Drawer Bottom Actions: Tip Chai + WhatsApp Share -->
        <div class="pt-5 border-t border-[var(--border)] space-y-2.5 mt-4">
          <button
            type="button"
            id="btn-drawer-chai-tip"
            class="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl"
          >
            ${getLucideIcon('coffee', 'w-4 h-4 text-inherit')}
            <span>${isHindi ? 'सर्वर चाय टिप' : 'Tip Server Chai'}</span>
          </button>

          <a
            href="${whatsappShareUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-secondary w-full h-11 flex items-center justify-center gap-2 text-sm font-medium rounded-xl"
          >
            ${getLucideIcon('share', 'w-4 h-4 text-[#25D366]')}
            <span>${isHindi ? 'WhatsApp पर शेयर करें' : 'Share on WhatsApp'}</span>
          </a>

          <p class="text-[11px] text-[var(--muted)] font-normal text-center pt-1">
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

  // Desktop Language Handlers
  document.getElementById('btn-lang-hi-desktop')?.addEventListener('click', () => {
    if (getLanguage() !== 'hindi') setLanguage('hindi');
  });
  document.getElementById('btn-lang-en-desktop')?.addEventListener('click', () => {
    if (getLanguage() !== 'english') setLanguage('english');
  });

  // Drawer Language Handlers
  document.getElementById('btn-lang-hi-drawer')?.addEventListener('click', () => {
    if (getLanguage() !== 'hindi') setLanguage('hindi');
    closeDrawer();
  });
  document.getElementById('btn-lang-en-drawer')?.addEventListener('click', () => {
    if (getLanguage() !== 'english') setLanguage('english');
    closeDrawer();
  });

  // Chai Tip Handlers
  document.getElementById('btn-chai-tip-desktop')?.addEventListener('click', () => {
    if (onChaiTipClick) onChaiTipClick();
  });
  document.getElementById('btn-chai-tip-mobile')?.addEventListener('click', () => {
    if (onChaiTipClick) onChaiTipClick();
  });
  document.getElementById('btn-drawer-chai-tip')?.addEventListener('click', () => {
    closeDrawer();
    if (onChaiTipClick) onChaiTipClick();
  });

  // Mobile Drawer Toggle Logic
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobilePanel = document.getElementById('mobile-nav-panel');
  const toggleBtn = document.getElementById('btn-mobile-menu-toggle');
  const closeBtn = document.getElementById('btn-close-mobile-nav');

  const openDrawer = () => {
    mobileDrawer?.classList.remove('hidden');
    document.body.classList.add('panel-scroll-locked');
    requestAnimationFrame(() => {
      mobilePanel?.classList.remove('translate-x-full');
    });
  };

  const closeDrawer = () => {
    mobilePanel?.classList.add('translate-x-full');
    document.body.classList.remove('panel-scroll-locked');
    setTimeout(() => {
      mobileDrawer?.classList.add('hidden');
    }, 250);
  };

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  mobileDrawer?.addEventListener('click', (e) => {
    if (e.target === mobileDrawer) closeDrawer();
  });

  // Global ESC Key handler for drawer
  if (!isEscListenerAttached) {
    isEscListenerAttached = true;
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mobileDrawer?.classList.contains('hidden')) {
        closeDrawer();
      }
    });
  }

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

  // Scroll listener for sticky header shadow
  if (!isScrollListenerAttached) {
    isScrollListenerAttached = true;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 15) {
        container.classList.add('is-scrolled');
      } else {
        container.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }
}

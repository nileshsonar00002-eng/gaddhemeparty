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
  const shareUrl = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost'))
    ? window.location.origin
    : 'https://www.roadtok.in';
  const shareText = `🚧 तुमच्या शहरातील खड्डे आता लपून राहणार नाहीत! 📸\n\nखड्डा दिसला की लगेच www.roadtok.in वर रिपोर्ट करा आणि रस्ते सुधारण्यासाठी आपला हातभार लावा! 💪\n\nखड्डा दिसला? RoadTok करा! 🛣️🔥\n${shareUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  container.innerHTML = `
    <!-- Top Floating Header Pill -->
    <div id="top-header-pill" class="pointer-events-auto w-full px-3.5 sm:px-4 py-2 flex items-center justify-between bg-[#0B1626]/90 backdrop-blur-md border border-[#243449] rounded-full shadow-lg relative z-50 text-[var(--text)] select-none">
      <!-- Left: Logo + App Name -->
      <button type="button" id="nav-brand-btn" class="flex items-center gap-2.5 cursor-pointer focus:outline-none min-w-0" title="RoadTok">
        <img src="/logo.png" alt="Logo" class="w-8 h-8 rounded-full transition transform duration-150 hover:scale-105 shadow-xs shrink-0" />
        <span class="brand-roadtok text-lg sm:text-xl text-white font-bold leading-none tracking-tight">
          RoadTok
        </span>
      </button>

      <!-- Right: Action Buttons Group (WhatsApp Share & Hamburger Menu) -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- WhatsApp Share Button -->
        <a
          id="btn-header-whatsapp-share"
          href="${whatsappShareUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="h-9 px-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer shrink-0 border border-[#25D366]/40 select-none"
          title="WhatsApp पर शेयर करें / Share on WhatsApp"
          aria-label="Share on WhatsApp"
        >
          <!-- WhatsApp Icon -->
          <svg class="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.761.881 2.802.881 3.181 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.768-5.774-5.768zm3.376 8.21c-.144.405-.837.774-1.17.824-.312.045-.697.073-2.196-.543-1.802-.741-2.936-2.588-3.025-2.707-.09-.12-0.729-.97-0.729-1.85 0-.88.46-1.314.624-1.492.164-.179.359-.224.479-.224.12 0 .24.001.345.006.11.005.259-.042.404.309.15.36.51.1.245.555 1.355.045.09.075.195.015.315-.06.12-.09.195-.18.3-.09.105-.19.235-.27.315-.09.09-.184.187-.079.367.105.18.467.771 1.003 1.248.69.614 1.272.804 1.452.894.18.09.285.075.39-.045.105-.12.45-.525.57-.705.12-.18.24-.15.405-.09.165.06 1.05.495 1.23.585.18.09.3.135.345.21.045.075.045.435-.099.84z"/>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.176L2 22l4.981-1.309A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.156 8.156 0 01-4.225-1.176l-.303-.18-2.964.777.791-2.89-.197-.314A8.167 8.167 0 013.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z"/>
          </svg>
          <span class="text-xs font-bold tracking-tight text-white leading-none">Share</span>
        </a>

        <!-- Right: Hamburger Button (Target >= 44px) -->
        <button
          id="btn-mobile-menu-toggle"
          type="button"
          class="w-10 h-10 min-w-[40px] min-h-[40px] p-0 flex items-center justify-center rounded-full border border-[var(--border)] bg-[#101D2E]/80 text-white hover:bg-slate-800 transition cursor-pointer active:scale-95 shrink-0"
          aria-label="Open menu"
          title="Menu"
        >
          ${getLucideIcon('menu', 'w-5 h-5 text-lime-400')}
        </button>
      </div>
    </div>

    <!-- Centered Counter Pill ("16 Potholes | 8 Today", solid navy, readable) -->
    <div id="top-counter-pill" class="pointer-events-auto mx-auto mt-2 px-3.5 py-1.5 rounded-full bg-[#0B1626] border border-[#243449] shadow-md flex items-center gap-2 text-xs select-none max-w-fit transition-all duration-200">
      <span class="w-2 h-2 rounded-full bg-lime-400 animate-pulse shrink-0"></span>
      <span class="font-bold text-white tracking-tight">
        <span id="counter-total-count">0</span> <span data-i18n="potholesText">${t('potholesText') || 'Potholes'}</span>
      </span>
      <span class="text-slate-500 font-bold">|</span>
      <span class="font-medium text-slate-300 tracking-tight">
        <span id="counter-today-count" class="text-lime-400 font-bold">0</span> <span data-i18n="todayText">${t('todayText') || 'Today'}</span>
      </span>
      <button id="btn-dismiss-counter" type="button" class="w-5 h-5 -mr-1 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer active:scale-90" aria-label="${t('dismissCounter') || 'Dismiss'}" title="${t('dismissCounter') || 'Dismiss'}">
        ${getLucideIcon('x', 'w-3.5 h-3.5 text-inherit')}
      </button>
    </div>
  `;

  // Mount Mobile Full-Height Navigation Drawer to body portal so it is never clipped or trapped behind fixed header
  let drawerPortal = document.getElementById('mobile-nav-drawer-portal');
  if (!drawerPortal) {
    drawerPortal = document.createElement('div');
    drawerPortal.id = 'mobile-nav-drawer-portal';
    document.body.appendChild(drawerPortal);
  }

  drawerPortal.innerHTML = `
    <!-- Mobile Full-Height Navigation Drawer Overlay -->
    <div id="mobile-nav-drawer" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[99999] hidden transition-opacity duration-200">
      <div
        id="mobile-nav-panel"
        class="fixed top-0 right-0 w-[85%] max-w-sm h-full bg-[var(--surface)] border-l border-[var(--border)] p-5 flex flex-col justify-between shadow-2xl overflow-y-auto transform transition-transform duration-250 ease-out translate-x-full z-[99999]"
      >
        <div class="space-y-5">
          <!-- Drawer Top Header -->
          <div class="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div class="flex items-center gap-2.5">
              <img src="/logo.png" alt="Logo" class="w-8 h-8 rounded-lg" />
              <div class="flex flex-col">
                <span class="brand-roadtok text-base text-[var(--text)] leading-tight">RoadTok</span>
                <span class="text-[11px] text-[var(--muted)]">"${t('tagline')}"</span>
              </div>
            </div>
            <button
              id="btn-close-mobile-nav"
              type="button"
              class="w-10 h-10 min-w-[40px] min-h-[40px] p-0 flex items-center justify-center rounded-xl bg-[#101D2E] text-slate-200 hover:text-white hover:bg-slate-800 border border-[#243449] hover:border-[#84CC16] transition cursor-pointer active:scale-95 shadow-sm"
              aria-label="Close menu"
              title="Close menu"
            >
              <svg class="w-6 h-6 text-inherit" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Drawer Navigation Rows (Large 48px tap targets with icons) -->
          <nav class="flex flex-col gap-1">
            <button type="button" data-nav-panel="map" class="mobile-nav-panel-btn h-12 min-h-[48px] flex items-center gap-3.5 px-3.5 rounded-xl text-base font-medium text-left transition cursor-pointer ${activeNav === 'map' ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-semibold' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'}">
              ${getLucideIcon('map', 'w-5 h-5 shrink-0')} <span>${t('navMap')}</span>
            </button>
            <button type="button" data-nav-panel="leaderboard" class="mobile-nav-panel-btn h-12 min-h-[48px] flex items-center gap-3.5 px-3.5 rounded-xl text-base font-medium text-left transition cursor-pointer ${activeNav === 'leaderboard' ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-semibold' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'}">
              ${getLucideIcon('timeline', 'w-5 h-5 shrink-0')} <span>${t('navLeaderboard')}</span>
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

        <!-- Drawer Bottom Actions: WhatsApp Share -->
        <div class="pt-5 border-t border-[var(--border)] space-y-2.5 mt-4">
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

  // Check dismissed state for counter pill in localStorage with try/catch
  const counterPill = document.getElementById('top-counter-pill');
  try {
    if (localStorage.getItem('khadda_counter_dismissed') === 'true') {
      if (counterPill) counterPill.classList.add('hidden');
      document.documentElement.style.setProperty('--counter-h', '0px');
    }
  } catch (err) {
    console.warn('[Storage] Error checking counter dismissal:', err);
  }

  document.getElementById('btn-dismiss-counter')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (counterPill) {
      counterPill.classList.add('hidden');
      document.documentElement.style.setProperty('--counter-h', '0px');
      try {
        localStorage.setItem('khadda_counter_dismissed', 'true');
      } catch (err) {
        console.warn('[Storage] Error saving counter dismissal:', err);
      }
      if (window.__khaddaResizeMapPadding) {
        window.__khaddaResizeMapPadding();
      }
    }
  });

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

  const closeDrawer = (skipScrollUnlock = false) => {
    mobilePanel?.classList.add('translate-x-full');
    if (!skipScrollUnlock) {
      document.body.classList.remove('panel-scroll-locked');
    }
    if (skipScrollUnlock) {
      mobileDrawer?.classList.add('hidden');
    } else {
      setTimeout(() => {
        mobileDrawer?.classList.add('hidden');
      }, 250);
    }
  };

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', () => closeDrawer());
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

  // Panel navigation buttons in header and mobile drawer
  document.querySelectorAll('.nav-panel-btn, .mobile-nav-panel-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const panelId = e.currentTarget.getAttribute('data-nav-panel');
      const isOpeningPanel = panelId && panelId !== 'map';
      closeDrawer(isOpeningPanel);
      if (panelId === 'map') {
        window.__khaddaCloseInfo?.();
        router.navigate('');
      } else if (panelId === 'leaderboard') {
        if (window.__khaddaOpenTimeline) {
          window.__khaddaOpenTimeline();
        } else {
          window.__khaddaCloseInfo?.();
          router.navigate('leaderboard');
        }
      } else {
        window.__khaddaOpenInfo?.(panelId);
        router.navigate(panelId);
      }
    });
  });

  // Dedicated Nav Info buttons (Desktop & Mobile)
  document.querySelectorAll('.btn-nav-info').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeDrawer(true);
      window.__khaddaOpenInfo?.('mission');
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

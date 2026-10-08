import { t, getLanguage } from '../utils/i18n';
import { prefersReducedMotion } from '../utils/deviceTier';
import { subscribeToLeaderboard, callRefreshLeaderboard } from '../services/firebase';

/**
 * Slide-Over Panel Manager
 * Handles animated slide-over panels for:
 *   - Leaderboard (Non-modal on desktop so map is interactive beside it)
 *   - Mission (Modal with backdrop)
 *   - How It Works (Modal with backdrop)
 *   - About Us (Modal with backdrop)
 *   - Terms of Use (Modal with backdrop)
 */
export class PanelManager {
  constructor(options = {}) {
    this.onSelectPin = options.onSelectPin || (() => {});
    this.onPanelStateChange = options.onPanelStateChange || (() => {});
    
    this.activePanelId = null;
    this.isOpen = false;
    this.isMobilePeek = false;
    this.leaderboardData = null;
    this.leaderboardTab = 'week';
    this.leaderboardUnsub = null;
    this.lastLeaderboardUpdateTime = null;
    this.tickerInterval = null;
    this.lastFocusedElement = null;
    this.savedScrollY = 0;

    // Mobile touch drag tracking
    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDragging = false;

    this.initDOM();
    this.setupGlobalKeyHandlers();
  }

  initDOM() {
    let root = document.getElementById('slide-over-panel-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'slide-over-panel-root';
      document.body.appendChild(root);
    }
    this.root = root;

    this.root.innerHTML = `
      <!-- Modal Backdrop (Hidden / Non-blocking for Leaderboard) -->
      <div
        id="panel-backdrop"
        class="fixed inset-0 z-[1040] bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-250 ease-out"
        aria-hidden="true"
      ></div>

      <!-- Slide-Over Drawer Container -->
      <div
        id="panel-drawer"
        role="dialog"
        aria-modal="false"
        aria-labelledby="panel-header-title"
        class="fixed z-[1050] bg-[#0B1626] border-[#243449] shadow-2xl flex flex-col transition-all duration-250 ease-out pointer-events-none text-[#F5F7FA]
               /* Desktop: Right-side Drawer */
               lg:top-0 lg:right-0 lg:bottom-0 lg:w-[480px] lg:max-w-[90vw] lg:h-full lg:border-l lg:translate-x-full
               /* Mobile: Bottom Sheet */
               max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:w-full max-lg:h-[85dvh] max-lg:max-h-[85dvh] max-lg:rounded-t-3xl max-lg:border-t max-lg:translate-y-full"
      >
        <!-- Mobile Drag Handle Bar -->
        <div id="panel-drag-zone" class="lg:hidden w-full flex justify-center items-center py-2.5 cursor-grab active:cursor-grabbing select-none">
          <div class="w-12 h-1.5 rounded-full bg-white/20"></div>
        </div>

        <!-- Sticky Panel Header -->
        <div id="panel-header" class="px-5 py-3.5 border-b border-[#243449] flex items-center justify-between bg-[#07111D]/95 backdrop-blur-md flex-shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <span id="panel-header-icon" class="text-xl"></span>
            <div>
              <h2 id="panel-header-title" class="font-heading font-extrabold text-base sm:text-lg text-[#F5F7FA] leading-tight truncate"></h2>
              <div id="panel-header-sub" class="text-[11px] text-[#94A3B8] flex items-center gap-2 mt-0.5"></div>
            </div>
          </div>

          <div class="flex items-center gap-1.5 flex-shrink-0">
            <!-- Leaderboard Refresh Button (shown only for leaderboard) -->
            <button
              id="btn-panel-refresh-lb"
              type="button"
              class="hidden p-1.5 text-[#94A3B8] hover:text-[#8CFF3F] hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Refresh Leaderboard"
              aria-label="Refresh"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>

            <!-- Close Button -->
            <button
              id="btn-panel-close"
              type="button"
              class="w-8 h-8 rounded-xl bg-white/10 hover:bg-[#8CFF3F]/20 text-[#F5F7FA] hover:text-[#8CFF3F] border border-white/15 flex items-center justify-center transition cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Scrollable Content Body -->
        <div id="panel-body-container" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain bg-[#0B1626]">
          <!-- Injected dynamically with cross-fade -->
        </div>
      </div>
    `;

    this.backdrop = document.getElementById('panel-backdrop');
    this.drawer = document.getElementById('panel-drawer');
    this.headerIcon = document.getElementById('panel-header-icon');
    this.headerTitle = document.getElementById('panel-header-title');
    this.headerSub = document.getElementById('panel-header-sub');
    this.bodyContainer = document.getElementById('panel-body-container');
    this.closeBtn = document.getElementById('btn-panel-close');
    this.refreshLbBtn = document.getElementById('btn-panel-refresh-lb');
    this.dragZone = document.getElementById('panel-drag-zone');

    // Event Listeners
    this.closeBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => {
      this.close();
    });

    this.refreshLbBtn.addEventListener('click', async () => {
      this.refreshLbBtn.classList.add('animate-spin');
      await callRefreshLeaderboard();
      setTimeout(() => this.refreshLbBtn.classList.remove('animate-spin'), 600);
    });

    this.setupMobileTouchDrag();
  }

  setupGlobalKeyHandlers() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    });
  }

  setupMobileTouchDrag() {
    if (!this.dragZone) return;

    this.dragZone.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
      this.touchCurrentY = this.touchStartY;
      this.isDragging = true;
      this.drawer.style.transition = 'none';
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      this.touchCurrentY = e.touches[0].clientY;
      const deltaY = this.touchCurrentY - this.touchStartY;
      if (deltaY > 0) {
        this.drawer.style.transform = `translateY(${deltaY}px)`;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.drawer.style.transition = '';
      const deltaY = this.touchCurrentY - this.touchStartY;

      if (deltaY > 120) {
        if (this.activePanelId === 'leaderboard' && !this.isMobilePeek) {
          this.setMobilePeek(true);
        } else {
          this.close();
        }
      } else {
        this.drawer.style.transform = '';
      }
    });
  }

  setMobilePeek(peek = true) {
    this.isMobilePeek = peek;
    if (window.innerWidth >= 1024) return;
    if (peek) {
      this.drawer.classList.add('max-lg:h-[38dvh]', 'max-lg:max-h-[38dvh]');
      this.drawer.classList.remove('max-lg:h-[85dvh]', 'max-lg:max-h-[85dvh]');
    } else {
      this.drawer.classList.remove('max-lg:h-[38dvh]', 'max-lg:max-h-[38dvh]');
      this.drawer.classList.add('max-lg:h-[85dvh]', 'max-lg:max-h-[85dvh]');
    }
  }

  open(panelId) {
    if (!panelId || panelId === 'map') {
      this.close();
      return;
    }

    const previousPanel = this.activePanelId;
    const wasOpen = this.isOpen;

    this.activePanelId = panelId;
    this.isOpen = true;
    this.lastFocusedElement = document.activeElement;

    this.setMobilePeek(false);

    this.drawer.setAttribute('aria-modal', 'true');
    this.backdrop.classList.remove('opacity-0', 'pointer-events-none');
    this.backdrop.classList.add('opacity-100', 'pointer-events-auto');
    this.lockBodyScroll();

    this.drawer.classList.remove('pointer-events-none', 'lg:translate-x-full', 'max-lg:translate-y-full');
    this.drawer.classList.add('pointer-events-auto', 'lg:translate-x-0', 'max-lg:translate-y-0');

    if (panelId === 'leaderboard') {
      this.refreshLbBtn.classList.remove('hidden');
      this.startLeaderboardSubscription();
    } else {
      this.refreshLbBtn.classList.add('hidden');
      this.stopLeaderboardSubscription();
    }

    this.renderContent(panelId, wasOpen && previousPanel !== panelId);

    setTimeout(() => this.closeBtn.focus(), 150);

    this.onPanelStateChange(panelId, true);
  }

  close() {
    if (!this.isOpen && !this.activePanelId) return;

    this.isOpen = false;
    this.activePanelId = null;
    this.setMobilePeek(false);

    this.drawer.classList.add('pointer-events-none', 'lg:translate-x-full', 'max-lg:translate-y-full');
    this.drawer.classList.remove('pointer-events-auto', 'lg:translate-x-0', 'max-lg:translate-y-0');

    this.backdrop.classList.add('opacity-0', 'pointer-events-none');
    this.backdrop.classList.remove('opacity-100', 'pointer-events-auto');

    this.unlockBodyScroll();
    this.stopLeaderboardSubscription();

    // Clean hash from browser URL bar so refreshing doesn't reopen panel
    if (window.location.hash && !window.location.hash.includes('pin=')) {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      try { this.lastFocusedElement.focus(); } catch (e) {}
    }

    this.onPanelStateChange('map', false);
  }

  lockBodyScroll() {
    if (document.body.classList.contains('panel-scroll-locked')) return;
    this.savedScrollY = window.scrollY;
    document.body.classList.add('panel-scroll-locked');
    document.body.style.top = `-${this.savedScrollY}px`;
  }

  unlockBodyScroll() {
    if (!document.body.classList.contains('panel-scroll-locked')) return;
    document.body.classList.remove('panel-scroll-locked');
    document.body.style.top = '';
    window.scrollTo(0, this.savedScrollY);
  }

  setData(data) {
    if (data) {
      this.leaderboardData = data;
      if (!this.lastLeaderboardUpdateTime) {
        this.lastLeaderboardUpdateTime = Date.now();
      }
      if (this.activePanelId === 'leaderboard') {
        this.renderLeaderboardBody();
        this.updateLeaderboardTimeAgo();
      }
    }
  }

  startLeaderboardSubscription() {
    if (this.leaderboardUnsub) return;

    this.leaderboardUnsub = subscribeToLeaderboard((data) => {
      this.leaderboardData = data;
      this.lastLeaderboardUpdateTime = Date.now();
      if (this.activePanelId === 'leaderboard') {
        this.renderLeaderboardBody();
        this.updateLeaderboardTimeAgo();
      }
    });

    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      this.updateLeaderboardTimeAgo();
    }, 30000);
  }

  stopLeaderboardSubscription() {
    if (this.leaderboardUnsub) {
      try { this.leaderboardUnsub(); } catch (e) {}
      this.leaderboardUnsub = null;
    }
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
  }

  updateLeaderboardTimeAgo() {
    if (!this.headerSub || this.activePanelId !== 'leaderboard') return;
    const isHindi = getLanguage() === 'hindi';

    let timeText = isHindi ? 'अभी-अभी अपडेट हुआ' : 'Updated just now';
    if (this.lastLeaderboardUpdateTime) {
      const diffSec = Math.floor((Date.now() - this.lastLeaderboardUpdateTime) / 1000);
      if (diffSec >= 60) {
        const mins = Math.floor(diffSec / 60);
        timeText = isHindi ? `${mins} मिनट पहले अपडेट हुआ` : `Updated ${mins}m ago`;
      }
    }

    this.headerSub.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 tabular-nums font-mono font-bold text-[10px]">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        LIVE
      </span>
      <span>${timeText}</span>
    `;
  }

  renderContent(panelId, isCrossFade = false) {
    if (isCrossFade && !prefersReducedMotion()) {
      this.bodyContainer.style.opacity = '0';
      setTimeout(() => {
        this.populatePanelData(panelId);
        this.bodyContainer.style.opacity = '1';
      }, 120);
    } else {
      this.populatePanelData(panelId);
    }
  }

  populatePanelData(panelId) {
    switch (panelId) {
      case 'leaderboard':
        this.headerIcon.innerHTML = `<svg class="w-5 h-5 text-[#8CFF3F]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15l-2 5l-1-2l-2 1l1-3l-2-1l3-1l-1-3l3 2l2-3l1 3l3-1l-1 3l2 1l-3 1l1 3l-2-1z"/></svg>`;
        this.headerTitle.innerText = t('leaderboardTitle');
        this.updateLeaderboardTimeAgo();
        this.renderLeaderboardBody();
        break;

      case 'mission':
        this.headerIcon.innerHTML = `<svg class="w-5 h-5 text-[#8CFF3F]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;
        this.headerTitle.innerText = t('missionTitle');
        this.headerSub.innerText = t('missionSubtitle');
        this.renderMissionBody();
        break;

      case 'how':
        this.headerIcon.innerHTML = `<svg class="w-5 h-5 text-[#8CFF3F]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
        this.headerTitle.innerText = t('howItWorksTitle');
        this.headerSub.innerText = t('howItWorksSubtitle');
        this.renderHowItWorksBody();
        break;

      case 'about':
        this.headerIcon.innerHTML = `<svg class="w-5 h-5 text-[#8CFF3F]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/></svg>`;
        this.headerTitle.innerText = t('aboutTitle');
        this.headerSub.innerText = t('aboutSubtitle');
        this.renderAboutBody();
        break;

      case 'terms':
        this.headerIcon.innerHTML = `<svg class="w-5 h-5 text-[#8CFF3F]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
        this.headerTitle.innerText = t('termsTitle');
        this.headerSub.innerText = t('termsSubtitle');
        this.renderTermsBody();
        break;

      default:
        this.bodyContainer.innerHTML = '';
        break;
    }
  }

  renderLeaderboardBody() {
    const isHindi = getLanguage() === 'hindi';
    const data = this.leaderboardData || {};
    const weekRankings = data.weekRankings || [];
    const monthRankings = data.monthRankings || weekRankings;
    const allTimeRankings = data.allTimeRankings || weekRankings;
    const heroPin = data.heroPotholeOfWeek || weekRankings[0] || null;

    const tabs = [
      { id: 'week', label: t('tabThisWeek') },
      { id: 'allTime', label: t('tabAllTime') },
      { id: 'cities', label: t('tabTopCities') }
    ];

    let tabsHtml = `
      <div class="flex items-center gap-1 p-1 bg-[#07111D] rounded-2xl border border-[#243449] text-xs font-heading font-bold select-none">
        ${tabs.map((tab) => `
          <button
            type="button"
            class="panel-lb-tab flex-1 py-1.5 px-2 rounded-xl transition text-center cursor-pointer ${this.leaderboardTab === tab.id ? 'bg-[#8CFF3F] text-[#06100A] font-extrabold shadow-[0_0_12px_rgba(140,255,63,0.30)]' : 'text-[#94A3B8] hover:text-[#F5F7FA] hover:bg-white/5'}"
            data-tab="${tab.id}"
          >
            ${tab.label}
          </button>
        `).join('')}
      </div>
    `;

    const getPinLabels = (pin) => {
      if (!pin) return { title: '', subtitle: '' };
      const cityName = isHindi 
        ? (pin.cityNameHindi || pin.cityNameEnglish || 'भारत') 
        : (pin.cityNameEnglish || pin.cityNameHindi || 'India');
      const rawLandmark = (pin.landmark || '').trim();
      const genericList = [
        'सड़क पर गहरा गड्ढा',
        'सड़क का गड्ढा',
        'सड़क पर गंभीर गड्ढा',
        'सड़क पर गड्ढा',
        'सड़क गड्ढा',
        'गड्ढा',
        'damaged road / pothole',
        'damaged road pothole',
        'damaged road',
        'pothole road',
        'pothole',
        'road pothole'
      ];
      const isGeneric = !rawLandmark || genericList.includes(rawLandmark.toLowerCase());
      if (isGeneric) {
        return {
          title: cityName,
          subtitle: `${pin.reportCount || 1} ${isHindi ? 'रिपोर्ट्स' : 'reps'}`
        };
      }
      return {
        title: rawLandmark,
        subtitle: `${cityName} • ${pin.reportCount || 1} ${isHindi ? 'रिपोर्ट्स' : 'reps'}`
      };
    };

    let heroCardHtml = '';
    const hasHeroCard = Boolean(heroPin && this.leaderboardTab === 'week');
    if (hasHeroCard) {
      const heroLabels = getPinLabels(heroPin);
      heroCardHtml = `
        <div class="p-4.5 sm:p-5 rounded-2xl bg-gradient-to-br from-[#8CFF3F]/15 via-[#101D2E] to-[#0B1626] border-2 border-[#8CFF3F]/40 space-y-3 relative overflow-hidden group shadow-md ring-1 ring-[#8CFF3F]/20">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8CFF3F] text-[#06100A] text-xs tabular-nums font-mono font-black uppercase shadow-sm">
              #1 ${isHindi ? 'सप्ताह का गड्ढा' : 'Pothole of the Week'}
            </span>
          </div>

          <div class="flex gap-3.5 items-center">
            ${heroPin.thumbnailUrl || heroPin.imageUrl ? `
              <img src="${heroPin.thumbnailUrl || heroPin.imageUrl}" alt="Hero Pothole" class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#8CFF3F]/50 shadow-sm flex-shrink-0" />
            ` : `
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#8CFF3F]/15 border-2 border-[#8CFF3F]/40 flex items-center justify-center text-[#8CFF3F] flex-shrink-0">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
              </div>
            `}
            <div class="min-w-0 flex-1">
              <h3 class="font-heading font-extrabold text-sm sm:text-base text-[#F5F7FA] truncate leading-tight">${heroLabels.title}</h3>
              <p class="text-xs text-[#94A3B8] mt-0.5">${heroLabels.subtitle}</p>
              <div class="flex gap-2.5 text-xs text-[#94A3B8] mt-1.5 tabular-nums font-mono font-medium">
                <span class="px-2 py-0.5 rounded-md bg-[#8CFF3F]/15 text-[#8CFF3F] border border-[#8CFF3F]/30 flex items-center gap-1">
                  <svg class="w-3 h-3 text-rose-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <span>${heroPin.reportCount || 1} ${isHindi ? 'रिपोर्ट्स' : 'Reports'}</span>
                </span>
                <span class="px-2 py-0.5 rounded-md bg-[#8CFF3F]/15 text-[#8CFF3F] border border-[#8CFF3F]/30 flex items-center gap-1">
                  <svg class="w-3 h-3 text-[#8CFF3F] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
                  <span>${heroPin.upvotes || 0} ${isHindi ? 'वोट' : 'Votes'}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="panel-pin-row-btn w-full py-2 px-3 rounded-xl bg-[#8CFF3F] hover:bg-[#A7FF68] text-[#06100A] text-xs font-heading font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-[0.99]"
            data-pin-id="${heroPin.id}"
          >
            <svg class="w-4 h-4 text-inherit shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span>${isHindi ? 'मैप पर देखें' : 'View on Map'}</span>
          </button>
        </div>
      `;
    }

    let listHtml = '';
    if (this.leaderboardTab === 'cities') {
      const topCities = (data.topCities || []).slice(0, 10);
      if (topCities.length === 0) {
        listHtml = `<div class="text-center py-8 text-[#94A3B8] text-xs">${isHindi ? 'अभी कोई शहर डेटा उपलब्ध नहीं है।' : 'No city data available yet.'}</div>`;
      } else {
        listHtml = topCities.map((c, idx) => {
          const isTop3 = idx < 3;
          const badgeClass = idx === 0 
            ? 'w-8 h-8 rounded-xl bg-[#8CFF3F] text-[#06100A] font-black text-sm shadow-sm ring-1 ring-[#8CFF3F]/40' 
            : (idx === 1 
              ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-950 font-black text-sm shadow-sm ring-1 ring-slate-400/40' 
              : (idx === 2 
                ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-100 font-black text-sm shadow-sm ring-1 ring-amber-700/40' 
                : 'w-7 h-7 rounded-xl bg-white/10 text-[#94A3B8] font-bold text-xs'));

          const cardClass = isTop3
            ? (idx === 0 
              ? 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#8CFF3F]/15 via-[#101D2E] to-[#101D2E] border border-[#8CFF3F]/40 shadow-sm' 
              : (idx === 1 
                ? 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-300/15 via-[#101D2E] to-[#101D2E] border border-slate-400/40 shadow-sm' 
                : 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#101D2E] to-[#101D2E] border border-amber-500/40 shadow-sm'))
            : 'p-3 rounded-2xl bg-[#101D2E] border border-[#243449] shadow-sm';

          return `
            <div class="${cardClass} flex items-center justify-between transition">
              <div class="flex items-center gap-3">
                <span class="${badgeClass} flex items-center justify-center tabular-nums font-mono flex-shrink-0">
                  #${idx + 1}
                </span>
                <div>
                  <h4 class="font-heading ${isTop3 ? 'font-extrabold text-sm sm:text-base' : 'font-bold text-sm'} text-[#F5F7FA]">${isHindi ? (c.nameHindi || c.nameEnglish) : (c.nameEnglish || c.nameHindi)}</h4>
                  <p class="text-[11px] text-[#94A3B8]">${c.count || 0} ${isHindi ? 'कुल रिपोर्ट्स' : 'Total Reports'}</p>
                </div>
              </div>
              <span class="text-xs ${isTop3 ? 'sm:text-sm font-black text-[#8CFF3F]' : 'font-bold text-[#8CFF3F]'} tabular-nums font-mono flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>${c.count || 0}</span>
              </span>
            </div>
          `;
        }).join('');
      }
    } else {
      const listKey = this.leaderboardTab === 'week' ? 'weekRankings' : 'allTimeRankings';
      const allPins = data[listKey] || [];
      const pins = hasHeroCard ? allPins.slice(1, 10) : allPins.slice(0, 10);
      const startRank = hasHeroCard ? 2 : 1;

      if (pins.length === 0 && !hasHeroCard) {
        listHtml = `<div class="text-center py-8 text-[#94A3B8] text-xs">${isHindi ? 'इस श्रेणी में अभी कोई गड्ढे नहीं हैं।' : 'No reported potholes in this category yet.'}</div>`;
      } else if (pins.length === 0 && hasHeroCard) {
        listHtml = '';
      } else {
        listHtml = pins.map((pin, idx) => {
          const rankNumber = startRank + idx;
          const isTop3 = rankNumber <= 3;
          const pinLabels = getPinLabels(pin);

          const badgeClass = rankNumber === 1 
            ? 'w-8 h-8 rounded-xl bg-[#8CFF3F] text-[#06100A] font-black text-sm shadow-sm ring-1 ring-[#8CFF3F]/50' 
            : (rankNumber === 2 
              ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-950 font-black text-sm shadow-sm ring-1 ring-slate-400/50' 
              : (rankNumber === 3 
                ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-100 font-black text-sm shadow-sm ring-1 ring-amber-700/50' 
                : 'w-6 h-6 rounded-lg bg-white/10 text-[#94A3B8] font-bold text-xs'));

          const cardClass = isTop3
            ? (rankNumber === 1 
              ? 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#8CFF3F]/15 via-[#101D2E] to-[#101D2E] border border-[#8CFF3F]/40 hover:border-[#8CFF3F]/70 shadow-sm' 
              : (rankNumber === 2 
                ? 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-300/15 via-[#101D2E] to-[#101D2E] border border-slate-400/40 hover:border-slate-300 shadow-sm' 
                : 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#101D2E] to-[#101D2E] border border-amber-500/40 hover:border-amber-400 shadow-sm'))
            : 'p-3 rounded-2xl bg-[#101D2E] hover:bg-[#16273D] border border-[#243449] hover:border-[#8CFF3F]/40 shadow-sm';

          const thumbSize = isTop3 ? 'w-12 h-12' : 'w-10 h-10';

          return `
            <div
              class="panel-pin-row ${cardClass} transition flex items-center justify-between gap-3 cursor-pointer group"
              data-pin-id="${pin.id}"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="${badgeClass} flex items-center justify-center tabular-nums font-mono flex-shrink-0">
                  ${rankNumber}
                </span>

                ${pin.thumbnailUrl || pin.imageUrl ? `
                  <img src="${pin.thumbnailUrl || pin.imageUrl}" alt="Pothole thumb" class="${thumbSize} rounded-xl object-cover border border-white/15 flex-shrink-0 shadow-xs" />
                ` : `
                  <div class="${thumbSize} rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xs text-[#94A3B8] flex-shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                  </div>
                `}

                <div class="min-w-0">
                  <h4 class="font-heading ${isTop3 ? 'font-extrabold text-sm sm:text-base' : 'font-bold text-xs sm:text-sm'} text-[#F5F7FA] truncate group-hover:text-[#8CFF3F] transition">${pinLabels.title}</h4>
                  <p class="text-[11px] text-[#94A3B8] truncate">${pinLabels.subtitle}</p>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-1 rounded-lg ${isTop3 ? 'bg-[#8CFF3F]/20 border-[#8CFF3F]/40 text-[#8CFF3F] font-extrabold' : 'bg-[#8CFF3F]/15 border-[#8CFF3F]/30 text-[#8CFF3F] font-bold'} border tabular-nums font-mono text-xs flex items-center gap-1">
                  <svg class="w-3 h-3 text-[#8CFF3F] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
                  <span>${pin.upvotes || 0}</span>
                </span>
                <span class="text-[#94A3B8] group-hover:text-[#F5F7FA] transition text-xs">➔</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    this.bodyContainer.innerHTML = `
      ${tabsHtml}
      ${heroCardHtml}
      <div class="space-y-2">
        ${listHtml}
      </div>
    `;

    this.bodyContainer.querySelectorAll('.panel-lb-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', (e) => {
        this.leaderboardTab = e.currentTarget.getAttribute('data-tab');
        this.renderLeaderboardBody();
      });
    });

    this.bodyContainer.querySelectorAll('.panel-pin-row, .panel-pin-row-btn').forEach((row) => {
      row.addEventListener('click', (e) => {
        const pinId = e.currentTarget.getAttribute('data-pin-id');
        const listKey = this.leaderboardTab === 'week' ? 'weekRankings' : 'allTimeRankings';
        const list = data[listKey] || [];
        const pinIdx = list.findIndex((p) => p.id === pinId);
        const pin = (pinIdx !== -1 ? list[pinIdx] : null) || (data.heroPotholeOfWeek?.id === pinId ? data.heroPotholeOfWeek : null);
        if (pin) {
          const rank = pinIdx !== -1 ? (pinIdx + 1) : (data.heroPotholeOfWeek?.id === pinId ? 1 : null);
          if (rank) pin.rank = rank;
          this.close();
          this.onSelectPin(pin);
        }
      });
    });
  }

  renderMissionBody() {
    const isHindi = getLanguage() === 'hindi';
    this.bodyContainer.innerHTML = `
      <div class="space-y-4 text-[#F5F7FA]">
        <div class="p-4 rounded-2xl bg-[#8CFF3F]/10 border border-[#8CFF3F]/30">
          <p class="text-xs sm:text-sm text-[#8CFF3F] font-medium leading-relaxed">
            ${isHindi
              ? '"हमारा लक्ष्य केवल गड्ढों की शिकायत करना नहीं, बल्कि तकनीक और पारदर्शी जन-भागीदारी से प्रशासन को त्वरित मरम्मत के लिए प्रेरित करना है।"'
              : '"Our goal is not just complaining about potholes, but leveraging technology and citizen collaboration to accelerate accountable road repairs across India."'}
          </p>
        </div>

        <div class="space-y-3">
          <div class="p-4 rounded-2xl bg-[#101D2E] border border-[#243449] space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[#8CFF3F]/15 border border-[#8CFF3F]/30 flex items-center justify-center text-[#8CFF3F] shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <h3 class="font-heading font-bold text-sm text-[#F5F7FA]">${t('pillar1Title')}</h3>
            </div>
            <p class="text-xs text-[#94A3B8] leading-relaxed pl-10">${t('pillar1Desc')}</p>
          </div>

          <div class="p-4 rounded-2xl bg-[#101D2E] border border-[#243449] space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[#8CFF3F]/15 border border-[#8CFF3F]/30 flex items-center justify-center text-[#8CFF3F] shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
              </div>
              <h3 class="font-heading font-bold text-sm text-[#F5F7FA]">${t('pillar2Title')}</h3>
            </div>
            <p class="text-xs text-[#94A3B8] leading-relaxed pl-10">${t('pillar2Desc')}</p>
          </div>

          <div class="p-4 rounded-2xl bg-[#101D2E] border border-[#243449] space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[#8CFF3F]/15 border border-[#8CFF3F]/30 flex items-center justify-center text-[#8CFF3F] shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>
              </div>
              <h3 class="font-heading font-bold text-sm text-[#F5F7FA]">${t('pillar3Title')}</h3>
            </div>
            <p class="text-xs text-[#94A3B8] leading-relaxed pl-10">${t('pillar3Desc')}</p>
          </div>
        </div>
      </div>
    `;
  }

  renderHowItWorksBody() {
    this.bodyContainer.innerHTML = `
      <div class="space-y-5 text-[#F5F7FA]">
        <div class="space-y-3">
          <div class="p-3.5 rounded-2xl bg-[#101D2E] border border-[#243449] flex gap-3 items-center shadow-sm">
            <span class="w-8 h-8 rounded-xl bg-[#8CFF3F] text-[#06100A] tabular-nums font-mono font-black text-sm flex items-center justify-center flex-shrink-0">1</span>
            <div>
              <h4 class="font-heading font-bold text-xs sm:text-sm text-[#F5F7FA]">${t('hwStep1Title')}</h4>
              <p class="text-[11px] text-[#94A3B8]">${t('hwStep1Desc')}</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-[#101D2E] border border-[#243449] flex gap-3 items-center shadow-sm">
            <span class="w-8 h-8 rounded-xl bg-[#8CFF3F] text-[#06100A] tabular-nums font-mono font-black text-sm flex items-center justify-center flex-shrink-0">2</span>
            <div>
              <h4 class="font-heading font-bold text-xs sm:text-sm text-[#F5F7FA]">${t('hwStep2Title')}</h4>
              <p class="text-[11px] text-[#94A3B8]">${t('hwStep2Desc')}</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-[#101D2E] border border-[#243449] flex gap-3 items-center shadow-sm">
            <span class="w-8 h-8 rounded-xl bg-[#8CFF3F] text-[#06100A] tabular-nums font-mono font-black text-sm flex items-center justify-center flex-shrink-0">3</span>
            <div>
              <h4 class="font-heading font-bold text-xs sm:text-sm text-[#F5F7FA]">${t('hwStep3Title')}</h4>
              <p class="text-[11px] text-[#94A3B8]">${t('hwStep3Desc')}</p>
            </div>
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <h3 class="font-heading font-bold text-sm text-[#F5F7FA]">${t('faqTitle')}</h3>
          
          <details class="group rounded-xl bg-[#101D2E] border border-[#243449] p-3 open:bg-[#16273D] shadow-sm">
            <summary class="font-heading font-bold text-xs text-[#F5F7FA] cursor-pointer list-none flex items-center justify-between">
              <span>${t('faq1Q')}</span>
              <span class="text-[#8CFF3F] group-open:rotate-180 transition transform">▼</span>
            </summary>
            <p class="text-xs text-[#94A3B8] mt-2 leading-relaxed">${t('faq1A')}</p>
          </details>

          <details class="group rounded-xl bg-[#101D2E] border border-[#243449] p-3 open:bg-[#16273D] shadow-sm">
            <summary class="font-heading font-bold text-xs text-[#F5F7FA] cursor-pointer list-none flex items-center justify-between">
              <span>${t('faq2Q')}</span>
              <span class="text-[#8CFF3F] group-open:rotate-180 transition transform">▼</span>
            </summary>
            <p class="text-xs text-[#94A3B8] mt-2 leading-relaxed">${t('faq2A')}</p>
          </details>

          <details class="group rounded-xl bg-[#101D2E] border border-[#243449] p-3 open:bg-[#16273D] shadow-sm">
            <summary class="font-heading font-bold text-xs text-[#F5F7FA] cursor-pointer list-none flex items-center justify-between">
              <span>${t('faq3Q')}</span>
              <span class="text-[#8CFF3F] group-open:rotate-180 transition transform">▼</span>
            </summary>
            <p class="text-xs text-[#94A3B8] mt-2 leading-relaxed">${t('faq3A')}</p>
          </details>
        </div>
      </div>
    `;
  }

  renderAboutBody() {
    this.bodyContainer.innerHTML = `
      <div class="space-y-4 text-[#F5F7FA]">
        <div class="flex flex-col items-center text-center p-5 rounded-2xl bg-[#101D2E] border border-[#243449] shadow-sm">
          <img src="/logo.png" alt="RoadTok Logo" class="w-14 h-14 rounded-2xl mb-2.5 shadow-md object-contain" />
          <div>
            <h3 class="brand-roadtok text-2xl text-[#F5F7FA] leading-none mb-1">RoadTok</h3>
            <p class="text-xs text-[#8CFF3F] font-semibold mt-0.5">${t('aboutSubtitle')}</p>
          </div>
        </div>

        <p class="text-xs sm:text-sm text-[#94A3B8] leading-relaxed text-center p-2">${t('aboutStory')}</p>

        <div class="p-4 rounded-2xl bg-[#101D2E] border border-[#243449] text-center space-y-2 shadow-sm">
          <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#8CFF3F]/15 border border-[#8CFF3F]/30 text-[#8CFF3F] mb-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
          </div>
          <h4 class="font-heading font-bold text-xs sm:text-sm text-[#F5F7FA]">${t('aboutContactBtn')}</h4>
          <a href="mailto:inforoadtok@gmail.com" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8CFF3F]/15 hover:bg-[#8CFF3F]/25 text-[#8CFF3F] text-xs font-mono font-bold border border-[#8CFF3F]/30 transition">
            <span>inforoadtok@gmail.com</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
          </a>
        </div>
      </div>
    `;
  }

  renderTermsBody() {
    this.bodyContainer.innerHTML = `
      <div class="space-y-3 text-[#F5F7FA]">
        <div class="p-3 rounded-2xl bg-[#101D2E] border border-[#243449] space-y-1 shadow-sm">
          <h4 class="font-heading font-bold text-xs text-[#8CFF3F]">${t('legalDisclaimerHeader') || t('terms1Title')}</h4>
          <p class="text-xs text-[#94A3B8] leading-relaxed">${t('legalDisclaimerText') || t('terms1Desc')}</p>
        </div>

        <div class="p-3 rounded-2xl bg-[#101D2E] border border-[#243449] space-y-1 shadow-sm">
          <h4 class="font-heading font-bold text-xs text-[#8CFF3F]">${t('legalContentRulesHeader') || t('terms2Title')}</h4>
          <p class="text-xs text-[#94A3B8] leading-relaxed">${t('legalContentRulesText') || t('terms2Desc')}</p>
        </div>

        <div class="p-3 rounded-2xl bg-[#101D2E] border border-[#243449] space-y-1 shadow-sm">
          <h4 class="font-heading font-bold text-xs text-[#8CFF3F]">${t('legalDataRetentionHeader') || t('terms3Title')}</h4>
          <p class="text-xs text-[#94A3B8] leading-relaxed">${t('legalDataRetentionText') || t('terms3Desc')}</p>
        </div>

        <div class="p-3 rounded-2xl bg-[#101D2E] border border-[#243449] space-y-1 shadow-sm">
          <h4 class="font-heading font-bold text-xs text-[#8CFF3F]">${t('legalRemovalHeader') || t('terms4Title')}</h4>
          <p class="text-xs text-[#94A3B8] leading-relaxed">${t('legalRemovalText') || t('terms4Desc')}</p>
        </div>
      </div>
    `;
  }
}

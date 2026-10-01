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
        class="fixed z-[1050] bg-[var(--surface)] border-[var(--border)] shadow-2xl flex flex-col transition-all duration-250 ease-out pointer-events-none text-[var(--text)]
               /* Desktop: Right-side Drawer */
               lg:top-0 lg:right-0 lg:bottom-0 lg:w-[480px] lg:max-w-[90vw] lg:h-full lg:border-l lg:translate-x-full
               /* Mobile: Bottom Sheet */
               max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:w-full max-lg:h-[85dvh] max-lg:max-h-[85dvh] max-lg:rounded-t-3xl max-lg:border-t max-lg:translate-y-full"
      >
        <!-- Mobile Drag Handle Bar -->
        <div id="panel-drag-zone" class="lg:hidden w-full flex justify-center items-center py-2.5 cursor-grab active:cursor-grabbing select-none">
          <div class="w-12 h-1.5 rounded-full bg-[var(--border-color)]"></div>
        </div>

        <!-- Sticky Panel Header -->
        <div id="panel-header" class="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)] backdrop-blur-md flex-shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <span id="panel-header-icon" class="text-xl"></span>
            <div>
              <h2 id="panel-header-title" class="font-heading font-extrabold text-base sm:text-lg text-[var(--text)] leading-tight truncate"></h2>
              <div id="panel-header-sub" class="text-[11px] text-[var(--muted)] flex items-center gap-2 mt-0.5"></div>
            </div>
          </div>

          <div class="flex items-center gap-1.5 flex-shrink-0">
            <!-- Leaderboard Refresh Button (shown only for leaderboard) -->
            <button
              id="btn-panel-refresh-lb"
              type="button"
              class="hidden p-1.5 text-[var(--muted)] hover:text-amber-500 hover:bg-[var(--surface-2)] rounded-xl transition cursor-pointer"
              title="Refresh Leaderboard"
              aria-label="Refresh"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>

            <!-- Close Button -->
            <button
              id="btn-panel-close"
              type="button"
              class="w-8 h-8 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] flex items-center justify-center transition cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Scrollable Content Body -->
        <div id="panel-body-container" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
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
      if (this.activePanelId !== 'leaderboard') {
        this.close();
      }
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

    const isModal = panelId !== 'leaderboard';
    this.drawer.setAttribute('aria-modal', isModal ? 'true' : 'false');

    if (isModal) {
      this.backdrop.classList.remove('opacity-0', 'pointer-events-none');
      this.backdrop.classList.add('opacity-100', 'pointer-events-auto');
      this.lockBodyScroll();
    } else {
      this.backdrop.classList.add('opacity-0', 'pointer-events-none');
      this.backdrop.classList.remove('opacity-100', 'pointer-events-auto');
      this.unlockBodyScroll();
    }

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

    if (isModal) {
      setTimeout(() => this.closeBtn.focus(), 150);
    }

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
        this.headerIcon.innerText = '🏆';
        this.headerTitle.innerText = t('leaderboardTitle');
        this.updateLeaderboardTimeAgo();
        this.renderLeaderboardBody();
        break;

      case 'mission':
        this.headerIcon.innerText = '🎯';
        this.headerTitle.innerText = t('missionTitle');
        this.headerSub.innerText = t('missionSubtitle');
        this.renderMissionBody();
        break;

      case 'how':
        this.headerIcon.innerText = '⚡';
        this.headerTitle.innerText = t('howItWorksTitle');
        this.headerSub.innerText = t('howItWorksSubtitle');
        this.renderHowItWorksBody();
        break;

      case 'about':
        this.headerIcon.innerText = '🇮🇳';
        this.headerTitle.innerText = t('aboutTitle');
        this.headerSub.innerText = t('aboutSubtitle');
        this.renderAboutBody();
        break;

      case 'terms':
        this.headerIcon.innerText = '📜';
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
      <div class="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] text-xs font-heading font-bold select-none">
        ${tabs.map((tab) => `
          <button
            type="button"
            class="panel-lb-tab flex-1 py-1.5 px-2 rounded-xl transition text-center cursor-pointer ${this.leaderboardTab === tab.id ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}"
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
          title: `📍 ${cityName}`,
          subtitle: `${pin.reportCount || 1} ${isHindi ? 'रिपोर्ट्स' : 'reps'}`
        };
      }
      return {
        title: rawLandmark,
        subtitle: `📍 ${cityName} • ${pin.reportCount || 1} ${isHindi ? 'रिपोर्ट्स' : 'reps'}`
      };
    };

    let heroCardHtml = '';
    const hasHeroCard = Boolean(heroPin && this.leaderboardTab === 'week');
    if (hasHeroCard) {
      const heroLabels = getPinLabels(heroPin);
      heroCardHtml = `
        <div class="p-4.5 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/25 via-amber-500/10 to-transparent border-2 border-amber-500/40 space-y-3 relative overflow-hidden group shadow-md ring-1 ring-amber-500/20">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs tabular-nums font-mono font-black uppercase shadow-sm">
              👑 #1 ${isHindi ? 'सप्ताह का गड्ढा' : 'Pothole of the Week'}
            </span>
          </div>

          <div class="flex gap-3.5 items-center">
            ${heroPin.thumbnailUrl || heroPin.imageUrl ? `
              <img src="${heroPin.thumbnailUrl || heroPin.imageUrl}" alt="Hero Pothole" class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-500/50 shadow-sm flex-shrink-0" />
            ` : `
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-3xl flex-shrink-0">🕳️</div>
            `}
            <div class="min-w-0 flex-1">
              <h3 class="font-heading font-extrabold text-sm sm:text-base text-[var(--text)] truncate leading-tight">${heroLabels.title}</h3>
              <p class="text-xs text-[var(--muted)] mt-0.5">${heroLabels.subtitle}</p>
              <div class="flex gap-2.5 text-xs text-[var(--muted)] mt-1.5 tabular-nums font-mono font-medium">
                <span class="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">📢 ${heroPin.reportCount || 1} ${isHindi ? 'रिपोर्ट्स' : 'Reports'}</span>
                <span class="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">👍 ${heroPin.upvotes || 0} ${isHindi ? 'वोट' : 'Votes'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="panel-pin-row-btn w-full py-2 px-3 rounded-none bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-heading font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-[0.99]"
            data-pin-id="${heroPin.id}"
          >
            <span>🗺️</span>
            <span>${isHindi ? 'मैप पर देखें' : 'View on Map'}</span>
          </button>
        </div>
      `;
    }

    let listHtml = '';
    if (this.leaderboardTab === 'cities') {
      const topCities = (data.topCities || []).slice(0, 10);
      if (topCities.length === 0) {
        listHtml = `<div class="text-center py-8 text-[var(--muted)] text-xs">${isHindi ? 'अभी कोई शहर डेटा उपलब्ध नहीं है।' : 'No city data available yet.'}</div>`;
      } else {
        listHtml = topCities.map((c, idx) => {
          const isTop3 = idx < 3;
          const badgeClass = idx === 0 
            ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-sm ring-1 ring-amber-500/40' 
            : (idx === 1 
              ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-950 font-black text-sm shadow-sm ring-1 ring-slate-400/40' 
              : (idx === 2 
                ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-amber-100 font-black text-sm shadow-sm ring-1 ring-amber-700/40' 
                : 'w-7 h-7 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] font-bold text-xs'));

          const cardClass = isTop3
            ? (idx === 0 
              ? 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[var(--surface)] to-[var(--surface)] border border-amber-500/40 shadow-sm' 
              : (idx === 1 
                ? 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-200/20 via-[var(--surface)] to-[var(--surface)] border border-slate-300 dark:border-slate-600 shadow-sm' 
                : 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-800/10 via-[var(--surface)] to-[var(--surface)] border border-amber-700/30 shadow-sm'))
            : 'p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm';

          return `
            <div class="${cardClass} flex items-center justify-between transition">
              <div class="flex items-center gap-3">
                <span class="${badgeClass} flex items-center justify-center tabular-nums font-mono flex-shrink-0">
                  #${idx + 1}
                </span>
                <div>
                  <h4 class="font-heading ${isTop3 ? 'font-extrabold text-sm sm:text-base' : 'font-bold text-sm'} text-[var(--text)]">${isHindi ? (c.nameHindi || c.nameEnglish) : (c.nameEnglish || c.nameHindi)}</h4>
                  <p class="text-[11px] text-[var(--muted)]">${c.count || 0} ${isHindi ? 'कुल रिपोर्ट्स' : 'Total Reports'}</p>
                </div>
              </div>
              <span class="text-xs ${isTop3 ? 'sm:text-sm font-black text-amber-600 dark:text-amber-400' : 'font-bold text-amber-500'} tabular-nums font-mono">🚨 ${c.count || 0}</span>
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
        listHtml = `<div class="text-center py-8 text-[var(--muted)] text-xs">${isHindi ? 'इस श्रेणी में अभी कोई गड्ढे नहीं हैं।' : 'No reported potholes in this category yet.'}</div>`;
      } else if (pins.length === 0 && hasHeroCard) {
        listHtml = '';
      } else {
        listHtml = pins.map((pin, idx) => {
          const rankNumber = startRank + idx;
          const isTop3 = rankNumber <= 3;
          const pinLabels = getPinLabels(pin);

          const badgeClass = rankNumber === 1 
            ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-sm ring-1 ring-amber-500/50' 
            : (rankNumber === 2 
              ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-950 font-black text-sm shadow-sm ring-1 ring-slate-400/50' 
              : (rankNumber === 3 
                ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-amber-100 font-black text-sm shadow-sm ring-1 ring-amber-700/50' 
                : 'w-6 h-6 rounded-lg bg-[var(--surface-2)] text-[var(--muted)] font-bold text-xs'));

          const cardClass = isTop3
            ? (rankNumber === 1 
              ? 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[var(--surface)] to-[var(--surface)] border border-amber-500/40 hover:border-amber-500/60 shadow-sm' 
              : (rankNumber === 2 
                ? 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-200/20 via-[var(--surface)] to-[var(--surface)] border border-slate-300 dark:border-slate-600 hover:border-slate-400 shadow-sm' 
                : 'p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-800/10 via-[var(--surface)] to-[var(--surface)] border border-amber-700/30 hover:border-amber-700/50 shadow-sm'))
            : 'p-3 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-amber-500/40 shadow-sm';

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
                  <img src="${pin.thumbnailUrl || pin.imageUrl}" alt="Pothole thumb" class="${thumbSize} rounded-xl object-cover border border-[var(--border)] flex-shrink-0 shadow-xs" />
                ` : `
                  <div class="${thumbSize} rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center ${isTop3 ? 'text-lg' : 'text-sm'} flex-shrink-0">🕳️</div>
                `}

                <div class="min-w-0">
                  <h4 class="font-heading ${isTop3 ? 'font-extrabold text-sm sm:text-base' : 'font-bold text-xs sm:text-sm'} text-[var(--text)] truncate group-hover:text-amber-500 transition">${pinLabels.title}</h4>
                  <p class="text-[11px] text-[var(--muted)] truncate">${pinLabels.subtitle}</p>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-1 rounded-lg ${isTop3 ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold' : 'bg-amber-500/10 border-amber-500/20 text-[var(--accent)] font-bold'} border tabular-nums font-mono text-xs">
                  👍 ${pin.upvotes || 0}
                </span>
                <span class="text-[var(--muted)] group-hover:text-[var(--text)] transition text-xs">➔</span>
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
          if (window.innerWidth < 1024) {
            this.close();
          }
          this.onSelectPin(pin);
        }
      });
    });
  }

  renderMissionBody() {
    const isHindi = getLanguage() === 'hindi';
    this.bodyContainer.innerHTML = `
      <div class="space-y-4 text-[var(--text)]">
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <p class="text-xs sm:text-sm text-[var(--accent)] font-medium leading-relaxed">
            ${isHindi
              ? '"हमारा लक्ष्य केवल गड्ढों की शिकायत करना नहीं, बल्कि तकनीक और पारदर्शी जन-भागीदारी से प्रशासन को त्वरित मरम्मत के लिए प्रेरित करना है।"'
              : '"Our goal is not just complaining about potholes, but leveraging technology and citizen collaboration to accelerate accountable road repairs across India."'}
          </p>
        </div>

        <div class="space-y-3">
          <div class="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2">
              <span class="text-xl">👁️</span>
              <h3 class="font-heading font-bold text-sm text-[var(--text)]">${t('pillar1Title')}</h3>
            </div>
            <p class="text-xs text-[var(--muted)] leading-relaxed">${t('pillar1Desc')}</p>
          </div>

          <div class="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2">
              <span class="text-xl">📢</span>
              <h3 class="font-heading font-bold text-sm text-[var(--text)]">${t('pillar2Title')}</h3>
            </div>
            <p class="text-xs text-[var(--muted)] leading-relaxed">${t('pillar2Desc')}</p>
          </div>

          <div class="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2">
              <span class="text-xl">🛠️</span>
              <h3 class="font-heading font-bold text-sm text-[var(--text)]">${t('pillar3Title')}</h3>
            </div>
            <p class="text-xs text-[var(--muted)] leading-relaxed">${t('pillar3Desc')}</p>
          </div>
        </div>
      </div>
    `;
  }

  renderHowItWorksBody() {
    this.bodyContainer.innerHTML = `
      <div class="space-y-5 text-[var(--text)]">
        <div class="space-y-3">
          <div class="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex gap-3 items-center shadow-sm">
            <span class="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 tabular-nums font-mono font-black text-sm flex items-center justify-center flex-shrink-0">1</span>
            <div>
              <h4 class="font-heading font-bold text-xs sm:text-sm text-[var(--text)]">${t('hwStep1Title')}</h4>
              <p class="text-[11px] text-[var(--muted)]">${t('hwStep1Desc')}</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex gap-3 items-center shadow-sm">
            <span class="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 tabular-nums font-mono font-black text-sm flex items-center justify-center flex-shrink-0">2</span>
            <div>
              <h4 class="font-heading font-bold text-xs sm:text-sm text-[var(--text)]">${t('hwStep2Title')}</h4>
              <p class="text-[11px] text-[var(--muted)]">${t('hwStep2Desc')}</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex gap-3 items-center shadow-sm">
            <span class="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 tabular-nums font-mono font-black text-sm flex items-center justify-center flex-shrink-0">3</span>
            <div>
              <h4 class="font-heading font-bold text-xs sm:text-sm text-[var(--text)]">${t('hwStep3Title')}</h4>
              <p class="text-[11px] text-[var(--muted)]">${t('hwStep3Desc')}</p>
            </div>
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <h3 class="font-heading font-bold text-sm text-[var(--text)]">${t('faqTitle')}</h3>
          
          <details class="group rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 open:bg-[var(--surface-2)] shadow-sm">
            <summary class="font-heading font-bold text-xs text-[var(--text)] cursor-pointer list-none flex items-center justify-between">
              <span>${t('faq1Q')}</span>
              <span class="text-amber-500 group-open:rotate-180 transition transform">▼</span>
            </summary>
            <p class="text-xs text-[var(--muted)] mt-2 leading-relaxed">${t('faq1A')}</p>
          </details>

          <details class="group rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 open:bg-[var(--surface-2)] shadow-sm">
            <summary class="font-heading font-bold text-xs text-[var(--text)] cursor-pointer list-none flex items-center justify-between">
              <span>${t('faq2Q')}</span>
              <span class="text-amber-500 group-open:rotate-180 transition transform">▼</span>
            </summary>
            <p class="text-xs text-[var(--muted)] mt-2 leading-relaxed">${t('faq2A')}</p>
          </details>

          <details class="group rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 open:bg-[var(--surface-2)] shadow-sm">
            <summary class="font-heading font-bold text-xs text-[var(--text)] cursor-pointer list-none flex items-center justify-between">
              <span>${t('faq3Q')}</span>
              <span class="text-amber-500 group-open:rotate-180 transition transform">▼</span>
            </summary>
            <p class="text-xs text-[var(--muted)] mt-2 leading-relaxed">${t('faq3A')}</p>
          </details>
        </div>
      </div>
    `;
  }

  renderAboutBody() {
    this.bodyContainer.innerHTML = `
      <div class="space-y-4 text-[var(--text)]">
        <div class="flex flex-col items-center text-center p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <img src="/logo.svg" alt="Gaddhe Me Party Logo" class="w-12 h-12 rounded-2xl mb-2" />
          <div>
            <h3 class="font-heading font-bold text-sm text-[var(--text)]">${t('appNameHindi')}</h3>
            <p class="text-xs text-[var(--accent)] font-semibold mt-0.5">${t('aboutSubtitle')}</p>
          </div>
        </div>

        <p class="text-xs sm:text-sm text-[var(--muted)] leading-relaxed text-center">${t('aboutStory')}</p>
      </div>
    `;
  }

  renderTermsBody() {
    this.bodyContainer.innerHTML = `
      <div class="space-y-3 text-[var(--text)]">
        <div class="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1 shadow-sm">
          <h4 class="font-heading font-bold text-xs text-[var(--accent)]">${t('legalDisclaimerHeader') || t('terms1Title')}</h4>
          <p class="text-xs text-[var(--muted)] leading-relaxed">${t('legalDisclaimerText') || t('terms1Desc')}</p>
        </div>

        <div class="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1 shadow-sm">
          <h4 class="font-heading font-bold text-xs text-[var(--accent)]">${t('legalContentRulesHeader') || t('terms2Title')}</h4>
          <p class="text-xs text-[var(--muted)] leading-relaxed">${t('legalContentRulesText') || t('terms2Desc')}</p>
        </div>

        <div class="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1 shadow-sm">
          <h4 class="font-heading font-bold text-xs text-[var(--accent)]">${t('legalDataRetentionHeader') || t('terms3Title')}</h4>
          <p class="text-xs text-[var(--muted)] leading-relaxed">${t('legalDataRetentionText') || t('terms3Desc')}</p>
        </div>

        <div class="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1 shadow-sm">
          <h4 class="font-heading font-bold text-xs text-[var(--accent)]">${t('legalRemovalHeader') || t('terms4Title')}</h4>
          <p class="text-xs text-[var(--muted)] leading-relaxed">${t('legalRemovalText') || t('terms4Desc')}</p>
        </div>
      </div>
    `;
  }
}

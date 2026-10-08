import './style.css';
import { syncAllModalContainersMount } from './utils/domUtils';
import { LeafletAdapter } from './map/LeafletAdapter';
import { GoogleMapsAdapter } from './map/GoogleMapsAdapter';
import { createNavbar } from './components/Navbar';
import { renderStatsStrip } from './components/StatsStrip';
import { BottomSheet } from './components/BottomSheet';
import { LeaderboardSection } from './components/LeaderboardSheet';
import { renderReportForm } from './components/ReportForm';
import { openPinDetailModal } from './components/PinDetailModal';
import { openChaiTipModal } from './components/ChaiTipModal';
import { openThankYouModal } from './components/ThankYouModal';
import { showToast } from './components/Toast';
import { t, getLanguage, renderAllPageI18n } from './utils/i18n';
import { modalManager } from './utils/modalManager';
import { resolvePinCity, getNearestIndianCity, haversineDistanceKm } from './utils/cities';
import { getActionQuota, hasUserReportedOrUpvoted, hasUserUpvoted, markPinAsUpvoted } from './utils/upvoteStorage';
import {
  initAnonymousAuth,
  subscribeToActivePins,
  subscribeToGlobalStats,
  subscribeToLeaderboard,
  uploadPotholePhoto,
  callSubmitReport,
  callUpvotePin,
  callFlagPin
} from './services/firebase';
import {
  saveReportOffline,
  getOfflineReports,
  removeOfflineReport
} from './utils/offlineQueue';

import { StarfieldCanvas } from './components/StarfieldCanvas';
import { NightGlobe } from './components/NightGlobe';
import { PanelManager } from './components/PanelManager';
import { initPotholeCartoonAnimation } from './components/PotholeCartoonAnimation';
import { initVisitorsCounter } from './components/VisitorsCounter';
import { TempleBellWidget } from './components/TempleBell';
import { router } from './utils/router';
import { getLiveUserLocation, getCachedUserLocation, setCachedUserLocation, getRealDeviceGps, setRealDeviceGps } from './utils/geo';
import { tilt3d } from './utils/tilt3d';

// Real Live Data Store
class KhaddaApp {
  constructor() {
    this.mapAdapter = null;
    this.bottomSheet = new BottomSheet();
    this.panelManager = null;
    this.leaderboardSection = new LeaderboardSection('leaderboard-mount');
    this.templeBell = new TempleBellWidget('temple-bell-mount');
    this.currentPins = [];
    this.userCoords = getCachedUserLocation();
    this.mapTheme = 'dark';
    this.activeNav = 'map';
    this.starfield = null;
    this.nightGlobe = null;
    this.hasFlownIn = false;
    this.knownPinIds = new Set();
    this.isMapShiftedForReport = false;
    this.statsData = {
      totalReports: 0,
      todayReports: 0,
      topCity: '-'
    };

    this.bottomSheet.onClose(() => {
      if (this.isMapShiftedForReport) {
        this.isMapShiftedForReport = false;
        this.mapAdapter?.panBy?.(-200, 0);
      }
    });
  }

  async init() {
    console.log('[KhaddaWaliParty] Initializing redesigned civic-tech app...');

    // 0. Initialize theme from storage or system preference
    this.initTheme();

    // 0.2. Render saved language across static DOM
    renderAllPageI18n();

    // 0.3. Render Interactive 3D Temple Bell Widget
    this.templeBell?.render();

    // 0.5. Initialize Hero Cinematic Visuals (Starfield & 3D Night Globe)
    this.initHeroVisuals();

    // 1. Initialize Anonymous Auth
    await initAnonymousAuth();

    // 2. Initialize Map View centered on India (Google Maps or Leaflet)
    const provider = import.meta.env.VITE_MAP_PROVIDER;
    const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (provider === 'google' && googleKey) {
      window.gm_authFailure = () => {
        console.warn('[Map] Google Maps API key authentication error. Switching to Leaflet...');
        if (this.mapAdapter && !(this.mapAdapter instanceof LeafletAdapter)) {
          try { this.mapAdapter.destroy?.(); } catch (_) {}
          const mapEl = document.getElementById('map');
          if (mapEl) mapEl.innerHTML = '';
          this.mapAdapter = new LeafletAdapter();
          this.mapAdapter.init('map', { theme: this.mapTheme });
          this.mapAdapter.renderPins(this.currentPins, (pin) => openPinDetailModal(pin));
        }
      };

      try {
        console.log('[Map] Initializing Google Maps JS API with region=IN...');
        this.mapAdapter = new GoogleMapsAdapter();
        await this.mapAdapter.init('map', { theme: this.mapTheme });
      } catch (e) {
        console.warn('[Map] Google Maps fallback to Leaflet:', e);
        this.mapAdapter = new LeafletAdapter();
        this.mapAdapter.init('map', { theme: this.mapTheme });
      }
    } else {
      this.mapAdapter = new LeafletAdapter();
      this.mapAdapter.init('map', { theme: this.mapTheme });
    }

    this.mapAdapter.renderPins(this.currentPins, (pin) => openPinDetailModal(pin));

    // Setup Map Cinematic Fly-in on first viewport intersection
    this.setupMapFlyInObserver();

    // 3. Initialize Slide-Over Panel Manager & Routing
    this.initPanelsAndRouter();

    // 4. Initialize Top Navbar & Real Stats Strip
    this.renderHeaderAndStats();

    // 5. Setup Global UI Event Handlers
    this.setupEventListeners();

    // 6. Connect Realtime Firestore Listeners
    this.setupFirestoreSubscriptions();

    // 7. Setup Offline Sync Manager
    this.setupOfflineSync();

    // 8. Auto-detect user geolocation on initial load if permitted
    this.detectInitialLocation();

    // 9. Sticky Mobile CTA & Scroll Reveal
    this.setupStickyCtaObserver();
    this.setupScrollReveal();

    // 10. Subtle Desktop 3D Card Tilt Engine
    tilt3d.init();

    // 10.5. Initialize Animated Pothole Cartoon Strip & Visitors Counter (Above Footer)
    initPotholeCartoonAnimation('pothole-animation-mount');
    initVisitorsCounter('visitors-counter-mount');
    window.addEventListener('languageChanged', () => {
      initPotholeCartoonAnimation('pothole-animation-mount');
      initVisitorsCounter('visitors-counter-mount');
      this.renderHeaderAndStats();
      tilt3d.refresh();
    });

    // 11. Window Resize Listener for full-width layout responsiveness
    window.addEventListener('resize', () => {
      if (this.mapAdapter && this.mapAdapter.resize) {
        this.mapAdapter.resize();
      }
    });
  }

  initHeroVisuals() {
    try {
      this.starfield = new StarfieldCanvas('starfield-canvas');
      this.nightGlobe = new NightGlobe('globe-canvas');
    } catch (e) {
      console.warn('[HeroVisuals] Initialization notice:', e);
    }
  }

  setupMapFlyInObserver() {
    const mapSection = document.getElementById('map-section');
    if (!mapSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.hasFlownIn) {
            this.hasFlownIn = true;
            if (this.mapAdapter && this.mapAdapter.cinematicFlyIn) {
              const liveTarget = (this.userCoords && this.userCoords.lat && this.userCoords.lng)
                ? this.userCoords
                : null;
              this.mapAdapter.cinematicFlyIn(null, liveTarget);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(mapSection);
  }

  initPanelsAndRouter() {
    this.panelManager = new PanelManager({
      onSelectPin: (pin) => {
        const pinRank = pin.rank || window.__khaddaGetPinRank?.(pin.id) || null;
        if (pinRank) pin.rank = pinRank;

        this.mapAdapter.setView(pin.latitude, pin.longitude, 17);
        if (this.mapAdapter.highlightPin) {
          this.mapAdapter.highlightPin(pin.latitude, pin.longitude, pinRank);
        }
        if (this.mapAdapter.playArrivalRipple) {
          this.mapAdapter.playArrivalRipple(pin.latitude, pin.longitude);
        }
        setTimeout(() => {
          openPinDetailModal(pin);
        }, 350);
      },
      onPanelStateChange: (panelId, isOpen) => {
        this.activeNav = isOpen ? panelId : 'map';
        this.renderHeaderAndStats();
      }
    });

    // Wire Router with History API
    router.init((route) => {
      if (route.type === 'pin' && route.id) {
        const pin = this.currentPins.find((p) => p.id === route.id);
        if (pin) {
          const pinRank = window.__khaddaGetPinRank?.(pin.id) || null;
          if (pinRank) pin.rank = pinRank;
          this.mapAdapter.setView(pin.latitude, pin.longitude, 17);
          if (this.mapAdapter.highlightPin) {
            this.mapAdapter.highlightPin(pin.latitude, pin.longitude, pinRank);
          }
          if (this.mapAdapter.playArrivalRipple) {
            this.mapAdapter.playArrivalRipple(pin.latitude, pin.longitude);
          }
          openPinDetailModal(pin);
        }
      } else if (route.type === 'panel') {
        if (route.name) {
          this.panelManager.open(route.name);
        } else {
          this.panelManager.close();
        }
      }
    });
  }

  initTheme() {
    this.mapTheme = 'light';
    this.applyGlobalTheme('light', true);
  }

  applyGlobalTheme(theme = 'light', persist = true) {
    this.mapTheme = 'light';
    if (persist) {
      localStorage.setItem('khadda_theme', 'light');
    }

    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', '#521F17');
    }

    if (this.mapAdapter && this.mapAdapter.applyTheme) {
      this.mapAdapter.applyTheme('light');
    }

    if (this.nightGlobe && this.nightGlobe.applyTheme) {
      this.nightGlobe.applyTheme('light');
    }

    if (this.starfield && this.starfield.applyTheme) {
      this.starfield.applyTheme('light');
    }

    this.renderHeaderAndStats();
  }

  renderHeaderAndStats() {
    createNavbar({
      onChaiTipClick: () => openChaiTipModal(),
      currentTheme: 'light',
      activeNav: this.activeNav
    });

    const statsContainer = document.getElementById('stats-strip-container');
    if (statsContainer) {
      renderStatsStrip(statsContainer, this.statsData);
    }
  }

  toggleMapTheme() {
    this.applyGlobalTheme('light', true);
  }

  setupEventListeners() {
    // Open Bottom Sheet Report Form
    const openReportBtn = document.getElementById('btn-open-report');
    openReportBtn?.addEventListener('click', () => {
      this.handleOpenReportClick();
    });

    // Locate Me Button
    const locateMeBtn = document.getElementById('btn-locate-me');
    locateMeBtn?.addEventListener('click', () => {
      this.locateUserAndCenter();
    });

    // In-card Info Button -> Opens About Panel
    const openAboutBtn = document.getElementById('btn-open-about');
    openAboutBtn?.addEventListener('click', () => {
      router.navigate('about');
    });

    // Sticky Mobile Floating Report Button
    const stickyReportBtn = document.getElementById('btn-sticky-report');
    stickyReportBtn?.addEventListener('click', () => {
      this.handleOpenReportClick();
    });

    // Hero Section Quick Report Button
    const heroReportBtn = document.getElementById('btn-hero-report');
    heroReportBtn?.addEventListener('click', () => {
      this.handleOpenReportClick();
    });

    // Card Zoom Controls
    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');

    zoomInBtn?.addEventListener('click', () => {
      if (this.mapAdapter && this.mapAdapter.zoomIn) {
        this.mapAdapter.zoomIn();
      }
    });

    zoomOutBtn?.addEventListener('click', () => {
      if (this.mapAdapter && this.mapAdapter.zoomOut) {
        this.mapAdapter.zoomOut();
      }
    });

    // Card Fullscreen Toggle Control
    const fullscreenToggleBtn = document.getElementById('btn-fullscreen-toggle');
    fullscreenToggleBtn?.addEventListener('click', () => {
      this.toggleMapFullscreen();
    });

    // Dedicated Fullscreen Exit Button on Map (Mobile & Desktop)
    const exitFullscreenTopBtn = document.getElementById('btn-map-fullscreen-exit');
    exitFullscreenTopBtn?.addEventListener('click', () => {
      if (this.activeConfirmCleanup) {
        this.activeConfirmCleanup();
      }
      this.exitMapFullscreen();
      this.isReportFullscreenFlow = false;
    });

    // When Report Drawer closes, return to normal view if opened from report flow
    this.bottomSheet.onCloseCallbacks.push(() => {
      if (this.isReportFullscreenFlow && this.isMapFullscreenActive()) {
        this.exitMapFullscreen();
        this.isReportFullscreenFlow = false;
      }
    });

    // Listen to native and ESC fullscreen changes
    const onFullscreenChange = () => {
      const isNativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      const card = document.getElementById('map-card-container');
      const isCssFs = card?.classList.contains('is-fullscreen');
      this.updateFullscreenUI(isNativeFs || isCssFs);
      syncAllModalContainersMount();
      if (this.mapAdapter && this.mapAdapter.resize) {
        setTimeout(() => this.mapAdapter.resize(), 100);
        setTimeout(() => this.mapAdapter.resize(), 300);
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    // Map User Interaction Tracking (Prevents programmatic auto-centering after manual user pan/drag)
    const mapEl = document.getElementById('map');
    if (mapEl) {
      const markInteracted = () => { this.userInteractedWithMap = true; };
      mapEl.addEventListener('touchstart', markInteracted, { passive: true });
      mapEl.addEventListener('mousedown', markInteracted, { passive: true });
    }

    // Global Pin Navigation & Rank Handlers
    window.__khaddaGetPinRank = (pinId) => {
      if (!pinId) return null;
      if (this.panelManager?.leaderboardData?.heroPotholeOfWeek?.id === pinId) {
        return 1;
      }
      const weekRankings = this.panelManager?.leaderboardData?.weekRankings || [];
      const weekIdx = weekRankings.findIndex((p) => p.id === pinId);
      if (weekIdx !== -1) return weekIdx + 1;

      const allTimeRankings = this.panelManager?.leaderboardData?.allTimeRankings || [];
      const allTimeIdx = allTimeRankings.findIndex((p) => p.id === pinId);
      if (allTimeIdx !== -1) return allTimeIdx + 1;

      if (this.currentPins && this.currentPins.length > 0) {
        const sorted = [...this.currentPins].sort((a, b) => (b.upvotes || 0) + (b.reportCount || 1) * 3 - ((a.upvotes || 0) + (a.reportCount || 1) * 3));
        const sortedIdx = sorted.findIndex((p) => p.id === pinId);
        if (sortedIdx !== -1 && sortedIdx < 10) return sortedIdx + 1;
      }
      return null;
    };

    window.__khaddaClosePanels = () => {
      if (this.panelManager) {
        this.panelManager.close();
      }
    };

    window.__khaddaFocusPinOnMap = (pin, rank = null) => {
      if (!pin || !pin.latitude || !pin.longitude) return;

      if (this.panelManager) {
        this.panelManager.close();
      }

      const mapEl = document.getElementById('map-section');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      const pinRank = rank || pin.rank || window.__khaddaGetPinRank(pin.id);

      if (this.mapAdapter) {
        this.mapAdapter.setView(pin.latitude, pin.longitude, 18);
        if (this.mapAdapter.highlightPin) {
          this.mapAdapter.highlightPin(pin.latitude, pin.longitude, pinRank);
        }
        if (this.mapAdapter.playArrivalRipple) {
          this.mapAdapter.playArrivalRipple(pin.latitude, pin.longitude);
        }
      }
    };

    window.__khaddaFlyToPin = (pinId, rank = null) => {
      const pin = this.currentPins.find((p) => p.id === pinId) ||
                  (this.panelManager?.leaderboardData?.heroPotholeOfWeek?.id === pinId ? this.panelManager.leaderboardData.heroPotholeOfWeek : null);
      if (pin) {
        const pinRank = rank || pin.rank || window.__khaddaGetPinRank(pinId);
        if (pinRank) pin.rank = pinRank;

        if (this.panelManager) {
          this.panelManager.close();
        }

        const mapEl = document.getElementById('map-section');
        if (mapEl) {
          mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        this.mapAdapter.setView(pin.latitude, pin.longitude, 17);
        if (this.mapAdapter.highlightPin) {
          this.mapAdapter.highlightPin(pin.latitude, pin.longitude, pinRank);
        }
        if (this.mapAdapter.playArrivalRipple) {
          this.mapAdapter.playArrivalRipple(pin.latitude, pin.longitude);
        }
        setTimeout(() => {
          openPinDetailModal(pin);
        }, 400);
      }
    };

    window.__khaddaOpenPinModal = (pin) => {
      if (this.panelManager) {
        this.panelManager.close();
      }
      if (pin) openPinDetailModal(pin);
    };

    window.__khaddaReRenderPins = () => {
      if (this.mapAdapter && this.currentPins) {
        this.mapAdapter.renderPins(this.currentPins, (p) => openPinDetailModal(p));
      }
    };

    // Language Change Event - Synchronous bilingual UI re-render
    window.addEventListener('languageChanged', () => {
      renderAllPageI18n();
      this.renderHeaderAndStats();
      
      const fabText = document.getElementById('fab-text');
      if (fabText) fabText.innerText = t('reportBtn');

      const stickyText = document.querySelector('#btn-sticky-report span:last-child');
      if (stickyText) stickyText.innerText = t('reportBtn');

      const locateBtnEl = document.getElementById('btn-locate-me');
      if (locateBtnEl) {
        locateBtnEl.title = t('locateMe');
        locateBtnEl.setAttribute('aria-label', t('locateMe'));
      }

      const aboutBtnEl = document.getElementById('btn-open-about');
      if (aboutBtnEl) {
        aboutBtnEl.title = t('aboutBtnTooltip');
        aboutBtnEl.setAttribute('aria-label', t('aboutBtnTooltip'));
      }

      const fsBtnEl = document.getElementById('btn-fullscreen-toggle');
      if (fsBtnEl) {
        const card = document.getElementById('map-card-container');
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || card?.classList.contains('is-fullscreen'));
        const label = isFs ? t('exitFullscreenTooltip') : t('fullscreenTooltip');
        fsBtnEl.title = label;
        fsBtnEl.setAttribute('aria-label', label);
      }

      const offlineBanner = document.getElementById('offline-banner');
      if (offlineBanner) {
        const span = offlineBanner.querySelector('span');
        if (span) span.innerText = t('offlineBanner');
      }

      // Re-render pins so open & future popups immediately use the selected language
      if (this.mapAdapter && this.currentPins) {
        this.mapAdapter.renderPins(this.currentPins, (pin) => openPinDetailModal(pin));
      }

      // Re-render in-page Leaderboard preview
      if (this.leaderboardSection) {
        this.leaderboardSection.render();
      }

      // Re-render Temple Bell Widget
      this.templeBell?.render();

      // Re-render active panel if open
      if (this.panelManager && this.panelManager.isOpen) {
        this.panelManager.renderContent(this.panelManager.activePanelId);
      }

      // If report bottom sheet is currently open, re-render form in place
      const reportMount = document.getElementById('report-form-mount');
      if (reportMount && this.bottomSheet.isOpen) {
        renderReportForm(reportMount, {
          currentCoordinates: this.userCoords,
          onStartMapPinConfirm: (formState) => {
            this.startMapLocationConfirm(formState);
          },
          onClose: () => this.bottomSheet.close(),
          onSubmit: async (formData) => {
            await this.handleReportSubmit(formData);
          }
        });
      }
    });

    // Expose Upvote & Flag methods to window
    window.__khaddaUpvotePin = async (pinId) => {
      if (hasUserReportedOrUpvoted(pinId)) {
        showToast(t('alreadyReportedAlert'), 'warning');
        return;
      }

      const quota = getActionQuota();
      if (quota.isLimitReached) {
        showToast(t('nextReportAvailable', { time: quota.waitFormatted || '24 घंटे' }), 'warning', 6000);
        return;
      }

      try {
        const res = await callUpvotePin(pinId);
        markPinAsUpvoted(pinId);
        showToast(res.message || t('upvoteSuccess'), 'success');
        
        // Optimistic UI update for pins
        const pin = this.currentPins.find((p) => p.id === pinId);
        if (pin) {
          pin.upvotes = (pin.upvotes || 0) + 1;
          this.mapAdapter.renderPins(this.currentPins, (p) => openPinDetailModal(p));
          this.leaderboardSection?.render();
          if (this.panelManager && this.panelManager.activePanelId === 'leaderboard') {
            this.panelManager.renderLeaderboardBody();
          }
          openPinDetailModal(pin);
        }
      } catch (err) {
        showToast(err.message || t('alreadyReportedAlert'), 'warning');
      }
    };

    window.__khaddaFlagPin = async (pinId) => {
      const reason = prompt(t('flagPrompt'));
      if (reason === null) return;
      try {
        const res = await callFlagPin(pinId, reason);
        showToast(res.message || t('flagSuccess'), 'info');
      } catch (err) {
        showToast(err.message || t('flagError'), 'error');
      }
    };
  }

  setupFirestoreSubscriptions() {
    // 1. Subscribe to active pins
    subscribeToActivePins((livePins) => {
      const pins = livePins || [];
      const isInitialLoad = this.knownPinIds.size === 0;

      pins.forEach((pin) => {
        if (!isInitialLoad && !this.knownPinIds.has(pin.id)) {
          // Play cinematic arrival ripple on map for real-time live events
          if (this.mapAdapter && this.mapAdapter.playArrivalRipple) {
            this.mapAdapter.playArrivalRipple(pin.latitude, pin.longitude);
          }
        }
        this.knownPinIds.add(pin.id);
      });

      this.currentPins = pins;
      this.mapAdapter.renderPins(this.currentPins, (p) => openPinDetailModal(p));

      // Compute real stats from live pins
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      let todayCount = 0;
      let totalCount = 0;
      const cityCounts = {};

      this.currentPins.forEach((pin) => {
        const count = pin.reportCount || 1;
        totalCount += count;

        let createdTime = 0;
        if (pin.createdAt?.toDate) {
          createdTime = pin.createdAt.toDate().getTime();
        } else if (pin.createdAt) {
          createdTime = new Date(pin.createdAt).getTime();
        }

        if (createdTime >= startOfToday) {
          todayCount += count;
        }

        const isHindi = getLanguage() === 'hindi';
        const cName = resolvePinCity(pin, isHindi);
        cityCounts[cName] = (cityCounts[cName] || 0) + count;
      });

      let topCity = '-';
      let maxCityCount = 0;
      for (const [c, cnt] of Object.entries(cityCounts)) {
        if (cnt > maxCityCount) {
          maxCityCount = cnt;
          topCity = c;
        }
      }

      this.statsData = {
        totalReports: totalCount,
        todayReports: todayCount,
        topCity
      };

      const statsContainer = document.getElementById('stats-strip-container');
      if (statsContainer) {
        renderStatsStrip(statsContainer, this.statsData);
      }

      // If leaderboard doesn't have custom server data yet, construct from live user pins
      if (this.currentPins.length > 0) {
        const sorted = [...this.currentPins].sort((a, b) => (b.upvotes || 0) + (b.reportCount || 1) * 3 - ((a.upvotes || 0) + (a.reportCount || 1) * 3)).slice(0, 10);
        const topCities = Object.entries(cityCounts).map(([name, count]) => ({
          nameEnglish: name,
          nameHindi: name,
          count
        })).sort((a, b) => b.count - a.count).slice(0, 10);

        const lbPayload = {
          heroPotholeOfWeek: sorted[0] || null,
          weekRankings: sorted,
          monthRankings: sorted,
          allTimeRankings: sorted,
          topCities: topCities
        };
        this.leaderboardSection?.setData(lbPayload);
        this.panelManager?.setData(lbPayload);
      }
    });

    // 2. Subscribe to global report counter
    subscribeToGlobalStats((stats) => {
      if (stats && stats.totalReports) {
        this.statsData.totalReports = stats.totalReports;
        const statsContainer = document.getElementById('stats-strip-container');
        if (statsContainer) {
          renderStatsStrip(statsContainer, this.statsData);
        }
      }
    });
  }

  setupStickyCtaObserver() {
    const mapSection = document.getElementById('map-section');
    const stickyCta = document.getElementById('sticky-mobile-cta');
    if (!mapSection || !stickyCta) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          stickyCta.classList.remove('hidden');
        } else {
          stickyCta.classList.add('hidden');
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(mapSection);
  }

  setupScrollReveal() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');
    if (reveals.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -50px 0px', threshold: 0.1 }
    );

    reveals.forEach((el) => observer.observe(el));
  }

  detectInitialLocation() {
    getLiveUserLocation({ enableHighAccuracy: true, timeout: 8000, fallbackToCache: true })
      .then((coords) => {
        if (coords && coords.lat && coords.lng) {
          this.userCoords = coords;
          this.realDeviceGps = coords;
          setRealDeviceGps(coords, coords.source || 'gps');
          if (this.mapAdapter && this.mapAdapter.setUserLocationMarker) {
            this.mapAdapter.setUserLocationMarker(this.userCoords.lat, this.userCoords.lng);
          }
          // Center the map on live user location if user has not manually dragged or zoomed the map
          if (this.mapAdapter && !this.userInteractedWithMap) {
            const isMobile = window.innerWidth <= 768;
            const targetZoom = isMobile ? 6 : 7;
            if (this.mapAdapter.setView) {
              this.mapAdapter.setView(this.userCoords.lat, this.userCoords.lng, targetZoom);
            }
          }
        }
      })
      .catch((err) => {
        console.log('[App] Initial location background notice:', err.message);
      });
  }

  async locateUserAndCenter() {
    showToast(t('locating'), 'info', 2000);
    try {
      const coords = await getLiveUserLocation({ enableHighAccuracy: true, timeout: 10000, fallbackToCache: false });
      this.userCoords = coords;
      this.realDeviceGps = coords;
      setRealDeviceGps(coords, coords.source || 'gps');
      if (this.mapAdapter) {
        this.mapAdapter.setUserLocationMarker(coords.lat, coords.lng);
        this.mapAdapter.setView(coords.lat, coords.lng, 18, true);
        this.mapAdapter.resize();
      }

      // If adjust-on-map / confirm bar is currently active, immediately snap confirm marker and bar display
      const confirmBarEl = document.getElementById('map-confirm-bar');
      if (confirmBarEl && !confirmBarEl.classList.contains('hidden')) {
        if (this.mapAdapter) {
          this.mapAdapter.setConfirmMarkerPosition?.(coords.lat, coords.lng);
          this.mapAdapter.setAccuracyCircle?.(coords.lat, coords.lng, 20000);
        }
        const coordsDisplay = document.getElementById('confirm-bar-coords');
        if (coordsDisplay) {
          coordsDisplay.textContent = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
        }
        const accDisplay = document.getElementById('confirm-bar-acc');
        if (accDisplay) {
          accDisplay.textContent = 'सटीक पिन / Pin Placed';
          accDisplay.className = 'tabular-nums text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-900/80 text-red-200 border border-red-700/60';
        }
        const doneBtn = document.getElementById('btn-done-confirm-map');
        if (doneBtn) {
          doneBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      }

      showToast(t('locationFound'), 'success');
    } catch (err) {
      console.warn('[App] Locate user failed:', err);
      showToast(t('locationDenied'), 'warning');
    }
  }

  startMapLocationConfirm(formState = {}) {
    const { currentCoordinates, imageData, landmark } = formState;
    let realGps = getRealDeviceGps() || this.realDeviceGps || formState.baseGps || currentCoordinates || { lat: 18.5204, lng: 73.8567 };
    if (!this.realDeviceGps && realGps) {
      this.realDeviceGps = realGps;
      setRealDeviceGps(realGps);
    }

    // 1. Close / hide bottom sheet temporarily
    this.bottomSheet.close(false);

    // 2. Mark confirm mode
    document.body.classList.add('map-confirm-active');

    // 3. Show floating confirm bar
    const confirmBarEl = document.getElementById('map-confirm-bar');
    const coordsDisplay = document.getElementById('confirm-bar-coords');
    const accDisplay = document.getElementById('confirm-bar-acc');
    const doneBtn = document.getElementById('btn-done-confirm-map');
    const cancelBtn = document.getElementById('btn-cancel-confirm-map');

    if (confirmBarEl) {
      confirmBarEl.classList.remove('hidden');
    }

    // 4. Scroll to map section smoothly with header offset (never cut off map or hero)
    const mapSection = document.getElementById('map-section');
    if (mapSection) {
      const navHeader = document.querySelector('header');
      const headerOffset = navHeader ? navHeader.offsetHeight : 64;
      const elementPosition = mapSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }

    // Multi-stage resize triggers so all Google Maps tiles load 100% full without blank areas
    if (this.mapAdapter) {
      this.mapAdapter.resize();
      setTimeout(() => this.mapAdapter?.resize(), 150);
      setTimeout(() => this.mapAdapter?.resize(), 350);
      setTimeout(() => this.mapAdapter?.resize(), 600);
    }

    // 5. Target initial position
    let activeCoords = {
      lat: currentCoordinates?.lat || realGps?.lat || this.userCoords?.lat || 18.6298,
      lng: currentCoordinates?.lng || realGps?.lng || this.userCoords?.lng || 73.7997
    };

    const updateBarDisplay = (c) => {
      if (coordsDisplay && c) {
        coordsDisplay.textContent = `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
      }
      const distFromOrigin = (realGps && typeof realGps.lat === 'number') 
        ? haversineDistanceKm(realGps.lat, realGps.lng, c.lat, c.lng) 
        : 0;

      if (accDisplay) {
        if (distFromOrigin > 20) {
          accDisplay.textContent = `>20km (${Math.round(distFromOrigin)}km - सीमा से बाहर)`;
          accDisplay.className = 'tabular-nums text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/50';
          if (doneBtn) {
            doneBtn.classList.add('opacity-50', 'cursor-not-allowed');
          }
        } else {
          accDisplay.textContent = 'सटीक पिन / Pin Placed';
          accDisplay.className = 'tabular-nums text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-900/80 text-red-200 border border-red-700/60';
          if (doneBtn) {
            doneBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          }
        }
      }
    };

    updateBarDisplay(activeCoords);

    // 6. Place interactive draggable pin marker & 20km boundary circle on main map
    if (this.mapAdapter) {
      this.mapAdapter.setView(activeCoords.lat, activeCoords.lng, 18, true);
      if (realGps && typeof realGps.lat === 'number') {
        this.mapAdapter.setUserLocationMarker?.(realGps.lat, realGps.lng);
        this.mapAdapter.setAccuracyCircle?.(realGps.lat, realGps.lng, 20000);
      } else {
        this.mapAdapter.setAccuracyCircle?.(activeCoords.lat, activeCoords.lng, 20000);
      }

      let userHasMovedPin = false;

      // Background fresh live GPS query to ensure latest live position is rendered
      getLiveUserLocation({ enableHighAccuracy: true, timeout: 8000, fallbackToCache: false })
        .then((freshGps) => {
          if (freshGps && freshGps.lat && freshGps.lng) {
            realGps = freshGps;
            this.realDeviceGps = freshGps;
            this.userCoords = freshGps;
            setRealDeviceGps(freshGps, freshGps.source || 'gps');
            this.mapAdapter?.setUserLocationMarker?.(freshGps.lat, freshGps.lng);
            this.mapAdapter?.setAccuracyCircle?.(freshGps.lat, freshGps.lng, 20000);

            // If user has not dragged or moved the pin yet, snap pin and view to live GPS
            if (!userHasMovedPin) {
              activeCoords = { lat: freshGps.lat, lng: freshGps.lng };
              this.mapAdapter?.setConfirmMarkerPosition?.(freshGps.lat, freshGps.lng);
              this.mapAdapter?.setView?.(freshGps.lat, freshGps.lng, 18, true);
              updateBarDisplay(activeCoords);
            }
          }
        })
        .catch(() => {});

      this.mapAdapter.setConfirmLocationMarker?.(activeCoords.lat, activeCoords.lng, (newPos, isEnd) => {
        userHasMovedPin = true;
        const distFromOrigin = (realGps && typeof realGps.lat === 'number') 
          ? haversineDistanceKm(realGps.lat, realGps.lng, newPos.lat, newPos.lng) 
          : 0;

        if (isEnd && distFromOrigin > 20) {
          showToast(t('maxRadiusExceededAlert'), 'warning', 4000);
          if (realGps && typeof realGps.lat === 'number') {
            activeCoords = { lat: realGps.lat, lng: realGps.lng };
            this.mapAdapter?.setConfirmMarkerPosition?.(realGps.lat, realGps.lng);
            this.mapAdapter?.setView(realGps.lat, realGps.lng, 17, true);
          }
          updateBarDisplay(activeCoords);
          return;
        }

        activeCoords = { ...newPos };
        updateBarDisplay(activeCoords);
      });
    }

    // Cleanup & Exit Confirm Mode - Restore page scrolling
    const cleanupConfirmMode = () => {
      document.body.classList.remove('map-confirm-active');
      if (confirmBarEl) {
        confirmBarEl.classList.add('hidden');
      }
      this.mapAdapter?.clearConfirmLocationMarker?.();
      this.mapAdapter?.clearAccuracyCircle?.();
    };

    this.activeConfirmCleanup = cleanupConfirmMode;

    // Done / Confirm Button Click
    const handleDone = () => {
      this.activeConfirmCleanup = null;
      const pinPos = this.mapAdapter?.getConfirmLocationPosition?.() || activeCoords;
      const distFromOrigin = (realGps && typeof realGps.lat === 'number') 
        ? haversineDistanceKm(realGps.lat, realGps.lng, pinPos.lat, pinPos.lng) 
        : 0;

      if (distFromOrigin > 20) {
        showToast(t('maxRadiusExceededAlert'), 'warning', 4000);
        if (realGps && typeof realGps.lat === 'number') {
          activeCoords = { lat: realGps.lat, lng: realGps.lng };
          this.mapAdapter?.setConfirmMarkerPosition?.(realGps.lat, realGps.lng);
          this.mapAdapter?.setView(realGps.lat, realGps.lng, 17, true);
        }
        updateBarDisplay(activeCoords);
        return;
      }

      cleanupConfirmMode();
      doneBtn?.removeEventListener('click', handleDone);
      cancelBtn?.removeEventListener('click', handleCancel);

      const chosenCoords = {
        lat: pinPos.lat,
        lng: pinPos.lng,
        accuracy: 5,
        manuallyAdjusted: true,
        source: 'manual_map_pin'
      };

      this.userCoords = chosenCoords;
      setCachedUserLocation(chosenCoords);

      // Re-open report sheet in confirmed state with preserved image and landmark!
      this.openReportDrawer({
        currentCoordinates: chosenCoords,
        baseGps: realGps,
        isLocationConfirmed: true,
        imageData,
        landmark,
        autoTriggerPhoto: formState.autoTriggerPhoto || (window.innerWidth < 768 && !imageData)
      });
    };

    // Cancel Button Click
    const handleCancel = () => {
      this.activeConfirmCleanup = null;
      cleanupConfirmMode();
      doneBtn?.removeEventListener('click', handleDone);
      cancelBtn?.removeEventListener('click', handleCancel);

      if (this.isReportFullscreenFlow && !formState.isLocationConfirmed && !imageData) {
        this.exitMapFullscreen();
        this.isReportFullscreenFlow = false;
        return;
      }

      // Restore report sheet with previous state
      this.openReportDrawer({
        currentCoordinates,
        baseGps: realGps,
        isLocationConfirmed: formState.isLocationConfirmed,
        imageData,
        landmark
      });
    };

    doneBtn?.addEventListener('click', handleDone, { once: true });
    cancelBtn?.addEventListener('click', handleCancel, { once: true });
  }

  handleOpenReportClick() {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.isReportFullscreenFlow = true;
      this.enterMapFullscreen();
      // Mobile Step 1: Open Full Screen Map Location Confirmation first
      this.startMapLocationConfirm({ autoTriggerPhoto: true });
    } else {
      this.openReportDrawer();
    }
  }

  openReportDrawer(initialState = {}) {
    const quota = getActionQuota();
    if (quota.isLimitReached) {
      showToast(t('nextReportAvailable', { time: quota.waitFormatted || '24 घंटे' }), 'warning', 6000);
    }

    // Scroll map into view so map is full screen behind report bottom sheet
    const mapSection = document.getElementById('map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    this.bottomSheet.open('<div id="report-form-mount" class="h-full"></div>');

    // On Desktop / Tablet (>= 768px), shift map center so the pin stays visible in the remaining viewport
    if (window.innerWidth >= 768 && !this.isMapShiftedForReport) {
      this.isMapShiftedForReport = true;
      this.mapAdapter?.panBy?.(200, 0);
    }

    const mountPoint = document.getElementById('report-form-mount');
    if (!mountPoint) return;

    const mapCenter = this.mapAdapter?.getCenter ? this.mapAdapter.getCenter() : null;
    const coords = initialState.currentCoordinates || this.userCoords || getCachedUserLocation() || mapCenter;
    const baseGps = initialState.baseGps || this.userCoords || getCachedUserLocation() || coords;

    renderReportForm(mountPoint, {
      currentCoordinates: coords,
      baseGps,
      isLocationConfirmed: initialState.isLocationConfirmed,
      imageData: initialState.imageData,
      landmark: initialState.landmark,
      mapCenter,
      onStartMapPinConfirm: (formState) => {
        this.startMapLocationConfirm({ ...formState, baseGps });
      },
      onClose: () => this.bottomSheet.close(),
      onSubmit: async (formData) => {
        await this.handleReportSubmit(formData);
      }
    });

    // Auto-trigger photo capture if requested (e.g. on mobile after location confirm)
    if (initialState.autoTriggerPhoto && !initialState.imageData) {
      setTimeout(() => {
        const photoInput = document.getElementById('photo-input');
        if (photoInput && typeof photoInput.click === 'function') {
          photoInput.click();
        }
      }, 350);
    }
  }

  async handleReportSubmit(formData) {
    const quota = getActionQuota();
    if (quota.isLimitReached) {
      showToast(t('nextReportAvailable', { time: quota.waitFormatted || '24 घंटे' }), 'warning', 6000);
      this.bottomSheet.close();
      return;
    }

    const latitude = Number(formData.latitude ?? formData.coordinates?.lat ?? this.userCoords?.lat);
    const longitude = Number(formData.longitude ?? formData.coordinates?.lng ?? this.userCoords?.lng);

    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      showToast(t('gpsRequiredAlert'), 'error');
      return;
    }

    if (!formData.imageData && !formData.imageUrl) {
      showToast(t('photoRequiredAlert'), 'warning');
      return;
    }

    // 20km radius spam defense check against live hardware/device GPS
    const realGps = getRealDeviceGps() || this.realDeviceGps;
    if (realGps && typeof realGps.lat === 'number' && typeof realGps.lng === 'number') {
      const distKm = haversineDistanceKm(realGps.lat, realGps.lng, latitude, longitude);
      if (distKm > 20) {
        showToast(t('maxRadiusExceededAlert'), 'error', 5000);
        return;
      }
    }

    this.userCoords = { lat: latitude, lng: longitude };
    setCachedUserLocation(this.userCoords);

    const isOnline = navigator.onLine;

    if (!isOnline) {
      const offlineImgUrl = formData.imageData?.mainDataUrl || null;
      const offlineThumbUrl = formData.imageData?.thumbDataUrl || null;
      await saveReportOffline({
        latitude,
        longitude,
        landmark: formData.landmark,
        imageUrl: offlineImgUrl,
        thumbnailUrl: offlineThumbUrl,
        formOpenTime: formData.formOpenTime
      });
      showToast(t('offlineAlert'), 'warning', 6000);
      this.bottomSheet.close();
      return;
    }

    try {
      let imageUrl = null;
      let thumbnailUrl = null;

      if (formData.imageData && formData.imageData.mainBlob) {
        showToast(t('photoCompressing'), 'info', 2000);
        try {
          imageUrl = await uploadPotholePhoto(null, formData.imageData.mainBlob, false);
          thumbnailUrl = await uploadPotholePhoto(null, formData.imageData.thumbnailBlob, true);
        } catch (uploadErr) {
          console.warn('Image upload notice:', uploadErr);
        }

        if (!imageUrl && formData.imageData.mainDataUrl) {
          imageUrl = formData.imageData.mainDataUrl;
        }
        if (!thumbnailUrl && formData.imageData.thumbDataUrl) {
          thumbnailUrl = formData.imageData.thumbDataUrl;
        }
      }

      const reportPayload = {
        latitude,
        longitude,
        landmark: formData.landmark,
        imageUrl,
        thumbnailUrl,
        website_hp: formData.website_hp,
        formOpenTime: formData.formOpenTime
      };

      const result = await callSubmitReport(reportPayload);

      if (result.deduplicated) {
        showToast(result.message || t('dedupedNotice'), 'warning', 6000);
      } else {
        showToast(result.message || t('submitSuccess'), 'success', 5000);
      }

      const nearestCity = getNearestIndianCity(latitude, longitude);
      let targetPin = null;

      if (result.deduplicated && result.pinId) {
        targetPin = this.currentPins.find((p) => p.id === result.pinId);
        if (targetPin) {
          targetPin.reportCount = (targetPin.reportCount || 1) + 1;
          if (imageUrl && targetPin.images) {
            targetPin.images.unshift(imageUrl);
            targetPin.photoStatus = 'pending';
            targetPin.photoApproved = false;
          }
        }
      } else if (result.pinId) {
        targetPin = {
          id: result.pinId,
          latitude,
          longitude,
          landmark: formData.landmark || t('defaultLandmark'),
          cityNameHindi: result.cityNameHindi || nearestCity.nameHindi,
          cityNameEnglish: result.cityNameEnglish || nearestCity.nameEnglish,
          imageUrl,
          thumbnailUrl,
          images: imageUrl ? [imageUrl] : [],
          photoStatus: imageUrl ? 'pending' : 'none',
          photoApproved: false,
          reportCount: 1,
          upvotes: 0,
          status: 'active',
          createdAt: new Date()
        };
        this.currentPins.unshift(targetPin);
      }

      // Re-render pins on map & center on new report
      if (this.mapAdapter) {
        this.mapAdapter.renderPins(this.currentPins, (pin) => openPinDetailModal(pin));
        this.mapAdapter.setView(latitude, longitude, 17);
      }

      // Close bottom sheet
      this.bottomSheet.close();

      // Trigger celebratory animation
      if (window.__khaddaTriggerPartyExplosion) {
        window.__khaddaTriggerPartyExplosion();
      }

      // Open Thank You feedback modal popup
      openThankYouModal({
        landmark: formData.landmark || targetPin?.landmark || '',
        cityName: targetPin?.cityNameEnglish || targetPin?.cityNameHindi || nearestCity?.nameEnglish || '',
        isDeduplicated: Boolean(result.deduplicated),
        onClose: () => {
          if (this.panelManager) {
            this.panelManager.close();
          }
          const mapSec = document.getElementById('map-section');
          if (mapSec) {
            mapSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    } catch (err) {
      console.error('[App] Report submission error:', err);
      showToast(err.message || t('submitError'), 'error');
    }
  }

  setupOfflineSync() {
    const offlineBanner = document.getElementById('offline-banner');

    const updateOnlineStatus = async () => {
      if (!navigator.onLine) {
        if (offlineBanner) {
          const span = offlineBanner.querySelector('span');
          if (span) span.innerText = t('offlineBanner');
          offlineBanner.classList.remove('hidden');
        }
      } else {
        if (offlineBanner) offlineBanner.classList.add('hidden');
        const pending = await getOfflineReports();
        if (pending.length > 0) {
          showToast(t('offlineSyncing', { count: pending.length }), 'info');
          for (const item of pending) {
            try {
              await callSubmitReport({
                latitude: item.latitude,
                longitude: item.longitude,
                landmark: item.landmark,
                imageUrl: item.imageUrl || null,
                thumbnailUrl: item.thumbnailUrl || null,
                website_hp: '',
                formOpenTime: item.formOpenTime || (Date.now() - 5000)
              });
              await removeOfflineReport(item.id);
            } catch (syncErr) {
              console.warn('Sync item failed:', syncErr);
            }
          }
          showToast(t('offlineSyncSuccess'), 'success');
        }
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  isMapFullscreenActive() {
    const card = document.getElementById('map-card-container');
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      card?.classList.contains('is-fullscreen')
    );
  }

  enterMapFullscreen() {
    const card = document.getElementById('map-card-container');
    if (!card || this.isMapFullscreenActive()) return;

    if (card.requestFullscreen) {
      card.requestFullscreen().catch(() => {
        card.classList.add('is-fullscreen');
        this.updateFullscreenUI(true);
      });
    } else if (card.webkitRequestFullscreen) {
      card.webkitRequestFullscreen();
    } else if (card.mozRequestFullScreen) {
      card.mozRequestFullScreen();
    } else if (card.msRequestFullscreen) {
      card.msRequestFullscreen();
    } else {
      card.classList.add('is-fullscreen');
      this.updateFullscreenUI(true);
    }

    if (this.mapAdapter && this.mapAdapter.resize) {
      setTimeout(() => this.mapAdapter.resize(), 120);
      setTimeout(() => this.mapAdapter.resize(), 350);
    }
  }

  exitMapFullscreen() {
    const card = document.getElementById('map-card-container');
    if (!card || !this.isMapFullscreenActive()) return;

    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    card.classList.remove('is-fullscreen');
    this.updateFullscreenUI(false);

    if (this.mapAdapter && this.mapAdapter.resize) {
      setTimeout(() => this.mapAdapter.resize(), 120);
      setTimeout(() => this.mapAdapter.resize(), 350);
    }
  }

  toggleMapFullscreen() {
    if (this.isMapFullscreenActive()) {
      this.exitMapFullscreen();
    } else {
      this.enterMapFullscreen();
    }
  }

  updateFullscreenUI(isFullscreen) {
    const btn = document.getElementById('btn-fullscreen-toggle');
    const enterIcon = document.getElementById('icon-enter-fullscreen');
    const exitIcon = document.getElementById('icon-exit-fullscreen');
    const topExitBtn = document.getElementById('btn-map-fullscreen-exit');

    if (isFullscreen) {
      enterIcon?.classList.add('hidden');
      exitIcon?.classList.remove('hidden');
      if (topExitBtn) {
        topExitBtn.classList.remove('hidden');
        topExitBtn.classList.add('flex');
      }
      if (btn) {
        btn.title = t('exitFullscreenTooltip');
        btn.setAttribute('aria-label', t('exitFullscreenTooltip'));
      }
    } else {
      enterIcon?.classList.remove('hidden');
      exitIcon?.classList.add('hidden');
      if (topExitBtn) {
        topExitBtn.classList.add('hidden');
        topExitBtn.classList.remove('flex');
      }
      if (btn) {
        btn.title = t('fullscreenTooltip');
        btn.setAttribute('aria-label', t('fullscreenTooltip'));
      }
    }
  }
}

// Bootstrap Application
const app = new KhaddaApp();
app.init().catch((e) => console.error('App init failed:', e));

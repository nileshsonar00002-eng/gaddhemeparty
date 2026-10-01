import './style.css';
import { LeafletAdapter } from './map/LeafletAdapter';
import { GoogleMapsAdapter } from './map/GoogleMapsAdapter';
import { createNavbar } from './components/Navbar';
import { renderStatsStrip } from './components/StatsStrip';
import { BottomSheet } from './components/BottomSheet';
import { LeaderboardSection } from './components/LeaderboardSheet';
import { renderReportForm } from './components/ReportForm';
import { openPinDetailModal } from './components/PinDetailModal';
import { openChaiTipModal } from './components/ChaiTipModal';
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
import { router } from './utils/router';
import { getLiveUserLocation, getCachedUserLocation, setCachedUserLocation, getRealDeviceGps, setRealDeviceGps } from './utils/geo';

// Real Live Data Store
class KhaddaApp {
  constructor() {
    this.mapAdapter = null;
    this.bottomSheet = new BottomSheet();
    this.panelManager = null;
    this.leaderboardSection = new LeaderboardSection('leaderboard-mount');
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

    // 10.5. Initialize Animated Pothole Cartoon Strip (Above Footer)
    initPotholeCartoonAnimation('pothole-animation-mount');
    window.addEventListener('languageChanged', () => {
      initPotholeCartoonAnimation('pothole-animation-mount');
      this.renderHeaderAndStats();
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
              this.mapAdapter.cinematicFlyIn();
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
        this.mapAdapter.setView(pin.latitude, pin.longitude, 17);
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
          this.mapAdapter.setView(pin.latitude, pin.longitude, 17);
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
    const saved = localStorage.getItem('khadda_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.mapTheme = saved || (prefersDark ? 'dark' : 'light');
    this.applyGlobalTheme(this.mapTheme, false);

    // Auto-listen to system color scheme changes if user hasn't explicitly set a preference
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('khadda_theme')) {
          this.applyGlobalTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  applyGlobalTheme(theme, persist = true) {
    this.mapTheme = theme;
    if (persist) {
      localStorage.setItem('khadda_theme', theme);
    }

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#080C14' : '#F8FAFC');
    }

    if (this.mapAdapter && this.mapAdapter.applyTheme) {
      this.mapAdapter.applyTheme(theme);
    }

    if (this.nightGlobe && this.nightGlobe.applyTheme) {
      this.nightGlobe.applyTheme(theme);
    }

    if (this.starfield && this.starfield.applyTheme) {
      this.starfield.applyTheme(theme);
    }

    this.renderHeaderAndStats();
  }

  renderHeaderAndStats() {
    createNavbar({
      onChaiTipClick: () => openChaiTipModal(),
      onToggleMapTheme: () => this.toggleMapTheme(),
      currentTheme: this.mapTheme,
      activeNav: this.activeNav
    });

    const statsContainer = document.getElementById('stats-strip-container');
    if (statsContainer) {
      renderStatsStrip(statsContainer, this.statsData);
    }
  }

  toggleMapTheme() {
    const nextTheme = this.mapTheme === 'dark' ? 'light' : 'dark';
    this.applyGlobalTheme(nextTheme, true);
  }

  setupEventListeners() {
    // Open Bottom Sheet Report Form
    const openReportBtn = document.getElementById('btn-open-report');
    openReportBtn?.addEventListener('click', () => {
      this.openReportDrawer();
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
      this.openReportDrawer();
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

    // Listen to native and ESC fullscreen changes
    const onFullscreenChange = () => {
      const isNativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      const card = document.getElementById('map-card-container');
      const isCssFs = card?.classList.contains('is-fullscreen');
      this.updateFullscreenUI(isNativeFs || isCssFs);
      if (this.mapAdapter && this.mapAdapter.resize) {
        setTimeout(() => this.mapAdapter.resize(), 100);
        setTimeout(() => this.mapAdapter.resize(), 300);
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    // Global Pin Navigation Handlers
    window.__khaddaFlyToPin = (pinId) => {
      const pin = this.currentPins.find((p) => p.id === pinId) ||
                  (this.panelManager?.leaderboardData?.heroPotholeOfWeek?.id === pinId ? this.panelManager.leaderboardData.heroPotholeOfWeek : null);
      if (pin) {
        const mapEl = document.getElementById('map-section');
        if (mapEl) {
          mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        this.mapAdapter.setView(pin.latitude, pin.longitude, 17);
        setTimeout(() => {
          openPinDetailModal(pin);
        }, 400);
      }
    };

    window.__khaddaOpenPinModal = (pin) => {
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
        }
      })
      .catch((err) => {
        console.log('[App] Initial location background notice:', err.message);
      });
  }

  async locateUserAndCenter() {
    showToast(t('locating'), 'info', 2000);
    try {
      const coords = await getLiveUserLocation({ enableHighAccuracy: true, timeout: 12000, fallbackToCache: false });
      this.userCoords = coords;
      this.realDeviceGps = coords;
      setRealDeviceGps(coords, coords.source || 'gps');
      if (this.mapAdapter) {
        this.mapAdapter.setUserLocationMarker(coords.lat, coords.lng);
        this.mapAdapter.setView(coords.lat, coords.lng, 16);
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

    // 2. Lock page background scrolling so only the map section is visible & interactive
    document.body.classList.add('map-confirm-active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // 3. Show floating confirm bar
    const confirmBarEl = document.getElementById('map-confirm-bar');
    const coordsDisplay = document.getElementById('confirm-bar-coords');
    const accDisplay = document.getElementById('confirm-bar-acc');
    const doneBtn = document.getElementById('btn-done-confirm-map');
    const cancelBtn = document.getElementById('btn-cancel-confirm-map');

    if (confirmBarEl) {
      confirmBarEl.classList.remove('hidden');
    }

    // 4. Scroll to map section smoothly
    const mapSection = document.getElementById('map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      this.mapAdapter.setView(activeCoords.lat, activeCoords.lng, 18);
      if (realGps && typeof realGps.lat === 'number') {
        this.mapAdapter.setUserLocationMarker?.(realGps.lat, realGps.lng);
        this.mapAdapter.setAccuracyCircle?.(realGps.lat, realGps.lng, 20000);
      } else {
        this.mapAdapter.setAccuracyCircle?.(activeCoords.lat, activeCoords.lng, 20000);
      }

      // Background fresh live GPS query to ensure latest live position is rendered
      getLiveUserLocation({ enableHighAccuracy: true, timeout: 5000, fallbackToCache: true })
        .then((freshGps) => {
          if (freshGps && freshGps.lat && freshGps.lng) {
            realGps = freshGps;
            this.realDeviceGps = freshGps;
            setRealDeviceGps(freshGps, freshGps.source || 'gps');
            this.mapAdapter?.setUserLocationMarker?.(freshGps.lat, freshGps.lng);
            this.mapAdapter?.setAccuracyCircle?.(freshGps.lat, freshGps.lng, 20000);
          }
        })
        .catch(() => {});

      this.mapAdapter.setConfirmLocationMarker?.(activeCoords.lat, activeCoords.lng, (newPos, isEnd) => {
        const distFromOrigin = (realGps && typeof realGps.lat === 'number') 
          ? haversineDistanceKm(realGps.lat, realGps.lng, newPos.lat, newPos.lng) 
          : 0;

        if (isEnd && distFromOrigin > 20) {
          showToast(t('maxRadiusExceededAlert'), 'warning', 4000);
          if (realGps && typeof realGps.lat === 'number') {
            activeCoords = { lat: realGps.lat, lng: realGps.lng };
            this.mapAdapter?.setConfirmMarkerPosition?.(realGps.lat, realGps.lng);
            this.mapAdapter?.setView(realGps.lat, realGps.lng, 17);
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
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (confirmBarEl) {
        confirmBarEl.classList.add('hidden');
      }
      this.mapAdapter?.clearConfirmLocationMarker?.();
      this.mapAdapter?.clearAccuracyCircle?.();
    };

    // Done / Confirm Button Click
    const handleDone = () => {
      const pinPos = this.mapAdapter?.getConfirmLocationPosition?.() || activeCoords;
      const distFromOrigin = (realGps && typeof realGps.lat === 'number') 
        ? haversineDistanceKm(realGps.lat, realGps.lng, pinPos.lat, pinPos.lng) 
        : 0;

      if (distFromOrigin > 20) {
        showToast(t('maxRadiusExceededAlert'), 'warning', 4000);
        if (realGps && typeof realGps.lat === 'number') {
          activeCoords = { lat: realGps.lat, lng: realGps.lng };
          this.mapAdapter?.setConfirmMarkerPosition?.(realGps.lat, realGps.lng);
          this.mapAdapter?.setView(realGps.lat, realGps.lng, 17);
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
        landmark
      });
    };

    // Cancel Button Click
    const handleCancel = () => {
      cleanupConfirmMode();
      doneBtn?.removeEventListener('click', handleDone);
      cancelBtn?.removeEventListener('click', handleCancel);

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

  openReportDrawer(initialState = {}) {
    const quota = getActionQuota();
    if (quota.isLimitReached) {
      showToast(t('nextReportAvailable', { time: quota.waitFormatted || '24 घंटे' }), 'warning', 6000);
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

  toggleMapFullscreen() {
    const card = document.getElementById('map-card-container');
    if (!card) return;

    const isCurrentlyFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      card.classList.contains('is-fullscreen')
    );

    if (isCurrentlyFs) {
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
    } else {
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
    }

    if (this.mapAdapter && this.mapAdapter.resize) {
      setTimeout(() => this.mapAdapter.resize(), 120);
      setTimeout(() => this.mapAdapter.resize(), 350);
    }
  }

  updateFullscreenUI(isFullscreen) {
    const btn = document.getElementById('btn-fullscreen-toggle');
    const enterIcon = document.getElementById('icon-enter-fullscreen');
    const exitIcon = document.getElementById('icon-exit-fullscreen');

    if (isFullscreen) {
      enterIcon?.classList.add('hidden');
      exitIcon?.classList.remove('hidden');
      if (btn) {
        btn.title = t('exitFullscreenTooltip');
        btn.setAttribute('aria-label', t('exitFullscreenTooltip'));
      }
    } else {
      enterIcon?.classList.remove('hidden');
      exitIcon?.classList.add('hidden');
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

import createGlobe from 'cobe';
import { isLowEndDevice, prefersReducedMotion, getEffectiveDpr } from '../utils/deviceTier';

// Prominent Indian City Coordinates for Night City Light Dots
const INDIAN_CITY_MARKERS = [
  { location: [28.6139, 77.2090], size: 0.08 }, // New Delhi (Bright)
  { location: [19.0760, 72.8777], size: 0.075 }, // Mumbai
  { location: [12.9716, 77.5946], size: 0.07 }, // Bengaluru
  { location: [17.3850, 78.4867], size: 0.065 }, // Hyderabad
  { location: [22.5726, 88.3639], size: 0.065 }, // Kolkata
  { location: [13.0827, 80.2707], size: 0.065 }, // Chennai
  { location: [18.5204, 73.8567], size: 0.06 },  // Pune
  { location: [23.0225, 72.5714], size: 0.06 },  // Ahmedabad
  { location: [26.8467, 80.9462], size: 0.055 }, // Lucknow
  { location: [26.9124, 75.7873], size: 0.055 }, // Jaipur
  { location: [21.1458, 79.0882], size: 0.05 },  // Nagpur
  { location: [25.5941, 85.1376], size: 0.05 },  // Patna
  { location: [30.7333, 76.7794], size: 0.05 }   // Chandigarh
];

export class NightGlobe {
  constructor(canvasId = 'globe-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.globe = null;
    this.theme = document.documentElement.getAttribute('data-theme') || 'dark';
    this.phi = 0.55; // Centered facing India
    this.theta = 0.32; // Slight downward tilt to showcase South Asia
    this.pointerInteracting = null;
    this.pointerInteractionMovement = 0;
    this.isVisible = true;
    this.isLowEnd = isLowEndDevice();
    this.reducedMotion = prefersReducedMotion();
    this.init();
  }

  init() {
    if (!this.canvas) return;

    // Budget Android fallback: hide canvas & display static cosmic halo
    if (this.isLowEnd) {
      this.renderFallback();
      return;
    }

    try {
      this.createGlobe();
      this.setupInteraction();
      this.setupVisibilityObserver();
    } catch (e) {
      console.warn('[NightGlobe] WebGL init fallback:', e);
      this.renderFallback();
    }
  }

  applyTheme(theme = 'dark') {
    if (this.theme === theme) return;
    this.theme = theme;
    if (this.globe) {
      this.destroy();
      this.createGlobe();
    }
  }

  renderFallback() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div class="w-full h-full flex items-center justify-center relative">
          <div class="w-full h-full rounded-full bg-gradient-to-tr from-amber-500/25 via-orange-500/15 to-rose-500/20 blur-2xl animate-pulse"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-amber-500/40 bg-[var(--bg-surface)] shadow-[0_0_50px_rgba(245,158,11,0.25)] flex items-center justify-center transition-transform hover:scale-105">
              <span class="text-2xl sm:text-3xl font-heading font-black italic tracking-wider bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 bg-clip-text text-transparent select-none drop-shadow">#gddp</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  createGlobe() {
    const width = this.canvas.offsetWidth || 340;
    const dpr = getEffectiveDpr();
    const isDark = this.theme !== 'light';

    this.globe = createGlobe(this.canvas, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: width * dpr,
      phi: this.phi,
      theta: this.theta,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 1.2 : 0.8,
      mapSamples: 16000,
      mapBrightness: isDark ? 6 : 4,
      baseColor: isDark ? [0.05, 0.08, 0.14] : [0.92, 0.94, 0.98],
      markerColor: [0.96, 0.62, 0.04], // Amber #F59E0B city lights
      glowColor: isDark ? [0.12, 0.22, 0.38] : [0.85, 0.88, 0.95],
      markers: INDIAN_CITY_MARKERS,
      onRender: (state) => {
        if (!this.pointerInteracting && !this.reducedMotion && this.isVisible) {
          this.phi += 0.003;
        }
        state.phi = this.phi + this.pointerInteractionMovement;
        state.theta = this.theta;
        state.width = (this.canvas.offsetWidth || 340) * dpr;
        state.height = (this.canvas.offsetWidth || 340) * dpr;
      }
    });

    setTimeout(() => {
      if (this.canvas) this.canvas.style.opacity = '1';
    }, 100);
  }

  setupInteraction() {
    if (!this.canvas) return;

    this.canvas.addEventListener('pointerdown', (e) => {
      this.pointerInteracting = e.clientX - this.pointerInteractionMovement;
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('pointerup', () => {
      if (this.pointerInteracting !== null) {
        this.phi += this.pointerInteractionMovement;
        this.pointerInteractionMovement = 0;
        this.pointerInteracting = null;
        if (this.canvas) this.canvas.style.cursor = 'grab';
      }
    });

    window.addEventListener('pointerout', (e) => {
      if (!e.relatedTarget && this.pointerInteracting !== null) {
        this.phi += this.pointerInteractionMovement;
        this.pointerInteractionMovement = 0;
        this.pointerInteracting = null;
        if (this.canvas) this.canvas.style.cursor = 'grab';
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (this.pointerInteracting !== null) {
        const delta = e.clientX - this.pointerInteracting;
        this.pointerInteractionMovement = delta * 0.005;
      }
    });
  }

  setupVisibilityObserver() {
    if ('IntersectionObserver' in window && this.canvas) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.isVisible = entry.isIntersecting;
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(this.canvas);
    }

    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
    });
  }

  destroy() {
    if (this.globe) {
      this.globe.destroy();
      this.globe = null;
    }
  }
}

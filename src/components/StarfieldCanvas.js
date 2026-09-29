import { isLowEndDevice, prefersReducedMotion, getEffectiveDpr } from '../utils/deviceTier';

export class StarfieldCanvas {
  constructor(canvasId = 'starfield-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.animationFrameId = null;
    this.isVisible = true;
    this.theme = document.documentElement.getAttribute('data-theme') || 'dark';
    this.numStars = isLowEndDevice() ? 40 : 85;
    this.reducedMotion = prefersReducedMotion();
    this.init();
  }

  init() {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    this.createStars();
    this.setupListeners();
    this.start();
  }

  applyTheme(theme = 'dark') {
    if (this.theme === theme) return;
    this.theme = theme;
    this.createStars();
    if (this.canvas) {
      this.canvas.style.opacity = theme === 'light' ? '0.45' : '0.85';
    }
  }

  resize() {
    if (!this.canvas) return;
    const dpr = getEffectiveDpr();
    const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : { width: window.innerWidth, height: 600 };
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  createStars() {
    this.stars = [];
    const isLight = this.theme === 'light';
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.2 + 0.3,
        baseAlpha: isLight ? Math.random() * 0.4 + 0.15 : Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        // Color tint: slight warm amber / icy blue / dark-slate or pure white
        color: isLight
          ? (i % 4 === 0 ? '#D97706' : (i % 6 === 0 ? '#0284C7' : '#475569'))
          : (i % 5 === 0 ? '#FBBF24' : (i % 7 === 0 ? '#60A5FA' : '#FFFFFF'))
      });
    }
  }

  setupListeners() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createStars();
    });

    // Pause when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else if (this.isVisible) {
        this.start();
      }
    });

    // IntersectionObserver to pause when hero is off-screen
    if ('IntersectionObserver' in window && this.canvas.parentElement) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.isVisible = entry.isIntersecting;
            if (this.isVisible) {
              this.start();
            } else {
              this.stop();
            }
          });
        },
        { threshold: 0.05 }
      );
      observer.observe(this.canvas.parentElement);
    }
  }

  start() {
    if (this.animationFrameId || !this.ctx) return;
    let time = 0;
    const animate = () => {
      time += 0.03;
      this.draw(time);
      if (!this.reducedMotion) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };
    if (this.reducedMotion) {
      this.draw(0);
    } else {
      this.animationFrameId = requestAnimationFrame(animate);
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  draw(time) {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const alpha = Math.max(0.1, Math.min(1, star.baseAlpha + Math.sin(time * star.twinkleSpeed * 10 + star.twinkleOffset) * 0.35));

      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = star.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.shadowBlur = star.radius > 1 ? 4 : 0;
      this.ctx.shadowColor = star.color;
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }
}

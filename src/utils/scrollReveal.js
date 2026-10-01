/**
 * Lightweight Scroll Reveal & Parallax Engine
 * - Single IntersectionObserver instance (< 2.5 KB)
 * - Animate ONLY transform and opacity (zero layout shifts)
 * - Progressive enhancement (supports .js fallback, pageshow, and language switches)
 * - rAF-throttled parallax for mascot and scroll-progress bar
 */

import { prefersReducedMotion } from './deviceTier';

class ScrollRevealEngine {
  constructor() {
    this.observer = null;
    this.hasInit = false;
    this.rafId = null;
    this.isParallaxActive = false;
    this.mascotEl = null;
    this.progressBarEl = null;
    this.heroSectionEl = null;
  }

  init() {
    // 1. Tag documentElement with 'js' class for progressive enhancement
    document.documentElement.classList.add('js');

    if (this.hasInit) {
      this.refresh();
      return;
    }
    this.hasInit = true;

    // 2. Reduced motion check
    if (prefersReducedMotion()) {
      this.revealAllImmediately();
      return;
    }

    // 3. Create single IntersectionObserver
    const isMobile = window.innerWidth < 768;
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.revealElement(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: isMobile ? '0px 0px -5% 0px' : '0px 0px -10% 0px'
      }
    );

    // 4. Observe all revealable targets
    this.observeElements();

    // 5. Setup Scroll Progress Bar & Parallax
    this.setupScrollProgressAndParallax();

    // 6. Handle back/forward cache and window resize
    window.addEventListener('pageshow', () => this.refresh());
    window.addEventListener('languageChanged', () => {
      // Ensure newly rendered text is not hidden
      this.refresh(true);
    });
  }

  observeElements() {
    if (!this.observer) return;

    // Observe direct reveal targets
    const targets = document.querySelectorAll('[data-reveal]:not(.revealed)');
    targets.forEach((el) => {
      // If already in viewport on load, reveal immediately
      if (this.isInInitialViewport(el)) {
        this.revealElement(el, true);
      } else {
        this.observer.observe(el);
      }
    });

    // Observe stagger containers
    const staggerContainers = document.querySelectorAll('[data-stagger]:not(.revealed)');
    staggerContainers.forEach((container) => {
      if (this.isInInitialViewport(container)) {
        this.revealStaggerContainer(container, true);
      } else {
        this.observer.observe(container);
      }
    });
  }

  isInInitialViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top <= windowHeight * 0.95 && rect.bottom >= 0;
  }

  revealElement(el, immediate = false) {
    if (el.classList.contains('revealed')) return;

    // Check if it's a stagger container
    if (el.hasAttribute('data-stagger')) {
      this.revealStaggerContainer(el, immediate);
      return;
    }

    const delay = immediate ? 0 : parseInt(el.getAttribute('data-delay') || '0', 10);

    if (delay > 0) {
      setTimeout(() => {
        this.applyReveal(el);
      }, delay);
    } else {
      this.applyReveal(el);
    }
  }

  revealStaggerContainer(container, immediate = false) {
    container.classList.add('revealed');
    const children = container.querySelectorAll('[data-stagger-item]:not(.revealed)');
    const stepDelay = parseInt(container.getAttribute('data-stagger') || '100', 10);
    const baseDelay = immediate ? 0 : parseInt(container.getAttribute('data-delay') || '0', 10);

    children.forEach((child, index) => {
      const delay = baseDelay + index * stepDelay;
      setTimeout(() => {
        this.applyReveal(child);
      }, delay);
    });
  }

  applyReveal(el) {
    if (el.classList.contains('revealed')) return;

    el.classList.add('will-animate-reveal');
    el.classList.add('revealed');

    // Clean up will-change on transitionend
    const onEnd = (e) => {
      if (e.target === el) {
        el.classList.remove('will-animate-reveal');
        el.removeEventListener('transitionend', onEnd);
      }
    };
    el.addEventListener('transitionend', onEnd, { once: true });
    // Safety timeout in case transitionend does not fire
    setTimeout(() => {
      el.classList.remove('will-animate-reveal');
    }, 800);
  }

  revealAllImmediately() {
    document.querySelectorAll('[data-reveal], [data-stagger], [data-stagger-item]').forEach((el) => {
      el.classList.add('revealed');
    });
  }

  refresh(keepVisible = false) {
    if (prefersReducedMotion() || keepVisible) {
      this.revealAllImmediately();
    }
    this.observeElements();
  }

  setupScrollProgressAndParallax() {
    this.mascotEl = document.querySelector('.hero-mascot-parallax');
    this.progressBarEl = document.getElementById('scroll-progress-bar');
    this.heroSectionEl = document.getElementById('hero-section');

    const updateScrollEffects = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      // 1. Update Scroll Progress Bar (0% to 100%)
      if (this.progressBarEl && docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
        this.progressBarEl.style.width = `${progress.toFixed(1)}%`;
      }

      // 2. Mascot Parallax (Active only while hero is in viewport, ±16px max)
      if (this.mascotEl && this.heroSectionEl && scrollY < window.innerHeight * 1.2) {
        const parallaxY = (scrollY * 0.08).toFixed(1);
        this.mascotEl.style.transform = `translate3d(0, ${parallaxY}px, 0)`;
      }

      this.rafId = null;
    };

    window.addEventListener('scroll', () => {
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(updateScrollEffects);
      }
    }, { passive: true });

    // Initial run
    updateScrollEffects();
  }
}

export const scrollReveal = new ScrollRevealEngine();

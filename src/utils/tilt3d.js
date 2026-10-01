/**
 * Subtle 3D Pointer Tilt Engine
 * - Active on desktop with fine pointer only
 * - Perspective(900px), max tilt 4-5 degrees
 * - rAF-throttled, zero layout shifts
 * - Respects prefers-reduced-motion and touch devices
 */

import { prefersReducedMotion } from './deviceTier';

class Tilt3DEngine {
  constructor() {
    this.elements = [];
    this.isSupported = false;
  }

  init() {
    if (typeof window === 'undefined') return;

    // Check device capabilities
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!hasFinePointer || prefersReducedMotion()) {
      return;
    }

    this.isSupported = true;
    this.bindElements();
  }

  bindElements() {
    const targets = document.querySelectorAll('[data-tilt], .tilt-card');
    targets.forEach((el) => {
      if (el._hasTiltListener) return;
      el._hasTiltListener = true;

      let rafId = null;

      const onMouseMove = (e) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = (((y - centerY) / centerY) * -4).toFixed(2);
          const rotateY = (((x - centerX) / centerX) * 4).toFixed(2);

          el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });
      };

      const onMouseLeave = () => {
        if (rafId) cancelAnimationFrame(rafId);
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
      };

      el.addEventListener('mousemove', onMouseMove, { passive: true });
      el.addEventListener('mouseleave', onMouseLeave, { passive: true });
    });
  }

  refresh() {
    if (this.isSupported) {
      this.bindElements();
    }
  }
}

export const tilt3d = new Tilt3DEngine();

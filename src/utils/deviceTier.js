// Device Tier and Accessibility Detection Utility

export function isLowEndDevice() {
  if (typeof window === 'undefined') return false;
  
  // 1. Check CPU cores
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 4) return true;

  // 2. Check Device Memory (RAM in GB) if available
  const memory = navigator.deviceMemory || 4;
  if (memory <= 2) return true;

  // 3. Check Data Saver mode
  if (navigator.connection && navigator.connection.saveData) return true;

  // 4. Check Mobile GPU heuristics if userAgent matches low-tier Android
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid && cores <= 6) return true;

  return false;
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getEffectiveDpr() {
  if (typeof window === 'undefined') return 1;
  if (isLowEndDevice()) {
    return Math.min(window.devicePixelRatio || 1, 1.5);
  }
  return Math.min(window.devicePixelRatio || 1, 2);
}

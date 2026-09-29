/**
 * Lightweight Client-Side Hash Router for Slide-Over Panels
 * Supported routes:
 *   - /#/leaderboard
 *   - /#/mission
 *   - /#/how-it-works (or /#/how)
 *   - /#/about
 *   - /#/terms
 *   - /#/map or empty (closes panels)
 */

class Router {
  constructor() {
    this.currentRoute = '';
    this.onRouteChange = null;

    window.addEventListener('hashchange', () => this.handleHashChange());
    window.addEventListener('popstate', () => this.handleHashChange());
  }

  init(onRouteChange) {
    this.onRouteChange = onRouteChange;
    // If user refreshes on a panel route, reset hash to clean map URL
    const raw = window.location.hash || '';
    if (raw && !raw.includes('pin=')) {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
    // Process initial route on page load (e.g. #pin=XYZ)
    this.handleHashChange();
  }

  getRouteFromHash() {
    const raw = window.location.hash || '';
    if (!raw.startsWith('#/')) {
      if (raw.startsWith('#pin=')) {
        return { type: 'pin', id: raw.replace('#pin=', '') };
      }
      return { type: 'panel', name: '' };
    }

    let clean = raw.replace(/^#\//, '').trim().toLowerCase();
    if (clean === 'how-it-works') clean = 'how';
    if (clean === 'terms-of-use') clean = 'terms';
    if (clean === 'about-us') clean = 'about';

    if (clean.startsWith('pin=')) {
      return { type: 'pin', id: clean.replace('pin=', '') };
    }

    const validPanels = ['leaderboard', 'mission', 'how', 'about', 'terms'];
    if (validPanels.includes(clean)) {
      return { type: 'panel', name: clean };
    }

    return { type: 'panel', name: '' };
  }

  handleHashChange() {
    const route = this.getRouteFromHash();
    this.currentRoute = route.name || '';
    if (typeof this.onRouteChange === 'function') {
      this.onRouteChange(route);
    }
  }

  navigate(panelId) {
    let targetHash = '';
    if (panelId && panelId !== 'map') {
      targetHash = `#/${panelId}`;
    }

    if (window.location.hash !== targetHash) {
      if (!targetHash) {
        history.pushState(null, document.title, window.location.pathname + window.location.search);
        this.handleHashChange();
      } else {
        window.location.hash = targetHash;
      }
    } else {
      this.handleHashChange();
    }
  }

  closePanel() {
    if (window.location.hash && window.location.hash !== '#map-section') {
      history.pushState(null, document.title, window.location.pathname + window.location.search);
      this.handleHashChange();
    } else {
      if (typeof this.onRouteChange === 'function') {
        this.onRouteChange({ type: 'panel', name: '' });
      }
    }
  }
}

export const router = new Router();

/**
 * DOM & Fullscreen Layer Management Utilities
 * Ensures modal overlays and lightboxes render on top of the map
 * in both normal mode and Fullscreen mode (HTML5 & CSS Fullscreen).
 */

export function isMapFullscreen() {
  const card = document.getElementById('map-card-container');
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    card?.classList.contains('is-fullscreen')
  );
}

export function getModalParentContainer() {
  const fsElement = document.fullscreenElement ||
                    document.webkitFullscreenElement ||
                    document.mozFullScreenElement ||
                    document.msFullscreenElement;
  if (fsElement) {
    return fsElement;
  }
  const card = document.getElementById('map-card-container');
  if (card && card.classList.contains('is-fullscreen')) {
    return card;
  }
  return document.getElementById('app') || document.body;
}

export function syncAllModalContainersMount() {
  const parent = getModalParentContainer();
  const isFs = isMapFullscreen();

  const modalIds = [
    'pin-detail-modal-container',
    'photo-lightbox-container',
    'leaderboard-container',
    'bottom-sheet-container',
    'how-it-works-container',
    'about-modal-container',
    'onboarding-modal-container',
    'chai-tip-modal-container'
  ];

  modalIds.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      if (container.parentElement !== parent) {
        parent.appendChild(container);
      }
      // Set high z-index in fullscreen mode
      if (isFs) {
        if (id === 'photo-lightbox-container') {
          container.className = 'z-[100010] relative';
        } else {
          container.className = 'z-[100005] relative';
        }
      }
    }
  });
}

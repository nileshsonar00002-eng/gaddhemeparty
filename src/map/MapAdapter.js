/**
 * Unified MapAdapter Interface
 * Allows swapping between Leaflet, Mapbox GL JS, MapLibre, or Google Maps
 * without modifying any UI or business logic code.
 */
export class MapAdapter {
  init(containerId, options) {
    throw new Error('init() must be implemented');
  }

  setView(lat, lng, zoom) {
    throw new Error('setView() must be implemented');
  }

  zoomIn() {
    throw new Error('zoomIn() must be implemented');
  }

  zoomOut() {
    throw new Error('zoomOut() must be implemented');
  }

  centerOnIndia() {
    throw new Error('centerOnIndia() must be implemented');
  }

  renderPins(pins, onPinClick) {
    throw new Error('renderPins() must be implemented');
  }

  setUserLocationMarker(lat, lng) {
    throw new Error('setUserLocationMarker() must be implemented');
  }

  onMoveEnd(callback) {
    throw new Error('onMoveEnd() must be implemented');
  }

  getBounds() {
    throw new Error('getBounds() must be implemented');
  }

  openPopup(pinId) {
    throw new Error('openPopup() must be implemented');
  }

  highlightPin(lat, lng, rank) {
    // Optional highlight implementation
  }

  clearHighlightPin() {
    // Optional clear highlight implementation
  }

  destroy() {
    throw new Error('destroy() must be implemented');
  }
}

/**
 * Marker Tier Configuration for RoadTok
 * Single pins (reportCount) and cluster bubbles (count) alike.
 * 
 * Config constant:
 * TIERS = [{max:2,name:'grey'},{max:5,name:'maroon'},{max:Infinity,name:'black'}]
 * (launch values; easily changed later to 2 / 9 / Infinity).
 */
export const TIERS = [
  { max: 2, name: 'grey' },
  { max: 5, name: 'maroon' },
  { max: Infinity, name: 'black' }
];

export function getTierForCount(count) {
  const c = Math.max(1, count || 1);
  for (const tier of TIERS) {
    if (c <= tier.max) {
      return tier.name;
    }
  }
  return 'black';
}

/**
 * Returns complete style specifications for a given report count & theme:
 *
 * Light map:
 * - grey: rgba(107,114,128,.62) 22px, 2px ring at 90%, white text, box-shadow: 0 0 0 1px rgba(255,255,255,.85)
 * - maroon: rgba(163,21,38,.62) 26px, 2px ring at 90%, white text, box-shadow: 0 0 0 1px rgba(255,255,255,.85)
 * - black: rgba(11,13,18,.78) 32px, 2px ring at 90%, white text, box-shadow: 0 0 0 1px rgba(255,255,255,.85)
 *
 * Dark map:
 * - grey: #9CA3AF, fill alpha .6 (rgba(156,163,175,.6)), 2px ring at 90%, white text, no hairline
 * - maroon: #D1364A, fill alpha .6 (rgba(209,54,74,.6)), 2px ring at 90%, white text, no hairline
 * - black tier: #F5F5F5 with dark text, fill alpha .6 (rgba(245,245,245,.6)), 2px ring at 90%, no hairline
 */
export function getMarkerTierStyle(count, theme = 'light') {
  const isDark = theme === 'dark';
  const tierName = getTierForCount(count);

  let size = 22;
  let fill = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.62)';
  let ring = isDark ? 'rgba(156, 163, 175, 0.9)' : 'rgba(107, 114, 128, 0.9)';
  let selectedFill = isDark ? 'rgba(156, 163, 175, 0.75)' : 'rgba(107, 114, 128, 0.75)';
  let textColor = '#FFFFFF';
  let textShadow = isDark ? '0 0 2px #000000, 0 1px 2px #000000' : '0 0 2px rgba(0, 0, 0, 0.6)';
  let fillVar = '--marker-grey-fill';
  let ringVar = '--marker-grey-ring';
  let selectedVar = '--marker-grey-selected';

  if (tierName === 'maroon') {
    size = 26;
    fill = isDark ? 'rgba(209, 54, 74, 0.6)' : 'rgba(163, 21, 38, 0.62)';
    ring = isDark ? 'rgba(209, 54, 74, 0.9)' : 'rgba(163, 21, 38, 0.9)';
    selectedFill = isDark ? 'rgba(209, 54, 74, 0.75)' : 'rgba(163, 21, 38, 0.75)';
    textColor = '#FFFFFF';
    fillVar = '--marker-maroon-fill';
    ringVar = '--marker-maroon-ring';
    selectedVar = '--marker-maroon-selected';
  } else if (tierName === 'black') {
    size = 32;
    fillVar = '--marker-black-fill';
    ringVar = '--marker-black-ring';
    selectedVar = '--marker-black-selected';
    if (isDark) {
      fill = 'rgba(245, 245, 245, 0.6)';
      ring = 'rgba(245, 245, 245, 0.9)';
      selectedFill = 'rgba(245, 245, 245, 0.75)';
      textColor = '#0B0D12';
      textShadow = 'none';
    } else {
      fill = 'rgba(11, 13, 18, 0.78)';
      ring = 'rgba(11, 13, 18, 0.9)';
      selectedFill = 'rgba(11, 13, 18, 0.75)';
      textColor = '#FFFFFF';
      textShadow = '0 0 2px rgba(0, 0, 0, 0.8)';
    }
  }

  const hairline = isDark ? 'none' : '0 0 0 1px rgba(255, 255, 255, 0.85)';
  const badgeText = count > 1 ? String(count) : '!';
  const fontSize = size >= 32 ? '13px' : (size >= 26 ? '12px' : '11px');

  return {
    tierName,
    size,
    fill,
    ring,
    selectedFill,
    textColor,
    textShadow,
    boxShadow: hairline,
    badgeText,
    fontSize,
    className: `tier-${tierName}`,
    cssVars: {
      fill: `var(${fillVar})`,
      ring: `var(${ringVar})`,
      selected: `var(${selectedVar})`,
      hairline: 'var(--marker-hairline)'
    }
  };
}

/**
 * Mercator projection calculation to compute pixel distance between coordinates at given zoom level
 */
export function latLngToPixel(lat, lng, zoom) {
  const sinY = Math.sin((lat * Math.PI) / 180);
  const clampedSinY = Math.min(Math.max(sinY, -0.9999), 0.9999);
  const scale = 256 * Math.pow(2, zoom);
  const x = scale * (0.5 + lng / 360);
  const y = scale * (0.5 - Math.log((1 + clampedSinY) / (1 - clampedSinY)) / (4 * Math.PI));
  return { x, y };
}

/**
 * Checks which items in an array of {lat, lng} have another item within thresholdPx on screen
 */
export function calculateCrowdedMarkers(items, zoom, thresholdPx = 44) {
  const pixels = items.map((item) => latLngToPixel(item.lat, item.lng, zoom));
  const thresholdSq = thresholdPx * thresholdPx;
  const crowdedSet = new Set();

  for (let i = 0; i < pixels.length; i++) {
    for (let j = i + 1; j < pixels.length; j++) {
      const dx = pixels[i].x - pixels[j].x;
      const dy = pixels[i].y - pixels[j].y;
      if (dx * dx + dy * dy < thresholdSq) {
        crowdedSet.add(i);
        crowdedSet.add(j);
      }
    }
  }

  return crowdedSet;
}

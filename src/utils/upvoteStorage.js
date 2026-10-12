const ACTIONS_KEY = 'khadda_user_actions_v2';
const UPVOTES_KEY = 'khadda_user_upvoted_pins_v1';
export const REPORT_LIMIT_ENABLED = false; // Daily 5-report limit disabled for now as requested
const MAX_ACTIONS_PER_DAY = 5;
const ROLLING_24H_MS = 24 * 60 * 60 * 1000;

function getStoredActions() {
  try {
    const raw = localStorage.getItem(ACTIONS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    const cutoff = Date.now() - ROLLING_24H_MS;
    // Keep only last 24h actions
    return list.filter((a) => a && typeof a.timestamp === 'number' && a.timestamp > cutoff);
  } catch (e) {
    return [];
  }
}

export function getActionQuota() {
  const actions = getStoredActions();
  const used = actions.length;

  if (!REPORT_LIMIT_ENABLED) {
    return {
      totalLimit: null,
      used,
      remaining: Infinity,
      nextAvailableAt: null,
      waitFormatted: '',
      isLimitReached: false,
      isUnlimited: true,
    };
  }

  const cappedUsed = Math.min(MAX_ACTIONS_PER_DAY, actions.length);
  const remaining = Math.max(0, MAX_ACTIONS_PER_DAY - cappedUsed);

  let nextAvailableAt = null;
  let waitFormatted = '';

  if (actions.length >= MAX_ACTIONS_PER_DAY) {
    const oldest = Math.min(...actions.map((a) => a.timestamp));
    nextAvailableAt = oldest + ROLLING_24H_MS;
    const diff = Math.max(0, nextAvailableAt - Date.now());
    let hours = Math.floor(diff / (60 * 60 * 1000));
    let mins = Math.ceil((diff % (60 * 60 * 1000)) / (60 * 1000));
    if (mins === 60) {
      hours += 1;
      mins = 0;
    }
    waitFormatted = hours > 0 ? (mins > 0 ? `${hours} घंटे ${mins} मिनट` : `${hours} घंटे`) : `${mins} मिनट`;
  }

  return {
    totalLimit: MAX_ACTIONS_PER_DAY,
    used: cappedUsed,
    remaining,
    nextAvailableAt,
    waitFormatted,
    isLimitReached: remaining === 0,
    isUnlimited: false,
  };
}

const sessionUpvotedPins = new Set();

export function recordLocalCountedAction(pinId) {
  const normalizedId = pinId ? String(pinId).trim() : undefined;
  if (normalizedId) {
    sessionUpvotedPins.add(normalizedId);
    markPinAsUpvoted(normalizedId);
  }
  try {
    const now = Date.now();
    const actions = getStoredActions();
    if (!normalizedId || !actions.some((a) => String(a.pinId).trim() === normalizedId)) {
      actions.push({ timestamp: now, pinId: normalizedId });
      localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions));
    }
  } catch (e) {
    console.warn('LocalStorage action write notice:', e);
  }
}

export function hasUserReportedOrUpvoted(pinId) {
  if (!pinId) return false;
  const targetId = String(pinId).trim();
  if (!targetId) return false;

  if (sessionUpvotedPins.has(targetId)) return true;

  // Check 24h actions
  const actions = getStoredActions();
  const recentAction = actions.some((a) => String(a.pinId || '').trim() === targetId);
  if (recentAction) {
    sessionUpvotedPins.add(targetId);
    return true;
  }

  // Fallback to permanent upvotes list
  return hasUserUpvoted(targetId);
}

export function getUpvotedPinIds() {
  try {
    const raw = localStorage.getItem(UPVOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function hasUserUpvoted(pinId) {
  if (!pinId) return false;
  const targetId = String(pinId).trim();
  if (sessionUpvotedPins.has(targetId)) return true;
  const list = getUpvotedPinIds();
  const found = list.some((id) => String(id).trim() === targetId);
  if (found) sessionUpvotedPins.add(targetId);
  return found;
}

export function markPinAsUpvoted(pinId) {
  if (!pinId) return;
  const targetId = String(pinId).trim();
  if (!targetId) return;
  sessionUpvotedPins.add(targetId);
  try {
    const list = getUpvotedPinIds();
    if (!list.some((id) => String(id).trim() === targetId)) {
      list.push(targetId);
      localStorage.setItem(UPVOTES_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('LocalStorage upvote write notice:', e);
  }
}

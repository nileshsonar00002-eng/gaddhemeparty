/**
 * Central Anti-Spam Configuration
 * Single file to easily adjust limits, cooldowns, and thresholds across Cloud Functions.
 */
export const ANTI_SPAM_CONFIG = {
  // Maximum total counted actions (new pin OR +1 upvote OR 20m duplicate report) per user in rolling 24 hours (disabled temporarily as requested)
  MAX_ACTIONS_PER_USER_PER_24H: 999999,

  // Cooldown window before a user can report or +1 the same pin again (in hours)
  SAME_PIN_COOLDOWN_HOURS: 24,

  // Maximum total actions allowed per IP address in rolling 24 hours (shared carrier/Wi-Fi friendly)
  MAX_ACTIONS_PER_IP_PER_24H: 999999,

  // Deduplication radius: a new report within 5 meters of an existing pin is converted to a +1
  DUPLICATE_RADIUS_M: 5,

  // Proximity requirement: user must be within 300 meters of the pin to submit a +1 upvote
  PROXIMITY_UPVOTE_RADIUS_M: 300,

  // Salt used for privacy-preserving SHA-256 IP hashing (never store raw IPs)
  IP_SALT: process.env.ANTI_SPAM_IP_SALT || 'khadda_anti_spam_salt_2026_prod_key',

  // TTL policy: document expiration buffer in hours (for Firestore automated TTL cleanup)
  TTL_EXPIRATION_HOURS: 48,
};

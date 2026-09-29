import { describe, it, expect } from 'vitest';
import { hashIpAddress } from '../rateLimit';
import { ANTI_SPAM_CONFIG } from '../config';

describe('Rate Limiting & Anti-Spam Config Logic', () => {
  it('generates consistent and irreversible IP hashes', () => {
    const ip1 = '103.21.124.50';
    const ip2 = '103.21.124.50';
    const ip3 = '103.21.124.51';

    const hash1 = hashIpAddress(ip1);
    const hash2 = hashIpAddress(ip2);
    const hash3 = hashIpAddress(ip3);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(32);
  });

  it('configures sensible anti-spam thresholds in central config', () => {
    expect(ANTI_SPAM_CONFIG.MAX_ACTIONS_PER_USER_PER_24H).toBe(5);
    expect(ANTI_SPAM_CONFIG.SAME_PIN_COOLDOWN_HOURS).toBe(24);
    expect(ANTI_SPAM_CONFIG.MAX_ACTIONS_PER_IP_PER_24H).toBe(30);
    expect(ANTI_SPAM_CONFIG.DUPLICATE_RADIUS_M).toBe(20);
    expect(ANTI_SPAM_CONFIG.PROXIMITY_UPVOTE_RADIUS_M).toBe(300);
  });
});

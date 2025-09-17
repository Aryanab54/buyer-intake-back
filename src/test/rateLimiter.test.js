const { checkRateLimit } = require('../utils/rateLimiter');

describe('Rate Limiter', () => {
  test('Allows requests within limit', () => {
    const key = 'test-user-1';
    
    for (let i = 0; i < 5; i++) {
      const allowed = checkRateLimit(key, 10, 60000);
      expect(allowed).toBe(true);
    }
  });

  test('Blocks requests over limit', () => {
    const key = 'test-user-2';
    
    // Fill up the limit
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key, 10, 60000);
    }
    
    // Next request should be blocked
    const blocked = checkRateLimit(key, 10, 60000);
    expect(blocked).toBe(false);
  });

  test('Resets after time window', () => {
    const key = 'test-user-3';
    
    // Fill up the limit with short window
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 100); // 100ms window
    }
    
    // Should be blocked
    expect(checkRateLimit(key, 5, 100)).toBe(false);
    
    // Wait for window to expire
    setTimeout(() => {
      expect(checkRateLimit(key, 5, 100)).toBe(true);
    }, 150);
  });
});
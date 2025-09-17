// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map();

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(time => time > now - 60000);
    if (validRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }
};

// Cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

const checkRateLimit = (key, limit = 10, windowMs = 60000) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  
  const requests = rateLimitStore.get(key);
  const validRequests = requests.filter(time => time > windowStart);
  
  if (validRequests.length >= limit) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  return true;
};

const rateLimitMiddleware = (limit = 10, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.user ? `user:${req.user.userId}` : `ip:${req.ip}`;
    
    if (!checkRateLimit(key, limit, windowMs)) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    next();
  };
};

module.exports = {
  checkRateLimit,
  rateLimitMiddleware
};
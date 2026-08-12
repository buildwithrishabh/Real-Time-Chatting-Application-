const crypto = require("crypto");
const { redis } = require("../redis/client");
const { AppError } = require("../common/appError");
const logger = require("../config/logger");

const apiRateLimiter = (limit = 100, windowSec = 60) => {
  return async (req, res, next) => {
    // Skip rate limiting in development mode to prevent local testing blocks
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress;
    const userId = req.user ? req.user.id : null;

    const identifier = userId ? `user:${userId}` : `ip:${ip}`;
    const key = `rate_limit:${identifier}:${req.baseUrl}${req.path}`;

    const now = Date.now();
    const windowStart = now - windowSec * 1000;
    const memberId = `${now}-${crypto.randomUUID()}`;

    try {
      const multi = redis.multi();

      // Remove requests older than the sliding window start
      multi.zremrangebyscore(key, 0, windowStart);

      // Add current request with a unique member value to ensure accurate counting under concurrency
      multi.zadd(key, now, memberId);

      // Count total requests within the current window
      multi.zcard(key);

      // Set TTL on the set key to prevent orphan records
      multi.expire(key, windowSec + 1);

      const result = await multi.exec();
      const requestCount = result[2][1];

      if (requestCount > limit) {
        logger.warn(`Rate limit reached for key: ${key}`);
        return next(
          new AppError("Too many requests, please try again later.", 429),
        );
      }

      next();
    } catch (err) {
      logger.error(`Rate Limiter error: ${err.message}`);
      next();
    }
  };
};

module.exports = apiRateLimiter;

const Redis = require("ioredis");
const env = require("../config/env");
const logger = require("../config/logger");

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  logger.info("Redis connected successfully");
});

redis.on("error", (err) => {
  logger.error("Redis connection Error :", err);
});

const scanKeys = async (pattern) => {
  const keys = [];
  const stream = redis.scanStream({
    match: pattern,
    count: 100,
  });

  for await (const resultkeys of stream) {
    keys.push(...resultkeys);
  }

  return keys;
}


const revokePatternKeys = async (pattern) => {
  const keys = await scanKeys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
    logger.info(
      `Revoked keys matching pattern: ${pattern}. Count: ${keys.length}`,
    );
  }
};

module.exports = {
  redis,
  scanKeys,
  revokePatternKeys,
};

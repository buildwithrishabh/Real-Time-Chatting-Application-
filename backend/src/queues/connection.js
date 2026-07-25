const env = require("../config/env");

const connectionOpts = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // BullMQ requires this to be null
};

module.exports = connectionOpts;
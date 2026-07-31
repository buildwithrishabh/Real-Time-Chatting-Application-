const { redis } = require("../../redis/client");
const logger = require("../../config/logger");
const User = require("../../model/User");

module.exports = (io, socket) => {
  const userId = socket.user.id;
  const presenceKey = `presence:status:${userId}`;
  const socketKey = `presence:sockets:${userId}`;
  const lastSeenKey = `presence:lastseen:${userId}`;

  const handleConnectPresence = async () => {
    try {
      await redis.sadd(socketKey, socket.id);
      await redis.set(presenceKey, "online");
      await redis.del(lastSeenKey);

      io.emit("user:status_change", {
        userId,
        status: "online",
      });

      logger.debug(`Presence: User [${socket.user.username}] marked online`);
    } catch (err) {
      logger.error(`Presence connection error: ${err.message}`);
    }
  };

  socket.on("presence:query", async ({ userIds }, callback) => {
    if (!Array.isArray(userIds) || typeof callback !== "function") return;
    try {
      const results = {};
      for (const targetId of userIds) {
        const status = await redis.get(`presence:status:${targetId}`);
        const lastSeen = await redis.get(`presence:lastseen:${targetId}`);
        results[targetId] = {
          status: status === "online" ? "online" : "offline",
          lastSeenAt: lastSeen || undefined,
        };
      }
      callback({ success: true, data: results });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on("disconnect", async () => {
    try {
      await redis.srem(socketKey, socket.id);
      const remainingSockets = await redis.scard(socketKey);

      // IF no active socket connections remain, mark the user offline
      if (remainingSockets === 0) {
        const lastseen = new Date();
        await redis.set(presenceKey, "offline");
        await redis.set(lastSeenKey, lastseen.toISOString());

        // Update MongoDB lastSeenAt so REST API queries have up-to-date lastSeen
        User.findByIdAndUpdate(userId, { lastSeenAt: lastseen }).catch((e) =>
          logger.warn(`Failed to update lastSeenAt in MongoDB for user ${userId}: ${e.message}`)
        );

        io.emit("user:status_change", {
          userId,
          status: "offline",
          lastSeenAt: lastseen.toISOString(),
        });

        logger.debug(`Presence: User [${socket.user.username}] marked OFFLINE`);
      }
    } catch (err) {
      logger.error(`Presence disconnect error: ${err.message}`);
    }
  });

  handleConnectPresence();
};
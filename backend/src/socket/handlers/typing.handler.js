const { redis } = require("../../redis/client");
const logger = require("../../config/logger");

module.exports = (io, socket) => {
  const userId = socket.user.id;

  socket.on("typing:start", async ({ conversationId }) => {
    if (!conversationId) return;

    const key = `typing:${conversationId}:${userId}`;

    try {
      await redis.set(key, "1", "EX", 3);

      socket.to(`chat:room:${conversationId}`).emit("typing:status", {
        conversationId,
        userId,
        isTyping: true,
      });
    } catch (err) {
      logger.error(`Typing event error: ${err.message}`);
    }
  });

  socket.on("typing:stop", async ({ conversationId }) => {
    if (!conversationId) return;
    const key = `typing:${conversationId}:${userId}`;

    try {
      await redis.del(key);

      socket.to(`chat:room:${conversationId}`).emit("typing:status", {
        conversationId,
        userId,
        isTyping: false,
      });
    } catch (err) {
      logger.error(`Typing stop error: ${err.message}`);
    }
  });
};

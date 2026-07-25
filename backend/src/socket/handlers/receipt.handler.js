const logger = require("../../config/logger");

module.exports = (io, socket) => {
  const userId = socket.user.id;

  socket.on("message:read", async ({ conversationId, messageId }) => {
    if (!conversationId || !messageId) return;

    try {
      socket.to(`chat:room:${conversationId}`).emit(`receipt:updated`, {
        conversationId,
        userId,
        messageId,
        status: "read",
        timestamp: new Date(),
      });
      logger.debug(
        `Receipt: Message [${messageId}] marked READ by user [${socket.user.username}]`,
      );
    } catch (err) {
      logger.error(`Receipt update error: ${err.message}`);
    }
  });
};

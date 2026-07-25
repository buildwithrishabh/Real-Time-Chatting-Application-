const logger = require("../../config/logger");
const messageService = require("../../modules/messages/message.service");

module.exports = (io, socket) => {
  socket.on("room:join", async ({ conversationId }) => {
    if (!conversationId) return;
    await socket.join(`chat:room:${conversationId}`);
    logger.debug(
      `user [${socket.user.username}] joined room [${conversationId}]`,
    );
  });

  socket.on("room:leave", async ({ conversationId }) => {
    if (!conversationId) return;
    await socket.leave(`chat:room:${conversationId}`);
    logger.debug(
      `user [${socket.user.username}] left room: [${conversationId}]`,
    );
  });

  socket.on("message:send", async (payload, callback) => {
    const { conversationId, content, fileId, tempId } = payload;

    if (!conversationId || (!content && !fileId)) {
      if (typeof callback === "function") {
        callback({ success: false, error: "Invalid message payload" });
      }
      return;
    }

    try {
      // 1. Save message to MongoDB and send notifications via service
      const message = await messageService.sendMessage(socket.user.id, payload);

      // 2. Broadcast the saved DB message to room participants
      socket.to(`chat:room:${conversationId}`).emit("message:new", message);

      // 3. Acknowledge sender with saved message data + client tempId
      if (typeof callback === "function") {
        callback({
          success: true,
          data: {
            ...(message.toObject ? message.toObject() : message),
            tempId,
          },
        });
      }
    } catch (err) {
      logger.error(`Socket message:send error: ${err.message}`);
      if (typeof callback === "function") {
        callback({
          success: false,
          error: err.message || "Failed to send message",
        });
      }
    }
  });
};

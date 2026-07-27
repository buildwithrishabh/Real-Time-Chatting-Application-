const logger = require("../../config/logger");
const Participant = require("../../model/Participant");
const Message = require("../../model/Message");

module.exports = (io, socket) => {
  const userId = socket.user.id;

  socket.on("message:read", async ({ conversationId, messageId }) => {
    if (!conversationId || !messageId) return;

    try {
      const participant = await Participant.findOneAndUpdate(
        { conversationId, userId },
        {
          lastReadMessageId: messageId,
          unreadCount: 0,
        },
        {
          new: true,
        },
      );
      
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

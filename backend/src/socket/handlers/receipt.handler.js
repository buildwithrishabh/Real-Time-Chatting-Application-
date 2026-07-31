const logger = require("../../config/logger");
const Participant = require("../../model/Participant");
const messageRepository = require("../../modules/messages/message.repository");

module.exports = (io, socket) => {
  const userId = socket.user.id;

  socket.on("message:read", async ({ conversationId, messageId }) => {
    if (!conversationId || !messageId) return;

    try {
      await Participant.findOneAndUpdate(
        { conversationId, userId },
        {
          lastReadMessageId: messageId,
          unreadCount: 0,
        },
        {
          new: true,
        },
      );

      const readMessageIds = await messageRepository.markAsReadUpToMessage(
        conversationId,
        userId,
        messageId,
      );

      socket.to(`chat:room:${conversationId}`).emit(`receipt:updated`, {
        conversationId,
        userId,
        messageId,
        messageIds: readMessageIds,
        status: "read",
        timestamp: new Date(),
      });

      logger.debug(
        `Receipt: Message [${messageId}] and previous messages marked READ by user [${socket.user.username}]`,
      );
    } catch (err) {
      logger.error(`Receipt update error: ${err.message}`);
    }
  });
};
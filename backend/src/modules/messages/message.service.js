const { notifyUser } = require("../notifications/notification.service");
const messageRepository = require("./message.repository");
const chatRepository = require("../chats/chat.repository");
const { AppError, StatusCodes } = require("../../common/appError");
const User = require("../../model/User");

const sendMessage = async (senderId, payload) => {
  const { conversationId, content, type, fileId, replyToMessageId, mentions } =
    payload;

  const isParticipant = await chatRepository.findParticipant(
    conversationId,
    senderId,
  );

  if (!isParticipant) {
    throw new AppError(
      "You must be a participant in this conversation to send Message",
      StatusCodes.FORBIDDEN,
    );
  }

  const message = await messageRepository.saveMessage({
    conversationId,
    senderId,
    content,
    type,
    fileId: fileId || null,
    replyToMessageId: replyToMessageId || null,
    mentions: mentions || [],
  });

  const [sender, participants] = await Promise.all([
    User.findById(senderId).select("username displayName"),
    chatRepository.getParticipants(conversationId),
  ]);

  const senderName = sender?.displayName || sender?.username || "Someone";
  const mentionedUserIds = new Set((mentions || []).map((id) => id.toString()));

  const notificationPromises = participants
    .filter((p) => p.userId?._id?.toString() !== senderId.toString())
    .map((p) => {
      const isMentioned = mentionedUserIds.has(p.userId?._id?.toString());
      return notifyUser({
        recipientId: p.userId?._id,
        senderId,
        type: isMentioned ? "MENTION" : "NEW_MESSAGE",
        title: isMentioned
          ? `${senderName} mentioned you in a message`
          : `New Message from ${senderName}`,
        body:
          content ||
          (type === "image" ? "📷 Sent an image" : "Sent an attachment"),
        chatId: conversationId,
        messageId: message._id,
      });
    });

  Promise.all(notificationPromises).catch((error) => {
    console.error("Failed to send notification", error);
  });

  return message;
};

const getMessages = async (userId, conversationId, cursor, limit = 50) => {
  const isParticipant = await chatRepository.findParticipant(
    conversationId,
    userId,
  );

  if (!isParticipant) {
    throw new AppError(
      "You are not authorized to view message in this conversation",
      StatusCodes.FORBIDDEN,
    );
  }

  return messageRepository.findConversationMessages(
    conversationId,
    userId,
    cursor,
    limit,
  );
};

const addReaction = async (userId, messageId, emoji) => {
  const message = await messageRepository.findMessageById(messageId);
  if (!message) {
    throw new AppError("Message not found", StatusCodes.NOT_FOUND);
  }

  const isParticipant = await chatRepository.findParticipant(
    message.conversationId,
    userId,
  );

  if (!isParticipant) {
    throw new AppError("Access Forbidden", StatusCodes.FORBIDDEN);
  }

  return messageRepository.addReaction(messageId, userId, emoji);
};

const removeReaction = async (userId, messageId, emoji) => {
  const message = await messageRepository.findMessageById(messageId);
  if (!message) throw new AppError("Message not found", StatusCodes.NOT_FOUND);

  const isParticipant = await chatRepository.findParticipant(
    message.conversationId,
    userId,
  );
  if (!isParticipant) {
    throw new AppError("Access Forbidden", StatusCodes.FORBIDDEN);
  }

  return messageRepository.removeReaction(messageId, userId, emoji);
};

const editMessage = async (messageId, userId, content) => {
  const message = await messageRepository.findMessageById(messageId);
  if (!message) {
    throw new AppError("Message not found", StatusCodes.NOT_FOUND);
  }

  if (message.senderId.toString() !== userId.toString()) {
    throw new AppError(
      "You can only edit your own message",
      StatusCodes.FORBIDDEN,
    );
  }

  if (message.isDeletedForEveryone) {
    throw new AppError(
      "You can't edit the deleted message",
      StatusCodes.BAD_REQUEST,
    );
  }

  return messageRepository.updateContent(messageId, content);
};

const deleteMessage = async (userId, messageId, type = "everyone") => {
  const message = await messageRepository.findMessageById(messageId);
  if (!message) {
    throw new AppError("Message not found", StatusCodes.NOT_FOUND);
  }

  const isParticipant = await chatRepository.findParticipant(
    message.conversationId,
    userId,
  );

  if (!isParticipant) {
    throw new AppError("Access Forbidden", StatusCodes.FORBIDDEN);
  }

  if (message.isDeletedForEveryone) {
    throw new AppError("Message is already deleted", StatusCodes.BAD_REQUEST);
  }

  if (type === "everyone") {
    if (message.senderId.toString() !== userId.toString()) {
      throw new AppError(
        "You can only delete your own message for everyone",
        StatusCodes.FORBIDDEN,
      );
    }
    return messageRepository.deleteForEveryone(messageId);
  } else if (type === "me") {
    return messageRepository.deleteForMe(messageId, userId);
  } else {
    throw new AppError(
      "Invalid delete type. Must be me or everyone",
      StatusCodes.BAD_REQUEST,
    );
  }
};

module.exports = {
  sendMessage,
  getMessages,
  addReaction,
  removeReaction,
  editMessage,
  deleteMessage,
};

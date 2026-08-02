const { notifyUser } = require("../notifications/notification.service");
const messageRepository = require("./message.repository");
const chatRepository = require("../chats/chat.repository");
const { AppError, StatusCodes } = require("../../common/appError");
const User = require("../../model/User");
const Conversation = require("../../model/Conversation");
const Participant = require("../../model/Participant");
const blockRepository = require("../users/block.repository");

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

  const participants = await chatRepository.getParticipants(conversationId);
  for (const p of participants) {
    const otherUserId = p.userId?._id || p.userId;
    if (otherUserId && otherUserId.toString() !== senderId.toString()) {
      const isBlocked = await blockRepository.isBlocked(otherUserId, senderId);
      if (isBlocked) {
        throw new AppError(
          "Cannot send message because you are blocked by a participant in this conversation",
          StatusCodes.FORBIDDEN,
        );
      }
    }
  }

  const File = require("../../model/File");

  let messageType = type;
  let fileDoc = null;

  if (fileId) {
    fileDoc = await File.findById(fileId);
    if (fileDoc && (!messageType || messageType === "text")) {
      const mime = fileDoc.mimeType || "";
      if (mime.startsWith("image/")) messageType = "image";
      else if (mime.startsWith("video/")) messageType = "video";
      else if (mime.startsWith("audio/")) messageType = "audio";
      else if (mime.includes("pdf")) messageType = "pdf";
      else if (mime.includes("zip")) messageType = "zip";
      else messageType = "document";
    }
  }

  const message = await messageRepository.saveMessage({
    conversationId,
    senderId,
    content,
    type: messageType || "text",
    fileId: fileId || null,
    replyToMessageId: replyToMessageId || null,
    mentions: mentions || [],
  });

  const populatedMessage = await message.populate("fileId");

  // Update Conversation with lastMessageId and latest updatedAt
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessageId: populatedMessage._id,
    updatedAt: populatedMessage.createdAt || new Date(),
  });

  // Increment unreadCount for other participants
  await Participant.updateMany(
    { conversationId, userId: { $ne: senderId } },
    { $inc: { unreadCount: 1 } },
  );

  // Real-time Socket Emission to all participants' user rooms so Conversation List updates instantly at top
  try {
    const { getIO } = require("../../socket");
    const io = getIO();
    if (io && participants) {
      for (const p of participants) {
        const pUserId = p.userId?._id || p.userId;
        if (pUserId) {
          io.to(`user:${pUserId.toString()}`).emit("conversation:updated", {
            conversationId: conversationId.toString(),
            lastMessage: populatedMessage,
            updatedAt: populatedMessage.createdAt || new Date(),
          });
        }
      }
    }
  } catch (err) {
    console.error("Failed to emit socket conversation:updated to user rooms", err);
  }

  const sender = await User.findById(senderId).select("username displayName");

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
          (messageType === "image" ? "📷 Sent an image" : "Sent an attachment"),
        chatId: conversationId,
        messageId: populatedMessage._id,
      });
    });

  Promise.all(notificationPromises).catch((error) => {
    console.error("Failed to send notification", error);
  });

  return populatedMessage;
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

    // Clean up attached file from Cloudinary and DB if present
    if (message.fileId) {
      try {
        const File = require("../../model/File");
        const cloudinary = require("../../config/cloudinary");
        const fileDoc = await File.findById(message.fileId);

        if (fileDoc && fileDoc.publicId) {
          const mime = fileDoc.mimeType || "";
          let resourceType = "image";
          if (mime.startsWith("video/")) {
            resourceType = "video";
          } else if (!mime.startsWith("image/")) {
            resourceType = "raw";
          }

          await cloudinary.uploader.destroy(fileDoc.publicId, {
            resource_type: resourceType,
          });
          await File.findByIdAndDelete(message.fileId);
        }
      } catch (err) {
        // Log error silently so message deletion still succeeds
        console.error("Cloudinary file deletion error:", err.message);
      }
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

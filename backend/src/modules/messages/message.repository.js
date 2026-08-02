const Message = require("../../model/Message");

const saveMessage = async (msgData) => {
  return Message.create(msgData);
};

const findMessageById = async (id) => {
  return Message.findById(id);
};

const findConversationMessages = async (
  conversationId,
  userId,
  cursor,
  limit,
) => {
  const query = { conversationId, deletedByUsers: { $ne: userId } };

  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  return Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("fileId");
};

const addReaction = async (messageId, userId, emoji) => {
  const update = { $addToSet: {} };
  update.$addToSet[`reactions.${emoji}`] = userId;
  return Message.findByIdAndUpdate(messageId, update, { new: true });
};

const removeReaction = async (messageId, userId, emoji) => {
  const update = { $pull: {} };
  update.$pull[`reactions.${emoji}`] = userId;
  return Message.findByIdAndUpdate(messageId, update, { new: true });
};

const updateContent = async (messageId, content) => {
  return Message.findByIdAndUpdate(
    messageId,
    {
      $set: { content, isEdited: true, editedAt: new Date() },
    },
    { new: true },
  );
};

const deleteForEveryone = async (messageId) => {
  return Message.findByIdAndUpdate(
    messageId,
    {
      $set: {
        content: "This message was deleted",
        isDeletedForEveryone: true,
        fileId: null,
      },
    },
    { new: true },
  );
};

const deleteForMe = async (messageId, userId) => {
  return Message.findByIdAndUpdate(
    messageId,
    {
      $addToSet: {
        deletedByUsers: userId,
      },
    },
    { new: true },
  );
};

const markAsReadUpToMessage = async (conversationId, userId, messageId) => {
  const targetMessage = await Message.findById(messageId);
  if (!targetMessage) return [];

  const filter = {
    conversationId,
    senderId: { $ne: userId },
    createdAt: { $lte: targetMessage.createdAt },
    "readBy.userId": { $ne: userId },
  };

  const update = {
    $addToSet: {
      readBy: {
        userId,
        readAt: new Date(),
      },
    },
    $set: {
      status: "read",
    },
  };

  await Message.updateMany(filter, update);

  const updatedMessages = await Message.find({
    conversationId,
    senderId: { $ne: userId },
    createdAt: { $lte: targetMessage.createdAt },
  }).select("_id");

  return updatedMessages.map((m) => m._id.toString());
};

module.exports = {
  saveMessage,
  findMessageById,
  findConversationMessages,
  addReaction,
  removeReaction,
  updateContent,
  deleteForEveryone,
  deleteForMe,
  markAsReadUpToMessage,
};

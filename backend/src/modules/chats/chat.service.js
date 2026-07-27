const { notifyUser } = require("../notifications/notification.service");
const chatRepository = require("./chat.repository");
const { AppError, StatusCodes } = require("../../common/appError");
const blockRepository = require("../users/block.repository");

const createChat = async (creatorId, { type, name, participantIds }) => {
  if (participantIds.includes(creatorId.toString())) {
    throw new AppError(
      "You cannot create a conversation with yourself",
      StatusCodes.BAD_REQUEST,
    );
  }

  if (type === "private") {
    if (participantIds.length !== 1) {
      throw new AppError(
        "Direct message must have exactly one recipent",
        StatusCodes.BAD_REQUEST,
      );
    }

    const recipentId = participantIds[0];

    const isBlocked = await blockRepository.isEitherBlocked(
      creatorId,
      recipentId,
    );
    if (isBlocked) {
      throw new AppError(
        "Cannot create chat with this user due to block setting",
        StatusCodes.FORBIDDEN,
      );
    }

    const existingChat = await chatRepository.findPrivateConversation(
      creatorId,
      recipentId,
    );
    if (existingChat) {
      return existingChat;
    }
  }

  const conversation = await chatRepository.createConversation(
    type,
    type === "group" ? name : "",
    type === "group" ? creatorId : null,
  );

  await chatRepository.addParticipant(
    conversation._id,
    creatorId,
    type === "group" ? "admin" : "member",
  );

  for (const memberId of participantIds) {
    await chatRepository.addParticipant(conversation._id, memberId, "member");

    if (type === "group") {
      await notifyUser({
        recipientId: memberId,
        senderId: creatorId,
        type: "GROUP_INVITE",
        title: "Added to Conversation",
        body: `You have been added to ${name || "a conversation"}`,
        chatId: conversation._id,
      });
    }
  }

  return conversation;
};

const addParticipant = async (adminId, conversationId, targetUserId) => {
  if (adminId.toString() === targetUserId.toString()) {
    throw new AppError(
      "You cannot add yourself to the conversation",
      StatusCodes.BAD_REQUEST,
    );
  }
  const conversation =
    await chatRepository.findConversationById(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found", StatusCodes.NOT_FOUND);
  }

  if (conversation.type !== "group") {
    throw new AppError(
      "Can only add participants to group conversations",
      StatusCodes.BAD_REQUEST,
    );
  }

  const requester = await chatRepository.findParticipant(
    conversationId,
    adminId,
  );

  if (!requester || requester.role !== "admin") {
    throw new AppError(
      "Only admins can add participants",
      StatusCodes.FORBIDDEN,
    );
  }

  const existing = await chatRepository.findParticipant(
    conversationId,
    targetUserId,
  );

  if (existing) {
    throw new AppError(
      "User is already in conversation",
      StatusCodes.BAD_REQUEST,
    );
  }

  const newParticipant = await chatRepository.addParticipant(
    conversationId,
    targetUserId,
    "member",
  );

  await notifyUser({
    recipientId: targetUserId,
    senderId: adminId,
    type: "GROUP_INVITE",
    title: "Added to Conversation",
    body: `You have been added to ${conversation.name || "a conversation"}`,
    chatId: conversationId,
  });

  return newParticipant;
};

const getConversations = async (userId, cursor, limit = 15) => {
  return chatRepository.findUserConversations(userId, cursor, limit);
};

const removeUser = async (adminId, conversationId, targetUserId) => {
  const conversation =
    await chatRepository.findConversationById(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found", StatusCodes.NOT_FOUND);
  }

  const requester = await chatRepository.findParticipant(
    conversationId,
    adminId,
  );

  if (!requester) {
    throw new AppError(
      "You are not a participant in this conversation",
      StatusCodes.FORBIDDEN,
    );
  }

  const isSelfRemoval = adminId.toString() === targetUserId.toString();

  if (!isSelfRemoval && requester.role !== "admin") {
    throw new AppError(
      "Only admins can remove other participants",
      StatusCodes.FORBIDDEN,
    );
  }

  const targetParticipant = await chatRepository.findParticipant(
    conversationId,
    targetUserId,
  );

  if (!targetParticipant) {
    throw new AppError(
      "User is not a participant in this conversation",
      StatusCodes.NOT_FOUND,
    );
  }

  // Prevent removing the group owner unless deleting group
  if (
    conversation.ownerId &&
    conversation.ownerId?.toString() === targetUserId.toString() &&
    conversation.type === "group"
  ) {
    throw new AppError(
      "The group owner cannot be removed. Transfer ownership or delete the group instead.",
      StatusCodes.BAD_REQUEST,
    );
  }

  await chatRepository.removeParticipant(conversationId, targetUserId);
  return { success: true };
};

const deleteGroup = async (userId, conversationId) => {
  const conversation =
    await chatRepository.findConversationById(conversationId);

  if (!conversation) {
    throw new AppError("Group chat not found", StatusCodes.NOT_FOUND);
  }

  if (conversation.type !== "group") {
    throw new AppError(
      "DMs cannot be deleted directly, use archived instead",
      StatusCodes.BAD_REQUEST,
    );
  }

  if (conversation.ownerId.toString() !== userId.toString()) {
    throw new AppError(
      "Only the owner can delete this group",
      StatusCodes.FORBIDDEN,
    );
  }

  await chatRepository.deleteConversation(conversationId);
  return { success: true };
};

const updateUserRole = async (
  adminId,
  conversationId,
  targetUserId,
  newRole,
) => {
  if (!["admin", "member"].includes(newRole)) {
    throw new AppError("Invalid role", StatusCodes.BAD_REQUEST);
  }

  const conversation =
    await chatRepository.findConversationById(conversationId);

  if (!conversation) {
    throw new AppError("Conversation not found", StatusCodes.NOT_FOUND);
  }

  const requester = await chatRepository.findParticipant(
    conversationId,
    adminId,
  );

  if (!requester || requester.role !== "admin") {
    throw new AppError("Only admin can delegate roles", StatusCodes.FORBIDDEN);
  }

  // Prevent demoting the group owner
  if (
    conversation.ownerId &&
    conversation.ownerId.toString() === targetUserId.toString() &&
    newRole !== "admin"
  ) {
    throw new AppError(
      "Cannot demote the group owner",
      StatusCodes.BAD_REQUEST,
    );
  }

  const updatedParticipant = await chatRepository.updateParticipantRole(
    conversationId,
    targetUserId,
    newRole,
  );

  if (!updatedParticipant) {
    throw new AppError(
      "Participants not found  in conversation",
      StatusCodes.NOT_FOUND,
    );
  }

  await notifyUser({
    recipientId: targetUserId,
    senderId: adminId,
    type: "GROUP_ROLE_UPDATE",
    title: "Group Role Updated",
    body: `Your role has been changed to ${newRole}`,
    chatId: conversationId,
  });

  return updatedParticipant;
};

module.exports = {
  createChat,
  addParticipant,
  getConversations,
  removeUser,
  deleteGroup,
  updateUserRole,
};

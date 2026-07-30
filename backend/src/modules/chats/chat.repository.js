const Conversation = require("../../model/Conversation");
const Participant = require("../../model/Participant");
const File = require("../../model/File")
const Notification = require("../../model/Notification")
const Message = require("../../model/Message");


const createConversation = async (type, name, ownerId = null) => {
  return Conversation.create({ type, name, ownerId });
};

const addParticipant = async (conversationId, userId, role = "member") => {
  return Participant.create({ conversationId, userId, role });
};

const findConversationById = async (id) => {
  return Conversation.findById(id);
};

const findParticipant = async (conversationId, userId) => {
  return Participant.findOne({ conversationId, userId });
};

const findUserConversations = async (userId, cursor, limit) => {
  // Find conversation the user is a participant in
  const userMembership = await Participant.find({ userId }).select(
    "conversationId",
  );

  const conversationIds = userMembership.map((m) => m.conversationId);

  const query = { _id: { $in: conversationIds } };

  if (cursor) {
    query.updatedAt = { $lt: new Date(cursor) };
  }

  return Conversation.find(query)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate("lastMessageId");
};

const getParticipants = async (conversationId) => {
  return Participant.find({ conversationId }).populate(
    "userId",
    "username displayName avatarUrl status lastSeenAt",
  );
};

const findPrivateConversation = async (userId1, userId2) => {
  const user1MemberShip = await Participant.find({ userId: userId1 }).select(
    "conversationId",
  );

  const conversationIds = user1MemberShip.map((m) => m.conversationId);

  const commonMemberships = await Participant.find({
    conversationId: { $in: conversationIds },
    userId: userId2,
  }).select("conversationId");

  const commonIds = commonMemberships.map((m) => m.conversationId);

  return Conversation.findOne({
    _id: { $in: commonIds },
    type: "private",
  });
};

const removeParticipant = async (conversationId, userId) => {
  return Participant.deleteOne({ conversationId, userId });
};

const updateParticipantRole = async (conversationId, userId, role) => {
  return Participant.findOneAndUpdate(
    {
      conversationId,
      userId,
    },
    { role },
    { new: true },
  );
};

const deleteConversation = async (id) => {
  // 1. Delete all messages in conversation
  await Message.deleteMany({ conversationId: id });
  
  // 2. Delete all file records
  await File.deleteMany({ conversationId: id });
  
  // 3. Delete all participants
  await Participant.deleteMany({ conversationId: id });
  
  // 4. Delete notifications
  await Notification.deleteMany({ chatId: id });
  
  // 5. Delete conversation document
  await Conversation.deleteOne({ _id: id });
};


module.exports = {
  createConversation,
  addParticipant,
  findConversationById,
  findParticipant,
  findUserConversations,
  getParticipants,
  findPrivateConversation,
  removeParticipant,
  updateParticipantRole,
  deleteConversation,
};

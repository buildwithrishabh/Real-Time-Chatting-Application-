const BlockedUser = require("../../model/BlockedUser");

const blockUser = async (blockerId, blockedId) => {
  return BlockedUser.findOneAndUpdate(
    { blockerId, blockedId },
    { $setOnInsert: { blockerId, blockedId } },
    { upsert: true, new: true },
  );
};

const unblockUser = async (blockerId, blockedId) => {
  return BlockedUser.findOneAndDelete({ blockerId, blockedId });
};

const isBlocked = async (blockerId, blockedId) => {
  const record = await BlockedUser.exists({ blockerId, blockedId });
  return !!record;
};

const getBlockedUsers = async (blockerId) => {
  return await BlockedUser.find({ blockerId })
    .populate("blockedId", "username displayName avatarUrl")
    .sort({ createdAt: -1 })
    .lean();
};

const isEitherBlocked = async (userId1, userId2) => {
  const record = await BlockedUser.exists({
    $or: [
      { blockerId: userId1, blockedId: userId2 },
      { blockerId: userId2, blockedId: userId1 },
    ],
  });
  return !!record;
};

module.exports = {
    blockUser,
    unblockUser,
    isBlocked,
    getBlockedUsers,
    isEitherBlocked,
}


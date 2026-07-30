const User = require("../../model/User");
const BlockedUser = require("../../model/BlockedUser");

const findUserById = async (userId) => {
  return User.findById(userId).select("-passwordHash");
};

const updateUserProfile = async (userId, updateData) => {
  return User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true },
  ).select("-passwordHash");
};

const findUsersByQuery = async (
  searchQuery,
  currentUserId = null,
  limit = 20,
) => {
  if (!searchQuery || !searchQuery.trim()) return [];

  // Escape special regex characters & create fast prefix regex
  const escapedQuery = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedQuery}`, "i");

  let excludedUserIds = [];
  if (currentUserId) {
    const blocks = await BlockedUser.find({
      $or: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
    })
      .select("blockerId blockedId")
      .lean();

    excludedUserIds = blocks.map((b) =>
      b.blockerId.toString() === currentUserId.toString()
        ? b.blockedId
        : b.blockerId,
    );

    excludedUserIds.push(currentUserId);
  }

  return User.find({
    _id: { $nin: excludedUserIds },
    status: { $ne: "suspended" },
    $or: [
      { username: regex },
      { displayName: regex },
    ],
  })
    .select("username displayName avatarUrl")
    .limit(limit)
    .lean();
};

module.exports = {
  findUserById,
  updateUserProfile,
  findUsersByQuery,
};
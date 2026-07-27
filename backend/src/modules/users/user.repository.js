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
  let excludedUserIds = [];
  if (currentUserId) {
    const blocks = await BlockedUser.find({
      $or: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
    }).select("blockerId blockedId");

    excludedUserIds = blocks.map((b) =>
      b.blockerId.toString() === currentUserId.toString()
        ? b.blockedId
        : b.blockerId,
    );

    excludedUserIds.push(currentUserId);
  }

  return User.find({
    _id: { $nin: excludedUserIds },
    $or: [
      { username: { $regex: searchQuery, $options: "i" } },
      { displayName: { $regex: searchQuery, $options: "i" } },
    ],
    status: "active",
  })
    .select("username displayName avatarUrl bio isProfileComplete")
    .limit(limit);
};

module.exports = {
  findUserById,
  updateUserProfile,
  findUsersByQuery,
};
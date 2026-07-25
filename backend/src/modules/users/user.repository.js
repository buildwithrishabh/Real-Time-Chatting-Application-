const User = require("../../model/User");

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

const findUsersByQuery = async (searchQuery, limit = 20) => {
  return User.find({
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

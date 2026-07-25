const userRepository = require("./user.repository");
const { AppError, StatusCodes } = require("../../common/appError");

const getProfile = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }
  return user;
};

const completeProfile = async (
  userId,
  { displayName, bio, avatarUrl, avatarPublicId },
) => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const updateData = {
    displayName: displayName || user.username,
    bio: bio || "",
    isProfileComplete: true,
  };

  if (avatarUrl) updateData.avatarUrl = avatarUrl;
  if (avatarPublicId) updateData.avatarPublicId = avatarPublicId;

  const updateUser = await userRepository.updateUserProfile(userId, updateData);
  return updateUser;
};

const updateProfile = async (userId, updateFields) => {
  const allowedFields = [
    "displayName",
    "bio",
    "avatarUrl",
    "avatarPublicId",
    "privacySettings",
  ];

  const sanitizedData = {};

  Object.keys(updateFields).forEach((key) => {
    if (allowedFields.includes(key)) {
      sanitizedData[key] = updateFields[key];
    }
  });

  const updateUser = await userRepository.updateUserProfile(
    userId,
    sanitizedData,
  );

  return updateUser;
};

const searchUsers = async (query) => {
  if (!query || query.trim().length === 0) return [];
  return userRepository.findUsersByQuery(query.trim());
};

module.exports = {
  getProfile,
  completeProfile,
  updateProfile,
  searchUsers,
};
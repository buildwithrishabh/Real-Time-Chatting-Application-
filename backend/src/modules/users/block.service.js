const blockRepository = require("./block.repository");
const { AppError, StatusCodes } = require("../../common/appError");

const blockUser = async (blockerId, targetUserId) => {
  if (blockerId.toString() === targetUserId.toString()) {
    throw new AppError("You cannot block yourself", StatusCodes.BAD_REQUEST);
  }

  const alreadyBlocked = await blockRepository.isBlocked(
    blockerId,
    targetUserId,
  );

  if (alreadyBlocked) {
    throw new AppError("User is already blocked", StatusCodes.BAD_REQUEST);
  }

  const blocked = await blockRepository.blockUser(blockerId, targetUserId);

  return blocked;
};

const unblockUser = async (blockerId, targetUserId) => {
  const result = await blockRepository.unblockUser(blockerId, targetUserId);
  if (!result) {
    throw new AppError("User is not blocked", StatusCodes.BAD_REQUEST);
  }
  return { success: true, message: "User unblocked successfully" };
};

const getBlockedUsers = async (userId) => {
  return blockRepository.getBlockedUsers(userId);
};

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
};

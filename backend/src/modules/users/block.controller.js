const blockService = require("./block.service");
const { StatusCodes } = require("../../common/appError");

const block = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await blockService.blockUser(req.user.id, userId);
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const unblock = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await blockService.unblockUser(req.user.id, userId);
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const listBlocked = async (req, res, next) => {
  try {
    const users = await blockService.getBlockedUsers(req.user.id);
    res.status(StatusCodes.OK).json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
};

module.exports = { block, unblock, listBlocked };
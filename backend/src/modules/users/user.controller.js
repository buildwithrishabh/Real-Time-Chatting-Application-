const userService = require("./user.service");
const { StatusCodes } = require("../../common/appError");

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.status(StatusCodes.OK).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const completeProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileData = req.validated?.body || req.body;
    const user = await userService.completeProfile(userId, profileData);

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Profile completed successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.validated?.body || req.body;
    const user = await userService.updateProfile(userId, updateData);

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getProfile(id);

    res.status(StatusCodes.OK).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const users = await userService.searchUsers(q);

    res.status(StatusCodes.OK).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  completeProfile,
  updateProfile,
  getUserById,
  searchUsers,
};

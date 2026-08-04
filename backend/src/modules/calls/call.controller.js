const callService = require("./call.service");

const getCallHistory = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { page, limit } = req.query;

    const data = await callService.getCallHistory(currentUserId, page, limit);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching call history",
      error: error.message,
    });
  }
};

module.exports = {
  getCallHistory,
};

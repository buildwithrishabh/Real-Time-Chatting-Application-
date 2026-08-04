const Call = require("../../model/call");

const getCallHistory = async (userId, page = 1, limit = 20) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const query = {
    $or: [{ callerId: userId }, { receiverId: userId }],
  };

  const [calls, total] = await Promise.all([
    Call.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("callerId", "username displayName avatarUrl")
      .populate("receiverId", "username displayName avatarUrl")
      .lean(),
    Call.countDocuments(query),
  ]);

  return {
    items: calls,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

module.exports = {
  getCallHistory,
};

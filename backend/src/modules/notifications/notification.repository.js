const Notification = require("../../model/Notification");

const create = async (data) => {
  return await Notification.create(data);
};

const findByRecipient = async (recipientId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ recipient: recipientId })
      .populate("sender", "username displayName email avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipient: recipientId }),
  ]);

  return {
    notifications,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const countUnread = async (recipientId) => {
  return await Notification.countDocuments({
    recipient: recipientId,
    isRead: false,
  });
};

const markAsRead = async (notificationId, recipientId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: recipientId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
};


const markAllAsRead = async (recipientId) => {
  return await Notification.updateMany(
    { recipient: recipientId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  ); 
};

const deleteById = async (notificationId, recipientId) => {
  return await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: recipientId,
  });
};

const deleteAll = async (recipientId) => {
  return await Notification.deleteMany({ recipient: recipientId });
};

module.exports = {
  create,
  findByRecipient,
  countUnread,
  markAsRead,
  markAllAsRead,
  deleteById,
  deleteAll,
};

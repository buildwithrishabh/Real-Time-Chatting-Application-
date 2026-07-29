const notificationRepository = require("./notification.repository");
const { sendNotificationJob } = require("../../queues/notification.queue");
const { redis } = require("../../redis/client");
const { AppError, StatusCodes } = require("../../common/appError");
const { getIO } = require("../../socket");

const notifyUser = async ({
  recipientId,
  senderId,
  type,
  title,
  body,
  chatId,
  messageId,
  metadata,
}) => {
  const notification = await notificationRepository.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    body,
    chatId,
    messageId,
    metadata,
  });

  const presenceStatus = await redis.get(`presence:status:${recipientId}`);
  const isOnline = presenceStatus === "online";

  let io = null;
  try {
    const getIO = require("../../socket")
    io = getIO();
  } catch (err) {
    // Socket.io might not be initialized in background worker context
    io = null;
  }

  if (isOnline && io) {
    io.to(`user:${recipientId}`).emit("notification:received", notification);
  } else {
    await sendNotificationJob(recipientId, {
      notificationId: notification._id,
      title,
      body,
      type,
      chatId,
    });
  }

  return notification;
};

const getUserNotifications = async (userId, page, limit) => {
  return await notificationRepository.findByRecipient(userId, page, limit);
};

const getUnreadCount = async (userId) => {
  const count = await notificationRepository.countUnread(userId);
  return { unreadCount: count };
};

const markNotificationAsRead = async (notificationId, userId) => {
  const updated = await notificationRepository.markAsRead(
    notificationId,
    userId,
  );

  if (!updated) {
    throw new AppError("Notification not found", StatusCodes.NOT_FOUND);
  }

  return updated;
};

const markAllNotificationsAsRead = async (userId) => {
  await notificationRepository.markAllAsRead(userId);
  return { message: "All notifications marked as read" };
};

const deleteNotification = async (notificationId, userId) => {
  const deleted = await notificationRepository.deleteById(
    notificationId,
    userId,
  );
  if (!deleted) {
    throw new AppError("Notification not found", StatusCodes.NOT_FOUND);
  }

  return { message: "Notification deleted successfully" };
};

module.exports = {
  notifyUser,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};

const notificationRepository = require("./notification.repository");
const { sendNotificationJob } = require("../../queues/notification.queue");
const { redis } = require("../../redis/client");
const { AppError, StatusCodes } = require("../../common/appError");


// Lazy getIO retriever to avoid circular dependency with socket/index.js
const getIOInstance = () => {
  try {
    const { getIO } = require("../../socket");
    return getIO();
  } catch (err) {
    return null;
  }
};

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
  const io = getIOInstance();
  let isParticipantActiveInRoom = false;

  if (io && chatId) {
    const roomName = `chat:room:${chatId}`;
    const roomSockets = io.sockets.adapter.rooms?.get(roomName);
    if (roomSockets) {
      for (const socketId of roomSockets) {
        const socket = io.sockets.sockets?.get(socketId);
        if (
          socket &&
          socket.user &&
          socket.user.id?.toString() === recipientId?.toString()
        ) {
          isParticipantActiveInRoom = true;
          break;
        }
      }
    }
  }

  const notification = await notificationRepository.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    body,
    chatId,
    messageId,
    metadata,
    isRead: isParticipantActiveInRoom,
  });

  const presenceStatus = await redis.get(`presence:status:${recipientId}`);
  const isOnline = presenceStatus === "online";

  if (isOnline && io) {
    const notifObj = notification.toObject
      ? notification.toObject()
      : notification;
    io.to(`user:${recipientId}`).emit("notification:received", {
      ...notifObj,
      activeInRoom: isParticipantActiveInRoom,
    });
  } else if (!isParticipantActiveInRoom) {
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

const deleteAllNotifications = async (userId) => {
  await notificationRepository.deleteAll(userId);
  return { message: "All notifications deleted successfully" };
};

module.exports = {
  notifyUser,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
};

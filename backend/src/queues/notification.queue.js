const { Queue } = require("bullmq");
const connection = require("./connection");
const logger = require("../config/logger");

const notificationQueue = new Queue("notifications", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "linear",
      delay: 2000, // Retry every 2 seconds
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const sendNotificationJob = async (userId, payload) => {
  try {
    await notificationQueue.add("push_notification", { userId, payload });
  } catch (error) {
    logger.error(`❌ Failed to add Notification Job: ${error.message}`);
  }
};

module.exports = { notificationQueue, sendNotificationJob };

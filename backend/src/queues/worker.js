const { Worker } = require("bullmq");
const connection = require("./connection");
const logger = require("../config/logger");
const { sendMail } = require("../utils/email");

// Unified Worker Initialization
const startWorkers = () => {
  // 1. Email Worker
  const emailWorker = new Worker(
    "email",
    async (job) => {
      const { to, data } = job.data;
      logger.info(`Processing email job ID ${job.id} for: ${to}`);

      switch (job.name) {
        case "welcome":
          await sendMail({
            to,
            subject: "Welcome to ChatApp!",
            html: `<p>Hi <strong>${data.username}</strong>, welcome aboard.</p>`,
          });
          break;
        case "otp_verification":
          await sendMail({
            to,
            subject: "Verify Your Email Address",
            html: `<p>Your OTP token is: <strong>${data.otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`,
          });
          break;
        case "password_reset":
          await sendMail({
            to,
            subject: "Reset Your Password",
            html: `<p>Your password reset token is: <strong>${data.token}</strong></p>`,
          });
          break;
        default:
          throw new Error(`Unknown email job type: ${job.name}`);
      }
    },
    { connection },
  );

  const notificationWorker = new Worker(
    "notifications",
    async (job) => {
      const { userId, payload } = job.data;
      logger.info(`Sending alert for User Id: ${userId}`);
      logger.info(`[FCM SUCCESS] Send push payload: ${JSON.stringify(payload)}`);
    },
    { connection },
  );

  emailWorker.on("completed", (job) => {
    logger.info(`Job completed: email - ID ${job.id}`);
  });

  emailWorker.on("failed", (job, err) => {
    logger.error(
      `Job failed: email - ID ${job.id || "unknown"} . Error : ${err.message}`,
    );
  });

  notificationWorker.on("completed", (job) => {
    logger.debug(`Job completed: notification - ID ${job.id}`);
  });

  notificationWorker.on("failed", (job, err) => {
    logger.error(
      `Job failed: notification - ID ${job.id || "unknown"}. Error: ${err.message}`,
    );
  });

  logger.info("🚀 Queue workers registered and listening for background tasks");
};

module.exports = { startWorkers };

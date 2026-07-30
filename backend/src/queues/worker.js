const { Worker } = require("bullmq");
const connection = require("./connection");
const logger = require("../config/logger");
const { sendMail } = require("../utils/email");
const {
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
} = require("../utils/emailTemplates");
const env = require("../config/env");

// Unified Worker Initialization
const startWorkers = () => {
  // 1. Email Worker
  const emailWorker = new Worker(
    "email",
    async (job) => {
      const { to, data } = job.data;
      logger.info(`Processing email job ID ${job.id} (Type: ${job.name}) for: ${to}`);

      const frontendUrl = (env.CORS_ORIGIN || "http://localhost:3000").replace(/\/+$/, "");

      switch (job.name) {
        case "email_verification":
        case "otp_verification": {
          const token = data.token || data.otp;
          const link = data.link || `${frontendUrl}/verify-email?token=${token}`;
          const html = getVerificationEmailHtml({
            name: data.username || data.name,
            link,
            token,
          });

          await sendMail({
            to,
            subject: "Verify Your Email Address - ChitChat",
            html,
          });
          break;
        }

        case "password_reset": {
          const token = data.token;
          const link = data.link || `${frontendUrl}/reset-password?token=${token}`;
          const html = getPasswordResetEmailHtml({
            name: data.username || data.name,
            link,
            token,
          });

          await sendMail({
            to,
            subject: "Reset Your Password - ChitChat",
            html,
          });
          break;
        }

        default:
          logger.warn(`Unknown or deprecated email job type: ${job.name}`);
          break;
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

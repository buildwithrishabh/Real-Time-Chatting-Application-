const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../config/logger");

// Create SMTP Transporter Connection Pool for Brevo
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST, // smtp-relay.brevo.com
  port: env.SMTP_PORT, // 587 or 465
  secure: env.SMTP_PORT === 465, // true for port 465, false for 587/2525
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  pool: true, // Make one connection and use that connection multiple times
  maxConnections: 5, // max 5 connections can be used at a time
  maxMessages: 100, // max 100 messages can be sent using one connection
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    logger.error(`❌ SMTP Transporter Verification Failed: ${error.message}`);
  } else {
    logger.info("⚡ SMTP Transporter is ready to send messages");
  }
});


const sendMail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"ChatApp Support" <${env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    logger.info(`[Brevo SMTP SUCCESS] Email sent to: ${to} | MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`[Brevo SMTP ERROR] Failed to send email to ${to}: ${error.message}`);
    // Always re-throw the error so that BullMQ knows the job has failed and should be retried
    throw error;
  }
};

module.exports = { sendMail };

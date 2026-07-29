const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../config/logger");

let smtpTransporter = null;

// Initialize SMTP Transporter if SMTP host is specified
if (env.SMTP_HOST) {
  smtpTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  smtpTransporter.verify((error) => {
    if (error) {
      logger.error(`❌ SMTP Transporter Verification Failed: ${error.message}`);
    } else {
      logger.info("⚡ SMTP Transporter is ready to send messages");
    }
  });
}

/**
 * Send email using Brevo API Key (Production REST API) or SMTP Transporter Fallback
 */
const sendMail = async ({ to, subject, html }) => {
  const senderEmail = env.BREVO_SENDER_EMAIL || env.SMTP_FROM;

  try {
    // 1. Production Mode: Use Brevo HTTP REST API with BREVO_API_KEY
    if (env.BREVO_API_KEY) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "ChitChat Support", email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Brevo API HTTP Error ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      logger.info(`[Brevo API SUCCESS] Email sent to: ${to} | MessageId: ${data.messageId || 'OK'}`);
      return data;
    }

    // 2. SMTP Mode: Use Nodemailer Pool Transporter
    if (smtpTransporter) {
      const info = await smtpTransporter.sendMail({
        from: `"ChitChat Support" <${senderEmail}>`,
        to,
        subject,
        html,
      });
      logger.info(`[Brevo SMTP SUCCESS] Email sent to: ${to} | MessageId: ${info.messageId}`);
      return info;
    }

    // 3. Dev / Fallback Mode (No API key or SMTP config provided)
    logger.warn(`[EMAIL DEV MOCK] BREVO_API_KEY or SMTP_HOST not configured. Mock sending to: ${to}`);
    logger.info(`[EMAIL DEV MOCK CONTENT] Subject: "${subject}"`);
    return { mock: true, messageId: "dev-mock-id" };
  } catch (error) {
    logger.error(`[Email Send Failed] Error sending email to ${to}: ${error.message}`);
    throw error;
  }
};

module.exports = { sendMail };

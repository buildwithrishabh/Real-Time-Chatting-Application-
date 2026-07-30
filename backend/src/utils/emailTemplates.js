/**
 * HTML Email Templates for ChitChat Platform
 * Designed to match frontend aesthetics: Electric Violet gradients, dark mode accents, responsive layout.
 */

const getBaseStyles = () => `
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0F172A;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #F8FAFC;
    }
    .wrapper {
      width: 100%;
      background-color: #0F172A;
      padding: 40px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 36px 32px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }
    .logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #06B6D4 100%);
      border-radius: 14px;
      display: inline-block;
      text-align: center;
      line-height: 44px;
      color: #ffffff;
      font-size: 22px;
      font-weight: bold;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      background: linear-gradient(135deg, #A78BFA, #38BDF8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
      letter-spacing: -0.5px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 14px 0;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #94A3B8;
      margin: 0 0 20px 0;
    }
    .btn-container {
      margin: 32px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%);
      color: #FFFFFF !important;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      border-radius: 14px;
      box-shadow: 0 10px 20px -5px rgba(124, 58, 237, 0.5);
      transition: all 0.2s ease;
    }
    .link-box {
      background: #0F172A;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 12px 16px;
      word-break: break-all;
      font-size: 13px;
      color: #38BDF8;
      margin-top: 16px;
    }
    .warning {
      background: rgba(245, 158, 11, 0.1);
      border-left: 4px solid #F59E0B;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      color: #FCD34D;
      margin-top: 24px;
    }
    .footer {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #334155;
      font-size: 12px;
      color: #64748B;
      text-align: center;
    }
  </style>
`;

/**
 * Returns HTML template for Email Verification link
 */
const getVerificationEmailHtml = ({ name, link }) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - ChitChat</title>
        ${getBaseStyles()}
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="logo-container">
              <span class="logo-icon">💬</span>
              <span class="brand-title">ChitChat</span>
            </div>
            
            <h1>Verify your email address</h1>
            <p>Hi <strong>${name || 'there'}</strong>,</p>
            <p>Welcome to ChitChat! Please click the button below to verify your email address and activate your real-time chat account.</p>
            
            <div class="btn-container">
              <a href="${link}" target="_blank" class="btn">Verify Email Address →</a>
            </div>

            <p style="font-size: 13px; margin-bottom: 8px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="link-box">${link}</div>

            <div class="warning">
              ⚡ This verification link is valid for 24 hours. If you didn't create an account, you can safely ignore this email.
            </div>

            <div class="footer">
              © 2026 ChitChat Inc. All rights reserved.<br>
              Ultra-fast real-time messaging platform.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Returns HTML template for Password Reset link
 */
const getPasswordResetEmailHtml = ({ name, link }) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - ChitChat</title>
        ${getBaseStyles()}
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="logo-container">
              <span class="logo-icon">💬</span>
              <span class="brand-title">ChitChat</span>
            </div>
            
            <h1>Reset your password</h1>
            <p>Hi <strong>${name || 'User'}</strong>,</p>
            <p>We received a request to reset the password for your ChitChat account. Click the button below to choose a new password.</p>
            
            <div class="btn-container">
              <a href="${link}" target="_blank" class="btn" style="background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%);">Reset Password →</a>
            </div>

            <p style="font-size: 13px; margin-bottom: 8px;">Or copy and paste this reset link into your browser:</p>
            <div class="link-box">${link}</div>

            <div class="warning">
              🔒 This link will expire in 15 minutes for your security. If you didn't request a password reset, please secure your account immediately.
            </div>

            <div class="footer">
              © 2026 ChitChat Inc. All rights reserved.<br>
              Ultra-fast real-time messaging platform.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

module.exports = {
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
};

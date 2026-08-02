/**
 * Premium HTML Email Templates for ChitChat Platform
 * Aligned with ChitChat's modern dark theme (#050505 / #09090B, #5D5FEF -> #3B82F6 gradients).
 * Designed to render flawlessly across Gmail, Outlook, Apple Mail & mobile email clients.
 */

const getEmailBaseStyles = () => `
  <style>
    /* Reset & Client-Specific Styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

    /* Custom Responsive Styling */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 10px !important; }
      .content-padding { padding: 24px 20px !important; }
      .mobile-btn { width: 100% !important; text-align: center !important; }
    }
  </style>
`;

/**
 * Returns premium HTML template for Email Verification
 */
const getVerificationEmailHtml = ({ name, link }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email Address - ChitChat</title>
  ${getEmailBaseStyles()}
</head>
<body style="margin: 0; padding: 0; background-color: #050505;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="560" class="email-container" style="background-color: #09090B; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Accent Gradient Line -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #5D5FEF 0%, #3B82F6 50%, #06B6D4 100%);"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px 32px;" class="content-padding">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #5D5FEF 0%, #3B82F6 100%); border-radius: 16px; width: 44px; height: 44px; box-shadow: 0 10px 20px rgba(93, 95, 239, 0.35);">
                    <span style="font-size: 22px; line-height: 44px; color: #FFFFFF;">💬</span>
                  </td>
                  <td style="padding-left: 14px;">
                    <span style="font-size: 24px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">ChitChat</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Icon Badge -->
          <tr>
            <td align="center" style="padding: 10px 32px 0 32px;">
              <div style="display: inline-block; background-color: rgba(93, 95, 239, 0.12); border: 1px solid rgba(93, 95, 239, 0.3); border-radius: 50px; padding: 6px 18px;">
                <span style="color: #A5B4FC; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">✉️ Email Verification</span>
              </div>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 24px 36px 36px 36px;" class="content-padding">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #FFFFFF; text-align: center; letter-spacing: -0.5px;">
                Confirm Your Email Address
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #A1A1AA; text-align: center;">
                Hi <strong style="color: #FFFFFF;">${name || 'there'}</strong>,
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #A1A1AA; text-align: center;">
                Welcome to ChitChat! To complete setting up your real-time messaging account and start chatting, please verify your email address.
              </p>

              <!-- Primary Action Button CTA -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${link}" target="_blank" class="mobile-btn" style="display: inline-block; background: linear-gradient(135deg, #5D5FEF 0%, #3B82F6 100%); color: #FFFFFF !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 38px; border-radius: 16px; box-shadow: 0 12px 24px -6px rgba(93, 95, 239, 0.45);">
                      Verify Email Address →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link Box -->
              <div style="margin-top: 32px; padding: 16px; background-color: #111114; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #71717A;">
                  Having trouble clicking the button? Copy and paste this link into your web browser:
                </p>
                <a href="${link}" style="font-size: 12px; color: #38BDF8; word-break: break-all; text-decoration: none;">
                  ${link}
                </a>
              </div>

              <!-- Security Information Note -->
              <div style="margin-top: 24px; padding: 14px 18px; background-color: rgba(6, 182, 212, 0.08); border-left: 3px solid #06B6D4; border-radius: 8px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #67E8F9;">
                  🔒 <strong>Security Note:</strong> This verification link is valid for 24 hours. If you did not sign up for a ChitChat account, no action is needed.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #050505; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #71717A;">
                © 2026 ChitChat Inc. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #52525B;">
                Ultra-fast real-time messaging platform powered by Socket.io & Redis.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Returns premium HTML template for Password Reset
 */
const getPasswordResetEmailHtml = ({ name, link }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - ChitChat</title>
  ${getEmailBaseStyles()}
</head>
<body style="margin: 0; padding: 0; background-color: #050505;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="560" class="email-container" style="background-color: #09090B; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Accent Gradient Line -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #5D5FEF 0%, #3B82F6 50%, #EC4899 100%);"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px 32px;" class="content-padding">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #5D5FEF 0%, #3B82F6 100%); border-radius: 16px; width: 44px; height: 44px; box-shadow: 0 10px 20px rgba(93, 95, 239, 0.35);">
                    <span style="font-size: 22px; line-height: 44px; color: #FFFFFF;">🔒</span>
                  </td>
                  <td style="padding-left: 14px;">
                    <span style="font-size: 24px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">ChitChat</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Icon Badge -->
          <tr>
            <td align="center" style="padding: 10px 32px 0 32px;">
              <div style="display: inline-block; background-color: rgba(93, 95, 239, 0.12); border: 1px solid rgba(93, 95, 239, 0.3); border-radius: 50px; padding: 6px 18px;">
                <span style="color: #A5B4FC; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">🔑 Password Reset Request</span>
              </div>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 24px 36px 36px 36px;" class="content-padding">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #FFFFFF; text-align: center; letter-spacing: -0.5px;">
                Reset Your Password
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #A1A1AA; text-align: center;">
                Hi <strong style="color: #FFFFFF;">${name || 'User'}</strong>,
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #A1A1AA; text-align: center;">
                We received a request to reset your ChitChat account password. Click the secure button below to choose your new password.
              </p>

              <!-- Primary Action Button CTA -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${link}" target="_blank" class="mobile-btn" style="display: inline-block; background: linear-gradient(135deg, #5D5FEF 0%, #3B82F6 100%); color: #FFFFFF !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 38px; border-radius: 16px; box-shadow: 0 12px 24px -6px rgba(93, 95, 239, 0.45);">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link Box -->
              <div style="margin-top: 32px; padding: 16px; background-color: #111114; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #71717A;">
                  Or copy and paste this password reset link into your web browser:
                </p>
                <a href="${link}" style="font-size: 12px; color: #38BDF8; word-break: break-all; text-decoration: none;">
                  ${link}
                </a>
              </div>

              <!-- Security Information Note -->
              <div style="margin-top: 24px; padding: 14px 18px; background-color: rgba(245, 158, 11, 0.1); border-left: 3px solid #F59E0B; border-radius: 8px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #FCD34D;">
                  ⚠️ <strong>Expiration Notice:</strong> This reset link will expire in 15 minutes. If you did not request a password reset, please ignore this email or contact support.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #050505; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #71717A;">
                © 2026 ChitChat Inc. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #52525B;">
                Ultra-fast real-time messaging platform powered by Socket.io & Redis.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

module.exports = {
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
};

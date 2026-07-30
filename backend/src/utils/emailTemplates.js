/**
 * Premium HTML Email Templates for ChitChat Platform
 * Designed to render flawlessly across Gmail, Outlook, Apple Mail & mobile email clients.
 */

const getEmailBaseStyles = () => `
  <style>
    /* Reset & Client-Specific Styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

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
<body style="margin: 0; padding: 0; background-color: #0B0F19;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B0F19; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="560" class="email-container" style="background-color: #111827; border: 1px solid #1E293B; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Accent Gradient Line -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #7C3AED 0%, #4F46E5 50%, #06B6D4 100%);"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px 32px;" class="content-padding">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); border-radius: 16px; width: 48px; height: 48px; box-shadow: 0 10px 20px rgba(124, 58, 237, 0.35);">
                    <span style="font-size: 24px; line-height: 48px; color: #FFFFFF;">💬</span>
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
              <div style="display: inline-block; background-color: rgba(124, 58, 237, 0.12); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 50px; padding: 6px 18px;">
                <span style="color: #A78BFA; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">✉️ Email Verification</span>
              </div>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 24px 36px 36px 36px;" class="content-padding">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #F8FAFC; text-align: center; letter-spacing: -0.5px;">
                Confirm Your Email Address
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #94A3B8; text-align: center;">
                Hi <strong style="color: #F8FAFC;">${name || 'there'}</strong>,
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #94A3B8; text-align: center;">
                Welcome to ChitChat! To complete setting up your real-time messaging account and start chatting, please verify your email address.
              </p>

              <!-- Primary Action Button CTA -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${link}" target="_blank" class="mobile-btn" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); color: #FFFFFF !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 38px; border-radius: 16px; box-shadow: 0 12px 24px -6px rgba(124, 58, 237, 0.5);">
                      Verify Email Address →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link Box -->
              <div style="margin-top: 32px; padding: 16px; background-color: #0B0F19; border: 1px solid #1E293B; border-radius: 14px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748B;">
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
            <td style="padding: 24px 36px; background-color: #0B0F19; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748B;">
                © 2026 ChitChat Inc. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
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
<body style="margin: 0; padding: 0; background-color: #0B0F19;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B0F19; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="560" class="email-container" style="background-color: #111827; border: 1px solid #1E293B; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Accent Gradient Line -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #F43F5E 0%, #EC4899 50%, #8B5CF6 100%);"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px 32px;" class="content-padding">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #F43F5E 0%, #EC4899 100%); border-radius: 16px; width: 48px; height: 48px; box-shadow: 0 10px 20px rgba(244, 63, 94, 0.35);">
                    <span style="font-size: 24px; line-height: 48px; color: #FFFFFF;">🔒</span>
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
              <div style="display: inline-block; background-color: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 50px; padding: 6px 18px;">
                <span style="color: #FDA4AF; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">🔑 Password Reset Request</span>
              </div>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 24px 36px 36px 36px;" class="content-padding">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #F8FAFC; text-align: center; letter-spacing: -0.5px;">
                Reset Your Password
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #94A3B8; text-align: center;">
                Hi <strong style="color: #F8FAFC;">${name || 'User'}</strong>,
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #94A3B8; text-align: center;">
                We received a request to reset your ChitChat account password. Click the secure button below to choose your new password.
              </p>

              <!-- Primary Action Button CTA -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${link}" target="_blank" class="mobile-btn" style="display: inline-block; background: linear-gradient(135deg, #F43F5E 0%, #EC4899 100%); color: #FFFFFF !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 38px; border-radius: 16px; box-shadow: 0 12px 24px -6px rgba(244, 63, 94, 0.5);">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link Box -->
              <div style="margin-top: 32px; padding: 16px; background-color: #0B0F19; border: 1px solid #1E293B; border-radius: 14px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748B;">
                  Or copy and paste this password reset link into your web browser:
                </p>
                <a href="${link}" style="font-size: 12px; color: #F472B6; word-break: break-all; text-decoration: none;">
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
            <td style="padding: 24px 36px; background-color: #0B0F19; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748B;">
                © 2026 ChitChat Inc. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
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

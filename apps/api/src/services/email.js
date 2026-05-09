import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "PouchCare <noreply@pouchcare.com>";
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Send a 6-digit verification code to a new user.
 */
export async function sendVerificationEmail(to, name, code) {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your PouchCare account",
    html: verificationTemplate(name, code),
  });

  if (error) {
    console.error("[Resend] Verification email failed:", error);
    throw new Error("Failed to send verification email");
  }
}

/**
 * Send a password-reset link to the user.
 */
export async function sendPasswordResetEmail(to, name, token) {
  const resetUrl = `${FRONTEND}/customer/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your PouchCare password",
    html: resetTemplate(name, resetUrl),
  });

  if (error) {
    console.error("[Resend] Reset email failed:", error);
    throw new Error("Failed to send password reset email");
  }
}

// ────────────────── HTML Templates ──────────────────

function verificationTemplate(name, code) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 40px 0;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #0A7AFF, #00C2FF); padding: 32px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 24px;">PouchCare</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #1A1A2E; font-size: 16px; margin: 0 0 16px;">Hi ${name},</p>
      <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Welcome to PouchCare! Enter the code below to verify your email address and activate your account.
      </p>
      <div style="background: #f0f7ff; border: 2px dashed #0A7AFF; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0A7AFF;">${code}</span>
      </div>
      <p style="color: #718096; font-size: 13px; line-height: 1.5; margin: 0;">
        This code expires in <strong>15 minutes</strong>. If you didn't create a PouchCare account, you can safely ignore this email.
      </p>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #a0aec0; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} PouchCare. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function resetTemplate(name, resetUrl) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 40px 0;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #0A7AFF, #00C2FF); padding: 32px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 24px;">PouchCare</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #1A1A2E; font-size: 16px; margin: 0 0 16px;">Hi ${name},</p>
      <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        We received a request to reset your password. Click the button below to choose a new one.
      </p>
      <div style="text-align: center; margin: 0 0 24px;">
        <a href="${resetUrl}" style="display: inline-block; background: #0A7AFF; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Reset Password
        </a>
      </div>
      <p style="color: #718096; font-size: 13px; line-height: 1.5; margin: 0 0 12px;">
        This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
      </p>
      <p style="color: #a0aec0; font-size: 12px; word-break: break-all;">
        ${resetUrl}
      </p>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #a0aec0; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} PouchCare. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

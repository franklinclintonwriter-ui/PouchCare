import { env } from "@/config/env";

async function getResend() {
  const { Resend } = await import("resend");
  return new Resend(env.RESEND_API_KEY);
}

// ── Brand constants ────────────────────────────────────────────────
const BRAND = {
  name: "PouchCare",
  logo: "https://pouchcare.com/images/logo.png",
  url: "https://pouchcare.com",
  color: "#2563EB", // primary blue
  dark: "#1E293B", // slate-800
  light: "#F8FAFC", // slate-50
  accent: "#3B82F6", // blue-500
  muted: "#64748B", // slate-500
  border: "#E2E8F0", // slate-200
  success: "#10B981", // emerald-500
};

// ── Base layout wrapper ────────────────────────────────────────────
function emailLayout(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${BRAND.name}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.light};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.light};">
    <tr><td align="center" style="padding:32px 16px 16px;">
      <!-- Header -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${BRAND.url}" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
            <img src="${BRAND.logo}" alt="${BRAND.name}" width="36" height="36" style="border:0;display:block;border-radius:8px;"/>
            <span style="font-size:22px;font-weight:700;color:${BRAND.dark};letter-spacing:-0.5px;">${BRAND.name}</span>
          </a>
        </td></tr>
      </table>
      <!-- Card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid ${BRAND.border};box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <tr><td style="padding:40px 36px 36px;">
          ${content}
        </td></tr>
      </table>
      <!-- Footer -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding:24px 0 32px;">
          <p style="margin:0;font-size:12px;line-height:18px;color:${BRAND.muted};">
            &copy; ${new Date().getFullYear()} ${BRAND.name} &middot; All rights reserved<br/>
            <a href="${BRAND.url}" style="color:${BRAND.muted};text-decoration:underline;">pouchcare.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function primaryButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr><td align="center" style="border-radius:10px;background:linear-gradient(135deg,${BRAND.color},${BRAND.accent});" bgcolor="${BRAND.color}">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
        ${escapeHtml(text)}
      </a>
    </td></tr>
  </table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.dark};line-height:1.3;">${escapeHtml(text)}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#374151;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:0;border-top:1px solid ${BRAND.border};margin:24px 0;"/>`;
}

function otpCodeBlock(code: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;background:${BRAND.light};border:2px dashed ${BRAND.border};border-radius:12px;">
    <tr><td style="padding:20px 40px;text-align:center;">
      <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:${BRAND.color};font-family:'Courier New',monospace;">${escapeHtml(code)}</span>
    </td></tr>
  </table>`;
}

function infoBox(text: string, icon = "💡"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0 0;background:${BRAND.light};border-radius:10px;border-left:4px solid ${BRAND.accent};">
    <tr><td style="padding:14px 18px;">
      <p style="margin:0;font-size:13px;line-height:20px;color:${BRAND.muted};">${icon} ${text}</p>
    </td></tr>
  </table>`;
}

// ── Core send function ─────────────────────────────────────────────
export async function sendEmail(to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY) {
    console.log(`[DEV] Email → ${to} | ${subject}`);
    return;
  }
  const resend = await getResend();
  await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
}

/** Broadcast batch: returns outcome per send (Resend missing = skipped, not failed). */
export async function sendBroadcastEmail(
  to: string,
  subject: string,
  html: string,
): Promise<"sent" | "skipped" | "failed"> {
  if (!env.RESEND_API_KEY) {
    console.log(`[DEV] Email → ${to} | ${subject}`);
    return "skipped";
  }
  try {
    const resend = await getResend();
    await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
    return "sent";
  } catch (err) {
    console.error("[broadcast email]", to, err);
    return "failed";
  }
}

// ── Verification email (with OTP) ──────────────────────────────────
/** Client account area on PORTAL_URL (same host as marketing site, e.g. pouchcare.com/my-accounts/…). */
const PORTAL_ACCOUNT_PREFIX = "/my-accounts";

export async function sendVerificationEmail(
  to: string,
  token: string,
  baseUrl?: string,
  otp?: string,
) {
  const base = (baseUrl ?? env.PORTAL_URL).replace(/\/$/, "");
  const url = `${base}${PORTAL_ACCOUNT_PREFIX}/verify-email?token=${token}`;

  const content = [
    heading("Verify Your Account"),
    paragraph("Welcome to <strong>PouchCare</strong>! Please verify your email address to get started."),
    otp
      ? [
          paragraph("Use this verification code:"),
          otpCodeBlock(otp),
          paragraph(`This code expires in <strong>10 minutes</strong>. Enter it on the verification page or click the button below.`),
        ].join("")
      : paragraph("Click the button below to verify your email address."),
    primaryButton("Verify Email Address", url),
    divider(),
    infoBox("If you didn't create a PouchCare account, you can safely ignore this email.", "🔒"),
  ].join("");

  await sendEmail(to, "Verify your PouchCare account", emailLayout(content, otp ? `Your code: ${otp}` : "Verify your email"));
}

// ── Password reset email ───────────────────────────────────────────
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  isPortal = false,
) {
  const base = isPortal ? env.PORTAL_URL : env.FRONTEND_URL;
  const path = isPortal
    ? `${PORTAL_ACCOUNT_PREFIX}/reset-password`
    : "/reset-password";
  const url = `${base.replace(/\/$/, "")}${path}?token=${token}`;

  const content = [
    heading("Reset Your Password"),
    paragraph("We received a request to reset the password for your PouchCare account. Click the button below to choose a new password."),
    primaryButton("Reset Password", url),
    divider(),
    paragraph(`<span style="font-size:13px;color:${BRAND.muted};">This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, no action is needed — your account is safe.</span>`),
    infoBox("For security, this link can only be used once.", "🛡️"),
  ].join("");

  await sendEmail(to, "Reset your PouchCare password", emailLayout(content, "Password reset request"));
}

// ── Broadcast email (used by admin notifications) ──────────────────
export function buildBroadcastEmailHtml(title: string, message: string): string {
  const bodyHtml = escapeHtml(message).split(/\r?\n/).join("<br/>\n");

  const content = [
    heading(title),
    paragraph(bodyHtml),
  ].join("");

  return emailLayout(content, title);
}

// ── Dead-code compat (exported but unused — kept for safety) ───────
export const emailTemplates = {
  verifyEmail: (name: string, token: string, baseUrl: string) => {
    const url = `${baseUrl.replace(/\/$/, "")}${PORTAL_ACCOUNT_PREFIX}/verify-email?token=${token}`;
    const content = [
      heading("Verify Your Account"),
      paragraph(`Hi <strong>${escapeHtml(name)}</strong>, welcome to PouchCare!`),
      paragraph("Click the button below to verify your email address."),
      primaryButton("Verify Email Address", url),
    ].join("");
    return {
      subject: "Verify your PouchCare account",
      html: emailLayout(content, "Verify your email"),
    };
  },
  resetPassword: (name: string, token: string, baseUrl: string) => {
    const url = `${baseUrl.replace(/\/$/, "")}${PORTAL_ACCOUNT_PREFIX}/reset-password?token=${token}`;
    const content = [
      heading("Reset Your Password"),
      paragraph(`Hi <strong>${escapeHtml(name)}</strong>, we received a request to reset your password.`),
      primaryButton("Reset Password", url),
      paragraph(`<span style="font-size:13px;color:${BRAND.muted};">This link expires in 1 hour.</span>`),
    ].join("");
    return {
      subject: "Reset your PouchCare password",
      html: emailLayout(content, "Password reset request"),
    };
  },
};

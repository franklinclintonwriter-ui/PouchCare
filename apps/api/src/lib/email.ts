import { env } from '@/config/env'

async function getResend() {
  const { Resend } = await import('resend')
  return new Resend(env.RESEND_API_KEY)
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY) {
    console.log(`[DEV] Email → ${to} | ${subject}`)
    return
  }
  const resend = await getResend()
  await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html })
}

/** Broadcast batch: returns outcome per send (Resend missing = skipped, not failed). */
export async function sendBroadcastEmail(
  to: string,
  subject: string,
  html: string,
): Promise<'sent' | 'skipped' | 'failed'> {
  if (!env.RESEND_API_KEY) {
    console.log(`[DEV] Email → ${to} | ${subject}`)
    return 'skipped'
  }
  try {
    const resend = await getResend()
    await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html })
    return 'sent'
  } catch (err) {
    console.error('[broadcast email]', to, err)
    return 'failed'
  }
}

/** Client account area on PORTAL_URL (same host as marketing site, e.g. pouchcare.com/my-accounts/…). */
const PORTAL_ACCOUNT_PREFIX = '/my-accounts'

export async function sendPasswordResetEmail(to: string, token: string, isPortal = false) {
  const base = isPortal ? env.PORTAL_URL : env.FRONTEND_URL
  const path = isPortal ? `${PORTAL_ACCOUNT_PREFIX}/reset-password` : '/reset-password'
  const url = `${base.replace(/\/$/, '')}${path}?token=${token}`
  await sendEmail(to, 'Reset your PouchCare password',
    `<p>Click <a href="${url}">here</a> to reset your password. Expires in 1 hour.</p>`)
}

export async function sendVerificationEmail(to: string, token: string, baseUrl?: string) {
  const base = (baseUrl ?? env.PORTAL_URL).replace(/\/$/, '')
  const url = `${base}${PORTAL_ACCOUNT_PREFIX}/verify-email?token=${token}`
  await sendEmail(to, 'Verify your PouchCare account',
    `<p>Click <a href="${url}">here</a> to verify your email.</p>`)
}

export const emailTemplates = {
  verifyEmail: (name: string, token: string, baseUrl: string) => ({
    subject: 'Verify your PouchCare account',
    html: `<p>Hi ${name}, click <a href="${baseUrl.replace(/\/$/, '')}${PORTAL_ACCOUNT_PREFIX}/verify-email?token=${token}">here</a> to verify your email.</p>`,
  }),
  resetPassword: (name: string, token: string, baseUrl: string) => ({
    subject: 'Reset your PouchCare password',
    html: `<p>Hi ${name}, click <a href="${baseUrl.replace(/\/$/, '')}${PORTAL_ACCOUNT_PREFIX}/reset-password?token=${token}">here</a> to reset your password. Expires in 1 hour.</p>`,
  }),
}

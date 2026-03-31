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

export async function sendPasswordResetEmail(to: string, token: string, _isPortal = true) {
  const url = `${env.FRONTEND_URL}/reset-password?token=${token}`
  await sendEmail(to, 'Reset your PouchCare password',
    `<p>Click <a href="${url}">here</a> to reset your password. Expires in 1 hour.</p>`)
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${env.FRONTEND_URL}/verify-email?token=${token}`
  await sendEmail(to, 'Verify your PouchCare account',
    `<p>Click <a href="${url}">here</a> to verify your email.</p>`)
}

export const emailTemplates = {
  verifyEmail: (name: string, token: string, baseUrl: string) => ({
    subject: 'Verify your PouchCare account',
    html: `<p>Hi ${name}, click <a href="${baseUrl}/verify-email?token=${token}">here</a> to verify your email.</p>`,
  }),
  resetPassword: (name: string, token: string, baseUrl: string) => ({
    subject: 'Reset your PouchCare password',
    html: `<p>Hi ${name}, click <a href="${baseUrl}/reset-password?token=${token}">here</a> to reset your password. Expires in 1 hour.</p>`,
  }),
}

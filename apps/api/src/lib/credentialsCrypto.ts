import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { env } from '@/config/env'

const PREFIX = 'v1:'
const IV_LEN = 12

function key32(): Buffer {
  const secret = process.env.VIGI_CREDENTIALS_KEY?.trim()
  if (secret && secret.length >= 32) {
    if (/^[0-9a-fA-F]{64}$/.test(secret)) return Buffer.from(secret, 'hex')
    return Buffer.from(secret.slice(0, 32), 'utf8')
  }
  return scryptSync(env.JWT_SECRET, 'pouchcare-vigi-creds', 32)
}

/** AES-256-GCM; output format: v1:base64(iv+ciphertext+tag) */
export function encryptCredential(plain: string): string {
  const key = key32()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const out = Buffer.concat([iv, enc, tag])
  return PREFIX + out.toString('base64')
}

export function decryptCredential(blob: string): string {
  if (!blob.startsWith(PREFIX)) {
    throw new Error('Unsupported credential blob format')
  }
  const raw = Buffer.from(blob.slice(PREFIX.length), 'base64')
  const iv = raw.subarray(0, IV_LEN)
  const tag = raw.subarray(raw.length - 16)
  const data = raw.subarray(IV_LEN, raw.length - 16)
  const key = key32()
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

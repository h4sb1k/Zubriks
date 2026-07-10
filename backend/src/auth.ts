import bcrypt from 'bcryptjs'
import { Response } from 'express'
import jwt from 'jsonwebtoken'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    // In development, use deterministic fallbacks; in production, crash.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${name}`)
    }
    return `dev-fallback-${name}`
  }
  return value
}

const JWT_ACCESS_SECRET = requireEnv('JWT_ACCESS_SECRET')
const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET')

// Tokens expire configuration
const ACCESS_TOKEN_EXPIRES_IN = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7

const isDev = process.env.NODE_ENV !== 'production'

const COOKIE_OPTIONS_BASE = {
  httpOnly: true,
  // В dev используем 'lax', т.к. localhost не поддерживает sameSite=none без HTTPS
  // В prod используем 'none' + secure для cross-origin запросов
  secure: !isDev,
  sameSite: isDev ? ('lax' as const) : ('none' as const),
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRES_IN_DAYS}d` })
}

export function verifyAccessToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string }
  } catch (err) {
    return null
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
  } catch (err) {
    return null
  }
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  // Access token cookie
  res.cookie('accessToken', accessToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: 15 * 60 * 1000, // 15 minutes
  })

  // Refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000, // 7 days
  })
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', COOKIE_OPTIONS_BASE)
  res.clearCookie('refreshToken', COOKIE_OPTIONS_BASE)
}

export function getRefreshTokenExpiry(): Date {
  const date = new Date()
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS)
  return date
}

// ─── Cloudflare Turnstile ──────────────────────────────────────────

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA' // Default to Cloudflare "always passes" dummy key for dev

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!token) return false

  try {
    const formData = new URLSearchParams()
    formData.append('secret', TURNSTILE_SECRET_KEY)
    formData.append('response', token)

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    })

    const outcome = (await result.json()) as { success: boolean }
    return outcome.success
  } catch (err) {
    console.error('Turnstile verification error:', err)
    return false
  }
}

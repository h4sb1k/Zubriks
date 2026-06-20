import bcrypt from 'bcryptjs'
import { Response } from 'express'
import jwt from 'jsonwebtoken'

// Use environment variables in production
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'super-secret-access-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key'

// Tokens expire configuration
const ACCESS_TOKEN_EXPIRES_IN = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7

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
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  })

  // Refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000, // 7 days
  })
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')
}

export function getRefreshTokenExpiry(): Date {
  const date = new Date()
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS)
  return date
}

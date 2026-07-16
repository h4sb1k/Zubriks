import crypto from 'crypto'
import dns from 'dns/promises'
import fs from 'fs'
import net from 'net'
import path from 'path'
import sharp from 'sharp'
import { URL } from 'url'

const uploadDir = path.join(__dirname, '../../public/images/uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// ─── Storage Interface ───
export type StorageProvider = {
  saveImage(buffer: Buffer): Promise<string>
}

// ─── Local Storage Implementation ───
export class LocalDiskStorage implements StorageProvider {
  async saveImage(buffer: Buffer): Promise<string> {
    // Process to WebP in memory first
    const processedBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer()

    // Calculate SHA-256 hash of the processed image for deduplication
    const hash = crypto.createHash('sha256').update(processedBuffer).digest('hex')
    const filename = `${hash}.webp`
    const filepath = path.join(uploadDir, filename)

    // Only write to disk if this exact image doesn't exist yet
    if (!fs.existsSync(filepath)) {
      await fs.promises.writeFile(filepath, processedBuffer)
    }

    return `/images/uploads/${filename}`
  }
}

const storageProvider = new LocalDiskStorage()

// ─── Security Validators (SSRF Prevention) ───

function isInternalIp(ip: string): boolean {
  if (ip === '::1') return true
  if (!ip.includes('.')) return false // Basic skip for other IPv6 for now
  
  if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) return true
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10)
    if (second >= 16 && second <= 31) return true
  }
  return false
}

async function isSafeUrl(urlString: string): Promise<boolean> {
  try {
    const parsed = new URL(urlString)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    if (parsed.hostname === 'localhost') return false

    // If it's already an IP
    if (net.isIP(parsed.hostname)) {
      return !isInternalIp(parsed.hostname)
    }

    // Resolve IP to prevent SSRF via DNS rebinding / internal IPs
    const addresses = await dns.resolve(parsed.hostname)
    for (const ip of addresses) {
      if (isInternalIp(ip)) return false
    }
    return true
  } catch (e) {
    return false
  }
}

// ─── External Fetch Logic ───

export async function processAndSaveExternalImage(url: string | null | undefined): Promise<string | null> {
  if (!url) return null

  // If it's already a local URL (e.g. /images/... or uploaded just now), return it as is
  if (url.startsWith('/') || url.includes('/images/uploads/')) {
    return url
  }

  const isSafe = await isSafeUrl(url)
  if (!isSafe) {
    throw new Error('Invalid or unsafe image URL')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'image/*'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL does not point to a valid image')
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      throw new Error('Image exceeds 5MB limit')
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('Image exceeds 5MB limit')
    }

    return await storageProvider.saveImage(buffer)
  } catch (error: any) {
    throw new Error(`Image processing failed: ${error.message}`)
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function processAndSaveUpload(buffer: Buffer): Promise<string> {
  return await storageProvider.saveImage(buffer)
}

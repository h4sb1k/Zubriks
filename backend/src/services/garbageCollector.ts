import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

export async function runGarbageCollection(prisma: PrismaClient): Promise<{ deletedCount: number; bytesFreed: number }> {
  console.info('[GC] Starting Image Garbage Collection...')
  const uploadDir = path.join(__dirname, '../../public/images/uploads')
  
  // 1. Get all files on disk
  let files: string[] = []
  try {
    files = await fs.readdir(uploadDir)
  } catch (error) {
    console.error('[GC] Could not read upload directory', error)
    return { deletedCount: 0, bytesFreed: 0 }
  }

  // 2. Gather all used URLs from the database
  const usedUrls = new Set<string>()

  // Zubriks
  const zubriks = await prisma.zubrik.findMany({ select: { imageUrl: true } })
  zubriks.forEach(z => { if (z.imageUrl) usedUrls.add(z.imageUrl) })

  // Achievements
  const achievements = await prisma.achievement.findMany({ select: { imageUrl: true } })
  achievements.forEach(a => { if (a.imageUrl) usedUrls.add(a.imageUrl) })

  // Routes
  const routes = await prisma.route.findMany({ select: { imageUrl: true } })
  routes.forEach(r => { if (r.imageUrl) usedUrls.add(r.imageUrl) })

  // Users (Avatars)
  const users = await prisma.user.findMany({ select: { avatarUrl: true } })
  users.forEach(u => { if (u.avatarUrl) usedUrls.add(u.avatarUrl) })

  // Events
  const events = await prisma.event.findMany({ select: { imageUrl: true } })
  events.forEach(e => { if (e.imageUrl) usedUrls.add(e.imageUrl) })

  // 3. Find orphaned files
  let deletedCount = 0
  let bytesFreed = 0

  for (const file of files) {
    // Only check files directly in uploads directory
    const fileUrl = `/images/uploads/${file}`
    
    if (!usedUrls.has(fileUrl)) {
      // File is orphaned!
      const filePath = path.join(uploadDir, file)
      try {
        const stats = await fs.stat(filePath)
        if (stats.isFile()) {
          await fs.unlink(filePath)
          deletedCount++
          bytesFreed += stats.size
          console.info(`[GC] Deleted orphaned file: ${file}`)
        }
      } catch (err) {
        console.error(`[GC] Failed to delete file ${file}`, err)
      }
    }
  }

  console.info(`[GC] Finished. Deleted ${deletedCount} files. Freed ${(bytesFreed / 1024 / 1024).toFixed(2)} MB.`)
  return { deletedCount, bytesFreed }
}

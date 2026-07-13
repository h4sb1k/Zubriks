import * as trpcExpress from '@trpc/server/adapters/express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import path from 'path'

import { adminRouter,createAdminContext, createContext, trpcRouter } from './trpc'
import { upload } from './upload'

const expressApp = express()
expressApp.use(cookieParser())

// Serve static images from /public/images
expressApp.use('/images', express.static(path.join(__dirname, '../public/images')))

// Public CORS
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : true // In development, allow all origins
const publicCors = cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
})

// Admin CORS
const ADMIN_ORIGINS = process.env.ADMIN_CORS_ORIGINS ? process.env.ADMIN_CORS_ORIGINS.split(',') : ['http://localhost:5174'] // Admin Vite port
const adminCors = cors({
  origin: (origin, callback) => {
    if (!origin || ADMIN_ORIGINS.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost'))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
})

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // Relaxed for development
  message: { error: { message: 'Слишком много попыток входа, повторите позже.' } },
})

// Mount public API
expressApp.use(
  '/trpc',
  publicCors,
  trpcExpress.createExpressMiddleware({
    router: trpcRouter,
    createContext,
  })
)

// Mount admin API
// 1. CORS first! Otherwise, rate limiters or OPTIONS requests fail
expressApp.use('/admin-api', adminCors)

// 2. Rate limiters
expressApp.use('/admin-api/trpc/adminLogin', adminLoginLimiter)
expressApp.use('/admin-api/trpc/adminVerify2FA', adminLoginLimiter)

// Image Upload Endpoint (must have valid admin accessToken cookie)
import { verifyAdminAccessToken } from './auth'
expressApp.post('/admin-api/upload', adminCors, upload.single('file'), (req, res) => {
  try {
    const token = req.cookies?.admin_at
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const payload = verifyAdminAccessToken(token)
    if (!payload) return res.status(401).json({ error: 'Unauthorized' })

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Return the public URL for the uploaded file
    const url = `/images/uploads/${req.file.filename}`
    res.json({ url })
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' })
  }
})

// 3. tRPC Route
expressApp.use(
  '/admin-api/trpc',
  trpcExpress.createExpressMiddleware({
    router: adminRouter,
    createContext: createAdminContext,
  })
)

const PORT = process.env.PORT || 3000
expressApp.listen(PORT, () => {
  console.info(`Server is running on http://localhost:${PORT}`)
})

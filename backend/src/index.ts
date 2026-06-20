import * as trpcExpress from '@trpc/server/adapters/express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { createContext, trpcRouter } from './trpc'

const expressApp = express()

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : true // In development, allow all origins

expressApp.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
)
expressApp.use(cookieParser())

expressApp.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: trpcRouter,
    createContext,
  })
)

const PORT = process.env.PORT || 3000
expressApp.listen(PORT, () => {
  console.info(`Server is running on http://localhost:${PORT}`)
})

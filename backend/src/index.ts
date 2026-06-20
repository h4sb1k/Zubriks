import * as trpcExpress from '@trpc/server/adapters/express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { createContext, trpcRouter } from './trpc'

const expressApp = express()

expressApp.use(
  cors({
    origin: true, // В production лучше указать конкретный домен
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

expressApp.listen(3000, () => {
  console.info('Server is running on http://localhost:3000')
})

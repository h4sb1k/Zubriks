import { initTRPC, TRPCError } from '@trpc/server'
import { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { orderBy } from 'lodash'
import { z } from 'zod'

import {
  clearAuthCookies,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashPassword,
  setAuthCookies,
  verifyAccessToken,
  verifyPassword,
} from './auth'
import { prisma } from './prisma'

export const createContext = async ({ req, res }: CreateExpressContextOptions) => {
  let userId: string | null = null

  const accessToken = req.cookies?.accessToken
  if (accessToken) {
    const payload = verifyAccessToken(accessToken)
    if (payload) {
      userId = payload.userId
    }
  }

  return { req, res, prisma, userId }
}

type Context = Awaited<ReturnType<typeof createContext>>

const trpc = initTRPC.context<Context>().create()

const protectedProcedure = trpc.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      userId: ctx.userId,
    },
  })
})

type Achievement = {
  id: string
  name: string
  description: string
  earned: boolean
  progress?: number
  emoji: string
}

// const mockAchievements: Achievement[] = [
//   { id: '1', name: 'Начало пути', description: 'Найди своего первого зубрика', earned: true, emoji: '🦬' },
//   { id: '2', name: 'Исследователь', description: 'Найди 5 зубриков', earned: true, emoji: '🗺️' },
//   { id: '3', name: 'Путешественник', description: 'Пройди 10 км по городу', earned: true, emoji: '🚶' },
//   { id: '4', name: 'Коллекционер', description: 'Найди 10 зубриков', earned: false, progress: 60, emoji: '📦' },
//   { id: '5', name: 'Знаток истории', description: 'Посети все музеи', earned: false, progress: 40, emoji: '🏛️' },
//   { id: '6', name: 'Мастер маршрутов', description: 'Создай 5 маршрутов', earned: false, emoji: '🗺️' },
//   { id: '7', name: 'Легенда Орла', description: 'Найди всех зубриков', earned: false, emoji: '👑' },
//   { id: '8', name: 'Активист', description: 'Посети 10 событий', earned: false, emoji: '🎉' },
// ]

export const trpcRouter = trpc.router({
  // ─── Auth ────────────────────────────────────────────────────────

  register: trpc.procedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const existingUser = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists' })
      }
      const passwordHash = await hashPassword(input.password)
      const user = await ctx.prisma.user.create({
        data: { email: input.email, passwordHash, name: input.name },
      })

      const accessToken = generateAccessToken(user.id)
      const refreshToken = generateRefreshToken(user.id)

      await ctx.prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt: getRefreshTokenExpiry() },
      })

      setAuthCookies(ctx.res, accessToken, refreshToken)
      return { user: { id: user.id, email: user.email, name: user.name } }
    }),

  login: trpc.procedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
      }
      const isValid = await verifyPassword(input.password, user.passwordHash)
      if (!isValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
      }

      const accessToken = generateAccessToken(user.id)
      const refreshToken = generateRefreshToken(user.id)

      await ctx.prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt: getRefreshTokenExpiry() },
      })

      setAuthCookies(ctx.res, accessToken, refreshToken)
      return { user: { id: user.id, email: user.email, name: user.name } }
    }),

  logout: trpc.procedure.mutation(async ({ ctx }) => {
    const refreshToken = ctx.req.cookies?.refreshToken
    if (refreshToken) {
      await ctx.prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }
    clearAuthCookies(ctx.res)
    return { success: true }
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({ where: { id: ctx.userId } })
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })
    return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl }
  }),

  getZubriks: trpc.procedure.query(async ({ ctx }) => {
    const zubriks = await ctx.prisma.zubrik.findMany({
      orderBy: { createdAt: 'asc' },
    })

    let unlockedIds = new Set<string>()
    if (ctx.userId) {
      const userZubriks = await ctx.prisma.userZubrik.findMany({ where: { userId: ctx.userId } })
      userZubriks.forEach((uz) => unlockedIds.add(uz.zubrikId))
    }

    return {
      zubriks: zubriks.map((z) => ({
        id: z.id,
        name: z.name,
        description: z.description,
        distance: '', // вычисляется на клиенте из координат
        unlocked: unlockedIds.has(z.id),
        imageColor: z.imageColor,
        imageUrl: z.imageUrl ?? '',
        coordinates: [z.latitude, z.longitude, z.locationName] as [number, number, string],
      })),
    }
  }),

  // ─── События ─────────────────────────────────────────────────────
  getEvents: trpc.procedure.query(async () => {
    const events = await prisma.event.findMany({
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    return {
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date.toISOString(),
        time: e.time,
        venue: e.venue,
        category: e.category,
        price: e.price,
        imageUrl: e.imageUrl,
        url: e.url,
      })),
    }
  }),

  // ─── Маршруты ────────────────────────────────────────────────────
  getRoutes: trpc.procedure.query(async () => {
    const routes = await prisma.route.findMany({
      where: { isMain: false },
      include: {
        author: { select: { name: true } },
        _count: { select: { waypoints: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const mainRoute = await prisma.route.findFirst({
      where: { isMain: true },
      include: { _count: { select: { waypoints: true } } },
    })

    return {
      routes: routes.map((r) => ({
        id: r.id,
        name: r.name,
        distance: r.distance,
        duration: r.duration,
        stops: r._count.waypoints,
        author: r.author?.name ?? 'Аноним',
        description: r.description,
        liked: false, // TODO: определять по UserRoute после реализации авторизации
        imageColor: r.imageColor ?? '#1A3D2B',
      })),
      mainRoute: mainRoute
        ? {
            id: mainRoute.id,
            name: mainRoute.name,
            distance: mainRoute.distance,
            duration: mainRoute.duration,
            stops: mainRoute._count.waypoints,
            description: mainRoute.description,
          }
        : null,
    }
  }),

  // ---Главный маршрут ----
  getMainRoute: trpc.procedure.query(async () => {
    const mainRoute = await prisma.route.findFirst({
      where: { isMain: true },
      include: { _count: { select: { waypoints: true } } },
    })

    if (!mainRoute) {
      return null
    }
    return {
      mainRoute: {
        id: mainRoute.id,
        name: mainRoute.name,
        distance: mainRoute.distance,
        duration: mainRoute.duration,
        stops: mainRoute._count.waypoints,
        description: mainRoute.description,
      },
    }
  }),

  // ─── Точки маршрута ──────────────────────────────────────────────
  getRouteWaypoints: trpc.procedure.input(z.object({ routeId: z.string() })).query(async ({ input }) => {
    const waypoints = await prisma.waypoint.findMany({
      where: { routeId: input.routeId },
      orderBy: { orderIndex: 'asc' },
    })

    return {
      waypoints: waypoints.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description ?? '',
        emoji: w.emoji ?? '📍',
        latitude: w.latitude,
        longitude: w.longitude,
        orderIndex: w.orderIndex,
        completed: false, // TODO: определять по UserWaypoint после реализации авторизации
      })),
    }
  }),

  // --- Ачивки ---
  getAchievements: trpc.procedure.query(async ({ ctx }) => {
    const achievements = await ctx.prisma.achievement.findMany()

    let earnedMap = new Map<string, { earned: boolean; progress: number }>()
    if (ctx.userId) {
      const userAchievements = await ctx.prisma.userAchievement.findMany({ where: { userId: ctx.userId } })
      userAchievements.forEach((ua) => earnedMap.set(ua.achievementId, { earned: ua.earned, progress: ua.progress }))
    }

    return {
      achievements: achievements.map((a) => {
        const userState = earnedMap.get(a.id) || { earned: false, progress: 0 }
        return {
          id: a.id,
          name: a.name,
          description: a.description,
          imageUrl: a.imageUrl,
          emoji: a.emoji ?? '🏆',
          earned: userState.earned,
          progress: userState.progress,
        }
      }),
    }
  }),
})

export type TrpcRouter = typeof trpcRouter

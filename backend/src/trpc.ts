import { initTRPC, TRPCError } from '@trpc/server'
import { CreateExpressContextOptions } from '@trpc/server/adapters/express'
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
  verifyRefreshToken,
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

  // If access token is missing or expired, try to refresh using refresh token
  if (!userId) {
    const refreshTokenValue = req.cookies?.refreshToken
    if (refreshTokenValue) {
      const payload = verifyRefreshToken(refreshTokenValue)
      if (payload) {
        // Verify the refresh token exists in DB and hasn't expired
        const storedToken = await prisma.refreshToken.findUnique({
          where: { token: refreshTokenValue },
        })
        if (storedToken && storedToken.expiresAt > new Date()) {
          userId = payload.userId

          // Rotate tokens: delete old, create new
          await prisma.refreshToken.delete({ where: { id: storedToken.id } })

          const newAccessToken = generateAccessToken(userId)
          const newRefreshToken = generateRefreshToken(userId)
          await prisma.refreshToken.create({
            data: { token: newRefreshToken, userId, expiresAt: getRefreshTokenExpiry() },
          })
          setAuthCookies(res, newAccessToken, newRefreshToken)
        }
      }
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

      // Clean up expired refresh tokens for this user
      await ctx.prisma.refreshToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
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

      // Clean up expired refresh tokens for this user
      await ctx.prisma.refreshToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      })

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

  getProfileStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: {
        _count: {
          select: { unlockedZubriks: true }
        },
        routeInteractions: {
          include: {
            route: { include: { _count: { select: { waypoints: true } } } }
          }
        },
        createdRoutes: {
          include: { _count: { select: { waypoints: true } } }
        }
      }
    })

    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })

    const daysInApp = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const completedRoutesCount = user.routeInteractions.filter(r => r.completedAt !== null).length

    const mapRoute = (r: { id: string; name: string; distance: string; duration: string; description: string | null; imageColor: string | null; _count: { waypoints: number } }) => ({
      id: r.id,
      name: r.name,
      distance: r.distance,
      duration: r.duration,
      stops: r._count.waypoints,
      description: r.description,
      imageColor: r.imageColor ?? '#1A3D2B',
    })

    return {
      stats: {
        zubriksCount: user._count.unlockedZubriks,
        routesCount: completedRoutesCount,
        daysCount: daysInApp,
      },
      likedRoutes: user.routeInteractions.filter(r => r.liked).map(r => mapRoute(r.route)),
      createdRoutes: user.createdRoutes.map(mapRoute),
    }
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
  getEvents: trpc.procedure.query(async ({ ctx }) => {
    const events = await ctx.prisma.event.findMany({
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
  getRoutes: trpc.procedure.query(async ({ ctx }) => {
    const routes = await ctx.prisma.route.findMany({
      where: { isMain: false },
      include: {
        author: { select: { name: true } },
        _count: { select: { waypoints: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Get liked route IDs for the current user
    let likedRouteIds = new Set<string>()
    if (ctx.userId) {
      const userRoutes = await ctx.prisma.userRoute.findMany({
        where: { userId: ctx.userId, liked: true },
        select: { routeId: true },
      })
      userRoutes.forEach((ur) => likedRouteIds.add(ur.routeId))
    }

    const mainRoute = await ctx.prisma.route.findFirst({
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
        liked: likedRouteIds.has(r.id),
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
  getMainRoute: trpc.procedure.query(async ({ ctx }) => {
    const mainRoute = await ctx.prisma.route.findFirst({
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
  getRouteWaypoints: trpc.procedure.input(z.object({ routeId: z.string() })).query(async ({ input, ctx }) => {
    const waypoints = await ctx.prisma.waypoint.findMany({
      where: { routeId: input.routeId },
      orderBy: { orderIndex: 'asc' },
    })

    let completedIds = new Set<string>()
    if (ctx.userId) {
      const userWaypoints = await ctx.prisma.userWaypoint.findMany({
        where: { userId: ctx.userId, waypointId: { in: waypoints.map(w => w.id) } },
        select: { waypointId: true },
      })
      userWaypoints.forEach((uw) => completedIds.add(uw.waypointId))
    }

    return {
      waypoints: waypoints.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description ?? '',
        emoji: w.emoji ?? '📍',
        latitude: w.latitude,
        longitude: w.longitude,
        orderIndex: w.orderIndex,
        completed: completedIds.has(w.id),
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

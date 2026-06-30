import { PrismaClient } from '@prisma/client'
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
      ...ctx,           // сохраняем prisma, req, res
      userId: ctx.userId, // userId точно не null (TypeScript знает это)
    },
  })
})

async function checkAndAwardAchievements(prisma: PrismaClient, userId: string) {
  const [unlockedZubriks, totalZubriks, completedRoutes, createdRoutes] = await Promise.all([
    prisma.userZubrik.findMany({ where: { userId }, include: { zubrik: true } }),
    prisma.zubrik.count(),
    prisma.userRoute.count({ where: { userId, completedAt: { not: null } } }),
    prisma.route.count({ where: { authorId: userId } }),
  ])

  const zubrikCount = unlockedZubriks.length
  const unlockedNames = new Set(unlockedZubriks.map((uz) => uz.zubrik.name))

  // Правила ачивок: { название_ачивки → условие }
  const rules: Record<string, boolean> = {
    'Первая находка': zubrikCount >= 1,
    Исследователь: zubrikCount >= 5,
    Коллекционер: zubrikCount >= 10,
    'Легенда Орла': zubrikCount >= totalZubriks && totalZubriks > 0,
    'Мастер маршрутов': createdRoutes >= 5,
    
    // Индивидуальные ачивки за зубриков
    'Знаток истории': unlockedNames.has('Зубрик-Историк'),
    'Знаток классики': unlockedNames.has('Зубрик-Литератор'),
    'Главный дегустатор': unlockedNames.has('Зубрик-Гурман'),
  }

  // Получаем все ачивки из БД
  const allAchievements = await prisma.achievement.findMany()
  const existingUserAchievements = await prisma.userAchievement.findMany({
    where: { userId, earned: true },
    select: { achievementId: true },
  })
  const earnedIds = new Set(existingUserAchievements.map((a) => a.achievementId))

  const newlyEarned: { id: string; name: string; description: string; emoji: string; imageUrl: string }[] = []

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) continue // уже получена
    const shouldEarn = rules[achievement.name]
    if (!shouldEarn) continue

    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      create: { userId, achievementId: achievement.id, earned: true, earnedAt: new Date(), progress: 100 },
      update: { earned: true, earnedAt: new Date(), progress: 100 },
    })

    newlyEarned.push({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description ?? '',
      emoji: achievement.emoji ?? '🏆',
      imageUrl: achievement.imageUrl ?? '',
    })
  }

  return newlyEarned
}

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
        data: { email: input.email, passwordHash, name: input.name, avatarUrl: '/images/avatar.png' },
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

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const achievement = await ctx.prisma.achievement.findFirst({ where: { name: 'Начало пути' } })
    if (!achievement) return { success: false }

    const existing = await ctx.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId: ctx.userId, achievementId: achievement.id } },
    })

    if (!existing) {
      await ctx.prisma.userAchievement.create({
        data: { userId: ctx.userId, achievementId: achievement.id, earned: true, earnedAt: new Date(), progress: 100 },
      })
      return {
        success: true,
        newAchievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description ?? '',
          emoji: achievement.emoji ?? '🏆',
          imageUrl: achievement.imageUrl ?? '',
        },
      }
    }
    return { success: false }
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
          select: { unlockedZubriks: true },
        },
        routeInteractions: {
          include: {
            route: { include: { _count: { select: { waypoints: true } } } },
          },
        },
        createdRoutes: {
          include: { _count: { select: { waypoints: true } } },
        },
      },
    })

    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })

    const daysInApp = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const completedRoutesCount = user.routeInteractions.filter((r) => r.completedAt !== null).length

    const mapRoute = (r: {
      id: string
      name: string
      distance: string
      duration: string
      description: string | null
      imageColor: string | null
      _count: { waypoints: number }
    }) => ({
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
      likedRoutes: user.routeInteractions.filter((r) => r.liked).map((r) => mapRoute(r.route)),
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
        emoji: r.emoji ?? '📍',
      })),
      mainRoute: mainRoute
        ? {
            id: mainRoute.id,
            name: mainRoute.name,
            distance: mainRoute.distance,
            duration: mainRoute.duration,
            stops: mainRoute._count.waypoints,
            description: mainRoute.description,
            emoji: mainRoute.emoji ?? '👑',
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
        emoji: mainRoute.emoji ?? '👑',
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
        where: { userId: ctx.userId, waypointId: { in: waypoints.map((w) => w.id) } },
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

  // ─── Взаимодействие с маршрутами ─────────────────────────────────
  toggleRouteLike: protectedProcedure
    .input(z.object({ routeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Ищем, есть ли уже запись взаимодействия
      const userRoute = await ctx.prisma.userRoute.findUnique({
        where: { userId_routeId: { userId: ctx.userId, routeId: input.routeId } },
      })

      if (userRoute) {
        // Запись есть — переключаем статус
        const updated = await ctx.prisma.userRoute.update({
          where: { userId_routeId: { userId: ctx.userId, routeId: input.routeId } },
          data: { liked: !userRoute.liked },
        })
        return { liked: updated.liked }
      } else {
        // Записи нет — создаём и сразу лайкаем
        const created = await ctx.prisma.userRoute.create({
          data: { userId: ctx.userId, routeId: input.routeId, liked: true },
        })
        return { liked: created.liked }
      }
    }),

  // ─── Создание маршрута ───────────────────────────────────────────
  createRoute: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        imageColor: z.string().optional(),
        emoji: z.string().optional(),
        waypoints: z
          .array(
            z.object({
              name: z.string().min(1),
              description: z.string().optional(),
              emoji: z.string().optional(),
              latitude: z.number(),
              longitude: z.number(),
            }),
          )
          .min(2, 'Маршрут должен содержать минимум 2 точки'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Рассчитываем расстояние и время (Haversine formula)
      let totalKm = 0
      for (let i = 0; i < input.waypoints.length - 1; i++) {
        const p1 = input.waypoints[i]
        const p2 = input.waypoints[i+1]
        const R = 6371
        const dLat = (p2.latitude - p1.latitude) * (Math.PI/180)
        const dLon = (p2.longitude - p1.longitude) * (Math.PI/180)
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(p1.latitude * (Math.PI/180)) * Math.cos(p2.latitude * (Math.PI/180)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        totalKm += R * c
      }

      const distanceStr = totalKm < 0.1 ? '0.1' : totalKm.toFixed(1)
      const estimatedMin = Math.max(1, Math.round((totalKm / 5) * 60))
      const duration =
        estimatedMin < 60
          ? `${estimatedMin} мин`
          : `${Math.floor(estimatedMin / 60)} ч ${estimatedMin % 60 > 0 ? (estimatedMin % 60) + ' мин' : ''}`.trim()

      let finalName = input.name
      const existingRoute = await ctx.prisma.route.findFirst({
        where: { name: finalName }
      })

      if (existingRoute) {
        const hash = Math.floor(1000 + Math.random() * 9000)
        finalName = `${finalName} #${hash}`
      }

      const route = await ctx.prisma.route.create({
        data: {
          name: finalName,
          description: input.description,
          distance: `${distanceStr} км`,
          duration,
          imageColor: input.imageColor ?? '#1A3D2B',
          emoji: input.emoji ?? '📍',
          isMain: false,
          authorId: ctx.userId,
          waypoints: {
            create: input.waypoints.map((wp, idx) => ({
              name: wp.name,
              description: wp.description,
              emoji: wp.emoji ?? '📍',
              latitude: wp.latitude,
              longitude: wp.longitude,
              orderIndex: idx,
            })),
          },
        },
        include: { _count: { select: { waypoints: true } } },
      })

      return {
        id: route.id,
        name: route.name,
        distance: route.distance,
        duration: route.duration,
        stops: route._count.waypoints,
      }
    }),

  // --- Геймификация ---
  completeWaypoint: protectedProcedure.input(z.object({ waypointId: z.string() })).mutation(async ({ input, ctx }) => {
    // 1. Проверяем, что waypoint существует
    const waypoint = await ctx.prisma.waypoint.findUnique({
      where: { id: input.waypointId },
      include: { route: true },
    })
    if (!waypoint) throw new TRPCError({ code: 'NOT_FOUND' })

    // 2. Записываем прогресс (upsert чтобы не падать при повторном вызове)
    await ctx.prisma.userWaypoint.upsert({
      where: { userId_waypointId: { userId: ctx.userId, waypointId: input.waypointId } },
      create: { userId: ctx.userId, waypointId: input.waypointId },
      update: {},
    })

    // 3. Проверяем, все ли точки маршрута пройдены → отмечаем маршрут как завершённый
    const totalWaypoints = await ctx.prisma.waypoint.count({ where: { routeId: waypoint.routeId } })
    const completedWaypoints = await ctx.prisma.userWaypoint.count({
      where: {
        userId: ctx.userId,
        waypoint: { routeId: waypoint.routeId },
      },
    })

    if (completedWaypoints >= totalWaypoints) {
      await ctx.prisma.userRoute.upsert({
        where: { userId_routeId: { userId: ctx.userId, routeId: waypoint.routeId } },
        create: { userId: ctx.userId, routeId: waypoint.routeId, completedAt: new Date(), startedAt: new Date() },
        update: { completedAt: new Date() },
      })
    }

    // 4. Проверяем ачивки
    const newAchievements = await checkAndAwardAchievements(ctx.prisma, ctx.userId)
    return { completed: true, routeCompleted: completedWaypoints >= totalWaypoints, newAchievements }
  }),

  unlockZubrik: protectedProcedure.input(z.object({ zubrikId: z.string() })).mutation(async ({ input, ctx }) => {
    const zubrik = await ctx.prisma.zubrik.findUnique({ where: { id: input.zubrikId } })
    if (!zubrik) throw new TRPCError({ code: 'NOT_FOUND' })

    // Upsert — безопасно при повторном вызове
    await ctx.prisma.userZubrik.upsert({
      where: { userId_zubrikId: { userId: ctx.userId, zubrikId: input.zubrikId } },
      create: { userId: ctx.userId, zubrikId: input.zubrikId },
      update: {},
    })

    const newAchievements = await checkAndAwardAchievements(ctx.prisma, ctx.userId)
    return { unlocked: true, newAchievements }
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

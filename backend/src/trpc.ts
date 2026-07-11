import { PrismaClient } from '@prisma/client'
import { initTRPC, TRPCError } from '@trpc/server'
import { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import * as OTPAuth from 'otpauth'
import { z } from 'zod'

import {
  clearAdminAuthCookies,
  clearAuthCookies,
  generateAccessToken,
  generateAdminAccessToken,
  generateAdminRefreshToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashPassword,
  setAdminAuthCookies,
  setAuthCookies,
  verifyAccessToken,
  verifyAdminAccessToken,
  verifyAdminRefreshToken,
  verifyPassword,
  verifyRefreshToken,
  verifyTurnstileToken} from './auth'
import { generateOTP, sendVerificationEmail } from './email'
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

export const createAdminContext = async ({ req, res }: CreateExpressContextOptions) => {
  let userId: string | null = null

  const accessToken = req.cookies?.admin_at
  if (accessToken) {
    const payload = verifyAdminAccessToken(accessToken)
    if (payload) {
      userId = payload.userId
    }
  }

  if (!userId) {
    const refreshTokenValue = req.cookies?.admin_rt
    if (refreshTokenValue) {
      const payload = verifyAdminRefreshToken(refreshTokenValue)
      if (payload) {
        // We verify the refresh token hasn't been globally invalidated by checking DB tokenVersion.
        // Or for simplicity, we store admin refresh tokens in the same `RefreshToken` table or assume we just rotate them.
        // Wait, the prompt says "Убедись, что при смене пароля или подозрительной активности все активные admin-сессии (refresh-токены) инвалидируются".
        // Let's use the DB RefreshToken table just like public ones, maybe adding a `isAdmin` boolean or just trusting the token.
        const storedToken = await prisma.refreshToken.findUnique({
          where: { token: refreshTokenValue },
        })
        if (storedToken && storedToken.expiresAt > new Date()) {
          userId = payload.userId

          // Rotate tokens
          await prisma.refreshToken.delete({ where: { id: storedToken.id } })

          const newAccessToken = generateAdminAccessToken(userId)
          const newRefreshToken = generateAdminRefreshToken(userId)
          // 12 hours expiry
          const expiry = new Date()
          expiry.setHours(expiry.getHours() + 12)
          await prisma.refreshToken.create({
            data: { token: newRefreshToken, userId, expiresAt: expiry },
          })
          setAdminAuthCookies(res, newAccessToken, newRefreshToken)
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

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.prisma.user.findUnique({ where: { id: ctx.userId }, select: { role: true } })
  if (!user || user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Requires admin role' })
  }
  return next({
    ctx: {
      ...ctx,
      userRole: user.role,
    },
  })
}).use(async ({ next, path, type, ctx, getRawInput }) => {
  const result = await next()
  
  // Log all successful admin mutations
  if (type === 'mutation' && result.ok) {
    const ip = ctx.req?.ip || ctx.req?.socket?.remoteAddress || null
    
    // Prevent logging sensitive data (like passwords in adminLogin/verify2FA) if those ever become adminProcedures.
    // Right now, those are public procedures, but just in case, we can omit password fields.
    let detailsToLog: any = {}
    try {
      if (getRawInput) {
        const rawInput = await getRawInput()
        detailsToLog = rawInput
        if (detailsToLog && typeof detailsToLog === 'object' && ('password' in detailsToLog || 'totpCode' in detailsToLog)) {
          detailsToLog = { ...detailsToLog, password: '[REDACTED]', totpCode: '[REDACTED]' }
        }
      }
    } catch(e) {}

    try {
      await ctx.prisma.adminAuditLog.create({
        data: {
          adminId: ctx.userId,
          action: path,
          details: detailsToLog || {},
          ipAddress: ip,
        }
      })
    } catch (e) {
      console.error('Failed to write admin audit log:', e)
    }
  }
  
  return result
})

async function checkAndAwardAchievements(prisma: PrismaClient, userId: string) {
  const [unlockedZubriks, totalZubriks, completedRoutes, createdRoutes, mainRoute] = await Promise.all([
    prisma.userZubrik.findMany({ where: { userId }, select: { zubrikId: true } }),
    prisma.zubrik.count(),
    prisma.userRoute.count({ where: { userId, completedAt: { not: null } } }),
    prisma.route.count({ where: { authorId: userId } }),
    prisma.route.findFirst({ where: { isMain: true }, select: { id: true } })
  ])

  const zubrikCount = unlockedZubriks.length
  const unlockedZubrikIds = new Set(unlockedZubriks.map((uz) => uz.zubrikId))

  const mainRouteCompleted = mainRoute
    ? await prisma.userRoute.findUnique({
        where: { userId_routeId: { userId, routeId: mainRoute.id } }
      }).then(ur => ur?.completedAt != null)
    : false

  // Получаем все ачивки и уже заработанные
  const allAchievements = await prisma.achievement.findMany()
  const existingUserAchievements = await prisma.userAchievement.findMany({
    where: { userId, earned: true },
    select: { achievementId: true },
  })
  const earnedIds = new Set(existingUserAchievements.map((a) => a.achievementId))

  const newlyEarned: { id: string; name: string; description: string; icon: string; imageUrl: string }[] = []

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) continue // уже получена

    // Data-driven проверка условия
    let shouldEarn = false
    switch (achievement.conditionType) {
      case 'ZUBRIK_COUNT':
        shouldEarn = zubrikCount >= achievement.conditionCount
        break
      case 'ZUBRIK_ALL':
        shouldEarn = zubrikCount >= totalZubriks && totalZubriks > 0
        break
      case 'SPECIFIC_ZUBRIK':
        shouldEarn = achievement.conditionTarget != null && unlockedZubrikIds.has(achievement.conditionTarget)
        break
      case 'ROUTE_COMPLETE':
        shouldEarn = completedRoutes >= achievement.conditionCount
        break
      case 'MAIN_ROUTE_COMPLETE':
        shouldEarn = mainRouteCompleted
        break
      case 'ROUTE_CREATE':
        shouldEarn = createdRoutes >= achievement.conditionCount
        break
      case 'MANUAL':
        // Выдаётся только вручную (например, при онбординге)
        shouldEarn = false
        break
      default:
        shouldEarn = false
    }

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
      icon: achievement.icon ?? 'Trophy',
      imageUrl: achievement.imageUrl ?? '',
    })
  }

  return newlyEarned
}

export const trpcRouter = trpc.router({
  // ─── Auth ────────────────────────────────────────────────────────

  register: trpc.procedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().optional(), turnstileToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Verify Turnstile token first
      const isHuman = await verifyTurnstileToken(input.turnstileToken)
      if (!isHuman) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Капча не пройдена' })
      }

      let user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      const passwordHash = await hashPassword(input.password)

      if (user) {
        if (user.emailVerified) {
          throw new TRPCError({ code: 'CONFLICT', message: 'User already exists' })
        }
        // Lazy cleanup: If the email exists but isn't verified, it might be an abandoned registration.
        // We allow the new user to take it over (they still must verify it).
        user = await ctx.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash, name: input.name },
        })
        await ctx.prisma.verificationToken.deleteMany({ where: { email: user.email } })
      } else {
        user = await ctx.prisma.user.create({
          data: { email: input.email, passwordHash, name: input.name, avatarUrl: '/images/avatar.png', emailVerified: false },
        })
      }

      // Generate OTP
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

      await ctx.prisma.verificationToken.create({
        data: { email: user.email, code: otp, expiresAt },
      })

      // Send email (async, don't await blocking if we want to be fast, but waiting is safer to ensure it didn't fail)
      await sendVerificationEmail(user.email, otp)

      return { requireVerification: true, email: user.email }
    }),

  resendOtp: trpc.procedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (!user || user.emailVerified) {
        // Return success silently to prevent email enumeration
        return { success: true }
      }

      await ctx.prisma.verificationToken.deleteMany({ where: { email: user.email } })
      
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
      
      await ctx.prisma.verificationToken.create({
        data: { email: user.email, code: otp, expiresAt },
      })
      
      await sendVerificationEmail(user.email, otp)
      return { success: true }
    }),

  verifyEmail: trpc.procedure
    .input(z.object({ email: z.string().email(), code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      const validToken = await ctx.prisma.verificationToken.findFirst({
        where: {
          email: input.email,
          code: input.code,
          expiresAt: { gt: new Date() },
        },
      })

      if (!validToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Неверный или просроченный код' })
      }

      // Mark verified
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      })

      // Cleanup tokens
      await ctx.prisma.verificationToken.deleteMany({
        where: { email: input.email },
      })

      // Clean up old refresh tokens
      await ctx.prisma.refreshToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      })

      const accessToken = generateAccessToken(user.id)
      const refreshToken = generateRefreshToken(user.id)

      await ctx.prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt: getRefreshTokenExpiry() },
      })

      // Award achievement for onboarding
      let newAchievement = null
      const hasAchievement = await ctx.prisma.userAchievement.findFirst({
        where: { userId: user.id, achievement: { name: 'Начало пути' } }
      })
      
      if (!hasAchievement) {
        const achievement = await ctx.prisma.achievement.findFirst({ where: { name: 'Начало пути' } })
        if (achievement) {
          await ctx.prisma.userAchievement.create({
            data: { userId: user.id, achievementId: achievement.id, earned: true, earnedAt: new Date(), progress: 100 },
          })
          newAchievement = {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description ?? '',
            icon: achievement.icon ?? 'Trophy',
            imageUrl: achievement.imageUrl ?? '',
          }
        }
      }

      setAuthCookies(ctx.res, accessToken, refreshToken)
      return { user: { id: user.id, email: user.email, name: user.name }, newAchievement }
    }),

  login: trpc.procedure
    .input(z.object({ email: z.string().email(), password: z.string(), turnstileToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Verify Turnstile token first
      const isHuman = await verifyTurnstileToken(input.turnstileToken)
      if (!isHuman) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Капча не пройдена' })
      }

      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
      }
      const isValid = await verifyPassword(input.password, user.passwordHash)
      if (!isValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
      }

      if (!user.emailVerified) {
        // Generate new OTP
        await ctx.prisma.verificationToken.deleteMany({ where: { email: user.email } })
        
        const otp = generateOTP()
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
        
        await ctx.prisma.verificationToken.create({
          data: { email: user.email, code: otp, expiresAt },
        })

        await sendVerificationEmail(user.email, otp)
        
        return { requireVerification: true, email: user.email }
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
    return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role }
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
    const totalZubriks = await ctx.prisma.zubrik.count()

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
        totalZubriks,
        routesCount: completedRoutesCount,
        daysCount: daysInApp,
      },
      likedRoutes: user.routeInteractions.filter((r) => r.liked).map((r) => mapRoute(r.route)),
      createdRoutes: user.createdRoutes.map(mapRoute),
    }
  }),

  getPublicProfile: trpc.procedure.input(z.object({ userId: z.string() })).query(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
      include: {
        _count: { select: { unlockedZubriks: true } },
        routeInteractions: { where: { completedAt: { not: null } } },
        createdRoutes: { include: { _count: { select: { waypoints: true } } } },
        achievements: { include: { achievement: true } },
      }
    })
    
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
    
    const daysInApp = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    const allAchievements = await ctx.prisma.achievement.findMany()
    const totalZubriks = await ctx.prisma.zubrik.count()
    const earnedMap = new Map(user.achievements.map(ua => [ua.achievementId, { earned: ua.earned, progress: ua.progress, isPinned: ua.isPinned, pinnedAt: ua.pinnedAt }]))
    
    return {
      id: user.id,
      name: user.name || 'Исследователь',
      avatarUrl: user.avatarUrl,
      role: user.role,
      stats: {
        zubriksCount: user._count.unlockedZubriks,
        totalZubriks,
        routesCount: user.routeInteractions.length,
        daysCount: daysInApp
      },
      createdRoutes: user.createdRoutes.map(r => ({
        id: r.id, name: r.name, distance: r.distance, duration: r.duration, stops: r._count.waypoints, description: r.description, imageColor: r.imageColor ?? '#1A3D2B', icon: r.icon ?? 'MapPin'
      })),
      achievements: allAchievements.map(a => {
        const userState = earnedMap.get(a.id) || { earned: false, progress: 0, isPinned: false, pinnedAt: null }
        return {
          id: a.id, name: a.name, description: a.description, icon: a.icon ?? 'Trophy', imageUrl: a.imageUrl, earned: userState.earned, progress: userState.progress, isPinned: userState.isPinned, pinnedAt: userState.pinnedAt ? userState.pinnedAt.toISOString() : null
        }
      })
    }
  }),

  getLeaderboard: trpc.procedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      include: {
        _count: {
          select: { unlockedZubriks: true },
        },
        routeInteractions: {
          where: { completedAt: { not: null } },
        },
      },
    })

    const leaderboard = users.map(user => ({
      id: user.id,
      name: user.name || 'Исследователь',
      avatarUrl: user.avatarUrl,
      zubriksCount: user._count.unlockedZubriks,
      routesCount: user.routeInteractions.length,
    }))

    // Сортировка: сначала по зубрикам (по убыванию), затем по пройденным маршрутам
    leaderboard.sort((a, b) => {
      if (b.zubriksCount !== a.zubriksCount) {
        return b.zubriksCount - a.zubriksCount
      }
      return b.routesCount - a.routesCount
    })

    return { leaderboard: leaderboard.slice(0, 50) } // Топ-50
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
        authorId: r.authorId,
        author: r.author?.name ?? 'Аноним',
        description: r.description,
        liked: likedRouteIds.has(r.id),
        imageColor: r.imageColor ?? '#1A3D2B',
        icon: r.icon ?? 'MapPin',
      })),
      mainRoute: mainRoute
        ? {
            id: mainRoute.id,
            name: mainRoute.name,
            distance: mainRoute.distance,
            duration: mainRoute.duration,
            stops: mainRoute._count.waypoints,
            description: mainRoute.description,
            icon: mainRoute.icon ?? 'Crown',
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
        icon: mainRoute.icon ?? 'Crown',
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
        icon: w.icon ?? 'MapPin',
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
        icon: z.string().optional(),
        waypoints: z
          .array(
            z.object({
              name: z.string().min(1),
              description: z.string().optional(),
              icon: z.string().optional(),
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
          icon: input.icon ?? 'MapPin',
          isMain: false,
          authorId: ctx.userId,
          waypoints: {
            create: input.waypoints.map((wp, idx) => ({
              name: wp.name,
              description: wp.description,
              icon: wp.icon ?? 'MapPin',
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

  deleteRoute: protectedProcedure
    .input(z.object({ routeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const route = await ctx.prisma.route.findUnique({
        where: { id: input.routeId },
        select: { authorId: true, isMain: true }
      })
      if (!route) throw new TRPCError({ code: 'NOT_FOUND', message: 'Route not found' })

      const user = await ctx.prisma.user.findUnique({ where: { id: ctx.userId }, select: { role: true } })
      const isAdmin = user?.role === 'ADMIN'

      // Only ADMIN can delete main routes. Author or ADMIN can delete custom routes.
      if (route.isMain && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can delete main routes' })
      }
      if (!isAdmin && route.authorId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own routes' })
      }

      await ctx.prisma.route.delete({ where: { id: input.routeId } })
      return { success: true }
    }),

  getRouteById: protectedProcedure
    .input(z.object({ routeId: z.string() }))
    .query(async ({ input, ctx }) => {
      const route = await ctx.prisma.route.findUnique({
        where: { id: input.routeId },
        include: { waypoints: { orderBy: { orderIndex: 'asc' } } }
      })
      if (!route) throw new TRPCError({ code: 'NOT_FOUND' })
      return { route }
    }),

  updateRoute: protectedProcedure
    .input(
      z.object({
        routeId: z.string(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        icon: z.string().optional(),
        waypoints: z
          .array(
            z.object({
              name: z.string().min(1),
              description: z.string().optional(),
              icon: z.string().optional(),
              latitude: z.number(),
              longitude: z.number(),
            }),
          )
          .min(2, 'Маршрут должен содержать минимум 2 точки'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const route = await ctx.prisma.route.findUnique({ where: { id: input.routeId } })
      if (!route) throw new TRPCError({ code: 'NOT_FOUND' })

      const user = await ctx.prisma.user.findUnique({ where: { id: ctx.userId }, select: { role: true } })
      const isAdmin = user?.role === 'ADMIN'

      if (!isAdmin && route.authorId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own routes' })
      }

      // Calculate new distance and duration
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

      // Delete existing waypoints and replace them
      await ctx.prisma.waypoint.deleteMany({ where: { routeId: input.routeId } })

      const updatedRoute = await ctx.prisma.route.update({
        where: { id: input.routeId },
        data: {
          name: input.name,
          description: input.description,
          icon: input.icon ?? 'MapPin',
          distance: `${distanceStr} км`,
          duration,
          waypoints: {
            create: input.waypoints.map((wp, idx) => ({
              name: wp.name,
              description: wp.description,
              icon: wp.icon ?? 'MapPin',
              latitude: wp.latitude,
              longitude: wp.longitude,
              orderIndex: idx,
            })),
          },
        },
      })
      
      return { success: true }
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

    let earnedMap = new Map<string, { earned: boolean; progress: number, isPinned: boolean, pinnedAt: Date | null, pinOrder: number }>()
    
    // Variables for dynamic progress calculation
    let zubrikCount = 0
    let totalZubriks = 0
    let completedRoutes = 0
    let createdRoutes = 0
    let mainRouteCompleted = false
    let unlockedZubrikIds = new Set<string>()

    if (ctx.userId) {
      const userAchievements = await ctx.prisma.userAchievement.findMany({ where: { userId: ctx.userId } })
      userAchievements.forEach((ua) => earnedMap.set(ua.achievementId, { earned: ua.earned, progress: ua.progress, isPinned: ua.isPinned, pinnedAt: ua.pinnedAt, pinOrder: ua.pinOrder }))

      // Fetch user stats
      const [unlockedZubriks, totalZCount, routesC, createdR, mainRoute] = await Promise.all([
        ctx.prisma.userZubrik.findMany({ where: { userId: ctx.userId }, select: { zubrikId: true } }),
        ctx.prisma.zubrik.count(),
        ctx.prisma.userRoute.count({ where: { userId: ctx.userId, completedAt: { not: null } } }),
        ctx.prisma.route.count({ where: { authorId: ctx.userId } }),
        ctx.prisma.route.findFirst({ where: { isMain: true }, select: { id: true } })
      ])
      
      zubrikCount = unlockedZubriks.length
      totalZubriks = totalZCount
      completedRoutes = routesC
      createdRoutes = createdR
      unlockedZubrikIds = new Set(unlockedZubriks.map((uz) => uz.zubrikId))

      if (mainRoute) {
        mainRouteCompleted = await ctx.prisma.userRoute.findUnique({
          where: { userId_routeId: { userId: ctx.userId, routeId: mainRoute.id } }
        }).then(ur => ur?.completedAt != null)
      }
    }

    return {
      achievements: achievements.map((a) => {
        const userState = earnedMap.get(a.id) || { earned: false, progress: 0, isPinned: false, pinnedAt: null, pinOrder: 0 }
        
        let currentProgress = userState.progress
        let progressCurrent = 0
        let progressTarget = 0
        
        // Compute progress dynamically if not earned
        if (ctx.userId && !userState.earned) {
           switch (a.conditionType) {
              case 'ZUBRIK_COUNT':
                 progressCurrent = Math.min(zubrikCount, a.conditionCount)
                 progressTarget = a.conditionCount
                 currentProgress = Math.min(100, Math.floor((zubrikCount / Math.max(1, a.conditionCount)) * 100))
                 break
              case 'ZUBRIK_ALL':
                 progressCurrent = zubrikCount
                 progressTarget = totalZubriks
                 currentProgress = totalZubriks > 0 ? Math.min(100, Math.floor((zubrikCount / totalZubriks) * 100)) : 0
                 break
              case 'SPECIFIC_ZUBRIK':
                 progressCurrent = a.conditionTarget != null && unlockedZubrikIds.has(a.conditionTarget) ? 1 : 0
                 progressTarget = 1
                 currentProgress = progressCurrent * 100
                 break
              case 'ROUTE_COMPLETE':
                 progressCurrent = Math.min(completedRoutes, a.conditionCount)
                 progressTarget = a.conditionCount
                 currentProgress = Math.min(100, Math.floor((completedRoutes / Math.max(1, a.conditionCount)) * 100))
                 break
              case 'MAIN_ROUTE_COMPLETE':
                 progressCurrent = mainRouteCompleted ? 1 : 0
                 progressTarget = 1
                 currentProgress = progressCurrent * 100
                 break
              case 'ROUTE_CREATE':
                 progressCurrent = Math.min(createdRoutes, a.conditionCount)
                 progressTarget = a.conditionCount
                 currentProgress = Math.min(100, Math.floor((createdRoutes / Math.max(1, a.conditionCount)) * 100))
                 break
              case 'MANUAL':
                 currentProgress = 0
                 progressCurrent = 0
                 progressTarget = 0
                 break
           }
        } else if (userState.earned) {
          // Already earned — fill progress
          currentProgress = 100
        }

        return {
          id: a.id,
          name: a.name,
          description: a.description,
          imageUrl: a.imageUrl,
          icon: a.icon ?? 'Trophy',
          earned: userState.earned,
          progress: currentProgress,
          progressCurrent,
          progressTarget,
          conditionType: a.conditionType,
          isPinned: userState.isPinned,
          pinnedAt: userState.pinnedAt ? userState.pinnedAt.toISOString() : null,
          pinOrder: userState.pinOrder,
        }
      }),
    }
  }),
  
  togglePinAchievement: protectedProcedure.input(z.object({ achievementId: z.string() })).mutation(async ({ input, ctx }) => {
    const existing = await ctx.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId: ctx.userId, achievementId: input.achievementId } },
    })

    if (!existing || !existing.earned) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'You can only pin earned achievements' })
    }

    // Если хотим закрепить, проверим, сколько уже закреплено. Разрешим максимум 3
    if (!existing.isPinned) {
      const pinnedCount = await ctx.prisma.userAchievement.count({
        where: { userId: ctx.userId, isPinned: true },
      })
      if (pinnedCount >= 3) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Максимум 3 закрепленных достижения' })
      }
    }

    const updated = await ctx.prisma.userAchievement.update({
      where: { userId_achievementId: { userId: ctx.userId, achievementId: input.achievementId } },
      data: { 
        isPinned: !existing.isPinned,
        pinnedAt: !existing.isPinned ? new Date() : null
      },
    })

    return { isPinned: updated.isPinned, pinnedAt: updated.pinnedAt ? updated.pinnedAt.toISOString() : null }
  }),

  reorderPinnedAchievements: protectedProcedure
    .input(z.object({ achievementIds: z.array(z.string()).min(1).max(3) }))
    .mutation(async ({ input, ctx }) => {
      // Update pinOrder for each achievement in the new order
      await Promise.all(
        input.achievementIds.map((achievementId, index) =>
          ctx.prisma.userAchievement.update({
            where: { userId_achievementId: { userId: ctx.userId, achievementId } },
            data: { pinOrder: index },
          })
        )
      )
      return { success: true }
    })
})

export const adminRouter = trpc.router({
  adminLogin: trpc.procedure
    .input(z.object({ email: z.string().email(), password: z.string(), turnstileToken: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      // Turnstile can be enabled here if needed
      if (input.turnstileToken) {
        const isValid = await verifyTurnstileToken(input.turnstileToken)
        if (!isValid) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Капча не пройдена' })
      }

      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (!user || user.role !== 'ADMIN' || !user.passwordHash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Неверные учетные данные' })
      }

      const isPasswordValid = await verifyPassword(input.password, user.passwordHash)
      if (!isPasswordValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Неверные учетные данные' })
      }

      if (!user.totpEnabled) {
        const secret = user.totpSecret || new OTPAuth.Secret().base32
        if (!user.totpSecret) {
          await ctx.prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret } })
        }
        return { requiresEnrollment: true, secret }
      }

      return { requires2FA: true }
    }),

  adminVerify2FA: trpc.procedure
    .input(z.object({ email: z.string().email(), password: z.string(), totpCode: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (!user || user.role !== 'ADMIN' || !user.passwordHash || !user.totpSecret) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Неверные учетные данные' })
      }

      const isPasswordValid = await verifyPassword(input.password, user.passwordHash)
      if (!isPasswordValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Неверные учетные данные' })
      }

      let isValidTotp = false
      try {
        const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.totpSecret) })
        const delta = totp.validate({ token: input.totpCode, window: 1 })
        isValidTotp = delta !== null
      } catch (e) {
        isValidTotp = false
      }

      if (!isValidTotp) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Неверный код 2FA' })
      }

      if (!user.totpEnabled) {
        await ctx.prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } })
      }

      // Cleanup old admin refresh tokens if needed (or just general tokens)
      await ctx.prisma.refreshToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      })

      const newAccessToken = generateAdminAccessToken(user.id)
      const newRefreshToken = generateAdminRefreshToken(user.id)
      
      const expiry = new Date()
      expiry.setHours(expiry.getHours() + 12)
      
      await ctx.prisma.refreshToken.create({
        data: { token: newRefreshToken, userId: user.id, expiresAt: expiry },
      })
      
      setAdminAuthCookies(ctx.res, newAccessToken, newRefreshToken)

      return { success: true }
    }),

  adminLogout: adminProcedure.mutation(async ({ ctx }) => {
    clearAdminAuthCookies(ctx.res)
    // Optional: delete the current refresh token from DB if we tracked it by session
    return { success: true }
  }),

  adminMe: adminProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true, name: true, avatarUrl: true, role: true }
    });
    return user;
  }),

  // --- ADMIN PROCEDURES ---
  adminGetStats: adminProcedure.query(async ({ ctx }) => {
    const [users, zubriks, routes, events] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.zubrik.count(),
      ctx.prisma.route.count(),
      ctx.prisma.event.count(),
    ])
    return { users, zubriks, routes, events }
  }),

  adminGetUsers: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
      }
    })
    return { users }
  }),

  adminUpdateUser: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      role: z.enum(['USER', 'ADMIN'])
    }))
    .mutation(async ({ input, ctx }) => {
      // Prevent removing the last admin
      if (input.role === 'USER') {
        const userToUpdate = await ctx.prisma.user.findUnique({ where: { id: input.id } })
        if (userToUpdate?.role === 'ADMIN') {
          const adminCount = await ctx.prisma.user.count({ where: { role: 'ADMIN' } })
          if (adminCount <= 1) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Нельзя удалить последнего администратора' })
          }
        }
      }

      const user = await ctx.prisma.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          role: input.role
        }
      })
      return { user }
    }),

  adminDeleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Prevent deleting yourself
      if (input.id === ctx.userId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Нельзя удалить свой собственный аккаунт' })
      }
      
      const userToDelete = await ctx.prisma.user.findUnique({ where: { id: input.id } })
      if (userToDelete?.role === 'ADMIN') {
        const adminCount = await ctx.prisma.user.count({ where: { role: 'ADMIN' } })
        if (adminCount <= 1) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Нельзя удалить последнего администратора' })
        }
      }

      await ctx.prisma.user.delete({ where: { id: input.id } })
      return { success: true }
    }),

  adminGetZubriks: adminProcedure.query(async ({ ctx }) => {
    const zubriks = await ctx.prisma.zubrik.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return { zubriks }
  }),

  adminCreateZubrik: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500),
      latitude: z.number(),
      longitude: z.number(),
      imageUrl: z.string().min(1)
    }))
    .mutation(async ({ input, ctx }) => {
      const zubrik = await ctx.prisma.zubrik.create({
        data: {
          name: input.name,
          description: input.description,
          latitude: input.latitude,
          longitude: input.longitude,
          locationName: 'Неизвестно',
          imageUrl: input.imageUrl
        }
      })
      return { zubrik }
    }),

  adminUpdateZubrik: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().max(500),
      latitude: z.number(),
      longitude: z.number(),
      imageUrl: z.string().min(1)
    }))
    .mutation(async ({ input, ctx }) => {
      const zubrik = await ctx.prisma.zubrik.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          latitude: input.latitude,
          longitude: input.longitude,
          imageUrl: input.imageUrl
        }
      })
      return { zubrik }
    }),

  adminDeleteZubrik: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Must delete UserZubrik references first
      await ctx.prisma.userZubrik.deleteMany({ where: { zubrikId: input.id } })
      await ctx.prisma.zubrik.delete({ where: { id: input.id } })
      return { success: true }
    }),

  adminGetAchievements: adminProcedure.query(async ({ ctx }) => {
    const achievements = await ctx.prisma.achievement.findMany()
    return { achievements }
  }),

  // Список зубриков для выпадающего списка в SPECIFIC_ZUBRIK
  adminGetZubriksList: adminProcedure.query(async ({ ctx }) => {
    const zubriks = await ctx.prisma.zubrik.findMany({
      select: { id: true, name: true, imageUrl: true },
      orderBy: { name: 'asc' },
    })
    return { zubriks }
  }),

  adminCreateAchievement: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500),
      imageUrl: z.string().min(1),
      icon: z.string().optional(),
      conditionType: z.string().default('MANUAL'),
      conditionTarget: z.string().nullable().optional(),
      conditionCount: z.number().int().min(1).default(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const achievement = await ctx.prisma.achievement.create({
        data: {
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          icon: input.icon,
          conditionType: input.conditionType,
          conditionTarget: input.conditionTarget ?? null,
          conditionCount: input.conditionCount,
        }
      })
      return { achievement }
    }),

  adminUpdateAchievement: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().max(500),
      imageUrl: z.string().min(1),
      icon: z.string().optional(),
      conditionType: z.string().default('MANUAL'),
      conditionTarget: z.string().nullable().optional(),
      conditionCount: z.number().int().min(1).default(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const achievement = await ctx.prisma.achievement.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          icon: input.icon,
          conditionType: input.conditionType,
          conditionTarget: input.conditionTarget ?? null,
          conditionCount: input.conditionCount,
        }
      })
      return { achievement }
    }),

  adminDeleteAchievement: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.userAchievement.deleteMany({ where: { achievementId: input.id } })
      await ctx.prisma.achievement.delete({ where: { id: input.id } })
      return { success: true }
    }),

  adminGetRoutes: adminProcedure.query(async ({ ctx }) => {
    const routes = await ctx.prisma.route.findMany({
      include: {
        author: { select: { name: true } },
        _count: { select: { waypoints: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return routes.map((r) => ({
      ...r,
      author: r.author?.name ?? 'Аноним',
      stops: r._count.waypoints,
    }))
  }),

  adminGetRouteById: adminProcedure
    .input(z.object({ routeId: z.string() }))
    .query(async ({ input, ctx }) => {
      const route = await ctx.prisma.route.findUnique({
        where: { id: input.routeId },
        include: {
          waypoints: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      })
      return { route }
    }),

  adminDeleteRoute: adminProcedure
    .input(z.object({ routeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.waypoint.deleteMany({ where: { routeId: input.routeId } })
      await ctx.prisma.userRoute.deleteMany({ where: { routeId: input.routeId } })
      await ctx.prisma.route.delete({ where: { id: input.routeId } })
      return { success: true }
    }),

  adminCreateRoute: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      imageColor: z.string().default('#1A3D2B'),
      icon: z.string().default('MapPin'),
      isMain: z.boolean().default(false),
      waypoints: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        latitude: z.number(),
        longitude: z.number(),
        icon: z.string().optional(),
      }))
    }))
    .mutation(async ({ input, ctx }) => {
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
      const distance = totalKm > 0 && totalKm < 0.1 ? '~0.1 км' : `~${totalKm.toFixed(1)} км`
      const durationMinutes = Math.max(1, Math.round((totalKm / 5) * 60))
      const duration = durationMinutes >= 60 
        ? `${Math.floor(durationMinutes/60)} ч ${durationMinutes%60} мин`
        : `${durationMinutes} мин`

      const route = await ctx.prisma.route.create({
        data: {
          name: input.name,
          description: input.description,
          distance,
          duration,
          imageColor: input.imageColor,
          icon: input.icon,
          isMain: input.isMain,
          authorId: ctx.userId, // use admin's user id
          waypoints: {
            create: input.waypoints.map((w, index) => ({
              ...w,
              orderIndex: index,
            }))
          }
        }
      })
      return { routeId: route.id }
    }),

  adminUpdateRoute: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      imageColor: z.string().default('#1A3D2B'),
      icon: z.string().default('MapPin'),
      isMain: z.boolean().default(false),
      waypoints: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        latitude: z.number(),
        longitude: z.number(),
        icon: z.string().optional(),
      }))
    }))
    .mutation(async ({ input, ctx }) => {
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
      const distance = totalKm > 0 && totalKm < 0.1 ? '~0.1 км' : `~${totalKm.toFixed(1)} км`
      const durationMinutes = Math.max(1, Math.round((totalKm / 5) * 60))
      const duration = durationMinutes >= 60 
        ? `${Math.floor(durationMinutes/60)} ч ${durationMinutes%60} мин`
        : `${durationMinutes} мин`

      // update route
      await ctx.prisma.route.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          distance,
          duration,
          imageColor: input.imageColor,
          icon: input.icon,
          isMain: input.isMain,
        }
      })

      // delete old waypoints and create new ones
      await ctx.prisma.waypoint.deleteMany({ where: { routeId: input.id } })
      
      await ctx.prisma.route.update({
        where: { id: input.id },
        data: {
          waypoints: {
            create: input.waypoints.map((w, index) => ({
              ...w,
              orderIndex: index,
            }))
          }
        }
      })
      
      return { success: true }
    })
})

export type TrpcRouter = typeof trpcRouter
export type AdminRouter = typeof adminRouter

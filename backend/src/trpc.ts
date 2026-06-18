import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { prisma } from './prisma'

const trpc = initTRPC.create()

export const trpcRouter = trpc.router({
  // ─── Зубрики ─────────────────────────────────────────────────────
  getZubriks: trpc.procedure.query(async () => {
    const zubriks = await prisma.zubrik.findMany({
      orderBy: { createdAt: 'asc' },
    })

    return {
      zubriks: zubriks.map((z) => ({
        id: z.id,
        name: z.name,
        description: z.description,
        distance: '', // вычисляется на клиенте из координат
        unlocked: false, // TODO: определять по UserZubrik после реализации авторизации
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
})

export type TrpcRouter = typeof trpcRouter

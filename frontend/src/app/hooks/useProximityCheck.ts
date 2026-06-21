import { useCallback, useEffect, useRef } from 'react'

import { trpc } from '../lib/trpc'
import { calculateDistanceRaw, PROXIMITY_RADIUS_METERS } from '../utils/distance'

type PointOfInterest = {
  id: string
  latitude: number
  longitude: number
  type: 'waypoint' | 'zubrik'
}

export type NewAchievement = {
  id: string
  name: string
  description: string
  emoji: string
  imageUrl: string
}

export function useProximityCheck(
  userLocation: [number, number] | null,
  points: PointOfInterest[],
  onAchievement: (achievement: NewAchievement) => void
) {
  const utils = trpc.useUtils()
  const completedRef = useRef<Set<string>>(new Set()) // уже отправленные, чтобы не спамить

  const completeWaypoint = trpc.completeWaypoint.useMutation({
    onSuccess: (data) => {
      utils.getRouteWaypoints.invalidate()
      utils.getProfileStats.invalidate()
      if (data.routeCompleted) utils.getRoutes.invalidate()
      data.newAchievements.forEach((a) => onAchievement(a))
    },
  })

  const unlockZubrik = trpc.unlockZubrik.useMutation({
    onSuccess: (data) => {
      utils.getZubriks.invalidate()
      utils.getProfileStats.invalidate()
      data.newAchievements.forEach((a) => onAchievement(a))
    },
  })

  const checkProximity = useCallback(() => {
    if (!userLocation) return

    for (const point of points) {
      if (completedRef.current.has(point.id)) continue

      const dist = calculateDistanceRaw(userLocation[0], userLocation[1], point.latitude, point.longitude)

      if (dist <= PROXIMITY_RADIUS_METERS) {
        completedRef.current.add(point.id)
        if (point.type === 'waypoint') {
          completeWaypoint.mutate({ waypointId: point.id })
        } else {
          unlockZubrik.mutate({ zubrikId: point.id })
        }

        if ('vibrate' in navigator) {
          navigator.vibrate(200)
        }
      }
    }
  }, [userLocation, points, completeWaypoint, unlockZubrik])

  useEffect(() => {
    checkProximity()
  }, [checkProximity])
}

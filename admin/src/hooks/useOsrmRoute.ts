import { useState, useEffect } from 'react'

export function useOsrmRoute(waypoints: { latitude: number | null, longitude: number | null }[]) {
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null)
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null)

  useEffect(() => {
    const validWaypoints = waypoints.filter(w => w.latitude !== null && w.longitude !== null)
    if (validWaypoints.length < 2) {
      setRouteGeometry(null)
      setDistanceMeters(null)
      setDurationSeconds(null)
      return
    }

    let isMounted = true
    const fetchRoute = async () => {
      try {
        const coordsString = validWaypoints.map(w => `${w.longitude},${w.latitude}`).join(';')
        const res = await fetch(`https://router.project-osrm.org/route/v1/foot/${coordsString}?overview=full&geometries=geojson`)
        if (!res.ok) throw new Error('Network response was not ok')
        const data = await res.json()
        if (isMounted && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
          setRouteGeometry(coords)
          setDistanceMeters(route.distance)
          setDurationSeconds(route.duration)
        }
      } catch (e) {
        console.error('Failed to fetch real route:', e)
        if (isMounted) {
          setRouteGeometry(null)
          setDistanceMeters(null)
          setDurationSeconds(null)
        }
      }
    }

    fetchRoute()
    return () => { isMounted = false }
  }, [JSON.stringify(waypoints.map(w => [w.latitude, w.longitude]))])

  return { routeGeometry, distanceMeters, durationSeconds }
}

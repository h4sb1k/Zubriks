import { ArrowLeft, CheckCircle2, MapPin, Navigation } from 'lucide-react'
import { useMemo } from 'react'

import type { NewAchievement } from '../hooks/useProximityCheck'
import { useProximityCheck } from '../hooks/useProximityCheck'
import { trpc } from '../lib/trpc'
import { calculateDistance } from '../utils/distance'
import type { MapPoint } from '../utils/openInMaps'
import { openPointInMaps, openRouteInMaps } from '../utils/openInMaps'

type RouteActiveProps = {
  routeId: string
  routeName: string
  userLocation: [number, number] | null
  onClose: () => void
}

export default function RouteActive({ routeId, routeName, userLocation, onClose }: RouteActiveProps) {
  const { data: waypointsData, isLoading, isError, error } = trpc.getRouteWaypoints.useQuery({ routeId })

  // Трансформируем данные API в формат для рендеринга
  const waypoints = useMemo(() => {
    if (!waypointsData?.waypoints) return []
    return waypointsData.waypoints.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      emoji: w.emoji,
      completed: w.completed,
      coords: { lat: w.latitude, lon: w.longitude, name: w.name } as MapPoint,
      distance: userLocation ? calculateDistance(userLocation[0], userLocation[1], w.latitude, w.longitude) : '...',
    }))
  }, [waypointsData, userLocation])

  const currentStep = waypoints.findIndex((w) => !w.completed)
  const isCompleted = waypoints.length > 0 && currentStep === -1
  const progress = waypoints.length > 0 ? (isCompleted ? 100 : (Math.max(currentStep, 0) / waypoints.length) * 100) : 0
  const nextWaypoint = currentStep >= 0 ? waypoints[currentStep] : null

  // Незавершённые точки — передаём в утилиту как маршрут
  const remainingPoints = waypoints.filter((w) => !w.completed).map((w) => w.coords)

  // Трекинг приближения к точкам маршрута
  const waypointPoints = useMemo(() => {
    return waypoints
      .filter((w) => !w.completed)
      .map((w) => ({ id: w.id, latitude: w.coords.lat, longitude: w.coords.lon, type: 'waypoint' as const }))
  }, [waypoints])

  useProximityCheck(userLocation, waypointPoints, (ach) => {
    window.dispatchEvent(new CustomEvent('new-achievement', { detail: ach }))
  })

  const handleOpenInMaps = () => {
    if (remainingPoints.length > 1) {
      openRouteInMaps(remainingPoints)
    } else if (remainingPoints.length === 1) {
      openPointInMaps(remainingPoints[0])
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAFAF7] flex flex-col">
        <div className="bg-[#1A3D2B] px-5 py-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onClose} className="p-2 -ml-2">
              <ArrowLeft size={24} />
            </button>
            <div className="text-center flex-1">
              <div className="text-sm opacity-80">{routeName}</div>
            </div>
            <div className="w-10" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[#6B6B6B]">Загрузка маршрута...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAFAF7] flex flex-col">
        <div className="bg-[#1A3D2B] px-5 py-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onClose} className="p-2 -ml-2">
              <ArrowLeft size={24} />
            </button>
            <div className="text-center flex-1">
              <div className="text-sm opacity-80">{routeName}</div>
            </div>
            <div className="w-10" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-5">
          <span className="text-red-500">Ошибка: {error?.message || 'Не удалось загрузить маршрут'}</span>
        </div>
      </div>
    )
  }

  // Если у маршрута нет точек
  if (waypoints.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAFAF7] flex flex-col">
        <div className="bg-[#1A3D2B] px-5 py-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onClose} className="p-2 -ml-2">
              <ArrowLeft size={24} />
            </button>
            <div className="text-center flex-1">
              <div className="text-sm opacity-80">{routeName}</div>
            </div>
            <div className="w-10" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="text-center text-[#6B6B6B]">
            <span className="text-4xl block mb-3">🗺️</span>
            <p>У этого маршрута пока нет точек</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAF7] flex flex-col">
      {/* Header */}
      <div className="bg-[#1A3D2B] px-5 py-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onClose} className="p-2 -ml-2">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center flex-1">
            <div className="text-sm opacity-80">{routeName}</div>
            <div className="text-lg">
              {isCompleted ? 'Маршрут пройден!' : `Шаг ${Math.max(currentStep + 1, 1)} из ${waypoints.length}`}
            </div>
          </div>
          <div className="w-10" />
        </div>

        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-[#E8922A] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isCompleted ? (
          <div className="p-5 flex flex-col items-center justify-center min-h-full text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-[#1A3D2B] to-[#E8922A] rounded-full flex items-center justify-center text-6xl mb-6 shadow-xl animate-bounce">
              🏆
            </div>
            <h2 className="text-3xl font-bold text-[#1A3D2B] mb-3">Поздравляем!</h2>
            <p className="text-[#6B6B6B] mb-8 text-lg">
              Вы успешно прошли маршрут «{routeName}» и открыли для себя новые места!
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[#E8922A] text-white rounded-2xl py-4 flex items-center justify-center gap-2 active:scale-95 transition-transform text-lg font-medium"
            >
              Завершить прогулку
            </button>
          </div>
        ) : (
          nextWaypoint && (
            <div className="p-5">
              {/* Следующая точка */}
              <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B] mb-3">
                  <div className="w-2 h-2 bg-[#34C759] rounded-full animate-pulse" />
                  <span>Следующая точка</span>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1A3D2B] to-[#E8922A] rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                    {nextWaypoint.emoji}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl mb-1">{nextWaypoint.name}</h2>
                    <p className="text-[#6B6B6B] text-sm mb-2">{nextWaypoint.description}</p>
                    <div className="flex items-center gap-2 text-sm text-[#E8922A]">
                      <MapPin size={16} />
                      <span>{nextWaypoint.distance}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleOpenInMaps}
                  className="w-full bg-[#E8922A] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Navigation size={20} />
                  <span>Открыть в картах</span>
                </button>
              </div>

              {/* Список всех точек */}
              <div className="space-y-3">
                <h3 className="text-lg mb-3">Все точки маршрута</h3>
                {waypoints.map((waypoint, index) => (
                  <div
                    key={waypoint.id}
                    className={`flex items-start gap-3 p-4 rounded-2xl ${
                      waypoint.completed
                        ? 'bg-[#34C759]/10'
                        : index === currentStep
                          ? 'bg-white shadow-sm'
                          : 'bg-[#F5F2EB]'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                      {waypoint.completed ? (
                        <CheckCircle2 size={24} className="text-[#34C759]" />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                            index === currentStep ? 'bg-[#E8922A] text-white' : 'bg-[#E5E3DD] text-[#6B6B6B]'
                          }`}
                        >
                          {index + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={waypoint.completed ? 'text-[#6B6B6B]' : ''}>{waypoint.name}</h4>
                          <p className="text-sm text-[#6B6B6B] mt-0.5">{waypoint.description}</p>
                        </div>
                        <span className="text-2xl flex-shrink-0">{waypoint.emoji}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

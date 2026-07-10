import { ArrowLeft, CheckCircle2, MapPin, Navigation, Settings } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { NewAchievement } from '../hooks/useProximityCheck'
import { useProximityCheck } from '../hooks/useProximityCheck'
import { trpc } from '../lib/trpc'
import { calculateDistance } from '../utils/distance'
import type { MapPoint } from '../utils/openInMaps'
import { openPointInMaps, openRouteInMaps } from '../utils/openInMaps'
import ConfirmModal from './ConfirmModal'
import { DynamicIcon } from './DynamicIcon'
import LoadingZubrik from './LoadingZubrik'
import RouteBuilder from './RouteBuilder'

type RouteActiveProps = {
  routeId: string
  routeName: string
  authorId?: string | null
  isMain?: boolean
  userLocation: [number, number] | null
  onClose: () => void
}

export default function RouteActive({ routeId, routeName: initialRouteName, authorId, isMain, userLocation, onClose }: RouteActiveProps) {
  const { data: routeData } = trpc.getRouteById.useQuery({ routeId })
  const routeName = routeData?.route?.name || initialRouteName
  const { data: waypointsData, isLoading, isError, error } = trpc.getRouteWaypoints.useQuery({ routeId })
  const { data: user } = trpc.me.useQuery()
  const utils = trpc.useUtils()
  const [showSettings, setShowSettings] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const deleteMutation = trpc.deleteRoute.useMutation({
    onSuccess: () => {
      utils.getRoutes.invalidate()
      utils.getProfileStats.invalidate()
      onClose()
    }
  })

  const canEdit = user?.role === 'ADMIN' || (user && authorId === user.id)

  const handleDelete = () => {
    setShowSettings(false)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteMutation.mutate({ routeId })
    setShowDeleteConfirm(false)
  }

  // Трансформируем данные API в формат для рендеринга
  const waypoints = useMemo(() => {
    if (!waypointsData?.waypoints) return []
    return waypointsData.waypoints.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      icon: w.icon,
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
          <LoadingZubrik text="Загрузка маршрута..." />
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
          <div className="text-center text-[#6B6B6B] flex flex-col items-center">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mb-3 shadow-inner">
              <DynamicIcon name="Map" size={40} className="text-gray-400" />
            </div>
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
          <div className="w-10 flex justify-end relative">
            {canEdit && (
              <>
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className="p-2 -mr-2"
                >
                  <Settings size={20} />
                </button>
                
                {showSettings && (
                  <div className="absolute top-12 right-5 bg-white/90 backdrop-blur-md rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-white/50 overflow-hidden w-56 z-50 text-[#1C1C1E] animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => {
                        setShowSettings(false)
                        setIsEditing(true)
                      }}
                      className="w-full text-left px-5 py-4 hover:bg-[#F5F2EB]/80 text-[15px] font-bold border-b border-black/5 active:bg-[#E5E3DD]/50 transition-colors"
                    >
                      Редактировать маршрут
                    </button>
                    <button 
                      onClick={() => {
                        setShowSettings(false)
                        handleDelete()
                      }}
                      className="w-full text-left px-5 py-4 text-red-500 hover:bg-red-50/80 text-[15px] font-bold active:bg-red-100/50 transition-colors"
                    >
                      Удалить маршрут
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-[#E8922A] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isCompleted ? (
          <div className="p-5 flex flex-col items-center justify-center min-h-full text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-[#1A3D2B] to-[#E8922A] rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
              <DynamicIcon name="Trophy" size={64} className="text-white drop-shadow-lg" />
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
                    <DynamicIcon name={nextWaypoint.icon || 'MapPin'} size={32} className="text-white drop-shadow-sm" />
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
                        <span className="flex-shrink-0 flex items-center justify-center"><DynamicIcon name={waypoint.icon || 'MapPin'} size={24} /></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Удалить маршрут?"
        message="Вы уверены, что хотите удалить этот маршрут? Это действие нельзя отменить."
        confirmText={deleteMutation.isPending ? "Удаление..." : "Удалить"}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {isEditing && (
        <RouteBuilder 
          editRouteId={routeId} 
          onClose={() => {
            setIsEditing(false)
            utils.getRouteById.invalidate({ routeId })
            utils.getRouteWaypoints.invalidate({ routeId })
            utils.getRoutes.invalidate()
          }} 
        />
      )}
    </div>
  )
}

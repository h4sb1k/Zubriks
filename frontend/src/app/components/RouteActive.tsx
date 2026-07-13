import { AnimatePresence, motion } from 'framer-motion'
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
  const canEdit = Boolean(user && authorId === user.id)

  const handleDelete = () => {
    setShowSettings(false)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteMutation.mutate({ routeId })
    setShowDeleteConfirm(false)
  }

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

  const remainingPoints = waypoints.filter((w) => !w.completed).map((w) => w.coords)

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

  const routeImageUrl = routeData?.route?.imageUrl
  const routeImageColor = routeData?.route?.imageColor || '#1A3D2B'
  const routeIconName = routeData?.route?.icon || 'MapPin'

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAFAF7] flex flex-col items-center justify-center">
        <LoadingZubrik text="Загрузка маршрута..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAFAF7] flex flex-col p-5 items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <DynamicIcon name="AlertTriangle" size={32} className="text-red-500" />
        </div>
        <h2 className="text-[24px] font-black text-[#1C1C1E] mb-2">Упс!</h2>
        <p className="text-[#6B6B6B] mb-8">{error?.message || 'Не удалось загрузить маршрут'}</p>
        <button onClick={onClose} className="bg-[#E8922A] text-white px-8 py-3.5 rounded-full font-bold shadow-lg">
          Вернуться назад
        </button>
      </div>
    )
  }

  if (waypoints.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAFAF7] flex flex-col p-5 items-center justify-center text-center">
        <div className="bg-[#F5F2EB] rounded-full w-24 h-24 flex items-center justify-center mb-4 shadow-inner">
          <DynamicIcon name="Map" size={40} className="text-[#6B6B6B]" />
        </div>
        <h2 className="text-[24px] font-black text-[#1C1C1E] mb-2">{routeName}</h2>
        <p className="text-[#6B6B6B] mb-8">У этого маршрута пока нет точек.</p>
        <button onClick={onClose} className="bg-[#E8922A] text-white px-8 py-3.5 rounded-full font-bold shadow-lg">
          Назад
        </button>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#FAFAF7] flex flex-col overflow-hidden"
    >
      {/* Premium Hero Header */}
      <div className="relative h-[35vh] min-h-[260px] shrink-0 flex flex-col">
        {routeImageUrl ? (
          <img src={routeImageUrl} alt={routeName} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: routeImageColor }}>
             <DynamicIcon name={routeIconName} size={140} className="text-white/20 transform -rotate-12 translate-y-10 scale-125 drop-shadow-2xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E]/90 via-[#1C1C1E]/40 to-[#1C1C1E]/60" />

        {/* Top Navbar */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 safe-top text-white">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform border border-white/10 shadow-sm">
            <ArrowLeft size={20} />
          </button>
          
          <div className="text-[13px] font-bold tracking-[0.15em] uppercase opacity-90 drop-shadow-md">
            {isCompleted ? 'Завершён' : `Шаг ${Math.max(currentStep + 1, 1)} из ${waypoints.length}`}
          </div>

          <div className="w-10 relative flex justify-end">
            {canEdit && (
               <>
                 <button onClick={() => setShowSettings(!showSettings)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform border border-white/10 shadow-sm">
                   <Settings size={20} />
                 </button>
                 
                 <AnimatePresence>
                   {showSettings && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.95, y: 10 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95, y: 10 }}
                       className="absolute top-12 right-0 bg-white/95 backdrop-blur-xl rounded-[24px] shadow-[0_16px_40px_rgba(0,0,0,0.15)] border border-white/50 overflow-hidden w-56 z-50 text-[#1C1C1E] p-1"
                     >
                       <button 
                         onClick={() => {
                           setShowSettings(false)
                           setIsEditing(true)
                         }}
                         className="w-full text-left px-4 py-3.5 hover:bg-[#F5F2EB] rounded-[18px] text-[15px] font-bold transition-colors"
                       >
                         Редактировать
                       </button>
                       <button 
                         onClick={() => {
                           setShowSettings(false)
                           handleDelete()
                         }}
                         className="w-full text-left px-4 py-3.5 text-red-500 hover:bg-red-50 rounded-[18px] text-[15px] font-bold transition-colors mt-1"
                       >
                         Удалить маршрут
                       </button>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </>
            )}
          </div>
        </div>

        {/* Route Info bottom left */}
        <div className="relative z-10 mt-auto px-5 pb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[32px] font-black text-white leading-[1.1] drop-shadow-md mb-4"
          >
            {routeName}
          </motion.h1>

          {/* Glassy Progress Bar */}
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-sm relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.3 }}
              className="absolute top-0 left-0 bottom-0 bg-[#E8922A] rounded-full shadow-[0_0_10px_rgba(232,146,42,0.8)]"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-[#FAFAF7] rounded-t-[32px] -mt-6 relative z-20 overflow-y-auto px-5 pt-8 pb-24 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        {isCompleted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[40vh] text-center pt-6 pb-10"
          >
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-32 h-32 bg-gradient-to-br from-[#1A3D2B] to-[#E8922A] rounded-full flex items-center justify-center mb-8 shadow-[0_20px_40px_rgba(26,61,43,0.3)] relative"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
              <DynamicIcon name="Trophy" size={64} className="text-white drop-shadow-xl relative z-10" />
            </motion.div>
            <h2 className="text-[32px] font-black text-[#1C1C1E] mb-3 tracking-tight">Маршрут пройден!</h2>
            <p className="text-[#6B6B6B] mb-10 text-[16px] leading-relaxed max-w-[280px]">
              Вы успешно прошли все точки маршрута «<span className="font-bold text-[#1C1C1E]">{routeName}</span>»!
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[#E8922A] text-white rounded-[20px] py-4 flex items-center justify-center gap-2 active:scale-95 transition-transform text-[16px] font-bold shadow-[0_12px_30px_rgba(232,146,42,0.3)]"
            >
              <CheckCircle2 size={22} />
              <span>Вернуться назад</span>
            </button>
          </motion.div>
        ) : (
          <>
            {nextWaypoint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="bg-white rounded-[28px] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] mb-8 border border-[#E5E3DD]/50 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8922A]/5 rounded-bl-[100px] pointer-events-none" />
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 bg-[#34C759] rounded-full animate-pulse shadow-[0_0_8px_rgba(52,199,89,0.5)]" />
                  <span className="text-[13px] font-bold text-[#6B6B6B] tracking-wider uppercase">Следующая точка</span>
                </div>

                <div className="flex gap-4 mb-5">
                  <div className="w-16 h-16 bg-[#F5F2EB] rounded-[20px] flex items-center justify-center text-3xl shrink-0 border border-[#E5E3DD]">
                    <DynamicIcon name={nextWaypoint.icon || 'MapPin'} size={32} className="text-[#E8922A]" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-black text-[#1C1C1E] leading-tight mb-1">{nextWaypoint.name}</h2>
                    {nextWaypoint.description && (
                      <p className="text-[14px] text-[#6B6B6B] leading-snug line-clamp-2">{nextWaypoint.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-[#E8922A] text-[14px] font-bold">
                       <MapPin size={16} />
                       <span>{nextWaypoint.distance}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleOpenInMaps}
                  className="w-full bg-[#1A3D2B] text-white rounded-[20px] py-4 flex items-center justify-center gap-2 font-bold active:scale-[0.98] transition-transform shadow-[0_8px_24px_rgba(26,61,43,0.25)]"
                >
                  <Navigation size={20} />
                  <span>Построить маршрут</span>
                </button>
              </motion.div>
            )}

            <div className="space-y-3">
              <h3 className="text-[18px] font-black text-[#1C1C1E] tracking-tight mb-4 px-1">Все точки</h3>
              {waypoints.map((waypoint, index) => (
                <motion.div
                  key={waypoint.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className={`flex items-start gap-4 p-4 rounded-[24px] transition-colors border ${
                    waypoint.completed
                      ? 'bg-white border-[#E5E3DD] opacity-70 shadow-sm'
                      : index === currentStep
                        ? 'bg-[#FFF9E6] border-[#E8922A]/30 shadow-sm'
                        : 'bg-white border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                  }`}
                >
                  <div className="flex items-center justify-center shrink-0">
                    {waypoint.completed ? (
                      <div className="w-10 h-10 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-[#34C759]" />
                      </div>
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-black border-2 ${
                          index === currentStep 
                            ? 'bg-[#E8922A] text-white border-[#E8922A] shadow-[0_4px_12px_rgba(232,146,42,0.3)]' 
                            : 'bg-[#F5F2EB] text-[#6B6B6B] border-[#E5E3DD]'
                        }`}
                      >
                        {index + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 pr-2">
                        <h4 className={`text-[16px] font-bold leading-tight truncate ${waypoint.completed ? 'text-[#6B6B6B] line-through' : 'text-[#1C1C1E]'}`}>
                          {waypoint.name}
                        </h4>
                        {waypoint.description && (
                          <p className="text-[13px] text-[#6B6B6B] mt-1.5 line-clamp-2 leading-relaxed">
                            {waypoint.description}
                          </p>
                        )}
                      </div>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${waypoint.completed ? 'bg-[#F5F2EB]' : 'bg-[#E8922A]/10'}`}>
                        <DynamicIcon name={waypoint.icon || 'MapPin'} size={18} className={waypoint.completed ? 'text-[#6B6B6B]' : 'text-[#E8922A]'} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
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
    </motion.div>
  )
}

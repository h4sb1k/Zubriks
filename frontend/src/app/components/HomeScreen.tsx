import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Check, ChevronRight, Clock,Lock, MapPin, Route, Trophy } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '../lib/trpc'
import { calculateDistance } from '../utils/distance'
import { DynamicIcon } from './DynamicIcon'
import LeaderboardScreen from './LeaderboardScreen'
import LoadingZubrik from './LoadingZubrik'
import RouteActive from './RouteActive'
import ZubrikDetail from './ZubrikDetail'
import ZubrikImage from './ZubrikImage'

type Zubrik = {
  id: string
  name: string
  description: string
  distance: string
  unlocked: boolean
  imageUrl: string
  coordinates?: [number, number, string]
}

type UserData = {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
}

export default function HomeScreen({
  userLocation,
  user,
  onNavigate,
}: {
  userLocation: [number, number] | null
  user: UserData
  onNavigate: () => void
}) {
  const [selectedZubrik, setSelectedZubrik] = useState<Zubrik | null>(null)
  const [showMainRoute, setShowMainRoute] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const {
    data: zubriksData,
    isLoading: zubriksLoading,
    isError: zubriksIsError,
    error: zubriksError,
  } = trpc.getZubriks.useQuery()
  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsIsError,
    error: eventsError,
  } = trpc.getEvents.useQuery()
  const zubriks = (zubriksData?.zubriks || []).map((z) => {
    let distance = '...'
    if (userLocation && z.coordinates) {
      distance = calculateDistance(userLocation[0], userLocation[1], z.coordinates[0], z.coordinates[1])
    }
    return {
      ...(z as Zubrik),
      distance,
    }
  })

  const {
    data: mainRouteData,
    isLoading: isMainRouteLoading,
    isError: isMainRouteError,
    error: mainRouteError,
  } = trpc.getMainRoute.useQuery()

  if (isMainRouteLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAF7]">
        <LoadingZubrik text="Загрузка маршрутов..." />
      </div>
    )
  }

  if (isMainRouteError || !mainRouteData?.mainRoute) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAF7] p-5">
        <span className="text-red-500">Ошибка загрузки: {mainRouteError?.message || 'Маршрут не найден'}</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-5 pt-6 pb-8 bg-[#F5F2EB]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[22px] font-bold text-[#1C1C1E] mb-1 tracking-tight">Привет, {user.name || 'Исследователь'}!</h1>
              <p className="text-[#6B6B6B] font-medium">Готов исследовать Орёл?</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_rgba(232,146,42,0.15)] active:scale-95 transition-transform border border-[#F5F2EB]"
              >
                <Trophy size={22} className="text-[#E8922A]" />
              </button>
              <button
                onClick={onNavigate}
                className="w-14 h-14 rounded-full bg-[#1A3D2B] flex items-center justify-center overflow-hidden transition-transform active:scale-90 shadow-md border-[3px] border-white"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Аватар" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-lg">🦬</span>
                )}
              </button>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-[32px] overflow-hidden shadow-[0_12px_30px_rgba(26,61,43,0.08)] mb-8"
          >
            <div className="h-48 relative overflow-hidden flex items-end p-5">
              <img
                src="/images/Tour-Zubriki-1.webp"
                alt="Тур Зубрики"
                className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2), transparent)' }} />
              <div className="absolute top-4 right-4 bg-[#E8922A] text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-sm z-10">
                Главный маршрут
              </div>
              <div className="relative z-10 w-full text-center">
                <h2 className="text-white text-2xl font-bold mb-1 drop-shadow-sm">{mainRouteData?.mainRoute?.name}</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[#6B6B6B] mb-4">{mainRouteData?.mainRoute?.description}</p>
              <div className="flex items-center gap-4 mb-4 text-sm text-[#6B6B6B] font-medium">
                <div className="flex items-center gap-1.5">
                  <Route size={18} className="text-[#E8922A]" />
                  <span>{mainRouteData?.mainRoute?.distance}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={18} className="text-[#E8922A]" />
                  <span>{mainRouteData?.mainRoute?.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={18} className="text-[#E8922A]" />
                  <span>{mainRouteData?.mainRoute?.stops} остановок</span>
                </div>
              </div>
              <button
                onClick={() => setShowMainRoute(true)}
                className="w-full bg-[#E8922A] text-white rounded-full py-4 mt-2 font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <span>Начать путешествие</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>

        <div className="px-5 pb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Зубрики рядом</h2>
            <MapPin size={22} className="text-[#E8922A]" />
          </div>

          {zubriksLoading && <LoadingZubrik text="Загрузка..." />}
          {zubriksIsError && <span className="text-red-500">Ошибка: {zubriksError.message}</span>}

          {zubriksData && (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.08 } },
                hidden: {}
              }}
              className="flex gap-3 overflow-x-auto pb-4 pt-1 -mx-5 px-5 scrollbar-hide"
            >
              {zubriks.map((zubrik) => (
                <motion.button
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { opacity: 1, scale: 1, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.5 } }
                  }}
                  key={zubrik.id}
                  onClick={() => setSelectedZubrik(zubrik as Zubrik)}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 w-40 bg-white rounded-[24px] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
                >
                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden shadow-inner bg-[#E8922A]/15"
                  >
                    <ZubrikImage src={zubrik.imageUrl} alt={zubrik.name} iconSize={32} />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#1C1C1E] mb-1.5 line-clamp-2 min-h-[2.5rem] leading-tight">{zubrik.name}</h3>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B6B6B]">{zubrik.distance}</span>
                    {zubrik.unlocked ? (
                      <div className="bg-emerald-100/80 text-emerald-600 p-1 rounded-full shadow-sm">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="bg-gray-100/80 text-gray-400 p-1 rounded-full shadow-sm">
                        <Lock size={14} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        <div className="px-5 pb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">События сегодня</h2>
            <Calendar size={22} className="text-[#E8922A]" />
          </div>

          {eventsLoading && <LoadingZubrik text="Загрузка..." />}
          {eventsIsError && <span className="text-red-500">Ошибка: {eventsError.message}</span>}

          {eventsData && (
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
                hidden: {}
              }}
              className="space-y-4"
            >
              {eventsData.events.map((event) => (
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.6 } }
                  }}
                  key={event.id} 
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
                >
                  <div className="h-32 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A3D2B, #2A5D43)' }}>
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="z-10 bg-white/20 p-4 rounded-full backdrop-blur-sm shadow-lg">
                        <DynamicIcon name="Tent" size={48} className="text-white drop-shadow-md" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <div className="p-5">
                    <div className="inline-block bg-[#F5F2EB] px-3 py-1.5 rounded-full text-xs font-bold text-[#6B6B6B] mb-2 shadow-sm">
                      {event.category}
                    </div>
                    <h3 className="text-[16px] font-bold text-[#1C1C1E] mb-2 leading-tight">{event.title}</h3>
                    <div className="flex items-center gap-3 text-[13px] font-medium text-[#6B6B6B]">
                      <span className="flex items-center gap-1"><Calendar size={14} />{event.time}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin size={14} />{event.venue}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {selectedZubrik && (
        <ZubrikDetail
          name={selectedZubrik.name}
          unlocked={selectedZubrik.unlocked}
          description={selectedZubrik.description}
          imageUrl={selectedZubrik.imageUrl}
          coordinates={selectedZubrik.coordinates}
          onClose={() => setSelectedZubrik(null)}
        />
      )}

      {showMainRoute && mainRouteData?.mainRoute && (
        <RouteActive
          routeId={mainRouteData.mainRoute.id}
          routeName={mainRouteData.mainRoute.name}
          userLocation={userLocation}
          onClose={() => setShowMainRoute(false)}
        />
      )}

      <AnimatePresence>
        {showLeaderboard && <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />}
      </AnimatePresence>
    </>
  )
}

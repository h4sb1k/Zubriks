import { Calendar, ChevronRight, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'

import { trpc } from '../lib/trpc'
import { calculateDistance } from '../utils/distance'
import RouteActive from './RouteActive'
import ZubrikDetail from './ZubrikDetail'

type Zubrik = {
  id: string
  name: string
  description: string
  distance: string
  unlocked: boolean
  imageColor: string
  imageUrl: string
  coordinates?: [number, number, string]
}

export default function HomeScreen() {
  const [selectedZubrik, setSelectedZubrik] = useState<Zubrik | null>(null)
  const [showRouteActive, setShowRouteActive] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.warn('Geolocation error on home screen:', error)
        }
      )
    }
  }, [])

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
    let distance = z.distance
    if (userLocation && z.coordinates) {
      distance = calculateDistance(userLocation[0], userLocation[1], z.coordinates[0], z.coordinates[1])
    }
    return {
      ...(z as Zubrik),
      distance,
    }
  })

  return (
    <>
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-5 pt-6 pb-8 bg-[#F5F2EB]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl mb-1">Привет, Исследователь! 👋</h1>
              <p className="text-[#6B6B6B]">Исследуй Орёл</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#1A3D2B] flex items-center justify-center">
              <span className="text-white text-lg">🦬</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <div className="h-44 bg-gradient-to-br from-[#1A3D2B] to-[#2A5D3B] flex items-center justify-center relative">
              <div className="absolute top-4 right-4 bg-[#E8922A] text-white px-3 py-1.5 rounded-full text-sm">
                Главный маршрут
              </div>
              <div className="text-center">
                <div className="text-6xl mb-2">🦬</div>
                <h2 className="text-white text-xl">Тур «Зубрики»</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[#6B6B6B] mb-4">
                Пройди по главным достопримечательностям Орла и собери всех зубриков
              </p>
              <button
                onClick={() => setShowRouteActive(true)}
                className="w-full bg-[#E8922A] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2"
              >
                <span>Начать путешествие</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Зубрики рядом</h2>
            <MapPin size={20} className="text-[#E8922A]" />
          </div>

          {zubriksLoading && <span className="text-[#6B6B6B]">Загрузка...</span>}
          {zubriksIsError && <span className="text-red-500">Ошибка: {zubriksError.message}</span>}

          {zubriksData && (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              {zubriks.map((zubrik) => (
                <button
                  key={zubrik.id}
                  onClick={() => setSelectedZubrik(zubrik as Zubrik)}
                  className="flex-shrink-0 w-40 bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div
                    className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: zubrik.imageColor + '20' }}
                  >
                    {/* 3. Рендерим изображение. Если ссылки нет, оставляем эмодзи как фолбек */}
                    {zubrik.imageUrl ? (
                      <img src={zubrik.imageUrl} alt={zubrik.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">🦬</span>
                    )}
                  </div>
                  <h3 className="text-sm mb-1 line-clamp-2 min-h-[2.5rem]">{zubrik.name}</h3>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B6B6B]">{zubrik.distance}</span>
                    {zubrik.unlocked ? (
                      <span className="text-[#34C759]">✓</span>
                    ) : (
                      <span className="text-[#6B6B6B]">🔒</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">События сегодня</h2>
            <Calendar size={20} className="text-[#E8922A]" />
          </div>

          {eventsLoading && <span className="text-[#6B6B6B]">Загрузка...</span>}
          {eventsIsError && <span className="text-red-500">Ошибка: {eventsError.message}</span>}

          {eventsData && (
            <div className="space-y-3">
              {eventsData.events.map((event) => (
                <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="h-24 bg-gradient-to-r from-[#1A3D2B] to-[#E8922A] flex items-center justify-center">
                    <span className="text-4xl">🎭</span>
                  </div>
                  <div className="p-4">
                    <div className="inline-block bg-[#F5F2EB] px-2.5 py-1 rounded-full text-xs text-[#6B6B6B] mb-2">
                      {event.category}
                    </div>
                    <h3 className="text-sm mb-2 line-clamp-2">{event.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
                      <span>{event.time}</span>
                      <span>•</span>
                      <span>{event.venue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

      {showRouteActive && <RouteActive onClose={() => setShowRouteActive(false)} />}
    </>
  )
}

import { ChevronRight, Clock, Heart, MapPin, Plus } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '../lib/trpc'
import LoadingZubrik from './LoadingZubrik'
import PublicProfileScreen from './PublicProfileScreen'
import RouteActive from './RouteActive'
import RouteBuilder from './RouteBuilder'

type Route = {
  id: string
  name: string
  distance: string
  duration: string
  stops: number
  authorId?: string | null
  author: string
  description?: string
  liked: boolean
  imageColor: string
  emoji: string
}

export default function RoutesScreen({ userLocation }: { userLocation: [number, number] | null }) {
  const [activeFilter, setActiveFilter] = useState('Все')
  const [activeRoute, setActiveRoute] = useState<{ id: string; name: string; authorId?: string | null; isMain?: boolean } | null>(null)
  const [viewProfileId, setViewProfileId] = useState<string | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)

  const utils = trpc.useUtils()
  const { data: routesData, isLoading, isError, error } = trpc.getRoutes.useQuery()

  const toggleLikeMutation = trpc.toggleRouteLike.useMutation({
    onMutate: async ({ routeId }) => {
      await utils.getRoutes.cancel()
      const previousData = utils.getRoutes.getData()

      if (previousData) {
        utils.getRoutes.setData(undefined, {
          ...previousData,
          routes: previousData.routes.map((r) =>
            r.id === routeId ? { ...r, liked: !r.liked } : r
          ),
        })
      }

      return { previousData }
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        utils.getRoutes.setData(undefined, context.previousData)
      }
    },
    onSettled: () => {
      utils.getRoutes.invalidate()
      utils.getProfileStats.invalidate()
    },
  })

  const toggleLike = (id: string) => {
    toggleLikeMutation.mutate({ routeId: id })
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAF7]">
        <LoadingZubrik text="Загрузка маршрутов..." />
      </div>
    )
  }

  if (isError || !routesData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAF7] p-5">
        <span className="text-red-500">Ошибка загрузки: {error?.message || 'Неизвестная ошибка'}</span>
      </div>
    )
  }

  const { routes, mainRoute } = routesData

  const displayedRoutes = (routes || []) as Route[]

  const filteredRoutes = displayedRoutes.filter((route) => {
    if (activeFilter === 'Избранные') {
      return route.liked
    }
    if (activeFilter === 'Мои') {
      return route.author === 'Я' || route.id === 'user-created'
    }
    return true
  })

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-bold text-[#1C1C1E] mb-5 tracking-tight">Маршруты</h1>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide mb-6">
          {['Все', 'Мои', 'Избранные'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeFilter === filter ? 'bg-[#E8922A] text-white shadow-md' : 'bg-[#F5F2EB] text-[#6B6B6B] hover:bg-[#E5E3DD]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_12px_30px_rgba(26,61,43,0.08)] mb-8">
          <div className="h-48 relative overflow-hidden flex items-end p-5">
            <img
              src="/images/Tour-Zubriki-1.webp"
              alt="Тур Зубрики"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2), transparent)' }} />
            <div className="absolute top-4 right-4 bg-[#E8922A] text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-sm z-10">
              Главный маршрут
            </div>
            <div className="relative z-10 w-full text-center">
              <h2 className="text-white text-2xl font-bold mb-1 drop-shadow-sm">{mainRoute?.name}</h2>
            </div>
          </div>
          <div className="p-5">
            <p className="text-[#6B6B6B] mb-4">{mainRoute?.description}</p>
            <div className="flex items-center gap-4 mb-4 text-sm text-[#6B6B6B]">
              <div className="flex items-center gap-1.5">
                <MapPin size={16} />
                <span>{mainRoute?.distance}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} />
                <span>{mainRoute?.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                <span>{mainRoute?.stops} остановок</span>
              </div>
            </div>
            <button
              onClick={() => setActiveRoute({ id: mainRoute?.id as string, name: mainRoute?.name as string, isMain: true })}
              className="w-full bg-[#E8922A] text-white rounded-full py-4 mt-2 font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <span>В путь</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pb-8">
        <h2 className="text-[20px] font-bold text-[#1C1C1E] mb-5 tracking-tight">Другие маршруты</h2>
        <div className="grid grid-cols-2 gap-3">
          {filteredRoutes.map((route) => (
            <div
              key={route.id}
              onClick={() => setActiveRoute({ id: route.id, name: route.name, authorId: route.authorId })}
              className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.05)] cursor-pointer active:scale-[0.98] transition-all border border-transparent hover:border-[#E5E3DD]/50"
            >
              <div
                className="w-full h-28 flex items-center justify-center shrink-0 shadow-inner"
                style={{ backgroundColor: route.imageColor }}
              >
                <span className="text-[3.5rem] drop-shadow-md">{route.emoji}</span>
              </div>
              <div className="p-4">
                <h3 className="text-[15px] font-bold text-[#1C1C1E] mb-2 line-clamp-2 min-h-[2.5rem] leading-tight">{route.name}</h3>
                <div className="flex items-center gap-2 text-xs text-[#6B6B6B] mb-2">
                  <span>{route.distance}</span>
                  <span>•</span>
                  <span>{route.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div 
                    className={`flex items-center gap-1.5 ${route.authorId ? 'hover:opacity-80 active:scale-95 transition-all' : ''}`}
                    onClick={(e) => {
                      if (route.authorId) {
                        e.preventDefault()
                        e.stopPropagation()
                        setViewProfileId(route.authorId)
                      }
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#E8922A] flex items-center justify-center text-xs text-white">
                      {route.author.charAt(0)}
                    </div>
                    <span className="text-xs text-[#6B6B6B] truncate max-w-[80px]">{route.author}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleLike(route.id)
                    }}
                    className="p-1"
                  >
                    <Heart size={16} className={route.liked ? 'fill-[#E8922A] text-[#E8922A]' : 'text-[#6B6B6B]'} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsBuilding(true)}
        className="fixed bottom-24 right-5 w-16 h-16 bg-[#E8922A] text-white rounded-full shadow-[0_8px_20px_rgba(232,146,42,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-[3px] border-white z-40"
      >
        <Plus size={24} />
      </button>

      {isBuilding && <RouteBuilder onClose={() => setIsBuilding(false)} />}

      {activeRoute && (
        <RouteActive
          routeId={activeRoute.id}
          routeName={activeRoute.name}
          authorId={activeRoute.authorId}
          isMain={activeRoute.isMain}
          userLocation={userLocation}
          onClose={() => setActiveRoute(null)}
        />
      )}

      {viewProfileId && (
        <PublicProfileScreen userId={viewProfileId} onClose={() => setViewProfileId(null)} />
      )}
    </div>
  )
}

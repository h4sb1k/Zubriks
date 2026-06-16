import { ChevronRight, Clock, Heart, MapPin, Plus } from 'lucide-react'
import { useState } from 'react'

type Route = {
  id: string
  name: string
  distance: string
  duration: string
  stops: number
  author: string
  liked: boolean
  imageColor: string
}

const mainRoute = {
  id: 'main',
  name: 'Тур «Зубрики»',
  distance: '5.2 км',
  duration: '2-3 часа',
  stops: 8,
  description: 'Пройди по главным достопримечательностям Орла и собери всех зубриков',
}

const mockRoutes: Route[] = [
  {
    id: '1',
    name: 'Исторический центр',
    distance: '3.5 км',
    duration: '1.5 ч',
    stops: 5,
    author: 'Анна К.',
    liked: false,
    imageColor: '#1A3D2B',
  },
  {
    id: '2',
    name: 'Парки и скверы',
    distance: '4.2 км',
    duration: '2 ч',
    stops: 6,
    author: 'Дмитрий М.',
    liked: true,
    imageColor: '#34C759',
  },
  {
    id: '3',
    name: 'Музеи Орла',
    distance: '2.8 км',
    duration: '3 ч',
    stops: 4,
    author: 'Елена В.',
    liked: false,
    imageColor: '#E8922A',
  },
  {
    id: '4',
    name: 'Архитектура модерна',
    distance: '3.0 км',
    duration: '1 ч',
    stops: 7,
    author: 'Игорь С.',
    liked: false,
    imageColor: '#D4A017',
  },
]

export default function RoutesScreen() {
  const [activeFilter, setActiveFilter] = useState('Все')
  const [routes, setRoutes] = useState(mockRoutes)

  const toggleLike = (id: string) => {
    setRoutes(routes.map((route) => (route.id === id ? { ...route, liked: !route.liked } : route)))
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl mb-4">Маршруты</h1>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide mb-6">
          {['Все', 'Зубрики', 'Мои', 'Избранные'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors ${
                activeFilter === filter ? 'bg-[#E8922A] text-white' : 'bg-[#F5F2EB] text-[#1C1C1E]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-6">
          <div className="h-48 bg-gradient-to-br from-[#1A3D2B] via-[#2A5D3B] to-[#E8922A] flex items-center justify-center relative">
            <div className="absolute top-4 right-4 bg-[#E8922A] text-white px-3 py-1.5 rounded-full text-sm">
              Главный маршрут
            </div>
            <div className="text-center">
              <div className="text-6xl mb-2">🦬</div>
              <h2 className="text-white text-xl mb-1">{mainRoute.name}</h2>
            </div>
          </div>
          <div className="p-5">
            <p className="text-[#6B6B6B] mb-4">{mainRoute.description}</p>
            <div className="flex items-center gap-4 mb-4 text-sm text-[#6B6B6B]">
              <div className="flex items-center gap-1.5">
                <MapPin size={16} />
                <span>{mainRoute.distance}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} />
                <span>{mainRoute.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                <span>{mainRoute.stops} остановок</span>
              </div>
            </div>
            <button className="w-full bg-[#E8922A] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2">
              <span>В путь</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pb-6">
        <h2 className="text-lg mb-4">Другие маршруты</h2>
        <div className="grid grid-cols-2 gap-3">
          {routes.map((route) => (
            <div key={route.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div
                className="h-28 flex items-center justify-center text-4xl"
                style={{ backgroundColor: route.imageColor }}
              >
                🗺️
              </div>
              <div className="p-3">
                <h3 className="text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{route.name}</h3>
                <div className="flex items-center gap-2 text-xs text-[#6B6B6B] mb-2">
                  <span>{route.distance}</span>
                  <span>•</span>
                  <span>{route.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#E8922A] flex items-center justify-center text-xs">
                      {route.author.charAt(0)}
                    </div>
                    <span className="text-xs text-[#6B6B6B]">{route.author}</span>
                  </div>
                  <button onClick={() => toggleLike(route.id)} className="p-1">
                    <Heart size={16} className={route.liked ? 'fill-[#E8922A] text-[#E8922A]' : 'text-[#6B6B6B]'} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="fixed bottom-24 right-5 w-14 h-14 bg-[#E8922A] text-white rounded-full shadow-lg flex items-center justify-center">
        <Plus size={24} />
      </button>
    </div>
  )
}

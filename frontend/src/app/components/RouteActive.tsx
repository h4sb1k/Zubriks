import { ArrowLeft, CheckCircle2, MapPin, Navigation } from 'lucide-react'
import { useState } from 'react'

import { MapPoint, openPointInMaps, openRouteInMaps } from '../utils/openInMaps'

type RouteActiveProps = {
  onClose: () => void
}

type Waypoint = {
  id: string
  name: string
  description: string
  distance: string
  completed: boolean
  emoji: string
  // Реальные координаты точки (Орёл)
  coords: MapPoint
}

const mockWaypoints: Waypoint[] = [
  {
    id: '1',
    name: 'Площадь Ленина',
    description: 'Главная площадь города',
    distance: '0 м',
    completed: true,
    emoji: '🏛️',
    coords: { lat: 52.9674, lon: 36.0694, name: 'Площадь Ленина' },
  },
  {
    id: '2',
    name: 'Парк Культуры',
    description: 'Исторический парк',
    distance: '150 м',
    completed: true,
    emoji: '🌳',
    coords: { lat: 52.9688, lon: 36.071, name: 'Парк Культуры' },
  },
  {
    id: '3',
    name: 'Зубрик-Путешественник',
    description: 'Найди первого зубрика',
    distance: '320 м',
    completed: false,
    emoji: '🦬',
    coords: { lat: 52.9701, lon: 36.0732, name: 'Зубрик-Путешественник' },
  },
  {
    id: '4',
    name: 'Музей изобразительных искусств',
    description: 'Посети музей',
    distance: '580 м',
    completed: false,
    emoji: '🎨',
    coords: { lat: 52.972, lon: 36.0755, name: 'Музей изобразительных искусств' },
  },
  {
    id: '5',
    name: 'Набережная',
    description: 'Прогуляйся вдоль реки',
    distance: '1.2 км',
    completed: false,
    emoji: '🌊',
    coords: { lat: 52.975, lon: 36.08, name: 'Набережная' },
  },
]

export default function RouteActive({ onClose }: RouteActiveProps) {
  const [waypoints] = useState(mockWaypoints)

  const currentStep = waypoints.findIndex((w) => !w.completed)
  const progress = (currentStep / waypoints.length) * 100
  const nextWaypoint = waypoints[currentStep]

  // Незавершённые точки — передаём в утилиту как маршрут
  const remainingPoints = waypoints.filter((w) => !w.completed).map((w) => w.coords)

  const handleOpenInMaps = () => {
    if (remainingPoints.length > 1) {
      openRouteInMaps(remainingPoints)
    } else if (remainingPoints.length === 1) {
      openPointInMaps(remainingPoints[0])
    }
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
            <div className="text-sm opacity-80">Тур «Зубрики»</div>
            <div className="text-lg">
              Шаг {currentStep + 1} из {waypoints.length}
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
        {nextWaypoint && (
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
        )}
      </div>
    </div>
  )
}

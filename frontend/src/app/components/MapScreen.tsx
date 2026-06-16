import { MapPin, Navigation2, Search } from 'lucide-react'
import { useState } from 'react'

type MapZubrik = {
  id: string
  name: string
  distance: string
  visited: boolean
  locked: boolean
  position: { top: string; left: string }
}

const mapZubriks: MapZubrik[] = [
  {
    id: '1',
    name: 'Зубрик-Путешественник',
    distance: '150м',
    visited: true,
    locked: false,
    position: { top: '25%', left: '35%' },
  },
  {
    id: '2',
    name: 'Зубрик-Художник',
    distance: '320м',
    visited: true,
    locked: false,
    position: { top: '45%', left: '55%' },
  },
  {
    id: '3',
    name: 'Зубрик-Музыкант',
    distance: '500м',
    visited: false,
    locked: false,
    position: { top: '60%', left: '40%' },
  },
  {
    id: '4',
    name: 'Зубрик-Историк',
    distance: '780м',
    visited: false,
    locked: false,
    position: { top: '35%', left: '65%' },
  },
  {
    id: '5',
    name: 'Зубрик-Гурман',
    distance: '1.2км',
    visited: false,
    locked: true,
    position: { top: '70%', left: '60%' },
  },
]

export default function MapScreen() {
  const [selectedZubrik, setSelectedZubrik] = useState<MapZubrik | null>(null)

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#E5E3DD]">
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
            <Search size={20} className="text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Найти место или зубрика..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
          <button className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center">
            <Navigation2 size={20} className="text-[#1A3D2B]" />
          </button>
        </div>

        <div className="w-full h-full relative bg-gradient-to-br from-[#D5D3CD] to-[#E5E3DD]">
          <svg className="w-full h-full absolute inset-0" style={{ opacity: 0.2 }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1A3D2B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {mapZubriks.map((zubrik) => (
            <button
              key={zubrik.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-95"
              style={{ top: zubrik.position.top, left: zubrik.position.left }}
              onClick={() => setSelectedZubrik(zubrik)}
            >
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg ${
                    zubrik.locked ? 'bg-[#A0A0A0]' : zubrik.visited ? 'bg-[#E8922A]' : 'bg-[#1A3D2B]'
                  }`}
                >
                  {zubrik.locked ? '🔒' : '🦬'}
                </div>
                {!zubrik.visited && !zubrik.locked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#34C759] rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>

        {selectedZubrik && (
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-5 z-20 animate-slide-up">
            <div className="w-12 h-1.5 bg-[#E5E3DD] rounded-full mx-auto mb-4" />
            <div className="flex items-start gap-4">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
                  selectedZubrik.locked ? 'bg-[#A0A0A0]' : selectedZubrik.visited ? 'bg-[#E8922A]' : 'bg-[#1A3D2B]'
                }`}
              >
                {selectedZubrik.locked ? '🔒' : '🦬'}
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-1">{selectedZubrik.name}</h3>
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B] mb-3">
                  <MapPin size={16} />
                  <span>{selectedZubrik.distance}</span>
                </div>
                {selectedZubrik.visited ? (
                  <div className="inline-flex items-center gap-2 bg-[#34C759]/10 text-[#34C759] px-3 py-1.5 rounded-full text-sm">
                    <span>✓</span>
                    <span>Найден</span>
                  </div>
                ) : selectedZubrik.locked ? (
                  <div className="inline-flex items-center gap-2 bg-[#6B6B6B]/10 text-[#6B6B6B] px-3 py-1.5 rounded-full text-sm">
                    <span>🔒</span>
                    <span>Заблокирован</span>
                  </div>
                ) : (
                  <button className="bg-[#E8922A] text-white px-6 py-2.5 rounded-2xl text-sm">Найти меня!</button>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedZubrik(null)} className="w-full mt-4 py-2 text-sm text-[#6B6B6B]">
              Закрыть
            </button>
          </div>
        )}

        <div className="absolute bottom-20 left-4 right-4 z-10">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {mapZubriks
              .filter((z) => !z.visited && !z.locked)
              .slice(0, 3)
              .map((zubrik) => (
                <button
                  key={zubrik.id}
                  onClick={() => setSelectedZubrik(zubrik)}
                  className="flex-shrink-0 bg-white rounded-2xl p-3 shadow-lg flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1A3D2B] flex items-center justify-center text-xl">🦬</div>
                  <div className="text-left">
                    <div className="text-sm mb-0.5 whitespace-nowrap">{zubrik.name}</div>
                    <div className="text-xs text-[#6B6B6B]">{zubrik.distance}</div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

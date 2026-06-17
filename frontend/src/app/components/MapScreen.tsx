import * as L from 'leaflet'
import { MapPin, Navigation2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'

import { trpc } from '../lib/trpc'
import ZubrikDetail from './ZubrikDetail'

type Zubrik = {
  id: string
  name: string
  description: string
  distance: string
  unlocked: boolean
  imageColor: string
  imageUrl: string
}

// Real locations of interest in Orel for the walking tour
const ZUBRIK_COORDINATES: Record<string, [number, number]> = {
  '1': [52.9701, 36.0732], // Park of Culture / Children's Park
  '2': [52.9722, 36.0753], // Art Museum
  '3': [52.9681, 36.0695], // Central Square Bridge / River
  '4': [52.9754, 36.0812], // Historical Museum of Writers
  '5': [52.9655, 36.0671], // Turgenev Museum area
  '6': [52.9712, 36.0785], // Central Plaza Cafes
}

// Controller component to dynamically change map view and fix initial container size issues
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap()
  
  useEffect(() => {
    // Invalidate map size after mount to force Leaflet to recalculate size.
    // This solves the common issue of a blank/gray/white screen when Leaflet mounts
    // before the parent container has finished its layout sizing.
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)
    return () => clearTimeout(timer)
  }, [map])

  useEffect(() => {
    if (center) {
      map.setView(center, 15, { animate: true })
    }
  }, [center, map])
  
  return null
}

// Custom Leaflet marker generator for Zubrik avatars
const createZubrikIcon = (zubrik: Zubrik) => {
  const isFound = zubrik.unlocked
  const borderClass = isFound ? 'border-[#34C759] bg-[#CEE6B6]' : 'border-[#E8922A] bg-[#FEA35A]'
  const pulseHtml = !isFound
    ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-[#E8922A] rounded-full border-2 border-white animate-pulse"></div>'
    : ''
  const tintHtml = isFound
    ? '<div class="absolute inset-0 bg-[#34C759]/20 mix-blend-color rounded-full"></div>'
    : ''

  const iconHtml = `
    <div class="relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-3 overflow-hidden transition-all duration-300 hover:scale-110 ${borderClass}">
      ${
        zubrik.imageUrl
          ? `<div class="relative w-full h-full">
               <img src="${zubrik.imageUrl}" alt="${zubrik.name}" class="w-full h-full object-cover rounded-full" />
               ${tintHtml}
             </div>`
          : '<span class="text-xl text-white">🦬</span>'
      }
      ${pulseHtml}
    </div>
  `

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })
}

// GPS pulsing blue dot for User's Location
const createUserLocationIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative w-6 h-6 flex items-center justify-center">
        <div class="absolute w-6 h-6 bg-[#3b82f6]/30 rounded-full animate-ping"></div>
        <div class="w-4 h-4 bg-[#3b82f6] rounded-full border-2 border-white shadow-md"></div>
      </div>
    `,
    className: 'user-location-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

export default function MapScreen() {
  const [selectedZubrik, setSelectedZubrik] = useState<Zubrik | null>(null)
  const [detailZubrik, setDetailZubrik] = useState<Zubrik | null>(null)

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Touch gesture state for bottom sheet
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)

  const {
    data: zubriksData,
    isLoading: zubriksLoading,
    isError: zubriksIsError,
    error: zubriksError,
  } = trpc.getZubriks.useQuery()

  const mapZubriks = (zubriksData?.zubriks || []).map((z) => {
    const coords = ZUBRIK_COORDINATES[z.id] || [52.9701, 36.0732]
    return {
      ...(z as Zubrik),
      visited: z.unlocked,
      coords,
    }
  })

  // Geolocation centering logic
  const handleCenterUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMapCenter([latitude, longitude])
          setUserLocation([latitude, longitude])
        },
        (error) => {
          console.error('Error getting user location:', error)
          alert('Не удалось получить ваше местоположение. Убедитесь, что геопозиция включена в настройках браузера.')
        }
      )
    } else {
      alert('Геолокация не поддерживается вашим устройством.')
    }
  }

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - startY
    if (deltaY > 0) {
      setTranslateY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (translateY > 100) {
      setSelectedZubrik(null)
    }
    setTranslateY(0)
  }

  return (
    <div className="w-full h-full flex-1 relative overflow-hidden min-h-0">
      <div className="absolute inset-0 z-0 w-full h-full">
        {/* Leaflet MapContainer */}
        <MapContainer
          center={[52.9701, 36.0732]} // Center of Orel tour
          zoom={14.5}
          zoomControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Dynamic Map Controller */}
          <MapController center={mapCenter} />

          {/* User Location Pulsing Dot */}
          {userLocation && <Marker position={userLocation} icon={createUserLocationIcon()} />}

          {/* Zubriks Map Pins */}
          {mapZubriks.map((zubrik) => (
            <Marker
              key={zubrik.id}
              position={zubrik.coords}
              icon={createZubrikIcon(zubrik)}
              eventHandlers={{
                click: () => {
                  setSelectedZubrik(zubrik)
                },
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Floating overlays (placed in absolute positioning over Leaflet relative container) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Search Bar */}
        <div className="absolute top-4 left-4 right-4 pointer-events-auto">
          <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
            <Search size={20} className="text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Найти место или зубрика..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        {/* GPS Centering FAB */}
        <div className="absolute top-20 right-4 pointer-events-auto flex flex-col gap-2">
          <button
            onClick={handleCenterUserLocation}
            className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform cursor-pointer"
            aria-label="Центрировать местоположение"
          >
            <Navigation2 size={20} className="text-[#1A3D2B]" />
          </button>
        </div>

        {/* Loading Overlay */}
        {zubriksLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-xs">
            <span className="text-sm text-[#6B6B6B]">Загрузка карты...</span>
          </div>
        )}

        {/* Error Overlay */}
        {zubriksIsError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-xs p-4">
            <span className="text-sm text-red-500">Ошибка загрузки: {zubriksError.message}</span>
          </div>
        )}

        {/* Selected Zubrik Bottom Sheet */}
        {selectedZubrik && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateY(${translateY}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-5 pointer-events-auto touch-none select-none"
          >
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-[#E5E3DD] rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing" />
            <div className="flex items-start gap-4">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden shadow-sm border-3 ${
                  selectedZubrik.unlocked ? 'border-[#34C759] bg-[#34C759]/10' : 'border-[#E8922A] bg-[#E8922A]/10'
                }`}
              >
                {selectedZubrik.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={selectedZubrik.imageUrl}
                      alt={selectedZubrik.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedZubrik.unlocked && <div className="absolute inset-0 bg-[#34C759]/20 mix-blend-color" />}
                  </div>
                ) : (
                  <span className="text-3xl text-white">🦬</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-1">{selectedZubrik.name}</h3>
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B] mb-3">
                  <MapPin size={16} />
                  <span>{selectedZubrik.distance}</span>
                </div>
                <div className="flex gap-2">
                  {selectedZubrik.unlocked ? (
                    <div className="inline-flex items-center gap-2 bg-[#34C759]/10 text-[#34C759] px-3 py-1.5 rounded-full text-sm">
                      <span>✓</span>
                      <span>Найден</span>
                    </div>
                  ) : (
                    <button className="bg-[#E8922A] text-white px-6 py-2.5 rounded-2xl text-sm font-medium hover:bg-[#d68120] active:scale-95 transition-all">
                      Найти меня!
                    </button>
                  )}
                  <button
                    onClick={() => setDetailZubrik(selectedZubrik)}
                    className="border border-[#E5E3DD] text-[#1C1C1E] px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedZubrik(null)}
              className="w-full mt-4 py-2 text-sm text-[#6B6B6B] hover:text-gray-800 transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        )}

        {/* Nearby Zubriks Horizontal Scroll (when no specific pin selected) */}
        {!selectedZubrik && mapZubriks.length > 0 && (
          <div className="absolute bottom-20 left-4 right-4 pointer-events-auto">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {mapZubriks
                .filter((z) => !z.visited)
                .slice(0, 3)
                .map((zubrik) => (
                  <button
                    key={zubrik.id}
                    onClick={() => setSelectedZubrik(zubrik)}
                    className="flex-shrink-0 bg-white rounded-2xl p-3 shadow-lg flex items-center gap-3 border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1A3D2B] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {zubrik.imageUrl ? (
                        <img src={zubrik.imageUrl} alt={zubrik.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🦬</span>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-sm mb-0.5 whitespace-nowrap font-medium">{zubrik.name}</div>
                      <div className="text-xs text-[#6B6B6B]">{zubrik.distance}</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Zubrik Detail Modal overlay */}
      {detailZubrik && (
        <ZubrikDetail
          name={detailZubrik.name}
          description={detailZubrik.description}
          imageUrl={detailZubrik.imageUrl}
          unlocked={detailZubrik.unlocked}
          onClose={() => setDetailZubrik(null)}
        />
      )}
    </div>
  )
}

import * as L from 'leaflet'
import { Camera, Landmark, MapPin, Navigation, Navigation2, Palette, Search, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'

import { trpc } from '../lib/trpc'
import { calculateDistance } from '../utils/distance'
import { openPointInMaps } from '../utils/openInMaps'
import LoadingZubrik from './LoadingZubrik'
import ZubrikDetail from './ZubrikDetail'

type Zubrik = {
  id: string
  name: string
  description: string
  distance: string
  unlocked: boolean
  imageUrl: string
  coordinates?: [number, number, string]
}

// Real locations of interest in Orel for the walking tour

// Controller component to dynamically change map view and fix initial container size issues
function MapController({ center, isDrawerOpen }: { center: [number, number] | null; isDrawerOpen: boolean }) {
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
      // Preserve current zoom level
      let currentZoom = map.getZoom()
      // If we are selecting a Zubrik and we are zoomed too far out, auto-zoom in a bit
      if (isDrawerOpen && currentZoom < 14) {
        currentZoom = 15
      }

      if (isDrawerOpen) {
        // Offset the center by 150px downwards so the marker moves UP on the screen
        const targetPoint = map.project(center, currentZoom)
        targetPoint.y += 50
        const targetLatLng = map.unproject(targetPoint, currentZoom)
        map.setView(targetLatLng, currentZoom, { animate: true })
      } else {
        map.setView(center, currentZoom, { animate: true })
      }
    }
  }, [center, isDrawerOpen, map])

  return null
}

// Custom Leaflet marker generator for Zubrik avatars
const createZubrikIcon = (zubrik: Zubrik) => {
  const isFound = zubrik.unlocked
  const borderClass = isFound ? 'border-[#34C759] bg-[#CEE6B6]' : 'border-[#E8922A] bg-[#FEA35A]'
  const pulseHtml = !isFound
    ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-[#E8922A] rounded-full border-2 border-white animate-pulse"></div>'
    : ''
  const tintHtml = isFound ? '<div class="absolute inset-0 bg-[#34C759]/20 mix-blend-color rounded-full"></div>' : ''

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

// POI custom marker - category specific
const createPOIIcon = (poi: any) => {
  const type = (poi.type || '').toLowerCase();
  
  let bgColor = 'bg-[#E8922A]' // generic attraction (Yellow)
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' // star

  if (type.includes('historic') || type.includes('monument') || type.includes('memorial')) {
    bgColor = 'bg-[#A16207]' // Brown
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-white"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>'
  } else if (type.includes('museum') || type.includes('gallery')) {
    bgColor = 'bg-[#8B5CF6]' // Purple
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-white"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>'
  } else if (type.includes('viewpoint')) {
    bgColor = 'bg-[#0D9488]' // Teal
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-white"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>'
  }

  return L.divIcon({
    html: `
      <div class="w-[22px] h-[22px] rounded-full ${bgColor} flex items-center justify-center border-2 border-white shadow-sm transition-transform hover:scale-110">
        ${svg}
      </div>
    `,
    className: 'custom-leaflet-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

// POI Layer component to handle zoom visibility
function POILayer({ pois }: { pois: any[] }) {
  const [zoom, setZoom] = useState(15)
  const map = useMap()
  
  useEffect(() => {
    setZoom(map.getZoom())
  }, [map])

  useMapEvents({
    zoomend: (e) => setZoom(e.target.getZoom())
  })

  // Only show POIs when sufficiently zoomed in
  if (zoom < 15) return null

  return (
    <>
      {pois.map((poi: any) => (
        <Marker 
          key={poi.id} 
          position={[poi.lat, poi.lon]} 
          icon={createPOIIcon(poi)}
          zIndexOffset={-100} // Ensure they are below Zubriks
          eventHandlers={{
            click: () => {
              map.setView([poi.lat, poi.lon], Math.max(map.getZoom(), 16), { animate: true })
            }
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
            <div className="font-medium text-xs text-center max-w-[150px] whitespace-normal">
              {poi.name}
              <span className="block text-[10px] text-gray-500 mt-0.5 opacity-80 uppercase tracking-wider">{poi.type}</span>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}

export default function MapScreen({
  userLocation,
  setUserLocation,
}: {
  userLocation: [number, number] | null
  setUserLocation: React.Dispatch<React.SetStateAction<[number, number] | null>>
}) {
  const [selectedZubrik, setSelectedZubrik] = useState<Zubrik | null>(null)
  const [detailZubrik, setDetailZubrik] = useState<Zubrik | null>(null)

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)

  // Center map on selected Zubrik
  useEffect(() => {
    if (selectedZubrik && selectedZubrik.coordinates) {
      setMapCenter([selectedZubrik.coordinates[0], selectedZubrik.coordinates[1]])
    }
  }, [selectedZubrik])

  // Touch gesture state for bottom sheet
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)

  // Search query state
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: zubriksData,
    isLoading: zubriksLoading,
    isError: zubriksIsError,
    error: zubriksError,
  } = trpc.getZubriks.useQuery()

  // Fetch POIs
  const { data: pois = [] } = trpc.getPOIs.useQuery()

  const mapZubriks = (zubriksData?.zubriks || []).map((z) => {
    let distance = '...'
    if (userLocation && z.coordinates) {
      distance = calculateDistance(userLocation[0], userLocation[1], z.coordinates[0], z.coordinates[1])
    }
    return {
      ...(z as Zubrik),
      visited: z.unlocked,
      coords: (z.coordinates ? [z.coordinates[0], z.coordinates[1]] : [0, 0]) as [number, number],
      distance,
    }
  })

  // Filter Zubriks and POIs based on search query
  let searchResults: Array<{ type: 'zubrik' | 'poi', item: any }> = []
  if (searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase()
    
    const matchingZubriks = mapZubriks
      .filter((z) => z.name.toLowerCase().includes(query) || (z.coordinates?.[2] || '').toLowerCase().includes(query))
      .map((z) => ({ type: 'zubrik' as const, item: z }))

    const matchingPOIs = pois
      .filter((p: any) => p.name.toLowerCase().includes(query))
      .map((p: any) => ({ type: 'poi' as const, item: p }))

    searchResults = [...matchingZubriks, ...matchingPOIs].slice(0, 15) // Limit to prevent UI lag
  }

  // Geolocation centering logic
  const handleCenterUserLocation = () => {
    setSelectedZubrik(null)
    if (userLocation) {
      setMapCenter(userLocation)
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords: [number, number] = [position.coords.latitude, position.coords.longitude]
            setUserLocation(coords)
            setMapCenter(coords)
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

  const handleOpenInMaps = () => {
    if (selectedZubrik && selectedZubrik.coordinates) {
      const [lat, lon, name] = selectedZubrik.coordinates
      openPointInMaps({ lat, lon, name })
    }
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
          <MapController center={mapCenter} isDrawerOpen={!!selectedZubrik} />

          {/* User Location Pulsing Dot */}
          {userLocation && <Marker position={userLocation} icon={createUserLocationIcon()} zIndexOffset={1000} />}

          {/* POIs rendering */}
          <POILayer pois={pois} />

          {/* Zubriks Map Pins */}
          {mapZubriks.map((zubrik) => (
            <Marker
              key={zubrik.id}
              position={zubrik.coords}
              icon={createZubrikIcon(zubrik)}
              zIndexOffset={1000}
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
        {/* Search Bar & Results Dropdown */}
        <div className="absolute top-4 left-4 right-4 pointer-events-auto flex flex-col gap-2">
          <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
            <Search size={20} className="text-[#6B6B6B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти место или зубрика..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#6B6B6B] hover:text-[#1C1C1E] active:scale-95 transition-transform"
              >
                Очистить
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchQuery.trim() && (
            <div className="bg-white rounded-2xl shadow-xl max-h-60 overflow-y-auto border border-gray-100 flex flex-col divide-y divide-gray-50 z-20">
              {searchResults.length > 0 ? (
                searchResults.map(({ type, item }) => (
                  <button
                    key={`${type}-${item.id}`}
                    onClick={() => {
                      if (type === 'zubrik') {
                        setSelectedZubrik(item)
                      } else {
                        // Center map on POI
                        setMapCenter([item.lat, item.lon])
                      }
                      setSearchQuery('')
                    }}
                    className="px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-medium text-[#1C1C1E]">{item.name}</div>
                      <div className="text-xs text-[#6B6B6B] mt-1 flex items-center gap-1.5">
                        {type === 'zubrik' ? (
                          <>
                            <MapPin size={12} className="text-[#E8922A] opacity-80" />
                            <span>{item.coordinates ? item.coordinates[2] : 'Местоположение'} · {item.distance}</span>
                          </>
                        ) : (
                          <>
                            {(item.type || '').includes('museum') ? <Palette size={12} className="text-[#8B5CF6] opacity-80" /> : 
                             (item.type || '').includes('viewpoint') ? <Camera size={12} className="text-[#0D9488] opacity-80" /> : 
                             (item.type || '').includes('historic') ? <Landmark size={12} className="text-[#A16207] opacity-80" /> : 
                             <Star size={12} className="text-[#E8922A] opacity-80" />}
                            <span>
                              {(item.type || '').includes('museum') ? 'Музей' : 
                               (item.type || '').includes('viewpoint') ? 'Смотровая площадка' : 
                               (item.type || '').includes('historic') ? 'Историческое место' : 'Достопримечательность'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {type === 'zubrik' ? (
                      <span className="text-xs text-[#E8922A] font-medium">
                        {item.unlocked ? '✓ Найден' : '🔒 Искать'}
                      </span>
                    ) : (
                      <span className="text-xs text-[#0D9488] font-medium bg-[#0D9488]/10 px-2 py-1 rounded-full">Место</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-center text-sm text-[#6B6B6B]">Ничего не найдено 🔍</div>
              )}
            </div>
          )}
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
            <LoadingZubrik text="Загрузка карты..." />
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
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] px-5 pt-5 pb-[calc(76px+env(safe-area-inset-bottom))] pointer-events-auto touch-none select-none"
          >
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-[#E5E3DD] rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing" />
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden shadow-sm border-3 ${
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
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-[#1C1C1E] mb-1 truncate">{selectedZubrik.name}</h3>
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                  <MapPin size={16} className="text-[#E8922A]" />
                  <span>{selectedZubrik.distance}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {selectedZubrik.unlocked ? (
                <div className="w-full bg-[#34C759]/10 text-[#34C759] py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 font-medium">
                  <span>✓</span>
                  <span>Найден</span>
                </div>
              ) : (
                <button
                  onClick={handleOpenInMaps}
                  className="w-full bg-[#E8922A] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm font-medium shadow-sm hover:bg-[#d68120]"
                >
                  <Navigation size={18} />
                  <span>Открыть в картах</span>
                </button>
              )}
              <button
                onClick={() => setDetailZubrik(selectedZubrik)}
                className="w-full border border-[#E5E3DD] text-[#1C1C1E] py-3.5 rounded-2xl text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center"
              >
                Подробнее
              </button>
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
          <div className="absolute bottom-[calc(76px+env(safe-area-inset-bottom))] left-0 right-0 px-4 pointer-events-auto">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {mapZubriks
                .filter((z) => !z.visited)
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
          coordinates={detailZubrik.coordinates}
          onClose={() => setDetailZubrik(null)}
        />
      )}
    </div>
  )
}

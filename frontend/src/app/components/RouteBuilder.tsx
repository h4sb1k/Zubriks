import { AnimatePresence, motion } from 'framer-motion'
import * as L from 'leaflet'
import { ArrowLeft, ChevronDown, ChevronUp, MapPin, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'

import { useOsrmRoute } from '../hooks/useOsrmRoute'
import { useSessionState } from '../hooks/useSessionState'
import { trpc } from '../lib/trpc'
import ConfirmModal from './ConfirmModal'
import { DynamicIcon } from './DynamicIcon'
import { IconPicker } from './IconPicker'
import RoutePreviewMap from './RoutePreviewMap'

const customIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-8 h-8 flex items-center justify-center bg-[#E8922A] text-white rounded-full shadow-md text-sm border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 15.007 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function MapEvents({ position, setTempPos, clearPoi }: { position: [number, number] | null, setTempPos: (pos: [number, number]) => void, clearPoi?: () => void }) {
  const map = useMapEvents({
    click(e) {
      setTempPos([e.latlng.lat, e.latlng.lng])
      if (clearPoi) clearPoi()
    },
  })
  
  useEffect(() => {
    if (position) {
      map.setView(position, 15)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  
  return null
}

// POI custom marker
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
function POILayer({ pois, onSelectPOI }: { pois: any[], onSelectPOI?: (poi: any) => void }) {
  const [zoom, setZoom] = useState(15)
  const map = useMap()
  
  useEffect(() => {
    setZoom(map.getZoom())
  }, [map])

  useMapEvents({
    zoomend: (e) => setZoom(e.target.getZoom())
  })

  if (zoom < 14) return null

  return (
    <>
      {pois.map((poi: any) => (
        <Marker 
          key={poi.id} 
          position={[poi.lat, poi.lon]} 
          icon={createPOIIcon(poi)}
          zIndexOffset={-100}
          eventHandlers={{
            click: () => {
              map.setView([poi.lat, poi.lon], Math.max(map.getZoom(), 16), { animate: true })
              if (onSelectPOI) onSelectPOI(poi)
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

// Zubrik custom marker
const createZubrikIcon = (zubrik: any) => {
  const borderClass = 'border-[#E8922A] bg-[#FEA35A]'
  const iconHtml = `
    <div class="relative w-10 h-10 rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.15)] border-[3px] overflow-hidden transition-transform hover:scale-110 ${borderClass}">
      ${
        zubrik.imageUrl
          ? `<div class="relative w-full h-full">
               <img src="${zubrik.imageUrl}" alt="${zubrik.name}" class="w-full h-full object-cover rounded-full" />
             </div>`
          : '<span class="text-xl text-white">🦬</span>'
      }
    </div>
  `
  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

// Zubrik Layer component
function ZubrikLayer({ zubriks, onSelectZubrik }: { zubriks: any[], onSelectZubrik?: (zubrik: any) => void }) {
  const [zoom, setZoom] = useState(15)
  const map = useMap()
  
  useEffect(() => {
    setZoom(map.getZoom())
   
  }, [map])

  useMapEvents({
    zoomend: (e) => setZoom(e.target.getZoom())
  })

  if (zoom < 14) return null

  return (
    <>
      {zubriks.map((z: any) => {
        const lat = z.latitude ?? (z.coordinates ? z.coordinates[0] : undefined);
        const lon = z.longitude ?? (z.coordinates ? z.coordinates[1] : undefined);
        if (lat === undefined || lon === undefined) return null;

        return (
          <Marker 
            key={z.id} 
            position={[lat, lon]} 
            icon={createZubrikIcon(z)}
            zIndexOffset={100}
            eventHandlers={{
              click: () => {
                map.setView([lat, lon], Math.max(map.getZoom(), 16), { animate: true })
                if (onSelectZubrik) onSelectZubrik(z)
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div className="font-medium text-xs text-center max-w-[150px] whitespace-normal">
                {z.name}
                <span className="block text-[10px] text-gray-500 mt-0.5 opacity-80 uppercase tracking-wider">Зубрик</span>
              </div>
            </Tooltip>
          </Marker>
        )
      })}
    </>
  )
}

function LocationPicker({
  position,
  onSelect,
  onClose,
}: {
  position: [number, number] | null
  onSelect: (pos: [number, number], poi?: any, zubrik?: any) => void
  onClose: () => void
}) {
  const [tempPos, setTempPos] = useState<[number, number] | null>(position)
  const [selectedPoi, setSelectedPoi] = useState<any | null>(null)
  const [selectedZubrik, setSelectedZubrik] = useState<any | null>(null)
  const { data: pois = [] } = trpc.getPOIs.useQuery()
  const { data: zubriksData } = trpc.getZubriks.useQuery()
  const zubriks = zubriksData?.zubriks || []

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
      <div className="flex items-center p-5 bg-[#F5F2EB] safe-top shrink-0">
        <button type="button" onClick={onClose} className="p-2 -ml-2 mr-2">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-medium">Выберите точку</h2>
      </div>
      <div className="flex-1 relative">
        <MapContainer center={tempPos || [52.9701, 36.0732]} zoom={15} zoomControl={false} attributionControl={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapEvents position={position} setTempPos={setTempPos} clearPoi={() => { setSelectedPoi(null); setSelectedZubrik(null); }} />
          {tempPos && <Marker position={tempPos} icon={customIcon} zIndexOffset={1000} />}
          <POILayer 
            pois={pois} 
            onSelectPOI={(poi) => {
              setTempPos([poi.lat, poi.lon])
              setSelectedPoi(poi)
              setSelectedZubrik(null)
            }} 
          />
          <ZubrikLayer 
            zubriks={zubriks} 
            onSelectZubrik={(zubrik) => {
              const lat = zubrik.latitude ?? (zubrik.coordinates ? zubrik.coordinates[0] : undefined);
              const lon = zubrik.longitude ?? (zubrik.coordinates ? zubrik.coordinates[1] : undefined);
              if (lat !== undefined && lon !== undefined) {
                setTempPos([lat, lon])
              }
              setSelectedZubrik(zubrik)
              setSelectedPoi(null)
            }} 
          />
        </MapContainer>
        <div className="absolute bottom-6 left-5 right-5 z-[400]">
          <button
            type="button"
            onClick={() => {
              if (tempPos) {
                if (selectedZubrik) {
                  onSelect(tempPos, null, selectedZubrik)
                } else if (selectedPoi) {
                  onSelect(tempPos, selectedPoi, null)
                } else {
                  onSelect(tempPos)
                }
              }
              onClose()
            }}
            disabled={!tempPos}
            className="w-full bg-[#E8922A] text-white rounded-2xl py-4 flex items-center justify-center font-medium disabled:opacity-50 shadow-lg active:scale-95 transition-transform"
          >
            Подтвердить
          </button>
        </div>
        <div className="absolute top-4 left-4 right-4 z-[400] bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-md text-sm text-center text-[#1C1C1E]">
          Нажмите на карту, чтобы установить метку
        </div>
      </div>
    </div>
  )
}

// EMOJI_LIST removed in favor of emoji-picker-react

type WaypointDraft = {
  id: string
  name: string
  description: string
  icon: string
  latitude: number | null
  longitude: number | null
}

export default function RouteBuilder({ editRouteId, onClose }: { editRouteId?: string, onClose: () => void }) {
  const draftKey = editRouteId ? `edit_${editRouteId}` : 'new'
  const [routeIcon, setRouteIcon] = useSessionState(`rb_icon_${draftKey}`, 'MapPin')
  const [routeIconPickerOpen, setRouteIconPickerOpen] = useState(false)
  const [name, setName] = useSessionState(`rb_name_${draftKey}`, '')
  const [description, setDescription] = useSessionState(`rb_desc_${draftKey}`, '')
  const [waypoints, setWaypoints] = useSessionState<WaypointDraft[]>(`rb_wp_${draftKey}`, [])

  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const [iconPickerIndex, setIconPickerIndex] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const utils = trpc.useUtils()
  
  const { data: routeData } = trpc.getRouteById.useQuery(
    { routeId: editRouteId! },
    { enabled: !!editRouteId }
  )

  useEffect(() => {
    const savedName = sessionStorage.getItem(`rb_name_${draftKey}`)
    const hasValidDraft = savedName && savedName !== '""' && savedName !== 'null'

    if (routeData?.route && !hasValidDraft) {
      const route = routeData.route
      setName(route.name)
      setDescription(route.description || '')
      setRouteIcon(route.icon || 'MapPin')
      setWaypoints(route.waypoints.map(wp => ({
        id: wp.id,
        name: wp.name,
        description: wp.description || '',
        icon: wp.icon || 'MapPin',
        latitude: wp.latitude,
        longitude: wp.longitude,
      })))
    }
  }, [routeData, draftKey])
  
  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === waypoints.length - 1) return
    
    const newWp = [...waypoints]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newWp[index]
    newWp[index] = newWp[swapIndex]
    newWp[swapIndex] = temp
    setWaypoints(newWp)
  }

  const clearDraft = () => {
    sessionStorage.removeItem(`rb_icon_${draftKey}`)
    sessionStorage.removeItem(`rb_name_${draftKey}`)
    sessionStorage.removeItem(`rb_desc_${draftKey}`)
    sessionStorage.removeItem(`rb_wp_${draftKey}`)
  }

  const createRoute = trpc.createRoute.useMutation({
    onSuccess: () => {
      utils.getRoutes.invalidate()
      clearDraft()
      onClose()
    },
    onError: (err) => alert('Ошибка при создании маршрута: ' + err.message),
  })

  const updateRoute = trpc.updateRoute.useMutation({
    onSuccess: () => {
      utils.getRoutes.invalidate()
      utils.getRouteWaypoints.invalidate()
      clearDraft()
      onClose()
    },
    onError: (err) => alert('Ошибка при обновлении маршрута: ' + err.message),
  })

  const deleteRoute = trpc.deleteRoute.useMutation({
    onSuccess: () => {
      utils.getRoutes.invalidate()
      utils.getRouteWaypoints.invalidate()
      clearDraft()
      onClose() // also closes RouteActive if it's nested
      // To close RouteActive fully, we might need a signal, but reloading routes or just closing this modal will trigger state cleanup.
      // Wait, we need to dispatch an event to completely close RouteActive.
      window.dispatchEvent(new CustomEvent('close-route-active'))
    },
    onError: (err) => alert('Ошибка при удалении маршрута: ' + err.message),
  })

  const addWaypoint = () => {
    setWaypoints([
      ...waypoints,
      {
        id: Math.random().toString(),
        name: '',
        description: '',
        icon: 'MapPin',
        latitude: null,
        longitude: null,
      },
    ])
  }

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index))
  }

  const updateWaypoint = (index: number, updates: Partial<WaypointDraft>) => {
    setWaypoints((prev) => {
      const newWp = [...prev]
      newWp[index] = { ...newWp[index], ...updates }
      return newWp
    })
  }

  const isValid =
    name.trim().length > 0 &&
    waypoints.length >= 2 &&
    waypoints.every((w) => w.name.trim() && w.latitude && w.longitude)

  const validWaypoints = waypoints.filter((w) => w.latitude && w.longitude)

  const { distanceMeters, durationSeconds } = useOsrmRoute(validWaypoints as any)

  const handleSubmit = () => {
    if (!isValid) return
    if (editRouteId) {
      updateRoute.mutate({
        routeId: editRouteId,
        name,
        description,
        icon: routeIcon,
        waypoints: validWaypoints.map((w) => ({
          name: w.name,
          description: w.description,
          icon: w.icon,
          latitude: w.latitude!,
          longitude: w.longitude!,
        })),
      })
    } else {
      createRoute.mutate({
        name,
        description,
        icon: routeIcon,
        waypoints: validWaypoints.map((w) => ({
          name: w.name,
          description: w.description,
          icon: w.icon,
          latitude: w.latitude!,
          longitude: w.longitude!,
        })),
      })
    }
  }

  // Calculate stats dynamically using OSRM results if available, else fallback to Haversine
  let totalKm = 0
  if (distanceMeters !== null) {
    totalKm = distanceMeters / 1000
  } else {
    for (let i = 0; i < validWaypoints.length - 1; i++) {
      const p1 = validWaypoints[i]
      const p2 = validWaypoints[i + 1]
      const R = 6371
      const dLat = (p2.latitude! - p1.latitude!) * (Math.PI / 180)
      const dLon = (p2.longitude! - p1.longitude!) * (Math.PI / 180)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.latitude! * (Math.PI / 180)) * Math.cos(p2.latitude! * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      totalKm += R * c
    }
  }
  
  const displayKm = totalKm > 0 && totalKm < 0.1 ? 0.1 : Number(totalKm.toFixed(1))
  const displayMin = Math.max(1, Math.round((totalKm / 5) * 60))
  const displaySteps = Math.round(totalKm * 1300)

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom">
      {pickerIndex !== null && (
        <LocationPicker
          position={
            waypoints[pickerIndex].latitude && waypoints[pickerIndex].longitude
              ? [waypoints[pickerIndex].latitude, waypoints[pickerIndex].longitude]
              : null
          }
          onSelect={(pos, poi, zubrik) => {
            if (zubrik) {
              updateWaypoint(pickerIndex, { 
                latitude: pos[0], 
                longitude: pos[1],
                name: waypoints[pickerIndex].name || zubrik.name,
                description: waypoints[pickerIndex].description || 'Зубрик',
                icon: waypoints[pickerIndex].icon || 'Star',
              })
            } else if (poi) {
              const poiType = (poi.type || '').toLowerCase();
              let newIcon = waypoints[pickerIndex].icon || 'MapPin';
              
              if (poiType.includes('historic') || poiType.includes('monument') || poiType.includes('memorial')) {
                newIcon = 'Landmark';
              } else if (poiType.includes('museum') || poiType.includes('gallery')) {
                newIcon = 'Palette';
              } else if (poiType.includes('viewpoint')) {
                newIcon = 'Camera';
              } else if (poiType) {
                newIcon = 'Star';
              }

              updateWaypoint(pickerIndex, { 
                latitude: pos[0], 
                longitude: pos[1],
                name: waypoints[pickerIndex].name || poi.name,
                description: waypoints[pickerIndex].description || poi.type || '',
                icon: newIcon,
              })
            } else {
              updateWaypoint(pickerIndex, { latitude: pos[0], longitude: pos[1] })
            }
          }}
          onClose={() => setPickerIndex(null)}
        />
      )}

      <div className="flex items-center p-5 bg-[#F5F2EB] safe-top shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 mr-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">{editRouteId ? 'Редактировать' : 'Новый маршрут'}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24">
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm text-[#6B6B6B] mb-2">Название маршрута</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRouteIconPickerOpen(!routeIconPickerOpen)}
                className="h-12 w-14 bg-[#F5F2EB] rounded-2xl flex items-center justify-center outline-none focus:ring-2 focus:ring-[#E8922A]/50 shrink-0 transition-shadow text-[#1C1C1E]"
              >
                <DynamicIcon name={routeIcon} size={24} />
              </button>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-[#F5F2EB] rounded-2xl px-4 py-3 outline-none text-[15px] focus:ring-2 focus:ring-[#E8922A]/50 min-w-0 transition-shadow"
                placeholder="Мой супер маршрут"
              />
            </div>
            
            <AnimatePresence>
              {routeIconPickerOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[110]" 
                    onClick={() => setRouteIconPickerOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute z-[120] mt-1 left-5 shadow-2xl rounded-2xl overflow-hidden"
                  >
                    <IconPicker 
                      onIconSelect={(iconName) => {
                        setRouteIcon(iconName)
                        setRouteIconPickerOpen(false)
                      }}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">Описание (опционально)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F5F2EB] rounded-2xl px-4 py-3 outline-none text-[15px] h-24 resize-none focus:ring-2 focus:ring-[#E8922A]/50 transition-shadow"
              placeholder="Краткое описание"
            />
          </div>
        </div>

        {validWaypoints.length >= 2 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-3 ml-2">Превью маршрута</h3>
            <RoutePreviewMap waypoints={validWaypoints as any} />
          </div>
        )}

        <h3 className="text-lg font-medium mb-4">
          Точки {waypoints.length > 0 && <span className="text-[#6B6B6B]">({waypoints.length})</span>}
        </h3>

        <div className="space-y-4 mb-6">
          {waypoints.map((wp, i) => (
            <div 
              key={wp.id} 
              className="bg-white border border-gray-100 shadow-sm rounded-3xl p-4 flex gap-4"
            >
              {/* Left Sidebar for Arrows */}
              <div className="flex flex-col items-center justify-center gap-1 shrink-0 border-r border-gray-100 pr-4">
                <button 
                  type="button"
                  onClick={() => moveWaypoint(i, 'up')} 
                  disabled={i === 0} 
                  className="p-2 text-gray-400 disabled:opacity-20 active:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronUp size={24} />
                </button>
                <div className="text-xs font-bold text-[#E8922A]">{i + 1}</div>
                <button 
                  type="button"
                  onClick={() => moveWaypoint(i, 'down')} 
                  disabled={i === waypoints.length - 1} 
                  className="p-2 text-gray-400 disabled:opacity-20 active:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronDown size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-4 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-[#E8922A] pt-1">Точка маршрута</span>
                  <button 
                    type="button"
                    onClick={() => removeWaypoint(i)} 
                    className="text-red-400 p-2 active:bg-red-50 rounded-xl transition-colors -mt-1 -mr-1"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="flex gap-3 relative">
                  <button
                    type="button"
                    onClick={() => setIconPickerIndex(iconPickerIndex === i ? null : i)}
                    className="h-12 w-14 bg-[#F5F2EB] rounded-2xl flex items-center justify-center outline-none focus:ring-2 focus:ring-[#E8922A]/50 shrink-0 transition-shadow text-[#1C1C1E]"
                  >
                    <DynamicIcon name={wp.icon} size={24} />
                  </button>
                  
                  <AnimatePresence>
                    {iconPickerIndex === i && (
                      <>
                        <div 
                          className="fixed inset-0 z-[450]" 
                          onClick={() => setIconPickerIndex(null)}
                        />
                        <motion.div 
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute z-[500] top-full mt-2 left-0 shadow-2xl rounded-2xl overflow-hidden"
                        >
                          <IconPicker 
                            onIconSelect={(iconName) => {
                              updateWaypoint(i, { icon: iconName })
                              setIconPickerIndex(null)
                            }}
                          />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  <input
                    type="text"
                    value={wp.name}
                    onChange={(e) => updateWaypoint(i, { name: e.target.value })}
                    className="flex-1 bg-[#F5F2EB] rounded-2xl px-4 py-3 outline-none text-[15px] focus:ring-2 focus:ring-[#E8922A]/50 min-w-0 transition-shadow"
                    placeholder="Название точки"
                  />
                </div>


                <input
                    type="text"
                    value={wp.description}
                    onChange={(e) => updateWaypoint(i, { description: e.target.value })}
                    className="w-full bg-[#F5F2EB] rounded-2xl px-4 py-3 outline-none text-[15px] focus:ring-2 focus:ring-[#E8922A]/50 transition-shadow"
                    placeholder="Описание (опционально)"
                />

                {wp.latitude && wp.longitude && (
                  <div className="w-full h-32 rounded-2xl overflow-hidden relative border border-gray-200 mt-2 pointer-events-none shadow-inner">
                    <MapContainer center={[wp.latitude, wp.longitude]} zoom={15} zoomControl={false} attributionControl={false} dragging={false} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      />
                      <Marker position={[wp.latitude, wp.longitude]} icon={customIcon} />
                    </MapContainer>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent z-10" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPickerIndex(i)}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-medium border active:scale-95 transition-all ${
                    wp.latitude
                      ? 'bg-white border-[#E8922A] text-[#E8922A] shadow-sm'
                      : 'bg-[#F5F2EB] border-transparent text-[#6B6B6B]'
                  }`}
                >
                  <MapPin size={18} />
                  {wp.latitude ? 'Изменить координаты' : 'Указать на карте'}
                </button>
              </div>
            </div>
          ))}
          
          {waypoints.length === 0 && (
            <div className="text-center py-6 text-[#6B6B6B] text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              Добавьте хотя бы 2 точки для маршрута
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={addWaypoint}
          className="w-full py-4 border-2 border-dashed border-[#E8922A] text-[#E8922A] rounded-3xl flex items-center justify-center gap-2 font-medium mb-6 active:scale-95 transition-transform"
        >
          <Plus size={20} />
          Добавить точку
        </button>
      </div>

      <div className="p-5 bg-white border-t border-gray-100 shrink-0 safe-bottom">
        {validWaypoints.length >= 2 && (
          <div className="flex justify-between items-center mb-5 px-4">
            <div className="flex flex-col items-center">
              <span className="text-[#6B6B6B] text-[10px] font-bold uppercase tracking-wider mb-0.5">Дистанция</span>
              <span className="text-[#1C1C1E] font-bold text-base">~{displayKm} км</span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <span className="text-[#6B6B6B] text-[10px] font-bold uppercase tracking-wider mb-0.5">Время</span>
              <span className="text-[#1C1C1E] font-bold text-base">
                ~{displayMin < 60 ? `${displayMin} мин` : `${Math.floor(displayMin / 60)} ч ${displayMin % 60 > 0 ? (displayMin % 60) + ' мин' : ''}`.trim()}
              </span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <span className="text-[#6B6B6B] text-[10px] font-bold uppercase tracking-wider mb-0.5">Шагов</span>
              <span className="text-[#1C1C1E] font-bold text-base">~{displaySteps}</span>
            </div>
          </div>
        )}
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || createRoute.isPending || updateRoute.isPending}
          className="w-full bg-[#E8922A] text-white rounded-2xl py-4 font-medium disabled:opacity-50 shadow-lg active:scale-95 transition-transform"
        >
          {createRoute.isPending || updateRoute.isPending
            ? 'Сохранение...'
            : !isValid
              ? 'Заполните все поля'
              : (editRouteId ? 'Применить' : 'Сохранить маршрут')}
        </button>

        {editRouteId && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteRoute.isPending}
            className="w-full mt-3 bg-red-500 text-white rounded-2xl py-4 flex justify-center items-center gap-2 font-medium shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            <Trash2 size={20} />
            {deleteRoute.isPending ? 'Удаление...' : 'Удалить маршрут'}
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Удалить маршрут?"
        message="Вы уверены, что хотите удалить этот маршрут?"
        confirmText={deleteRoute.isPending ? "Удаление..." : "Удалить"}
        onConfirm={() => {
          if (editRouteId) {
            deleteRoute.mutate({ routeId: editRouteId })
          }
          setShowDeleteConfirm(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

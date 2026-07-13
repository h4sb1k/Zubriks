import { AnimatePresence, motion } from 'framer-motion'
import * as L from 'leaflet'
import { ArrowLeft, ChevronDown, ChevronUp, ImagePlus, MapPin, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'

import { trpc } from '../lib/trpc'
import ConfirmModal from './ConfirmModal'
import AlertModal from './AlertModal'
import { DynamicIcon } from './DynamicIcon'
import { IconPicker } from './IconPicker'

const customIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-8 h-8 flex items-center justify-center bg-[#E8922A] text-white rounded-full shadow-md text-sm border-2 border-white">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function MapEvents({ position, setTempPos }: { position: [number, number] | null, setTempPos: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setTempPos([e.latlng.lat, e.latlng.lng])
    },
  })
  
  useEffect(() => {
    if (position) {
      map.setView(position, 15)
    }
  }, [map, position])
  
  return null
}

function LocationPicker({
  position,
  onSelect,
  onClose,
}: {
  position: [number, number] | null
  onSelect: (pos: [number, number]) => void
  onClose: () => void
}) {
  const [tempPos, setTempPos] = useState<[number, number] | null>(position)

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
      <div className="flex items-center p-5 bg-[#F5F2EB] safe-top shrink-0">
        <button type="button" onClick={onClose} className="p-2 -ml-2 mr-2">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-medium">Выберите точку</h2>
      </div>
      <div className="flex-1 relative">
        <MapContainer center={tempPos || [52.9701, 36.0732]} zoom={14.5} zoomControl={false} attributionControl={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapEvents position={position} setTempPos={setTempPos} />
          {tempPos && <Marker position={tempPos} icon={customIcon} />}
        </MapContainer>
        <div className="absolute bottom-6 left-5 right-5 z-[400]">
          <button
            type="button"
            onClick={() => {
              if (tempPos) {
                onSelect(tempPos)
                onClose()
              }
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
  const [routeIcon, setRouteIcon] = useState('MapPin')
  const [routeIconPickerOpen, setRouteIconPickerOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isMain, setIsMain] = useState(false)
  const [waypoints, setWaypoints] = useState<WaypointDraft[]>([])

  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const [iconPickerIndex, setIconPickerIndex] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  const utils = trpc.useUtils()
  
  const { data: routeData } = trpc.adminGetRouteById.useQuery(
    { routeId: editRouteId! },
    { enabled: !!editRouteId }
  )

  useEffect(() => {
    if (routeData?.route) {
      const route = routeData.route
      setName(route.name)
      setDescription(route.description || '')
      setImageUrl(route.imageUrl || '')
      setRouteIcon(route.icon || 'MapPin')
      setIsMain(route.isMain || false)
      setWaypoints(route.waypoints.map(wp => ({
        id: wp.id,
        name: wp.name,
        description: wp.description || '',
        icon: wp.icon || 'MapPin',
        latitude: wp.latitude,
        longitude: wp.longitude,
      })))
    }
  }, [routeData])
  
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

  const createRoute = trpc.adminCreateRoute.useMutation({
    onSuccess: () => {
      utils.adminGetRoutes.invalidate()
      onClose()
    },
    onError: (err) => setUploadError('Ошибка при создании маршрута: ' + err.message),
  })

  const updateRoute = trpc.adminUpdateRoute.useMutation({
    onSuccess: () => {
      utils.adminGetRoutes.invalidate()
      onClose()
    },
    onError: (err) => setUploadError('Ошибка при обновлении маршрута: ' + err.message),
  })

  const deleteRoute = trpc.adminDeleteRoute.useMutation({
    onSuccess: () => {
      utils.adminGetRoutes.invalidate()
      onClose()
      window.dispatchEvent(new CustomEvent('close-route-active'))
    },
    onError: (err) => setUploadError('Ошибка при удалении маршрута: ' + err.message),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setIsUploading(true)
    try {
      const res = await fetch('/admin-api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const data = await res.json()
      setImageUrl(data.url)
    } catch (err) {
      setUploadError('Ошибка при загрузке картинки. Проверьте размер (до 5 МБ) и формат (только изображения).')
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

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

  const calculateDistance = (waypoints: WaypointDraft[]) => {
    let totalKm = 0
    const valid = waypoints.filter(w => w.latitude && w.longitude)
    for (let i = 0; i < valid.length - 1; i++) {
        const p1 = valid[i]
        const p2 = valid[i + 1]
        const R = 6371
        const dLat = (p2.latitude! - p1.latitude!) * (Math.PI / 180)
        const dLon = (p2.longitude! - p1.longitude!) * (Math.PI / 180)
        const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.latitude! * (Math.PI / 180)) * Math.cos(p2.latitude! * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        totalKm += R * c
    }
    return totalKm > 0 && totalKm < 0.1 ? 0.1 : Number(totalKm.toFixed(1))
  }

  const calculateDuration = (waypoints: WaypointDraft[]) => {
    const totalKm = calculateDistance(waypoints)
    return Math.max(1, Math.round((totalKm / 5) * 60))
  }

  const handleSubmit = () => {
    if (!isValid) return
    if (editRouteId) {
      updateRoute.mutate({
        id: editRouteId,
        name,
        description,
        icon: routeIcon,
        imageUrl: imageUrl || null,
        isMain: isMain,
        waypoints: waypoints.map(w => ({
          name: w.name,
          description: w.description,
          icon: w.icon,
          latitude: w.latitude!,
          longitude: w.longitude!,
        }))
      })
    } else {
      createRoute.mutate({
        name,
        description,
        icon: routeIcon,
        imageUrl: imageUrl || null,
        isMain: isMain,
        waypoints: waypoints.map(w => ({
          name: w.name,
          description: w.description,
          icon: w.icon,
          latitude: w.latitude!,
          longitude: w.longitude!,
        })),
      })
    }
  }

  // Calculate stats dynamically
  let totalKm = 0
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
          onSelect={(pos) => {
            updateWaypoint(pickerIndex, { latitude: pos[0], longitude: pos[1] })
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

          <div>
            <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Изображение маршрута (опционально)</label>
            
            <label className={`relative flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
              imageUrl 
                ? 'w-full min-h-[220px] bg-[#F5F2EB] rounded-[24px] p-6 border border-[#E5E3DD] shadow-inner group'
                : 'w-full bg-white rounded-[24px] p-8 flex-col shadow-sm border-2 border-dashed border-[#E5E3DD] hover:border-[#E8922A] hover:bg-[#FFF9E6]/30 active:scale-[0.99] group'
            }`}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />

              {isUploading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[#E8922A] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="font-bold text-[#E8922A]">Загрузка...</span>
                </div>
              ) : imageUrl ? (
                <>
                  <img src={imageUrl} alt="preview" className="max-w-full max-h-[260px] object-contain drop-shadow-lg rounded-[12px] transition-transform group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-[#1C1C1E]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-[20px] font-bold text-[15px] text-[#1C1C1E] shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <ImagePlus size={18} className="text-[#E8922A]" />
                      Изменить фото
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      setImageUrl('')
                    }}
                    className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-red-500 hover:text-red-600 hover:bg-white hover:scale-105 active:scale-95 transition-all z-10"
                    title="Удалить"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-[#F5F2EB] group-hover:bg-[#FFF9E6] rounded-full flex items-center justify-center transition-colors mb-3">
                    <ImagePlus size={28} className="text-[#6B6B6B] group-hover:text-[#E8922A] transition-colors" />
                  </div>
                  <span className="font-bold text-[#6B6B6B] group-hover:text-[#E8922A] transition-colors">Загрузить фото маршрута</span>
                </>
              )}
            </label>
          </div>

          <div className="flex items-center gap-3 bg-white p-4 rounded-[20px] shadow-sm border border-[#E5E3DD]">
                  <div>
                    <div className="font-bold text-[#1C1C1E]">Главный маршрут</div>
                    <div className="text-xs text-[#6B6B6B]">Отображается на главном экране</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isMain}
                      onChange={(e) => setIsMain(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E8922A]"></div>
                  </label>
                </div>
        </div>

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

      <AlertModal
        isOpen={!!uploadError}
        title="Ошибка загрузки"
        message={uploadError || ''}
        onClose={() => setUploadError(null)}
      />
    </div>
  )
}

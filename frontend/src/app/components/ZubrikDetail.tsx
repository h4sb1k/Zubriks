import * as L from 'leaflet'
import { ArrowLeft, MapPin, Navigation, Share2 } from 'lucide-react'
import { useState } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'

import { openPointInMaps } from '../utils/openInMaps'
import ZubrikImage from './ZubrikImage'

type ZubrikDetailProps = {
  name: string
  description: string
  imageUrl: string
  unlocked: boolean
  coordinates?: [number, number, string]
  onClose: () => void
}

const createZubrikIcon = (imageUrl: string, name: string) => {
  const iconHtml = `
    <div class="relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-[#E8922A] bg-[#FEA35A] overflow-hidden">
      ${
        imageUrl
          ? `<img src="${imageUrl}" alt="${name}" class="w-full h-full object-cover" />`
          : '<span class="text-lg text-white">🦬</span>'
      }
    </div>
  `
  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-marker-detail',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

export default function ZubrikDetail({
  name,
  description,
  imageUrl,
  unlocked,
  coordinates,
  onClose,
}: ZubrikDetailProps) {
  const [activeTab, setActiveTab] = useState('История')

  const handleOpenInMaps = () => {
    if (coordinates) {
      const [lat, lon, label] = coordinates
      openPointInMaps({ lat, lon, name: label || name })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAF7] overflow-y-auto">
      <div className="relative">
        <div 
          className="h-72 relative"
          style={{ background: 'linear-gradient(135deg, #1A3D2B, #E8922A)' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onClose()
            }}
            className="absolute top-6 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer z-50"
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>

          <button className="absolute top-6 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <Share2 size={20} />
          </button>

          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="w-48 h-48 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-4 border-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300">
              <ZubrikImage src={imageUrl} alt={name} iconSize={72} />
            </div>
          </div>

          {unlocked && (
            <div className="absolute bottom-4 right-4 bg-[#34C759] text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
              <span>✓</span>
              <span>Найден</span>
            </div>
          )}
        </div>

        <div className="px-5 py-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#1C1C1E] mb-2 tracking-tight">{name}</h1>
              <p className="text-[#6B6B6B] font-medium">Коллекционный персонаж</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-[#E5E3DD]">
            {['История', 'Где найти', 'Фото'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm transition-colors relative ${
                  activeTab === tab ? 'text-[#1C1C1E]' : 'text-[#6B6B6B]'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8922A] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'История' && (
            <div className="space-y-4">
              <p className="text-[#1C1C1E] leading-relaxed">
                {description ? (
                  <>
                    <span className="text-5xl float-left mr-3 mt-1 text-[#1A3D2B] font-bold">
                      {description.charAt(0).toUpperCase()}
                    </span>
                    {description.slice(1)}
                  </>
                ) : (
                  'Описание отсутствует.'
                )}
              </p>
              <p className="text-[#1C1C1E] leading-relaxed">
                Каждый Зубрик уникален и связан с определённым памятным местом или культурной особенностью нашего
                города. Найдите их всех, чтобы собрать полную коллекцию достижений и открыть новые захватывающие
                подробности об Орле!
              </p>
            </div>
          )}

          {activeTab === 'Где найти' && (
            <div className="space-y-4">
              <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
                {coordinates ? (
                  <div className="h-48 rounded-[24px] overflow-hidden shadow-inner z-0 relative">
                    <MapContainer
                      center={[coordinates[0], coordinates[1]]}
                      zoom={15}
                      zoomControl={false}
                      attributionControl={false}
                      dragging={false}
                      doubleClickZoom={false}
                      scrollWheelZoom={false}
                      touchZoom={false}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution="&copy; CARTO"
                      />
                      <Marker position={[coordinates[0], coordinates[1]]} icon={createZubrikIcon(imageUrl, name)} />
                    </MapContainer>
                  </div>
                ) : (
                  <div className="h-48 bg-[#E5E3DD] flex items-center justify-center">
                    <div className="text-center text-[#6B6B6B]">
                      <MapPin size={48} className="mx-auto mb-2" />
                      <p>Карта местоположения</p>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin size={20} className="text-[#E8922A] mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="mb-1">{coordinates ? coordinates[2] : 'Местоположение'}</h3>
                      <p className="text-sm text-[#6B6B6B]">г. Орёл{coordinates ? `, ${coordinates[2]}` : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenInMaps}
                    className="w-full bg-[#E8922A] text-white rounded-full py-3.5 flex items-center justify-center gap-2 font-bold shadow-md active:scale-95 transition-transform"
                  >
                    <Navigation size={20} />
                    <span>Построить маршрут</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Фото' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-[#E5E3DD] rounded-2xl flex items-center justify-center">
                    <span className="text-4xl">📷</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-[#6B6B6B] text-sm py-4">Здесь будут фотографии от сообщества</p>
            </div>
          )}

          {!unlocked && (
            <button
              onClick={handleOpenInMaps}
              className="w-full bg-[#1A3D2B] text-white rounded-full py-4 text-lg mt-6 font-bold shadow-lg active:scale-95 transition-transform"
            >
              Найти меня!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

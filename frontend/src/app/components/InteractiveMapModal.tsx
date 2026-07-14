import L from 'leaflet'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'

import { useOsrmRoute } from '../hooks/useOsrmRoute'

type Waypoint = {
  id: string
  latitude: number
  longitude: number
  completed?: boolean
}

type InteractiveMapModalProps = {
  waypoints: Waypoint[]
  onClose: () => void
}

function MapBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 })
    }
  }, [map, positions])

  return null
}

export default function InteractiveMapModal({ waypoints, onClose }: InteractiveMapModalProps) {
  const { routeGeometry } = useOsrmRoute(waypoints)

  const createMarkerIcon = (completed: boolean, index: number) => {
    return L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-md
          ${completed ? 'bg-[#34C759]' : 'bg-[#E8922A]'}
          border-2 border-white transition-all
        ">
          ${index + 1}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
  }

  const defaultPositions = waypoints.map(w => [w.latitude, w.longitude] as [number, number])
  const activePositions = routeGeometry || defaultPositions

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom">
      <div className="relative z-20 flex items-center justify-between px-5 py-4 safe-top bg-white/80 backdrop-blur-md border-b border-[#E5E3DD]/50 shadow-sm">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#F5F2EB] flex items-center justify-center active:scale-95 transition-transform text-[#1C1C1E]">
          <ArrowLeft size={20} />
        </button>
        <div className="text-[16px] font-bold tracking-tight text-[#1C1C1E]">
          Карта маршрута
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 w-full relative">
        <MapContainer
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          
          {routeGeometry && (
            <Polyline positions={activePositions} color="#8C520E" weight={8} opacity={0.3} />
          )}
          
          <Polyline 
            positions={activePositions} 
            color="#E8922A" 
            weight={4} 
            opacity={0.9} 
            dashArray={routeGeometry ? undefined : "10, 10"} 
          />
          
          {waypoints.map((w, index) => (
            <Marker 
              key={w.id} 
              position={[w.latitude, w.longitude]} 
              icon={createMarkerIcon(w.completed || false, index)} 
            />
          ))}
          <MapBounds positions={activePositions} />
        </MapContainer>
      </div>
    </div>
  )
}

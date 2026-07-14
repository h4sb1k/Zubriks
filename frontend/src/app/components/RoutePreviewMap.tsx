import L from 'leaflet'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'

type Waypoint = {
  id: string
  latitude: number
  longitude: number
  completed?: boolean
}

type RoutePreviewMapProps = {
  waypoints: Waypoint[]
  onClick?: () => void
}

function MapBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 })
    }
  }, [map, positions])

  return null
}

import { useOsrmRoute } from '../hooks/useOsrmRoute'

export default function RoutePreviewMap({ waypoints, onClick }: RoutePreviewMapProps) {
  const { routeGeometry } = useOsrmRoute(waypoints)

  if (waypoints.length === 0) return null

  // Custom marker icons
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
    <div className="w-full h-48 rounded-[24px] overflow-hidden relative z-10 shadow-inner mb-6 border border-[#E5E3DD]/50">
      {onClick && (
        <div 
          className="absolute inset-0 z-20 cursor-pointer" 
          onClick={onClick} 
        />
      )}
      <MapContainer
        zoom={13}
        scrollWheelZoom={false}
        touchZoom={false}
        dragging={false}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        {/* Draw a subtle outer border line if it's a real route for a premium look */}
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
  )
}

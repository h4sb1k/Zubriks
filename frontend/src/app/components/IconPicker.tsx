import * as LucideIcons from 'lucide-react'
import React, { useState } from 'react'

import { DynamicIcon } from './DynamicIcon'

const AVAILABLE_ICONS = [
  'MapPin', 'Trophy', 'Crown', 'Map', 'Compass', 'TreePine', 
  'Landmark', 'Music', 'Palette', 'BookOpen', 'Library', 'Pizza', 
  'CakeSlice', 'PartyPopper', 'Ghost', 'Cat', 'Smile', 'Heart', 
  'Star', 'Flame', 'Footprints', 'Flag', 'Tent', 'Camera'
]

type IconPickerProps = {
  onIconSelect: (iconName: string) => void
}

export function IconPicker({ onIconSelect }: IconPickerProps) {
  const [search, setSearch] = useState('')
  
  const filtered = AVAILABLE_ICONS.filter(i => i.toLowerCase().includes(search.toLowerCase()))
  
  return (
    <div className="bg-white border rounded-xl shadow-lg p-3 w-64 max-h-80 flex flex-col">
      <input 
        type="text" 
        placeholder="Поиск..." 
        className="mb-3 px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="flex flex-wrap gap-2 overflow-y-auto">
        {filtered.map(iconName => (
          <button
            key={iconName}
            onClick={() => onIconSelect(iconName)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            title={iconName}
          >
            <DynamicIcon name={iconName} size={24} className="text-gray-700" />
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 w-full text-center">Не найдено</p>}
      </div>
    </div>
  )
}

import * as LucideIcons from 'lucide-react'
import React from 'react'

type DynamicIconProps = {
  name?: string | null
  size?: number
  className?: string
  color?: string
}

export function DynamicIcon({ name, size = 24, className, color }: DynamicIconProps) {
  if (!name) return <LucideIcons.MapPin size={size} className={className} color={color} />
  
   
  const IconComponent = (LucideIcons as any)[name]
  
  if (!IconComponent) return <LucideIcons.HelpCircle size={size} className={className} color={color} />
  
  return <IconComponent size={size} className={className} color={color} />
}

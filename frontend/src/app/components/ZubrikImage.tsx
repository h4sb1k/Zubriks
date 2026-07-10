import { useState } from 'react'

import { DynamicIcon } from './DynamicIcon'

type Props = {
  src?: string | null
  alt?: string
  className?: string
  iconSize?: number
  fallbackIcon?: string
}

export default function ZubrikImage({ 
  src, 
  alt = "Zubrik", 
  className = "w-full h-full object-cover", 
  iconSize = 32,
  fallbackIcon = "Cat"
}: Props) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return <span className="flex items-center justify-center h-full w-full"><DynamicIcon name={fallbackIcon} size={iconSize} /></span>
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setHasError(true)} 
    />
  )
}

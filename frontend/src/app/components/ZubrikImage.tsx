import { useState } from 'react'

type Props = {
  src?: string | null
  alt?: string
  className?: string
  emojiSize?: string
  fallbackEmoji?: string
}

export default function ZubrikImage({ 
  src, 
  alt = "Zubrik", 
  className = "w-full h-full object-cover", 
  emojiSize = "text-3xl",
  fallbackEmoji = "🦬"
}: Props) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return <span className={emojiSize}>{fallbackEmoji}</span>
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

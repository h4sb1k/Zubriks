import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

export type AchievementData = {
  id: string
  name: string
  description: string
  emoji: string | null
  imageUrl: string | null
  earned: boolean
  progress?: number
  progressCurrent?: number
  progressTarget?: number
  conditionType?: string
  isPinned?: boolean
}

type AchievementModalProps = {
  achievement: AchievementData | null
  onClose: () => void
}

export default function AchievementModal({ achievement, onClose }: AchievementModalProps) {
  // Disable body scroll when modal is open
  useEffect(() => {
    if (achievement) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [achievement])

  // --- Interactive 3D Card Physics ---
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Motion values for pointer coordinates relative to card center (-1 to 1)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  
  // Emil's spring settings for UI motion:
  // We want the card to follow the pointer but with natural physics,
  // and smoothly return to 0 when let go.
  const springConfig = { damping: 20, stiffness: 150, mass: 0.8 }
  const springX = useSpring(pointerX, springConfig)
  const springY = useSpring(pointerY, springConfig)
  
  // Transform mapped to rotation angles (max tilt 20 degrees)
  const rotateX = useTransform(springY, [-1, 1], [20, -20])
  const rotateY = useTransform(springX, [-1, 1], [-20, 20])
  
  // Glare / Shine effect based on rotation
  const glareOpacity = useTransform(springY, [-1, 1], [0.1, 0.4])
  const glareY = useTransform(springY, [-1, 1], ['-20%', '120%'])
  const glareX = useTransform(springX, [-1, 1], ['-20%', '120%'])

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    // Calculate position from center of card (-1 to 1)
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    // Normalize based on card dimensions
    const normalizedX = (e.clientX - centerX) / (rect.width / 2)
    const normalizedY = (e.clientY - centerY) / (rect.height / 2)
    
    // Clamp values just in case
    pointerX.set(Math.max(-1, Math.min(1, normalizedX)))
    pointerY.set(Math.max(-1, Math.min(1, normalizedY)))
  }

  const handlePointerLeave = () => {
    // Reset to center smoothly
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <AnimatePresence>
      {achievement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop with strong blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }}
            exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Perspective Container */}
          <div className="relative w-full max-w-sm" style={{ perspective: '1200px' }}>
            {/* Close Button - positioned outside the 3D space so it doesn't rotate */}
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onClose}
              className="absolute -top-14 right-0 z-[110] w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all"
            >
              <X size={20} />
            </motion.button>

            {/* The 3D Card */}
            <motion.div
              ref={cardRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onPointerUp={handlePointerLeave}
              // Entry animation: flies up from the bottom of the screen
              initial={{ opacity: 0, y: '100vh', scale: 0.6, rotateX: 50 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                rotateX: 0, // Gets overridden by style prop but needed for initial animation
                transition: { 
                  // Emil's custom easing for UI entrances (snappy but natural)
                  type: 'spring', damping: 20, stiffness: 150, mass: 0.9
                }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.7, 
                y: '100vh',
                rotateX: 20,
                transition: { duration: 0.3, ease: 'easeIn' } 
              }}
              className={`relative aspect-[3/4] w-full rounded-[32px] p-1 shadow-2xl touch-none ${
                achievement.earned
                  ? 'bg-gradient-to-b from-[#FFF5D1] via-[#E8922A] to-[#8C520E]' 
                  : 'bg-[#E5E3DD]'
              }`}
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
                boxShadow: achievement.earned 
                  ? '0 30px 60px -12px rgba(232,146,42,0.4), 0 0 40px rgba(255,215,0,0.2)'
                  : '0 30px 60px -12px rgba(0,0,0,0.3)'
              }}
            >
              {/* Card Inner Content */}
              <div 
                className={`relative w-full h-full rounded-[28px] overflow-hidden flex flex-col justify-end p-5 ${
                  achievement.earned ? 'bg-[#1A3D2B]' : 'bg-white'
                }`}
              >
                {/* Background glows for earned achievements */}
                {achievement.earned && (
                  <>
                    <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#E8922A]/40 via-transparent to-transparent -translate-y-1/4 translate-x-1/4 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#4CAF50]/30 via-transparent to-transparent translate-y-1/4 -translate-x-1/4 pointer-events-none" />
                  </>
                )}

                {/* Glare/Shine Effect responding to rotation */}
                {achievement.earned && (
                  <motion.div 
                    className="absolute inset-0 z-50 pointer-events-none mix-blend-overlay"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 60%)',
                      opacity: glareOpacity,
                      left: glareX,
                      top: glareY,
                      width: '200%',
                      height: '200%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}

                {/* Floating Image */}
                <div 
                  className="absolute inset-0 pt-4 px-6 pb-44 flex items-center justify-center pointer-events-none"
                >
                  {achievement.imageUrl && achievement.imageUrl !== '' ? (
                    <motion.img
                      src={achievement.imageUrl}
                      alt={achievement.name}
                      className={`w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)] ${
                        !achievement.earned ? 'grayscale opacity-30 drop-shadow-none' : ''
                      }`}
                    />
                  ) : (
                    <div className={`text-9xl drop-shadow-[0_15px_25px_rgba(0,0,0,0.3)] ${!achievement.earned ? 'grayscale opacity-30 drop-shadow-none' : ''}`}>
                      {achievement.emoji}
                    </div>
                  )}
                </div>

                {/* Info Panel */}
                <div
                  className={`relative z-20 p-5 rounded-[20px] backdrop-blur-xl flex flex-col items-center text-center w-full border ${
                    achievement.earned 
                      ? 'bg-black/40 border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]' 
                      : 'bg-white/90 border-[#E5E3DD] shadow-sm'
                  }`}
                >
                  <h3
                    className={`font-black text-2xl leading-tight mb-2 w-full tracking-tight ${
                      achievement.earned ? 'text-white' : 'text-[#1C1C1E]'
                    }`}
                  >
                    {achievement.name}
                  </h3>
                  
                  {/* Divider line */}
                  <div className={`w-12 h-1 rounded-full mb-3 ${achievement.earned ? 'bg-[#E8922A]' : 'bg-[#E5E3DD]'}`} />

                  <p
                    className={`text-sm leading-relaxed mb-5 w-full ${
                      achievement.earned ? 'text-white/90' : 'text-[#6B6B6B]'
                    }`}
                  >
                    {achievement.description}
                  </p>

                  {!achievement.earned && achievement.conditionType !== 'MANUAL' && achievement.progressTarget !== undefined && achievement.progressTarget > 0 && (
                    <div className="w-full mt-auto">
                      <div className="flex justify-between items-baseline text-xs font-bold mb-2 text-[#1C1C1E]">
                        <span>Прогресс</span>
                        <span className="text-sm tabular-nums">{achievement.progressCurrent ?? 0} / {achievement.progressTarget}</span>
                      </div>
                      <div className="h-3 bg-[#F5F2EB] rounded-full overflow-hidden shadow-inner border border-[#E5E3DD]/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.progress ?? 0}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                          className="h-full bg-gradient-to-r from-[#FEA35A] to-[#E8922A] rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  {!achievement.earned && achievement.conditionType === 'MANUAL' && (
                    <div className="w-full mt-1">
                      <div className="inline-flex items-center justify-center gap-1.5 bg-[#F5F2EB] border border-[#E5E3DD] px-4 py-2 rounded-full">
                        <span className="text-[#6B6B6B] text-xs font-bold">Особое достижение</span>
                      </div>
                    </div>
                  )}
                  
                  {achievement.earned && (
                    <div className="w-full mt-1">
                      <div className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#E8922A]/20 to-[#D4A017]/20 border border-[#E8922A]/30 px-4 py-2 rounded-full backdrop-blur-md">
                        <span className="text-[#FCE182] text-sm font-bold tracking-wide uppercase">
                          Получено
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

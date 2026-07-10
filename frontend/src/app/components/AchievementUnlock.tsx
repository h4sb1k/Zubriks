import type { Options as ConfettiOptions } from 'canvas-confetti'
import confetti from 'canvas-confetti'
import { Share2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { DynamicIcon } from './DynamicIcon'

// ─── Types ───────────────────────────────────────────────────────────────────

type AchievementUnlockProps = {
  name: string
  description: string
  icon?: string
  image?: ReactNode | string
  onClose: () => void
}

// ─── Confetti config ──────────────────────────────────────────────────────────

/** Цвета конфети — берём палитру приложения + контрастные акценты */
const CONFETTI_COLORS = [
  '#D4A017', // золото
  '#E8922A', // янтарь
  '#FFFFFF', // белый
  '#2A5D3B', // зелёный бренд
  '#FFD700', // жёлтый
  '#FF6B6B', // красный акцент
  '#74C0FC', // голубой акцент
]

/**
 * Одна «волна» хлопушки.
 * origin — точка в viewport-координатах [0..1].
 * angle  — направление выброса (градусы, 0 = вправо, 90 = вверх).
 */
function fireCannon(origin: { x: number; y: number }, angle: number, count = 60): void {
  const shared: ConfettiOptions = {
    origin,
    angle,
    colors: CONFETTI_COLORS,
    ticks: 300, // время жизни частиц
    gravity: 1.1, // ускорение — чуть тяжелее стандарта для реализма
    decay: 0.92, // замедление
    scalar: 0.9, // размер частиц
  }

  // Первый залп — быстрые крупные частицы (основной выброс)
  confetti({
    ...shared,
    particleCount: Math.floor(count * 0.7),
    spread: 55,
    startVelocity: 52,
  })

  // Второй залп — более медленные частицы с широким разбросом (шлейф)
  confetti({
    ...shared,
    particleCount: Math.floor(count * 0.3),
    spread: 80,
    startVelocity: 28,
    scalar: 0.65,
  })
}

/**
 * Запускает две хлопушки — из левого и правого нижнего угла карточки.
 * cardEl — DOM-элемент карточки, нужен для вычисления viewport-координат.
 */
function shootFromCard(cardEl: HTMLElement): void {
  const rect = cardEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Левая хлопушка — угол ~60° (вправо-вверх)
  fireCannon({ x: rect.left / vw, y: rect.bottom / vh }, 60, 70)

  // Правая хлопушка с небольшой задержкой — угол ~120° (влево-вверх)
  setTimeout(() => {
    fireCannon({ x: rect.right / vw, y: rect.bottom / vh }, 120, 70)
  }, 150)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AchievementUnlock({ name, description, icon, image, onClose }: AchievementUnlockProps) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Запуск конфети после появления карточки
  const launchConfetti = useCallback(() => {
    if (!cardRef.current) return
    shootFromCard(cardRef.current)

    // Второй залп через 700мс — «эхо хлопушки»
    setTimeout(() => {
      if (cardRef.current) shootFromCard(cardRef.current)
    }, 700)
  }, [])

  useEffect(() => {
    // Небольшая задержка перед появлением, затем конфети
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    const confettiTimer = setTimeout(() => {
      launchConfetti()
    }, 350) // запускаем после завершения scale-анимации карточки

    return () => {
      clearTimeout(showTimer)
      clearTimeout(confettiTimer)
      // Останавливаем все активные анимации при размонтировании
      confetti.reset()
    }
  }, [launchConfetti])

  const renderIcon = () => {
    if (image) {
      if (typeof image === 'string') {
        return (
          <img src={image} alt={name} className="w-full h-full object-contain" style={{ background: 'transparent' }} />
        )
      }
      return <div className="w-32 h-32 flex items-center justify-center">{image}</div>
    }
    return <DynamicIcon name={icon || 'Trophy'} size={80} className="text-gray-800 drop-shadow-md mx-auto" />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-[340px] sm:max-w-sm transition-all duration-500 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <div className="relative" ref={cardRef}>
          {/* Soft outer glow */}
          <div className="absolute inset-0 rounded-[32px] blur-2xl opacity-60" style={{ background: 'linear-gradient(135deg, #D4A017, #E8922A)' }} />

          {/* Claymorphism Card */}
          <div 
            className="relative rounded-[32px] p-6 sm:p-8 text-center w-full" 
            style={{ 
              background: 'linear-gradient(135deg, #D4A017, #E8922A)',
              boxShadow: '0 25px 50px -12px rgba(212,160,23,0.5), inset 0 6px 15px rgba(255,255,255,0.4), inset 0 -6px 15px rgba(0,0,0,0.15)'
            }}
          >
            <div className="relative w-full">
              {/* Clay Icon Base */}
              <div 
                className="inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 bg-white mb-5 sm:mb-6 border-[6px] border-white/20 mx-auto"
                style={{ 
                  borderRadius: '50%', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15), inset 0 -4px 10px rgba(0,0,0,0.08), inset 0 4px 10px rgba(255,255,255,0.8)'
                }}
              >
                {renderIcon()}
              </div>

              <div className="uppercase tracking-widest text-white/90 text-[10px] sm:text-xs font-extrabold mb-3 drop-shadow-sm">Новое достижение</div>
              
              {/* Clay Title Badge */}
              <div 
                className="inline-flex items-center justify-center bg-white px-4 py-2 sm:px-6 sm:py-3.5 mb-5 w-full max-w-full"
                style={{ 
                  borderRadius: '20px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15), inset 0 -4px 8px rgba(0,0,0,0.06), inset 0 4px 8px rgba(255,255,255,0.9)'
                }}
              >
                <h3 className="text-2xl sm:text-3xl font-black text-[#1A3D2B] leading-tight drop-shadow-sm text-center break-words w-full">{name}</h3>
              </div>
              <p className="text-white/95 mb-6 font-medium leading-relaxed px-1 text-sm sm:text-base">{description}</p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-white/20 text-white rounded-full py-3.5 font-bold flex items-center justify-center gap-2 active:scale-90 transition-transform"
                  style={{ boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.2), inset 0 -2px 5px rgba(0,0,0,0.1)' }}
                >
                  <Share2 size={18} />
                  <span>Поделиться</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-white text-[#E8922A] rounded-full py-3.5 font-bold active:scale-90 transition-transform"
                  style={{ boxShadow: '0 8px 16px rgba(0,0,0,0.1), inset 0 -3px 6px rgba(0,0,0,0.05), inset 0 3px 6px rgba(255,255,255,0.8)' }}
                >
                  Продолжить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import type { Options as ConfettiOptions } from 'canvas-confetti'
import confetti from 'canvas-confetti'
import { Share2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type AchievementUnlockProps = {
  name: string
  description: string
  emoji?: string
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

export default function AchievementUnlock({ name, description, emoji, image, onClose }: AchievementUnlockProps) {
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
      return <div className="w-24 h-24 flex items-center justify-center">{image}</div>
    }
    return <span className="text-6xl">{emoji}</span>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div
        className={`relative z-10 transition-all duration-500 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <div className="relative" ref={cardRef}>
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4A017] to-[#E8922A] rounded-3xl blur-2xl opacity-50 animate-pulse" />

          <div className="relative bg-gradient-to-br from-[#D4A017] to-[#E8922A] rounded-3xl p-8 text-center shadow-2xl">
            {/* Border glow */}
            <div className="absolute -inset-1">
              <div className="w-full h-full bg-gradient-to-r from-[#D4A017] via-[#E8922A] to-[#D4A017] rounded-3xl opacity-75 blur-sm animate-pulse" />
            </div>

            <div className="relative">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 shadow-lg">
                {renderIcon()}
              </div>

              <h2 className="text-3xl text-white mb-2">Достижение!</h2>
              <h3 className="text-2xl text-white mb-3">{name}</h3>
              <p className="text-white/90 mb-6">{description}</p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-white/20 text-white rounded-2xl py-3 backdrop-blur-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Share2 size={18} />
                  <span>Поделиться</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-white text-[#E8922A] rounded-2xl py-3 active:scale-95 transition-transform"
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

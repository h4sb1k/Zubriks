import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '../lib/trpc'
import { loginWithVK } from './auth/loginWithVK'
import { loginWithYandex } from './auth/loginWithYandex'
import goalSVG from './pics/goal.svg'
import mapSVG from './pics/map.svg'
import bisonSVG from './pics/zubr.svg'

type OnboardingScreenProps = {
  onComplete: () => void
  initialStep?: number
}

const STEP_KEY = 'onboarding_step'

/**
 * useState, but backed by sessionStorage.
 * - Survives component unmount/remount within the same browser session.
 * - Cleared automatically when the tab closes (unlike localStorage).
 */
function usePersistedStep(total: number, initialStep: number = 0): [number, (n: number) => void] {
  const [step, setStepRaw] = useState<number>(() => {
    // If caller explicitly requests a non-zero step (e.g., auth screen),
    // override any stale sessionStorage value
    if (initialStep > 0) {
      try {
        sessionStorage.setItem(STEP_KEY, String(initialStep))
      } catch {
        /* ignore */
      }
      return initialStep
    }
    try {
      const saved = sessionStorage.getItem(STEP_KEY)
      if (saved !== null) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= 0 && parsed < total) return parsed
      }
    } catch {
      // sessionStorage can throw in private mode on some browsers
    }
    return initialStep
  })

  const setStep = (n: number) => {
    try {
      sessionStorage.setItem(STEP_KEY, String(n))
    } catch {
      /* ignore */
    }
    setStepRaw(n)
  }

  return [step, setStep]
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingScreen({ onComplete, initialStep = 0 }: OnboardingScreenProps) {
  const TOTAL_SCREENS = 3
  const [step, setStep] = usePersistedStep(TOTAL_SCREENS, initialStep)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const formatError = (err: any) => {
    try {
      const parsed = JSON.parse(err.message)
      if (Array.isArray(parsed) && parsed[0]?.message) {
        if (parsed[0].message === 'Invalid email address') return 'Некорректный формат Email'
        if (parsed[0].message === 'String must contain at least 6 character(s)')
          return 'Пароль должен быть не менее 6 символов'
        return parsed[0].message
      }
    } catch {
      /* ignore */
    }
    if (err.message === 'User already exists') return 'Пользователь с таким email уже существует'
    if (err.message === 'Invalid credentials') return 'Неверный email или пароль'
    return 'Произошла ошибка. Попробуйте позже.'
  }

  const loginMutation = trpc.login.useMutation({
    onSuccess: () => finishOnboarding(),
    onError: (err) => setError(formatError(err)),
  })

  const registerMutation = trpc.register.useMutation({
    onSuccess: (data) => {
      if (data.newAchievement) {
        window.dispatchEvent(new CustomEvent('new-achievement', { detail: data.newAchievement }))
      }
      finishOnboarding()
    },
    onError: (err) => setError(formatError(err)),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (isRegister) {
      registerMutation.mutate({ email, password, name })
    } else {
      loginMutation.mutate({ email, password })
    }
  }

  const screens = [
    {
      title: 'Зубрики',
      subtitle: 'Открой Орёл по-новому',
      image: bisonSVG,
      emoji: '🦬',
      description: 'Исследуй город через коллекционных персонажей',
      background: 'linear-gradient(135deg, #1A3D2B, #2A5D3B)',
      buttonColor: '#1A3D2B',
    },
    {
      title: 'Найди зубриков',
      subtitle: 'в городе',
      image: mapSVG,
      emoji: '🗺️',
      description: 'Используй карту, чтобы найти всех зубриков в Орле',
      background: 'linear-gradient(135deg, #E8922A, #D4A017)',
      buttonColor: '#E8922A',
    },
    {
      title: 'Собери коллекцию',
      subtitle: 'достижений',
      emoji: '🏆',
      image: goalSVG,
      description: 'Зарабатывай достижения и делись успехами с друзьями',
      background: 'linear-gradient(135deg, #2A5D3B, #E8922A)',
    },
  ]

  const isLastStep = step === screens.length - 1
  const isFirstStep = step === 0
  const currentScreen = screens[step]

  /** Wipe the saved step so a fresh re-open always starts from screen 0. */
  const finishOnboarding = () => {
    try {
      sessionStorage.removeItem(STEP_KEY)
    } catch {
      /* ignore */
    }
    onComplete()
  }

  const handleNext = () => {
    if (!isLastStep) setStep(step + 1)
  }

  const handleBack = () => {
    if (!isFirstStep) setStep(step - 1)
  }

  return (
    <div className="size-full flex flex-col bg-[#FAFAF7]">
      {/* ── Hero ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 text-center relative overflow-hidden transition-colors duration-500"
        style={{ background: currentScreen.background }}
      >
        {/* decorative blobs */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>

        {/* Back button — hidden on first step */}
        {!isFirstStep && (
          <button
            onClick={handleBack}
            aria-label="Назад"
            className="absolute top-12 left-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm active:scale-90 transition-transform"
          >
            <ChevronLeft size={22} className="text-white" />
          </button>
        )}

        {/* Skip button — visible on non-last steps */}
        {!isLastStep && (
          <button
            onClick={finishOnboarding}
            className="absolute top-12 right-6 z-20 text-white/80 font-bold px-4 py-2 bg-black/10 rounded-full backdrop-blur-sm active:scale-90 transition-all"
          >
            Пропустить
          </button>
        )}

        <div className="relative z-10 flex flex-col items-center mt-10">
          <div className="mb-6 animate-bounce-slow drop-shadow-2xl">
            <img src={currentScreen.image} alt={currentScreen.emoji} className="w-64 h-64 sm:w-80 sm:h-80 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 drop-shadow-sm">{currentScreen.title}</h1>
          <p className="text-lg sm:text-xl font-medium text-white/95 mb-8 drop-shadow-sm">{currentScreen.subtitle}</p>
        </div>
      </div>

      {/* ── Bottom panel (Drawer style) ── */}
      <div className="bg-[#FAFAF7] px-6 sm:px-8 py-8 -mt-6 rounded-t-[32px] relative z-20 flex-shrink-0 shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
        <p className="text-center text-[#1C1C1E] mb-8 min-h-[3rem] font-medium leading-relaxed px-2">{currentScreen.description}</p>

        {/* Step indicators */}
        <div className="flex gap-2 justify-center mb-6">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === step ? 'w-10 bg-[#E8922A] shadow-sm' : 'w-2 bg-[#E5E3DD]'
              }`}
            />
          ))}
        </div>

        {/* ── Auth buttons (last step) — order: белый · синий · красный ── */}
        {isLastStep ? (
          <div className="space-y-3">
            {!showEmailForm ? (
              <>
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full bg-white border-2 border-[#E5E3DD] text-[#1C1C1E] rounded-full py-3.5 flex items-center justify-center gap-2 shadow-sm active:scale-90 transition-transform"
                >
                  <span className="text-base font-bold">Использовать E-mail</span>
                </button>

                <button
                  onClick={loginWithVK}
                  className="w-full bg-[#0077FF] text-white rounded-full py-3.5 flex items-center justify-center gap-2 shadow-md active:scale-90 transition-transform"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.018-1.304.585-1.496c.595-.189 1.36 1.261 2.172 1.818.613.42 1.08.328 1.08.328l2.17-.03s1.135-.071.597-1.111c-.044-.08-.312-.672-1.608-1.901-1.356-1.286-1.175-1.078.459-3.303.997-1.357 1.395-2.186 1.27-2.54-.12-.337-.864-.248-.864-.248l-2.44.015s-.181-.025-.315.056c-.132.08-.217.267-.217.267s-.386 1.05-.901 1.942c-1.085 1.89-1.52 1.99-1.698 1.872-.413-.273-.31-1.094-.31-1.678 0-1.824.271-2.585-.528-2.783-.265-.065-.46-.108-1.136-.115-.869-.009-1.604.003-2.02.211-.277.139-.491.45-.361.467.161.021.527.101.72.371.25.349.241 1.133.241 1.133s.144 2.147-.335 2.414c-.329.182-.781-.19-1.75-1.9-.497-.878-.872-1.849-.872-1.849s-.072-.181-.202-.278c-.157-.117-.376-.154-.376-.154l-2.322.015s-.348.01-.476.165c-.114.138-.009.424-.009.424s1.818 4.366 3.878 6.566c1.889 2.02 4.032 1.888 4.032 1.888h.972z" />
                  </svg>
                  <span className="text-base font-bold">Войти через ВКонтакте</span>
                </button>

                <button
                  onClick={loginWithYandex}
                  className="w-full bg-[#FC3F1D] text-white rounded-full py-3.5 flex items-center justify-center gap-2 shadow-md active:scale-90 transition-transform"
                >
                  <svg width="20" height="22" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true">
                    <path d="M11.733 24h3.427V0H10.64C5.64 0 3.013 2.667 3.013 6.667c0 3.44 1.6 5.453 4.64 7.573L2.666 24h3.694l5.44-10.56-1.867-1.173c-2.453-1.573-3.627-3.04-3.627-5.76 0-2.56 1.627-4.267 4.48-4.267h.947V24z" />
                  </svg>
                  <span className="text-base font-bold">Войти через Яндекс</span>
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                {isRegister && (
                  <input
                    type="text"
                    placeholder="Имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E5E3DD] focus:outline-none focus:border-[#E8922A] transition-colors"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E5E3DD] focus:outline-none focus:border-[#E8922A] transition-colors"
                  required
                />
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E5E3DD] focus:outline-none focus:border-[#E8922A] transition-colors"
                  required
                  minLength={6}
                />

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                  className="w-full bg-[#E8922A] text-white rounded-full py-4 mt-2 font-bold shadow-md active:scale-90 transition-transform disabled:opacity-50 disabled:active:scale-100"
                >
                  {loginMutation.isPending || registerMutation.isPending ? 'Загрузка...' : isRegister ? 'Создать аккаунт' : 'Войти'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="w-full bg-white text-[#6B6B6B] border border-[#E5E3DD] rounded-full py-3.5 font-bold shadow-sm active:scale-90 transition-transform mt-2"
                >
                  {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="w-full text-[#6B6B6B] py-3 text-sm font-medium active:scale-95 transition-transform"
                >
                  Вернуться к способам входа
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── "Next" button — intermediate steps only ── */
          <button
            onClick={handleNext}
            className="w-full text-white rounded-full py-4 font-bold shadow-md active:scale-90 transition-all duration-300 flex items-center justify-center gap-2"
            style={{ backgroundColor: currentScreen.buttonColor }}
          >
            <span>Продолжить</span>
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

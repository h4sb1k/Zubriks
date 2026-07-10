import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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

type FieldErrors = {
  email?: string
  password?: string
  confirmPassword?: string
  name?: string
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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [shake, setShake] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // Shake animation auto-reset
  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(t)
    }
  }, [shake])

  useEffect(() => {
    // Catch OAuth errors returned in the URL
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    const errDesc = params.get('error_description')
    if (err) {
      setError(errDesc ? decodeURIComponent(errDesc) : 'Ошибка при авторизации через соцсеть')
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash)
    }
  }, [])

  /** Clear all error states */
  const clearErrors = () => {
    setError('')
    setFieldErrors({})
  }

  const triggerErrorFeedback = (fields: FieldErrors) => {
    setShake(true)
    if (fields.name) nameRef.current?.focus()
    else if (fields.email) emailRef.current?.focus()
    else if (fields.password) passwordRef.current?.focus()
    else if (fields.confirmPassword) confirmPasswordRef.current?.focus()
  }

  /** Parse server error into user-friendly message + field-level hints */
  const handleServerError = (err: any) => {
    const newFieldErrors: FieldErrors = {}

    // ── LOGIN errors: never reveal which field is wrong (InfoSec best practice) ──
    if (!isRegister) {
      // Always clear passwords on error
      setPassword('')
      setConfirmPassword('')

      setError('Неверный email или пароль')
      newFieldErrors.email = ' '
      newFieldErrors.password = 'Неверный email или пароль'
      setFieldErrors(newFieldErrors)
      setShake(true)
      passwordRef.current?.focus()
      return
    }

    // ── REGISTER errors: field-level hints are acceptable ──
    let message = ''

    try {
      const parsed = JSON.parse(err.message)
      if (Array.isArray(parsed) && parsed[0]?.message) {
        const raw = parsed[0].message
        const path = parsed[0]?.path
        if (raw === 'Invalid email address' || path?.includes('email')) {
          message = 'Проверьте правильность email'
          newFieldErrors.email = 'Некорректный формат'
        } else if (raw.includes('at least 6 character') || path?.includes('password')) {
          message = 'Пароль должен быть не менее 6 символов'
          newFieldErrors.password = 'Минимум 6 символов'
        } else if (raw.includes('at least 1 character') || path?.includes('name')) {
          message = 'Укажите ваше имя'
          newFieldErrors.name = 'Обязательное поле'
        } else {
          // Never expose raw server messages
          message = 'Не удалось создать аккаунт. Попробуйте позже.'
        }
      }
    } catch {
      /* not JSON */
    }

    if (!message) {
      if (err.message === 'User already exists') {
        // Acceptable for register — user needs to know to use a different email
        message = 'Аккаунт с таким email уже существует'
        newFieldErrors.email = 'Попробуйте другой email'
      } else {
        message = 'Не удалось создать аккаунт. Попробуйте позже.'
      }
    }

    // Always clear passwords on error
    setPassword('')
    setConfirmPassword('')

    setError(message)
    setFieldErrors(newFieldErrors)
    triggerErrorFeedback(newFieldErrors)
  }

  const loginMutation = trpc.login.useMutation({
    onSuccess: () => finishOnboarding(),
    onError: (err) => handleServerError(err),
  })

  const registerMutation = trpc.register.useMutation({
    onSuccess: (data) => {
      if (data.newAchievement) {
        window.dispatchEvent(new CustomEvent('new-achievement', { detail: data.newAchievement }))
      }
      finishOnboarding()
    },
    onError: (err) => handleServerError(err),
  })

  /** Client-side validation — strict for register, minimal for login */
  const validateForm = (): boolean => {
    const errors: FieldErrors = {}
    const trimmedEmail = email.trim()

    if (isRegister) {
      // ── Register: full field-level validation ──
      if (!name.trim()) {
        errors.name = 'Введите ваше имя'
      }
      if (!trimmedEmail) {
        errors.email = 'Введите email'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        errors.email = 'Некорректный формат E-mail'
      }
      if (!password) {
        errors.password = 'Введите пароль'
      } else if (password.length < 6) {
        errors.password = 'Минимум 6 символов'
      }
      if (!confirmPassword) {
        errors.confirmPassword = 'Подтвердите пароль'
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Пароли не совпадают'
      }
    } else {
      // ── Login: only check that fields are not empty, no format hints ──
      if (!trimmedEmail) {
        errors.email = 'Введите email'
      }
      if (!password) {
        errors.password = 'Введите пароль'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError(Object.values(errors).filter(v => v && v.trim()).join('. '))
      triggerErrorFeedback(errors)
      return false
    }
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()
    
    const isValid = validateForm()
    
    // Store current values for the mutation before we clear the state
    const currentPassword = password
    
    // Always clear passwords after an attempt
    setPassword('')
    setConfirmPassword('')

    if (!isValid) return

    if (isRegister) {
      registerMutation.mutate({ email: email.trim(), password: currentPassword, name: name.trim() })
    } else {
      loginMutation.mutate({ email: email.trim(), password: currentPassword })
    }
  }

  const screens = [
    {
      title: 'Зубрики',
      subtitle: 'Открой Орёл по-новому',
      image: bisonSVG,
      icon: 'Cat',
      description: 'Исследуй город через коллекционных персонажей',
      background: '#1A3D2B',
      blob1: 'bg-[#34C759]',
      blob2: 'bg-[#E8922A]',
      buttonColor: '#1A3D2B',
    },
    {
      title: 'Найди зубриков',
      subtitle: 'в городе',
      image: mapSVG,
      icon: 'MapPin',
      description: 'Используй карту, чтобы найти всех зубриков в Орле',
      background: '#E8922A',
      blob1: 'bg-[#FFD60A]',
      blob2: 'bg-[#FFFFFF]',
      buttonColor: '#E8922A',
    },
    {
      title: 'Собери коллекцию',
      subtitle: 'достижений',
      icon: 'Trophy',
      image: goalSVG,
      description: 'Зарабатывай достижения и делись успехами с друзьями',
      background: '#2E5A41',
      blob1: 'bg-[#E8922A]',
      blob2: 'bg-[#34C759]',
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
        className="flex-1 flex flex-col items-center justify-center px-8 text-center relative overflow-hidden transition-colors duration-1000"
        style={{ backgroundColor: currentScreen.background }}
      >
        {/* Aurora blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full mix-blend-normal blur-[80px] opacity-40 animate-blob transition-colors duration-1000 ${currentScreen.blob1}`} />
          <div className={`absolute top-[40%] -right-[10%] w-[70%] h-[70%] rounded-full mix-blend-normal blur-[80px] opacity-40 animate-blob animation-delay-2000 transition-colors duration-1000 ${currentScreen.blob2}`} />
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-white mix-blend-normal blur-[60px] opacity-10 animate-blob animation-delay-4000" />
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
            <img src={currentScreen.image} alt={currentScreen.icon} className="w-64 h-64 sm:w-80 sm:h-80 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 drop-shadow-md">{currentScreen.title}</h1>
          <p className="text-lg sm:text-xl font-medium text-white/95 mb-8 drop-shadow-md">{currentScreen.subtitle}</p>
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
                {error && <p className="text-red-500 text-sm text-center mb-1 font-medium px-2">{error}</p>}
                
                <button
                  onClick={() => {
                    setError('')
                    setShowEmailForm(true)
                  }}
                  className="w-full bg-white border-2 border-[#E5E3DD] text-[#1C1C1E] rounded-full py-3.5 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
                >
                  <span className="text-base font-bold">Использовать E-mail</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      setError('')
                      await loginWithVK()
                    } catch (err: any) {
                      setError(err.message || 'Ошибка авторизации через ВКонтакте')
                    }
                  }}
                  className="w-full bg-[#0077FF] text-white rounded-full py-3.5 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.018-1.304.585-1.496c.595-.189 1.36 1.261 2.172 1.818.613.42 1.08.328 1.08.328l2.17-.03s1.135-.071.597-1.111c-.044-.08-.312-.672-1.608-1.901-1.356-1.286-1.175-1.078.459-3.303.997-1.357 1.395-2.186 1.27-2.54-.12-.337-.864-.248-.864-.248l-2.44.015s-.181-.025-.315.056c-.132.08-.217.267-.217.267s-.386 1.05-.901 1.942c-1.085 1.89-1.52 1.99-1.698 1.872-.413-.273-.31-1.094-.31-1.678 0-1.824.271-2.585-.528-2.783-.265-.065-.46-.108-1.136-.115-.869-.009-1.604.003-2.02.211-.277.139-.491.45-.361.467.161.021.527.101.72.371.25.349.241 1.133.241 1.133s.144 2.147-.335 2.414c-.329.182-.781-.19-1.75-1.9-.497-.878-.872-1.849-.872-1.849s-.072-.181-.202-.278c-.157-.117-.376-.154-.376-.154l-2.322.015s-.348.01-.476.165c-.114.138-.009.424-.009.424s1.818 4.366 3.878 6.566c1.889 2.02 4.032 1.888 4.032 1.888h.972z" />
                  </svg>
                  <span className="text-base font-bold">Войти через ВКонтакте</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      setError('')
                      await loginWithYandex()
                    } catch (err: any) {
                      setError(err.message || 'Ошибка авторизации через Яндекс')
                    }
                  }}
                  className="w-full bg-[#FC3F1D] text-white rounded-full py-3.5 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
                >
                  <svg width="20" height="22" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true">
                    <path d="M11.733 24h3.427V0H10.64C5.64 0 3.013 2.667 3.013 6.667c0 3.44 1.6 5.453 4.64 7.573L2.666 24h3.694l5.44-10.56-1.867-1.173c-2.453-1.573-3.627-3.04-3.627-5.76 0-2.56 1.627-4.267 4.48-4.267h.947V24z" />
                  </svg>
                  <span className="text-base font-bold">Войти через Яндекс</span>
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} autoComplete="off" className={`w-full flex flex-col gap-2.5 ${shake ? 'animate-shake' : ''}`}>
                {/* ── Name Field (register only) ── */}
                {isRegister && (
                  <div>
                    <input
                      ref={nameRef}
                      type="text"
                      placeholder="Имя"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined })) }}
                      className={`w-full px-4 py-3.5 rounded-2xl bg-white border-2 focus:outline-none transition-all text-[15px] ${
                        fieldErrors.name ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-[#E5E3DD] focus:border-[#E8922A]'
                      }`}
                    />
                    {fieldErrors.name && fieldErrors.name.trim() && (
                      <p className="text-red-500 text-[12px] font-medium mt-1.5 ml-4">{fieldErrors.name}</p>
                    )}
                  </div>
                )}

                {/* ── Email Field ── */}
                <div>
                  <input
                    ref={emailRef}
                    type="text"
                    inputMode="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined })) }}
                    autoComplete="off"
                    className={`w-full px-4 py-3.5 rounded-2xl bg-white border-2 focus:outline-none transition-all text-[15px] ${
                      fieldErrors.email ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-[#E5E3DD] focus:border-[#E8922A]'
                    }`}
                  />
                  {fieldErrors.email && fieldErrors.email.trim() && (
                    <p className="text-red-500 text-[12px] font-medium mt-1.5 ml-4">{fieldErrors.email}</p>
                  )}
                </div>

                {/* ── Password Field ── */}
                <div>
                  <div className="relative">
                    <input
                      ref={passwordRef}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Пароль"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined })) }}
                      autoComplete="off"
                      className={`w-full px-4 py-3.5 pr-12 rounded-2xl bg-white border-2 focus:outline-none transition-all text-[15px] ${
                        fieldErrors.password ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-[#E5E3DD] focus:border-[#E8922A]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#6B6B6B] hover:text-[#1C1C1E] transition-colors"
                      aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && fieldErrors.password.trim() && (
                    <p className="text-red-500 text-[12px] font-medium mt-1.5 ml-4">{fieldErrors.password}</p>
                  )}
                </div>

                {/* ── Confirm Password Field (register only) ── */}
                {isRegister && (
                  <div>
                    <div className="relative">
                      <input
                        ref={confirmPasswordRef}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Подтвердите пароль"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined })) }}
                        autoComplete="off"
                        className={`w-full px-4 py-3.5 pr-12 rounded-2xl bg-white border-2 focus:outline-none transition-all text-[15px] ${
                          fieldErrors.confirmPassword ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-[#E5E3DD] focus:border-[#E8922A]'
                        }`}
                      />
                    </div>
                    {fieldErrors.confirmPassword && fieldErrors.confirmPassword.trim() && (
                      <p className="text-red-500 text-[12px] font-medium mt-1.5 ml-4">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                  className="w-full bg-[#E8922A] text-white rounded-full py-4 mt-2 font-bold text-[16px] shadow-[0_8px_20px_rgba(232,146,42,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {loginMutation.isPending || registerMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  <span>{loginMutation.isPending || registerMutation.isPending ? 'Загрузка...' : isRegister ? 'Создать аккаунт' : 'Войти'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); clearErrors(); setPassword(''); setConfirmPassword('') }}
                  className="w-full bg-white text-[#6B6B6B] border-2 border-[#E5E3DD] rounded-full py-3.5 font-bold shadow-sm active:scale-[0.98] transition-transform mt-1"
                >
                  {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowEmailForm(false); clearErrors(); setPassword(''); setConfirmPassword('') }}
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

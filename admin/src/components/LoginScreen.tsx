import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'
import { trpc } from '../lib/trpc'

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [turnstileReady, setTurnstileReady] = useState(false)
  
  const [step, setStep] = useState<'login' | 'enroll' | 'verify'>('login')
  const [enrollSecret, setEnrollSecret] = useState('')
  const [error, setError] = useState('')

  const loginMutation = trpc.adminLogin.useMutation()
  const verifyMutation = trpc.adminVerify2FA.useMutation()

  // tRPC wraps server errors — extract the real message
  const extractError = (err: any): string => {
    return err?.data?.message || err?.message || 'Неизвестная ошибка'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await loginMutation.mutateAsync({ email, password, turnstileToken })
      if (res.requiresEnrollment) {
        setEnrollSecret(res.secret!)
        setStep('enroll')
      } else if (res.requires2FA) {
        setStep('verify')
      }
    } catch (err: any) {
      setError(extractError(err))
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await verifyMutation.mutateAsync({ email, password, totpCode })
      onLogin()
    } catch (err: any) {
      setError(extractError(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F2EB] p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#E5E3DD] w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#1C1C1E] mb-6 tracking-tight text-center">
          Zubriks Admin
        </h1>

        {step === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#F5F2EB] px-4 py-3 rounded-2xl text-[17px] outline-none focus:ring-2 focus:ring-[#1A3D2B] transition-all"
                placeholder="admin@zubriks.ru"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider mb-1 block">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#F5F2EB] px-4 py-3 rounded-2xl text-[17px] outline-none focus:ring-2 focus:ring-[#1A3D2B] transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <div className="flex justify-center my-2">
              <Turnstile 
                siteKey="1x00000000000000000000AA" // Dev dummy key — always passes. Change in production.
                onSuccess={(token) => { setTurnstileToken(token); setTurnstileReady(true) }}
                onLoad={() => setTurnstileReady(true)}
                onError={() => { setTurnstileReady(true) }}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                <p className="text-red-600 text-sm text-center font-medium">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loginMutation.isPending || !turnstileReady}
              className="w-full py-4 bg-[#1A3D2B] text-white font-bold rounded-full mt-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loginMutation.isPending ? 'Вход...' : !turnstileReady ? 'Загрузка капчи...' : 'Продолжить'}
            </button>
          </form>
        )}

        {step === 'enroll' && (
          <div className="flex flex-col gap-4 items-center text-center">
            <h2 className="text-lg font-bold text-[#1C1C1E]">Настройка 2FA</h2>
            <p className="text-sm text-[#6B6B6B]">
              Для вашего аккаунта требуется двухфакторная аутентификация. 
              Добавьте этот секрет в Google Authenticator:
            </p>
            <div className="bg-[#F5F2EB] p-4 rounded-xl font-mono text-lg font-bold text-[#1A3D2B] break-all">
              {enrollSecret}
            </div>
            <button
              onClick={() => setStep('verify')}
              className="w-full py-4 bg-[#1A3D2B] text-white font-bold rounded-full mt-4 hover:opacity-90 transition-opacity"
            >
              Я сохранил код
            </button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#1C1C1E] text-center">Введите код 2FA</h2>
            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={totpCode}
                onChange={e => setTotpCode(e.target.value)}
                className="w-full bg-[#F5F2EB] px-4 py-3 rounded-2xl text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-[#1A3D2B] transition-all font-mono"
                placeholder="000000"
              />
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <button
              type="submit"
              disabled={verifyMutation.isPending || totpCode.length !== 6}
              className="w-full py-4 bg-[#1A3D2B] text-white font-bold rounded-full mt-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {verifyMutation.isPending ? 'Проверка...' : 'Войти'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

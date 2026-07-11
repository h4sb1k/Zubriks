import React, { useState } from 'react'
import { trpc, TrpcProvider } from './lib/trpc'
import AdminScreen from './components/AdminScreen'
import LoginScreen from './components/LoginScreen'

function AuthWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const utils = trpc.useUtils()

  // We can verify auth by simply calling a protected admin endpoint
  // adminGetStats is an adminProcedure
  const { data, isLoading, error } = trpc.adminGetStats.useQuery(undefined, {
    retry: false,
  })

  // If we have an error and it's UNAUTHORIZED, we show login.
  // We manage the state to avoid showing login temporarily on successful refreshes.
  
  if (isLoading && !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F2EB] font-bold text-[#1A3D2B]">Проверка доступа...</div>
  }

  if (error || (!data && !isLoading)) {
    return <LoginScreen onLogin={() => utils.adminGetStats.invalidate()} />
  }

  // Once data loads successfully, we are authenticated
  return <AdminScreen onClose={() => {}} />
}

export default function App() {
  return (
    <TrpcProvider>
      <AuthWrapper />
    </TrpcProvider>
  )
}

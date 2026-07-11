import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { inferRouterOutputs } from '@trpc/server'
import type { adminRouter } from '@Zubriki/backend/src/trpc'
import React from 'react'

type AdminTrpcRouter = typeof adminRouter
type TrpcType = ReturnType<typeof createTRPCReact<AdminTrpcRouter>>

export const trpc = createTRPCReact<AdminTrpcRouter>() as TrpcType
export type RouterOutput = inferRouterOutputs<AdminTrpcRouter>

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const apiUrl = import.meta.env.VITE_ADMIN_API_URL
    if (apiUrl) return apiUrl
    return `${window.location.protocol}//${window.location.hostname}:3000/admin-api/trpc`
  }
  return 'http://localhost:3000/admin-api/trpc'
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getBaseUrl(),
      fetch(url, options) {
        return fetch(url, { ...options, credentials: 'include' })
      },
    }),
  ],
})

export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

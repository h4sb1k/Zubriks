import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { inferRouterOutputs } from '@trpc/server'
import type { TrpcRouter } from '@Zubriki/backend/src/trpc'

type TrpcType = ReturnType<typeof createTRPCReact<TrpcRouter>>

export const trpc = createTRPCReact<TrpcRouter>() as TrpcType
export type RouterOutput = inferRouterOutputs<TrpcRouter>

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
    return `http://${window.location.hostname}:3000/trpc`
  }
  return 'http://localhost:3000/trpc'
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getBaseUrl(),
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

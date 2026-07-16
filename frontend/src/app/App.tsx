// src/App.tsx
import { Calendar, Home, Map, Route, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import AchievementUnlock from './components/AchievementUnlock'
import EventsScreen from './components/EventsScreen'
import HomeScreen from './components/HomeScreen'
import LoadingZubrik from './components/LoadingZubrik'
import MapScreen from './components/MapScreen'
import OnboardingScreen from './components/OnboardingScreen'
import bisonSVG from './components/pics/zubr.svg'
import ProfileScreen from './components/ProfileScreen'
import RoutesScreen from './components/RoutesScreen'
import type { NewAchievement } from './hooks/useProximityCheck'
import { useProximityCheck } from './hooks/useProximityCheck'
import { trpc, TrpcProvider } from './lib/trpc'

type TabType = 'home' | 'map' | 'routes' | 'events' | 'profile'

const ONBOARDING_KEY = 'onboarding_completed'

const tabs: { id: TabType; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Главная' },
  { id: 'routes', icon: Route, label: 'Маршруты' },
  { id: 'map', icon: Map, label: 'Карта' },
  { id: 'events', icon: Calendar, label: 'События' },
  { id: 'profile', icon: User, label: 'Профиль' },
]

function MainApp() {
  const getTabFromHash = (): TabType => {
    const hash = window.location.hash.replace('#', '') as TabType
    if (['home', 'map', 'routes', 'events', 'profile'].includes(hash)) {
      return hash
    }
    return 'home'
  }

  const [activeTab, setActiveTabRaw] = useState<TabType>(getTabFromHash)

  const setActiveTab = (tab: TabType) => {
    window.location.hash = tab
    setActiveTabRaw(tab)
  }

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTabRaw(getTabFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(ONBOARDING_KEY) !== 'true')
  const [achievementQueue, setAchievementQueue] = useState<NewAchievement[]>([])

  const utils = trpc.useUtils()

  // tRPC query to get user
  const {
    data: user,
    isLoading,
    refetch,
  } = trpc.me.useQuery(undefined, {
    retry: false,
  })



  // Global user location state, initialized from cache if available
  const [userLocation, setUserLocation] = useState<[number, number] | null>(() => {
    const cached = localStorage.getItem('last_user_location')
    if (cached) {
      try {
        return JSON.parse(cached) as [number, number]
      } catch (e) {
        return null
      }
    }
    return null
  })

  // Watch user location in real-time
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude]
          setUserLocation(coords)
          localStorage.setItem('last_user_location', JSON.stringify(coords))
        },
        (error) => {
          console.warn('Geolocation watch error:', error)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Слушаем кастомные события ачивок от компонентов вроде RouteActive
  useEffect(() => {
    const handleNewAchievement = (e: CustomEvent<NewAchievement>) => {
      setAchievementQueue((prev) => [...prev, e.detail])
    }
    window.addEventListener('new-achievement', handleNewAchievement as EventListener)
    return () => window.removeEventListener('new-achievement', handleNewAchievement as EventListener)
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setShowOnboarding(false)
  }

  // Получаем зубриков для отслеживания на глобальном уровне
  const { data: zubriksData } = trpc.getZubriks.useQuery(undefined, {
    enabled: !!user && !showOnboarding,
  })

  const unlockedZubrikPoints = useMemo(() => {
    if (!zubriksData?.zubriks) return []
    return zubriksData.zubriks
      .filter((z) => !z.unlocked)
      .map((z) => ({
        id: z.id,
        latitude: z.coordinates[0],
        longitude: z.coordinates[1],
        type: 'zubrik' as const,
      }))
  }, [zubriksData])

  useProximityCheck(userLocation, unlockedZubrikPoints, (ach) => {
    setAchievementQueue((prev) => [...prev, ach])
  })

  if (isLoading) {
    return <LoadingZubrik text="Подготовка экспедиции..." fullScreen />
  }

  if (!user || showOnboarding) {
    return (
      <OnboardingScreen
        initialStep={showOnboarding ? 0 : 2}
        onComplete={() => {
          handleOnboardingComplete()
          refetch()
        }}
      />
    )
  }

  return (
    <div className="size-full flex flex-col bg-[#FAFAF7] max-w-md mx-auto relative h-[100dvh] overflow-hidden">
      {activeTab === 'home' && (
        <HomeScreen userLocation={userLocation} user={user} onNavigate={() => setActiveTab('profile')} />
      )}
      {activeTab === 'map' && <MapScreen userLocation={userLocation} setUserLocation={setUserLocation} />}
      {activeTab === 'routes' && <RoutesScreen userLocation={userLocation} />}
      {activeTab === 'events' && <EventsScreen />}
      {activeTab === 'profile' && <ProfileScreen />}

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#E5E3DD] px-2 pt-2 pb-safe z-40">
        <div className="flex items-center justify-around">
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-1 flex flex-col items-center gap-1 py-2 relative transition-all"
              >
                <div className={`transition-all ${isActive ? 'scale-110' : ''}`}>
                  <Icon
                    size={24}
                    className={isActive ? 'text-[#E8922A]' : 'text-[#6B6B6B]'}
                    fill={isActive ? '#E8922A' : 'none'}
                  />
                </div>
                <span className={`text-xs transition-colors ${isActive ? 'text-[#E8922A]' : 'text-[#6B6B6B]'}`}>
                  {label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#E8922A] rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {achievementQueue.length > 0 && (
        <AchievementUnlock
          key={achievementQueue[0].id}
          name={achievementQueue[0].name}
          description={achievementQueue[0].description}
          image={achievementQueue[0].imageUrl}
          icon={achievementQueue[0].icon}
          onClose={() => setAchievementQueue((prev) => prev.slice(1))}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <TrpcProvider>
      <MainApp />
    </TrpcProvider>
  )
}

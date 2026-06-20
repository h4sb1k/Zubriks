// src/App.tsx
import { Calendar, Home, Map, Route, User } from 'lucide-react'
import { useEffect, useState } from 'react'

import AchievementUnlock from './components/AchievementUnlock'
import EventsScreen from './components/EventsScreen'
import HomeScreen from './components/HomeScreen'
import MapScreen from './components/MapScreen'
import OnboardingScreen from './components/OnboardingScreen'
import bisonSVG from './components/pics/zubr.svg'
import ProfileScreen from './components/ProfileScreen'
import RoutesScreen from './components/RoutesScreen'
import { TrpcProvider } from './lib/trpc'

type TabType = 'home' | 'map' | 'routes' | 'events' | 'profile'

const ONBOARDING_KEY = 'onboarding_completed'

const tabs: { id: TabType; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Главная' },
  { id: 'map', icon: Map, label: 'Карта' },
  { id: 'routes', icon: Route, label: 'Маршруты' },
  { id: 'events', icon: Calendar, label: 'События' },
  { id: 'profile', icon: User, label: 'Профиль' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(ONBOARDING_KEY) !== 'true')
  const [showAchievement, setShowAchievement] = useState(false)

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

  

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setShowOnboarding(false)
    setTimeout(() => setShowAchievement(true), 1000)
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />
  }

  return (
    <TrpcProvider>
      <div className="size-full flex flex-col bg-[#FAFAF7] max-w-md mx-auto relative">
        {activeTab === 'home' && <HomeScreen userLocation={userLocation} />}
        {activeTab === 'map' && <MapScreen userLocation={userLocation} setUserLocation={setUserLocation} />}
        {activeTab === 'routes' && <RoutesScreen userLocation={userLocation} />}
        {activeTab === 'events' && <EventsScreen />}
        {activeTab === 'profile' && <ProfileScreen />}

        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#E5E3DD] px-2 pt-2 pb-safe">
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

        {showAchievement && (
          <AchievementUnlock
            name="Начало пути"
            description="Ты начал своё путешествие по Орлу!"
            image={bisonSVG}
            onClose={() => setShowAchievement(false)}
          />
        )}
      </div>
    </TrpcProvider>
  )
}

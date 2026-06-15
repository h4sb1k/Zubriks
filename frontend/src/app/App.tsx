import { Calendar, Home, Map, Route, User } from 'lucide-react';
import { useState } from 'react';

import AchievementUnlock from './components/AchievementUnlock';
import EventsScreen from './components/EventsScreen';
import HomeScreen from './components/HomeScreen';
import MapScreen from './components/MapScreen';
import OnboardingScreen from './components/OnboardingScreen';
import bisonSVG from './components/pics/zubr.svg';
import ProfileScreen from './components/ProfileScreen';
import RoutesScreen from './components/RoutesScreen';

type TabType = 'home' | 'map' | 'routes' | 'events' | 'profile';

const ONBOARDING_KEY = 'onboarding_completed';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) !== 'true'
  );
  const [showAchievement, setShowAchievement] = useState(false);

  const tabs = [
    { id: 'home' as TabType, icon: Home, label: 'Главная' },
    { id: 'map' as TabType, icon: Map, label: 'Карта' },
    { id: 'routes' as TabType, icon: Route, label: 'Маршруты' },
    { id: 'events' as TabType, icon: Calendar, label: 'События' },
    { id: 'profile' as TabType, icon: User, label: 'Профиль' },
  ];

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
    setTimeout(() => setShowAchievement(true), 1000);
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="size-full flex flex-col bg-[#FAFAF7] max-w-md mx-auto relative">
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'map' && <MapScreen />}
      {activeTab === 'routes' && <RoutesScreen />}
      {activeTab === 'events' && <EventsScreen />}
      {activeTab === 'profile' && <ProfileScreen />}

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#E5E3DD] px-2 pt-2 pb-safe">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-1 py-2 relative transition-all"
              >
                <div className={`transition-all ${isActive ? 'scale-110' : ''}`}>
                  <Icon
                    size={24}
                    className={isActive ? 'text-[#E8922A]' : 'text-[#6B6B6B]'}
                    fill={isActive ? '#E8922A' : 'none'}
                  />
                </div>
                <span
                  className={`text-xs transition-colors ${
                    isActive ? 'text-[#E8922A]' : 'text-[#6B6B6B]'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#E8922A] rounded-full" />
                )}
              </button>
            );
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
  );
}
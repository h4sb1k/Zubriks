import { Clock, MapPin, Star, Trophy } from 'lucide-react'
import { useState } from 'react'

type Achievement = {
  id: string
  name: string
  description: string
  earned: boolean
  progress?: number
  emoji: string
}

const mockAchievements: Achievement[] = [
  { id: '1', name: 'Начало пути', description: 'Найди своего первого зубрика', earned: true, emoji: '🦬' },
  { id: '2', name: 'Исследователь', description: 'Найди 5 зубриков', earned: true, emoji: '🗺️' },
  { id: '3', name: 'Путешественник', description: 'Пройди 10 км по городу', earned: true, emoji: '🚶' },
  { id: '4', name: 'Коллекционер', description: 'Найди 10 зубриков', earned: false, progress: 60, emoji: '📦' },
  { id: '5', name: 'Знаток истории', description: 'Посети все музеи', earned: false, progress: 40, emoji: '🏛️' },
  { id: '6', name: 'Мастер маршрутов', description: 'Создай 5 маршрутов', earned: false, emoji: '🗺️' },
  { id: '7', name: 'Легенда Орла', description: 'Найди всех зубриков', earned: false, emoji: '👑' },
  { id: '8', name: 'Активист', description: 'Посети 10 событий', earned: false, emoji: '🎉' },
]

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('Ачивки')

  const earnedAchievements = mockAchievements.filter((a) => a.earned)
  const totalAchievements = mockAchievements.length

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="px-5 pt-6 pb-6 bg-[#F5F2EB]">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[#1A3D2B] flex items-center justify-center mb-4 shadow-lg">
            <span className="text-5xl">🦬</span>
          </div>
          <h1 className="text-2xl mb-1">Исследователь</h1>
          <p className="text-[#6B6B6B] mb-6">Исследователь Орла</p>

          <div className="flex gap-6 w-full max-w-xs">
            <div className="flex-1 text-center">
              <div className="text-2xl mb-1">8</div>
              <div className="text-xs text-[#6B6B6B]">Зубриков</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl mb-1">3</div>
              <div className="text-xs text-[#6B6B6B]">Маршрутов</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl mb-1">12</div>
              <div className="text-xs text-[#6B6B6B]">Дней</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6">
        <h2 className="text-xl mb-4">Главные достижения</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {earnedAchievements.slice(0, 3).map((achievement) => (
            <div
              key={achievement.id}
              className="aspect-square bg-gradient-to-br from-[#D4A017] to-[#E8922A] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg"
            >
              <div className="text-3xl mb-2">{achievement.emoji}</div>
              <div className="text-xs text-white leading-tight">{achievement.name}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 border-b border-[#E5E3DD]">
          {['Ачивки', 'Маршруты', 'Избранное'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm transition-colors relative ${
                activeTab === tab ? 'text-[#1C1C1E]' : 'text-[#6B6B6B]'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8922A] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'Ачивки' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Все достижения</h3>
              <span className="text-sm text-[#6B6B6B]">
                {earnedAchievements.length} / {totalAchievements}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-6">
              {mockAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`rounded-2xl p-4 shadow-sm relative ${
                    achievement.earned ? 'bg-gradient-to-br from-[#D4A017] to-[#E8922A]' : 'bg-white'
                  }`}
                >
                  {!achievement.earned && (
                    <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                      <div className="text-4xl opacity-30">🔒</div>
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="text-4xl mb-2">{achievement.emoji}</div>
                    <div className={`text-sm mb-1 ${achievement.earned ? 'text-white' : 'text-[#1C1C1E]'}`}>
                      {achievement.name}
                    </div>
                    <div className={`text-xs ${achievement.earned ? 'text-white/80' : 'text-[#6B6B6B]'}`}>
                      {achievement.description}
                    </div>
                    {!achievement.earned && achievement.progress && (
                      <div className="w-full mt-3">
                        <div className="h-1.5 bg-[#E5E3DD] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#E8922A] rounded-full"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-[#6B6B6B] mt-1">{achievement.progress}%</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Маршруты' && (
          <div className="pb-6">
            <p className="text-center text-[#6B6B6B] py-12">Здесь будут ваши пройденные маршруты</p>
          </div>
        )}

        {activeTab === 'Избранное' && (
          <div className="pb-6">
            <p className="text-center text-[#6B6B6B] py-12">Здесь будут ваши избранные места</p>
          </div>
        )}
      </div>
    </div>
  )
}

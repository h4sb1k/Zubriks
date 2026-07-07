import { AnimatePresence } from 'framer-motion'
import { LogOut, Settings } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '../lib/trpc'
import AdminScreen from './AdminScreen'

type RouteInfo = {
  id: string
  name: string
  distance: string
  duration: string
  stops: number
  description: string | null
  imageColor: string
}

function RouteCard({ route }: { route: RouteInfo }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col mb-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-[#1C1C1E]">{route.name}</h4>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: route.imageColor }}
        >
          📍
        </div>
      </div>
      <p className="text-sm text-[#6B6B6B] mb-3 line-clamp-2">{route.description}</p>
      <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
        <span>{route.distance}</span>
        <span>{route.duration}</span>
        <span>{route.stops} точек</span>
      </div>
    </div>
  )
}

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('Награды')
  const [showAdmin, setShowAdmin] = useState(false)

  const { data: user } = trpc.me.useQuery()
  const { data: statsData, isLoading: isStatsLoading } = trpc.getProfileStats.useQuery()
  const { data: achievementsData, isLoading: isAchievementsLoading } = trpc.getAchievements.useQuery()

  const utils = trpc.useUtils()
  const logoutMutation = trpc.logout.useMutation({
    onSuccess: () => {
      utils.invalidate()
      window.location.reload()
    },
  })
  
  const togglePin = trpc.togglePinAchievement.useMutation({
    onSuccess: () => utils.getAchievements.invalidate()
  })

  const achievements = achievementsData?.achievements ?? []
  const earnedAchievements = achievements.filter((a) => a.earned)
  const totalAchievements = achievements.length
  
  const pinnedAchievements = earnedAchievements
    .filter((a) => a.isPinned)
    .sort((a, b) => {
      const timeA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0
      const timeB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0
      return timeA - timeB
    })
  const topAchievements = pinnedAchievements.length > 0 ? pinnedAchievements.slice(0, 3) : earnedAchievements.slice(0, 3)

  const stats = statsData?.stats ?? { zubriksCount: 0, totalZubriks: 0, routesCount: 0, daysCount: 0 }
  const createdRoutes = statsData?.createdRoutes ?? []
  const likedRoutes = statsData?.likedRoutes ?? []

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="px-5 pt-6 pb-6 bg-[#F5F2EB] relative">
        <button
          onClick={() => logoutMutation.mutate()}
          className="absolute top-6 right-5 flex items-center gap-1.5 text-[#6B6B6B] hover:text-red-500 transition-colors text-sm"
          disabled={logoutMutation.isPending}
        >
          <LogOut size={18} />
          <span>Выйти</span>
        </button>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowAdmin(true)}
            className="absolute top-6 left-5 bg-[#1A3D2B] text-white px-3.5 py-2 rounded-full text-sm font-bold shadow-md active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <Settings size={16} />
            <span>Админка</span>
          </button>
        )}

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[#1A3D2B] flex items-center justify-center mb-4 shadow-lg overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Аватар" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">🦬</span>
            )}
          </div>
          <h1 className="text-2xl mb-1">{user?.name || 'Исследователь'}</h1>
          <p className="text-[#6B6B6B] mb-6">{user?.email || 'Исследователь Орла'}</p>

          <div className="flex gap-6 w-full max-w-xs">
            <div className="flex-1 text-center">
              <div className="text-2xl mb-1">{isStatsLoading ? '—' : `${stats.zubriksCount}/${stats.totalZubriks}`}</div>
              <div className="text-xs text-[#6B6B6B]">Зубриков</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl mb-1">{isStatsLoading ? '—' : stats.routesCount}</div>
              <div className="text-xs text-[#6B6B6B]">Маршрутов</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl mb-1">{isStatsLoading ? '—' : stats.daysCount}</div>
              <div className="text-xs text-[#6B6B6B]">Дней</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6">
        <h2 className="text-xl font-semibold text-[#1A3D2B] mb-4">Главные достижения</h2>
        {earnedAchievements.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-[#E5E3DD] mb-6">
            <div className="text-4xl mb-3 opacity-50">🌱</div>
            <p className="text-[#6B6B6B] text-sm">Здесь появятся ваши лучшие достижения. Начните исследовать город!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {topAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="aspect-[4/5] rounded-[24px] p-2 flex flex-col items-center justify-end text-center shadow-lg shadow-[#1A3D2B]/10 relative overflow-hidden transition-transform active:scale-95"
                style={{ background: 'linear-gradient(135deg, #1A3D2B, #2E5A41)' }}
              >
                {/* Декоративный блик */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#E8922A]/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                {/* Изображение на всю карточку */}
                <div className="absolute inset-0 pt-2 px-2 pb-8 flex items-center justify-center">
                  {achievement.imageUrl && achievement.imageUrl !== '' ? (
                    <img
                      src={achievement.imageUrl}
                      alt={achievement.name}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  ) : (
                    <div className="text-5xl drop-shadow-md">{achievement.emoji}</div>
                  )}
                </div>

                <div className="w-full bg-black/30 backdrop-blur-md rounded-[16px] py-1.5 px-1 relative z-10">
                  <div className="text-[10px] font-medium text-white leading-tight line-clamp-1">
                    {achievement.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-[#E5E3DD]">
          {['Награды', 'Маршруты', 'Избранное'].map((tab) => (
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

        {activeTab === 'Награды' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4 mt-2">
              <h3 className="text-lg font-semibold text-[#1A3D2B]">Все достижения</h3>
              <div className="bg-[#E8922A]/10 text-[#E8922A] px-3 py-1 rounded-full text-xs font-semibold">
                {earnedAchievements.length} / {totalAchievements}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-6">
              {isAchievementsLoading ? (
                <div className="col-span-2 text-center text-[#6B6B6B] py-8">Загрузка достижений...</div>
              ) : (
                achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`aspect-[4/5] relative overflow-hidden rounded-[24px] p-3 flex flex-col justify-end transition-all duration-300 active:scale-[0.98] ${
                      achievement.earned
                        ? 'shadow-lg shadow-[#1A3D2B]/20 text-white'
                        : 'bg-white border border-[#E5E3DD] text-[#1C1C1E] shadow-sm'
                    }`}
                    style={achievement.earned ? { background: 'linear-gradient(135deg, #1A3D2B, #2E5A41)' } : undefined}
                  >
                    {achievement.earned && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8922A]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    )}

                    {/* Огромное изображение по центру */}
                    <div className="absolute inset-0 pt-3 px-3 pb-16 flex items-center justify-center pointer-events-none">
                      {achievement.imageUrl && achievement.imageUrl !== '' ? (
                        <img
                          src={achievement.imageUrl}
                          alt={achievement.name}
                          className={`w-full h-full object-contain drop-shadow-md transition-all duration-500 ${
                            !achievement.earned ? 'grayscale opacity-30 scale-90' : 'scale-100 hover:scale-110'
                          }`}
                        />
                      ) : (
                        <div
                          className={`text-6xl ${!achievement.earned ? 'grayscale opacity-30 scale-90' : 'drop-shadow-md'}`}
                        >
                          {achievement.emoji}
                        </div>
                      )}
                    </div>

                    {/* Контент поверх изображения снизу */}
                    <div
                      className={`relative z-10 p-2.5 rounded-[18px] backdrop-blur-md flex flex-col items-center text-center w-full ${
                        achievement.earned ? 'bg-black/30' : 'bg-white/80 border border-[#E5E3DD]/50'
                      }`}
                    >
                      <h4
                        className={`font-bold text-[13px] leading-tight mb-0.5 truncate w-full ${achievement.earned ? 'text-white' : 'text-[#1A3D2B]'}`}
                      >
                        {achievement.name}
                      </h4>
                      <p
                        className={`text-[10px] leading-snug line-clamp-2 w-full ${achievement.earned ? 'text-white/80' : 'text-[#6B6B6B]'}`}
                      >
                        {achievement.description}
                      </p>

                      {!achievement.earned && achievement.progress !== undefined && achievement.progress > 0 && (
                        <div className="w-full mt-2">
                          <div className="h-1 bg-[#E5E3DD] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#E8922A] rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {achievement.earned && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePin.mutate({ achievementId: achievement.id })
                        }}
                        className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                          achievement.isPinned ? 'bg-[#E8922A] text-white shadow-md' : 'bg-black/20 text-white/50 hover:text-white hover:bg-black/40'
                        }`}
                      >
                        {achievement.isPinned ? '📌' : '📍'}
                      </button>
                    )}
                    {!achievement.earned && <div className="absolute top-3 right-3 text-lg opacity-20">🔒</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'Маршруты' && (
          <div className="pb-6">
            <h3 className="text-lg mb-4">Мои маршруты</h3>
            {isStatsLoading ? (
              <div className="text-center text-[#6B6B6B] py-8">Загрузка...</div>
            ) : createdRoutes.length > 0 ? (
              createdRoutes.map((r) => <RouteCard key={r.id} route={r} />)
            ) : (
              <p className="text-center text-[#6B6B6B] py-12">Вы пока не создали ни одного маршрута</p>
            )}
          </div>
        )}

        {activeTab === 'Избранное' && (
          <div className="pb-6">
            <h3 className="text-lg mb-4">Избранные маршруты</h3>
            {isStatsLoading ? (
              <div className="text-center text-[#6B6B6B] py-8">Загрузка...</div>
            ) : likedRoutes.length > 0 ? (
              likedRoutes.map((r) => <RouteCard key={r.id} route={r} />)
            ) : (
              <p className="text-center text-[#6B6B6B] py-12">Здесь будут ваши избранные маршруты</p>
            )}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {showAdmin && <AdminScreen onClose={() => setShowAdmin(false)} />}
      </AnimatePresence>
    </div>
  )
}

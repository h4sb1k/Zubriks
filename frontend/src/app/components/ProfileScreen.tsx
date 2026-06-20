import { LogOut } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '../lib/trpc'

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
  const [activeTab, setActiveTab] = useState('Ачивки')

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

  const achievements = achievementsData?.achievements ?? []
  const earnedAchievements = achievements.filter((a) => a.earned)
  const totalAchievements = achievements.length

  const stats = statsData?.stats ?? { zubriksCount: 0, routesCount: 0, daysCount: 0 }
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
              <div className="text-2xl mb-1">{isStatsLoading ? '—' : stats.zubriksCount}</div>
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
        <h2 className="text-xl mb-4">Главные достижения</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {earnedAchievements.slice(0, 3).map((achievement) => (
            <div
              key={achievement.id}
              className="aspect-square bg-gradient-to-br from-[#D4A017] to-[#E8922A] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg"
            >
              {achievement.imageUrl ? (
                <img src={achievement.imageUrl} alt={achievement.name} className="w-10 h-10 mb-2 object-contain" />
              ) : (
                <div className="text-3xl mb-2">{achievement.emoji}</div>
              )}
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
              {isAchievementsLoading ? (
                <div className="col-span-2 text-center text-[#6B6B6B] py-8">Загрузка достижений...</div>
              ) : (
                achievements.map((achievement) => (
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
                      {achievement.imageUrl ? (
                        <img
                          src={achievement.imageUrl}
                          alt={achievement.name}
                          className="w-16 h-16 mb-2 object-contain"
                        />
                      ) : (
                        <div className="text-4xl mb-2">{achievement.emoji}</div>
                      )}
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
    </div>
  )
}

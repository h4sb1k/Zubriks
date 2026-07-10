import { AnimatePresence, motion, Reorder } from 'framer-motion'
import { Clock, Lock, LogOut, MapPin,Pin, Route, Settings } from 'lucide-react'
import { useEffect,useState } from 'react'

import { trpc } from '../lib/trpc'
import AchievementModal from './AchievementModal'
import AdminScreen from './AdminScreen'
import ConfirmModal from './ConfirmModal'
import { DynamicIcon } from './DynamicIcon'
import LoadingZubrik from './LoadingZubrik'

type RouteInfo = {
  id: string
  name: string
  distance: string
  duration: string
  stops: number
  description: string | null
  imageColor: string
  icon: string
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
          <DynamicIcon name={route.icon || 'MapPin'} size={18} />
        </div>
      </div>
      <p className="text-sm text-[#6B6B6B] mb-3 line-clamp-2">{route.description}</p>
      <div className="flex items-center gap-4 text-xs text-[#6B6B6B] font-medium">
        <div className="flex items-center gap-1">
          <Route size={14} className="text-[#E8922A]" />
          <span>{route.distance}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={14} className="text-[#E8922A]" />
          <span>{route.duration}</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-[#E8922A]" />
          <span>{route.stops} точек</span>
        </div>
      </div>
    </div>
  )
}

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('Награды')
  const [showAdmin, setShowAdmin] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null)

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
    .sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0))
  const topAchievements = pinnedAchievements.length > 0 ? pinnedAchievements.slice(0, 3) : earnedAchievements.slice(0, 3)
  
  // Local state for drag & drop reordering
  const [orderedTop, setOrderedTop] = useState(topAchievements)
  
  // Sync local state with server data
  useEffect(() => {
    setOrderedTop(topAchievements)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievementsData])
  
  const reorderMutation = trpc.reorderPinnedAchievements.useMutation({
    onSuccess: () => utils.getAchievements.invalidate()
  })

  const stats = statsData?.stats ?? { zubriksCount: 0, totalZubriks: 0, routesCount: 0, daysCount: 0 }
  const createdRoutes = statsData?.createdRoutes ?? []
  const likedRoutes = statsData?.likedRoutes ?? []

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="px-5 pt-6 pb-6 bg-[#F5F2EB] relative">
        <button
          onClick={() => setShowLogoutConfirm(true)}
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
              <DynamicIcon name="User" size={48} className="text-white/50" />
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
            <div className="bg-orange-50 text-[#E8922A] w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center shadow-inner">
              <DynamicIcon name="Trophy" size={32} />
            </div>
            <p className="text-[#6B6B6B] text-sm">Здесь появятся ваши лучшие достижения. Начните исследовать город!</p>
          </div>
        ) : pinnedAchievements.length > 0 ? (
          <Reorder.Group 
            axis="x" 
            values={orderedTop} 
            onReorder={(newOrder) => {
              setOrderedTop(newOrder)
            }}
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {orderedTop.map((achievement) => (
              <Reorder.Item
                key={achievement.id}
                value={achievement}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.6 } }
                }}
                onClick={() => setSelectedAchievement(achievement)}
                onDragEnd={() => {
                  // Save the new order to the server
                  const ids = orderedTop.map(a => a.id)
                  reorderMutation.mutate({ achievementIds: ids })
                }}
                whileTap={{ scale: 0.95 }}
                whileDrag={{ scale: 1.08, zIndex: 50, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                className="aspect-[4/5] rounded-[24px] p-2 flex flex-col items-center justify-end text-center shadow-lg shadow-[#1A3D2B]/10 relative overflow-hidden cursor-grab active:cursor-grabbing"
                style={{ background: 'linear-gradient(135deg, #1A3D2B, #2E5A41)' }}
                layout
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                {/* Декоративный блик */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#E8922A]/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                {/* Изображение на всю карточку */}
                <div className="absolute inset-0 pt-2 px-2 pb-8 flex items-center justify-center pointer-events-none">
                  {achievement.imageUrl && achievement.imageUrl !== '' ? (
                    <img
                      src={achievement.imageUrl}
                      alt={achievement.name}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${achievement.earned ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#1C1C1E]'}`}>
                      <DynamicIcon name={achievement.icon || 'Trophy'} size={32} />
                    </div>
                  )}
                </div>

                <div className="w-full bg-black/30 backdrop-blur-md rounded-[16px] py-1.5 px-1 relative z-10">
                  <div className="text-[10px] font-medium text-white leading-tight line-clamp-1">
                    {achievement.name}
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {topAchievements.map((achievement) => (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.6 } }
                }}
                key={achievement.id}
                onClick={() => setSelectedAchievement(achievement)}
                whileTap={{ scale: 0.95 }}
                className="aspect-[4/5] rounded-[24px] p-2 flex flex-col items-center justify-end text-center shadow-lg shadow-[#1A3D2B]/10 relative overflow-hidden cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #1A3D2B, #2E5A41)' }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#E8922A]/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute inset-0 pt-2 px-2 pb-8 flex items-center justify-center">
                  {achievement.imageUrl && achievement.imageUrl !== '' ? (
                    <img src={achievement.imageUrl} alt={achievement.name} className="w-full h-full object-contain drop-shadow-lg" />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${achievement.earned ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#1C1C1E]'}`}>
                      <DynamicIcon name={achievement.icon || 'Trophy'} size={32} />
                    </div>
                  )}
                </div>
                <div className="w-full bg-black/30 backdrop-blur-md rounded-[16px] py-1.5 px-1 relative z-10">
                  <div className="text-[10px] font-medium text-white leading-tight line-clamp-1">{achievement.name}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-6"
          >
            <div className="flex items-center justify-between mb-4 mt-2">
              <h3 className="text-lg font-semibold text-[#1A3D2B]">Все достижения</h3>
              <div className="bg-[#E8922A]/10 text-[#E8922A] px-3 py-1 rounded-full text-xs font-semibold">
                {earnedAchievements.length} / {totalAchievements}
              </div>
            </div>
            {isAchievementsLoading ? (
              <LoadingZubrik text="Загрузка достижений..." />
            ) : (
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
                  hidden: { opacity: 0 }
                }}
                className="grid grid-cols-2 gap-3 pb-6"
              >
                {achievements.map((achievement) => (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.9 },
                      visible: { opacity: 1, scale: 1, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.5 } }
                    }}
                    key={achievement.id}
                    onClick={() => setSelectedAchievement(achievement)}
                    whileTap={{ scale: 0.98 }}
                    className={`aspect-[4/5] relative overflow-hidden rounded-[24px] p-3 flex flex-col justify-end cursor-pointer ${
                      achievement.earned
                        ? 'shadow-lg shadow-[#1A3D2B]/20 text-white transition-shadow'
                        : 'bg-white border border-[#E5E3DD] text-[#1C1C1E] shadow-sm transition-shadow'
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
                          className={`w-20 h-20 rounded-full flex items-center justify-center ${!achievement.earned ? 'bg-gray-100/80 text-gray-400 scale-90 shadow-inner' : 'bg-white/20 text-white shadow-lg'}`}
                        >
                          <DynamicIcon name={achievement.icon || 'Trophy'} size={40} />
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

                      {!achievement.earned && achievement.conditionType !== 'MANUAL' && achievement.progressTarget !== undefined && achievement.progressTarget > 0 && (
                        <div className="w-full mt-2">
                          <div className="text-[9px] font-bold text-center mb-0.5" style={{ color: achievement.earned ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
                            {achievement.progressCurrent ?? 0} / {achievement.progressTarget}
                          </div>
                          <div className="h-1 bg-[#E5E3DD] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#E8922A] rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${achievement.progress ?? 0}%` }}
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
                        className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                          achievement.isPinned ? 'bg-[#E8922A] text-white shadow-md' : 'bg-black/20 text-white/50 hover:text-white hover:bg-black/40'
                        }`}
                      >
                        <Pin size={16} strokeWidth={2.5} className={achievement.isPinned ? 'fill-current' : ''} />
                      </button>
                    )}
                    {!achievement.earned && (
                      <div className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100/80 text-gray-400 shadow-sm">
                        <Lock size={14} strokeWidth={2.5} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'Маршруты' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-6"
          >
            <h3 className="text-lg mb-4">Мои маршруты</h3>
            {isStatsLoading ? (
              <LoadingZubrik text="Загрузка..." />
            ) : createdRoutes.length > 0 ? (
              createdRoutes.map((r) => <RouteCard key={r.id} route={r} />)
            ) : (
              <p className="text-center text-[#6B6B6B] py-12">Вы пока не создали ни одного маршрута</p>
            )}
          </motion.div>
        )}

        {activeTab === 'Избранное' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-6"
          >
            <h3 className="text-lg mb-4">Избранные маршруты</h3>
            {isStatsLoading ? (
              <LoadingZubrik text="Загрузка..." />
            ) : likedRoutes.length > 0 ? (
              likedRoutes.map((r) => <RouteCard key={r.id} route={r} />)
            ) : (
              <p className="text-center text-[#6B6B6B] py-12">Здесь будут ваши избранные маршруты</p>
            )}
          </motion.div>
        )}
      </div>
      
      <AnimatePresence>
        {showAdmin && <AdminScreen onClose={() => setShowAdmin(false)} />}
      </AnimatePresence>

      <AchievementModal 
        achievement={selectedAchievement} 
        onClose={() => setSelectedAchievement(null)} 
      />

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Выйти из аккаунта?"
        message="Вам потребуется заново ввести логин и пароль для входа."
        confirmText={logoutMutation.isPending ? "Выход..." : "Выйти"}
        onConfirm={() => {
          logoutMutation.mutate()
          setShowLogoutConfirm(false)
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}

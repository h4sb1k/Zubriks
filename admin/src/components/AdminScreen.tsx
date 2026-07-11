import { AnimatePresence,motion } from 'framer-motion'
import { ArrowLeft, Calendar, LogOut, MapPin, Route, Search, Settings, Trophy, Users } from 'lucide-react'
import { useMemo,useState } from 'react'

import { trpc } from '../lib/trpc'
import AchievementBuilder, { type AchievementEditData } from './AchievementBuilder'
import { DynamicIcon } from './DynamicIcon'
import LoadingZubrik from './LoadingZubrik'
import UserBuilder, { type UserEditData } from './UserBuilder'
import ZubrikBuilder, { type ZubrikEditData } from './ZubrikBuilder'
import RouteBuilder from './RouteBuilder'
import ConfirmModal from './ConfirmModal'

type AdminTab = 'stats' | 'users' | 'zubriks' | 'achievements' | 'routes'

export default function AdminScreen({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats')
  const [editingZubrik, setEditingZubrik] = useState<ZubrikEditData | null>(null)
  const [editingUser, setEditingUser] = useState<UserEditData | null>(null)
  const [editingAchievement, setEditingAchievement] = useState<AchievementEditData | null>(null)
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null)
  const [isBuildingZubrik, setIsBuildingZubrik] = useState(false)
  const [isBuildingAchievement, setIsBuildingAchievement] = useState(false)
  const [isBuildingRoute, setIsBuildingRoute] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data: stats, isLoading: isStatsLoading } = trpc.adminGetStats.useQuery()
  const { data: usersData, isLoading: isUsersLoading } = trpc.adminGetUsers.useQuery(undefined, { enabled: activeTab === 'users' })
  const { data: zubriksData, isLoading: isZubriksLoading } = trpc.adminGetZubriks.useQuery(undefined, { enabled: activeTab === 'zubriks' })
  const { data: achievementsData, isLoading: isAchievementsLoading } = trpc.adminGetAchievements.useQuery(undefined, { enabled: activeTab === 'achievements' })
  const { data: routesData, isLoading: isRoutesLoading } = trpc.adminGetRoutes.useQuery(undefined, { enabled: activeTab === 'routes' })
  const { data: me } = trpc.adminMe.useQuery()
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const logoutMutation = trpc.adminLogout.useMutation({
    onSuccess: () => {
      window.location.reload()
    }
  })
  
  const deleteRouteMutation = trpc.adminDeleteRoute.useMutation({
    onSuccess: () => {
      trpc.useUtils().adminGetRoutes.invalidate()
    }
  })

  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return []
    const lowerQ = searchQuery.toLowerCase()
    return usersData.users.filter(u => 
      (u.name?.toLowerCase().includes(lowerQ)) || 
      u.email.toLowerCase().includes(lowerQ)
    )
  }, [usersData, searchQuery])

  const filteredZubriks = useMemo(() => {
    if (!zubriksData?.zubriks) return []
    const lowerQ = searchQuery.toLowerCase()
    return zubriksData.zubriks.filter(z => 
      z.name.toLowerCase().includes(lowerQ) || 
      z.description?.toLowerCase().includes(lowerQ)
    )
  }, [zubriksData, searchQuery])

  const filteredAchievements = useMemo(() => {
    if (!achievementsData?.achievements) return []
    const lowerQ = searchQuery.toLowerCase()
    return achievementsData.achievements.filter(a => 
      a.name.toLowerCase().includes(lowerQ) || 
      a.description.toLowerCase().includes(lowerQ)
    )
  }, [achievementsData, searchQuery])

  const filteredRoutes = useMemo(() => {
    if (!routesData) return []
    const lowerQ = searchQuery.toLowerCase()
    return routesData.filter(r => 
      r.name.toLowerCase().includes(lowerQ) || 
      (r.description && r.description.toLowerCase().includes(lowerQ))
    )
  }, [routesData, searchQuery])

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#F5F2EB] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-safe-top pb-4 bg-white/90 backdrop-blur-xl border-b border-[#E5E3DD]/60 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] z-20 relative">
        
        {/* Row 1: Centered Title */}
        <div className="flex justify-center items-center w-full pt-2">
          <h1 className="text-[22px] sm:text-[26px] font-black text-[#1C1C1E] tracking-tight leading-none text-center">
            Панель администратора
          </h1>
        </div>

        {/* Row 2: Profile & Logout */}
        <div className="flex items-center justify-between w-full">
          
          {/* Left: User Profile */}
          <div className="flex items-center z-10 min-w-0 flex-shrink pr-4">
            {me && (
              <div className="flex items-center gap-2.5 bg-[#F5F2EB]/80 border border-[#E5E3DD] p-1.5 pr-4 rounded-full shadow-sm max-w-full">
                {me.avatarUrl ? (
                  <img src={me.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shadow-inner flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A3D2B] to-[#2A523D] flex items-center justify-center text-white text-[15px] font-bold shadow-inner flex-shrink-0">
                    {me.name?.[0]?.toUpperCase() || me.email[0].toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[14px] font-bold text-[#1C1C1E] leading-tight truncate">{me.name || me.email}</span>
                  <span className="text-[12px] font-bold text-[#1A3D2B] leading-tight opacity-80 mt-0.5 truncate">{me.role === 'admin' ? 'Администратор' : me.role}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Right: Logout Button */}
          <div className="flex items-center z-10 flex-shrink-0">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FFEFEF] text-[#FF3B30] hover:bg-[#FFD6D6] active:scale-95 active:bg-[#FFC4C4] transition-all border border-[#FF3B30]/10 shadow-sm"
              aria-label="Выйти"
            >
              <LogOut size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-5 overflow-x-auto scrollbar-hide bg-white shadow-sm border-b border-[#E5E3DD]">
        {[
          { id: 'stats', label: 'Обзор', icon: Settings },
          { id: 'users', label: 'Пользователи', icon: Users },
          { id: 'zubriks', label: 'Зубрики', icon: MapPin },
          { id: 'achievements', label: 'Достижения', icon: Trophy },
          { id: 'routes', label: 'Маршруты', icon: Route },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as AdminTab)
              setSearchQuery('')
            }}
            className={`flex items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-[#1A3D2B] text-white shadow-md' 
                : 'bg-[#F5F2EB] text-[#6B6B6B] hover:bg-[#E5E3DD]'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'stats' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)] flex flex-col">
              <div className="w-12 h-12 rounded-full bg-[#1A3D2B]/10 flex items-center justify-center text-[#1A3D2B] mb-3">
                <Users size={24} />
              </div>
              <span className="text-[32px] font-black text-[#1C1C1E]">{isStatsLoading ? '-' : stats?.users}</span>
              <span className="text-sm font-medium text-[#6B6B6B]">Пользователей</span>
            </div>
            
            <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)] flex flex-col">
              <div className="w-12 h-12 rounded-full bg-[#E8922A]/10 flex items-center justify-center text-[#E8922A] mb-3">
                <MapPin size={24} />
              </div>
              <span className="text-[32px] font-black text-[#1C1C1E]">{isStatsLoading ? '-' : stats?.zubriks}</span>
              <span className="text-sm font-medium text-[#6B6B6B]">Зубриков</span>
            </div>
            
            <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)] flex flex-col">
              <div className="w-12 h-12 rounded-full bg-[#34C759]/10 flex items-center justify-center text-[#34C759] mb-3">
                <Route size={24} />
              </div>
              <span className="text-[32px] font-black text-[#1C1C1E]">{isStatsLoading ? '-' : stats?.routes}</span>
              <span className="text-sm font-medium text-[#6B6B6B]">Маршрутов</span>
            </div>
            
            <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)] flex flex-col">
              <div className="w-12 h-12 rounded-full bg-[#FEA35A]/10 flex items-center justify-center text-[#FEA35A] mb-3">
                <Calendar size={24} />
              </div>
              <span className="text-[32px] font-black text-[#1C1C1E]">{isStatsLoading ? '-' : stats?.events}</span>
              <span className="text-sm font-medium text-[#6B6B6B]">Событий</span>
            </div>
          </motion.div>
        )}

        {(activeTab === 'users' || activeTab === 'zubriks' || activeTab === 'achievements') && (
          <div className="mb-4 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" size={20} />
             <input 
               type="text" 
               placeholder="Поиск..." 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full bg-white border-2 border-[#E5E3DD] rounded-full py-3 pl-12 pr-4 font-medium text-[#1C1C1E] focus:border-[#E8922A] focus:outline-none transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.02)]"
             />
          </div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {isUsersLoading ? (
              <LoadingZubrik text="Загрузка..." />
            ) : (
              filteredUsers.map(u => (
                <div 
                  key={u.id} 
                  onClick={() => setEditingUser(u as any)}
                  className="bg-white rounded-[20px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#E5E3DD]/60 flex items-center justify-between active:scale-[0.97] transition-all cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div>
                    <div className="font-bold text-[#1C1C1E] mb-1">{u.name || 'Аноним'}</div>
                    <div className="text-sm text-[#6B6B6B] mb-1">{u.email}</div>
                    <div className="text-xs text-[#1A3D2B] bg-[#1A3D2B]/10 inline-block px-2 py-0.5 rounded-full font-medium">
                      {u.role}
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'zubriks' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {isZubriksLoading ? (
              <LoadingZubrik text="Загрузка..." />
            ) : (
              filteredZubriks.map(z => (
                <div 
                  key={z.id} 
                  onClick={() => setEditingZubrik({
                    id: z.id,
                    name: z.name,
                    description: z.description,
                    latitude: z.latitude,
                    longitude: z.longitude,
                    imageUrl: z.imageUrl || undefined,
                  })}
                  className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#E5E3DD]/60 flex items-center gap-5 active:scale-[0.97] transition-all cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div
                    className="w-[84px] h-[84px] rounded-full flex items-center justify-center bg-[#F5F2EB] shadow-inner shrink-0 overflow-hidden border-[3px] border-white"
                  >
                    {z.imageUrl ? (
                      <img src={z.imageUrl} alt={z.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[40px] drop-shadow-sm">🦬</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="font-bold text-[17px] text-[#1C1C1E] mb-1 tracking-tight truncate">{z.name}</div>
                    <div className="text-[14px] text-[#6B6B6B] leading-snug line-clamp-2">{z.description}</div>
                  </div>
                </div>
              ))
            )}
            
            <button 
              onClick={() => setIsBuildingZubrik(true)}
              className="w-full bg-[#E8922A] text-white rounded-[20px] py-4 font-bold shadow-lg active:scale-95 transition-transform mt-4"
            >
              Добавить Зубрика
            </button>
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {isAchievementsLoading ? (
              <LoadingZubrik text="Загрузка..." />
            ) : (
              filteredAchievements.map(a => (
                <div 
                  key={a.id} 
                  onClick={() => setEditingAchievement(a)}
                  className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#E5E3DD]/60 flex items-center gap-5 active:scale-[0.97] transition-all cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div
                    className="w-[84px] h-[84px] rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 shadow-inner shrink-0 overflow-hidden border-[3px] border-white p-[2px]"
                  >
                    {a.imageUrl ? (
                      <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover rounded-full bg-white" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl">
                        <DynamicIcon name={a.icon || 'Trophy'} size={36} className="text-[#E8922A]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-[18px] text-[#1C1C1E] leading-tight mb-1 truncate">{a.name}</div>
                    <div className="text-[14px] text-[#6B6B6B] leading-snug line-clamp-2">{a.description}</div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingAchievement(a)
                    }}
                    className="w-10 h-10 rounded-full bg-[#F5F2EB] flex items-center justify-center text-[#E8922A] hover:bg-[#E8922A] hover:text-white transition-colors"
                  >
                    <DynamicIcon name="Settings" size={20} />
                  </button>
                </div>
              ))
            )}
            <button 
              onClick={() => setIsBuildingAchievement(true)}
              className="w-full bg-[#E8922A] text-white rounded-[20px] py-4 font-bold shadow-lg active:scale-95 transition-transform mt-4"
            >
              Новое достижение
            </button>
          </motion.div>
        )}

        {activeTab === 'routes' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pb-20">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]" size={20} />
              <input 
                type="text"
                placeholder="Поиск маршрутов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white rounded-full py-3.5 pl-12 pr-4 shadow-sm border border-[#E5E3DD]/60 outline-none focus:border-[#E8922A] focus:ring-2 focus:ring-[#E8922A]/20 transition-all font-medium text-[#1C1C1E]"
              />
            </div>
            
            {isRoutesLoading ? (
              <LoadingZubrik text="Загрузка..." />
            ) : !filteredRoutes.length ? (
              <div className="text-center text-[#6B6B6B] p-8">Ничего не найдено</div>
            ) : (
              filteredRoutes.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => setEditingRouteId(r.id)}
                  className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#E5E3DD]/60 flex items-center gap-5 active:scale-[0.97] transition-all cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div
                    className="w-[84px] h-[84px] rounded-full flex items-center justify-center shadow-inner shrink-0 overflow-hidden border-[3px] border-white p-[2px]"
                    style={{ backgroundColor: r.imageColor || '#1A3D2B' }}
                  >
                    <div className="w-full h-full rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: r.imageColor || '#1A3D2B' }}>
                      <DynamicIcon name={r.icon || 'MapPin'} size={36} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="font-black text-[18px] text-[#1C1C1E] leading-tight mb-1 truncate">{r.name}</div>
                    <div className="flex items-center gap-3 text-[13px] text-[#6B6B6B] mt-1 font-medium">
                      <span className="flex items-center gap-1 bg-[#F5F2EB] px-2 py-1 rounded-md">
                        <MapPin size={12} className="text-[#E8922A]"/> {r.stops} точек
                      </span>
                      {r.isMain && (
                        <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded-md">
                          ⭐ Главный
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingRouteId(r.id)
                    }}
                    className="w-10 h-10 rounded-full bg-[#F5F2EB] flex items-center justify-center text-[#E8922A] hover:bg-[#E8922A] hover:text-white transition-colors shrink-0"
                  >
                    <DynamicIcon name="Settings" size={20} />
                  </button>
                </div>
              ))
            )}
            <button 
              onClick={() => setIsBuildingRoute(true)}
              className="w-full bg-[#E8922A] text-white rounded-[20px] py-4 font-bold shadow-lg active:scale-95 transition-transform mt-4"
            >
              Новый маршрут
            </button>
          </motion.div>
        )}
      </div>

      {isBuildingZubrik && (
        <ZubrikBuilder onClose={() => setIsBuildingZubrik(false)} />
      )}

      {editingZubrik && (
        <ZubrikBuilder 
          initialData={editingZubrik} 
          onClose={() => setEditingZubrik(null)} 
        />
      )}

      <AnimatePresence>
        {isBuildingRoute && (
          <RouteBuilder onClose={() => setIsBuildingRoute(false)} />
        )}
        {editingRouteId && (
          <RouteBuilder 
            editRouteId={editingRouteId} 
            onClose={() => setEditingRouteId(null)} 
          />
        )}
        {editingUser && (
          <UserBuilder 
            initialData={editingUser as UserEditData}
            onClose={() => setEditingUser(null)}
          />
        )}
        {isBuildingAchievement && (
          <AchievementBuilder onClose={() => setIsBuildingAchievement(false)} />
        )}
        {editingAchievement && (
          <AchievementBuilder 
            initialData={editingAchievement}
            onClose={() => setEditingAchievement(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={() => logoutMutation.mutate()}
        title="Выйти из профиля?"
        message="Вы уверены, что хотите выйти из панели управления?"
        confirmText="Выйти"
      />
    </motion.div>
  )
}

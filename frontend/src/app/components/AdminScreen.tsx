import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Route, Settings,Users } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '../lib/trpc'
import ZubrikBuilder, { type ZubrikEditData } from './ZubrikBuilder'

type AdminTab = 'stats' | 'users' | 'zubriks'

export default function AdminScreen({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats')
  const [editingZubrik, setEditingZubrik] = useState<ZubrikEditData | null>(null)
  const [isBuildingZubrik, setIsBuildingZubrik] = useState(false)
  
  const { data: stats, isLoading: isStatsLoading } = trpc.adminGetStats.useQuery()
  const { data: usersData, isLoading: isUsersLoading } = trpc.adminGetUsers.useQuery(undefined, { enabled: activeTab === 'users' })
  const { data: zubriksData, isLoading: isZubriksLoading } = trpc.adminGetZubriks.useQuery(undefined, { enabled: activeTab === 'zubriks' })

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#F5F2EB] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-safe-top pb-4 bg-white border-b border-[#E5E3DD] flex items-center justify-between shadow-sm z-10 relative">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F5F2EB] active:scale-95 transition-all text-[#1C1C1E]"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Панель управления</h1>
        <div className="w-10 h-10" /> {/* Spacer */}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-5 overflow-x-auto scrollbar-hide bg-white shadow-sm border-b border-[#E5E3DD]">
        {[
          { id: 'stats', label: 'Обзор', icon: Settings },
          { id: 'users', label: 'Пользователи', icon: Users },
          { id: 'zubriks', label: 'Зубрики', icon: MapPin },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
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

        {activeTab === 'users' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {isUsersLoading ? (
              <div className="text-center text-[#6B6B6B] mt-10">Загрузка...</div>
            ) : (
              usersData?.users.map(u => (
                <div key={u.id} className="bg-white rounded-[20px] p-4 shadow-sm flex items-center justify-between">
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
              <div className="text-center text-[#6B6B6B] mt-10">Загрузка...</div>
            ) : (
              zubriksData?.zubriks.map(z => (
                <div 
                  key={z.id} 
                  onClick={() => setEditingZubrik({
                    id: z.id,
                    name: z.name,
                    description: z.description,
                    latitude: z.latitude,
                    longitude: z.longitude,
                    imageColor: z.imageColor || undefined,
                    imageUrl: z.imageUrl || undefined
                  })}
                  className="bg-white rounded-[20px] p-4 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div 
                    className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: z.imageColor + '20' }}
                  >
                    {z.imageUrl ? (
                      <img src={z.imageUrl} alt={z.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="text-2xl">🦬</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-[#1C1C1E] mb-1">{z.name}</div>
                    <div className="text-sm text-[#6B6B6B] line-clamp-2">{z.description}</div>
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
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, Crown, Trophy } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '../lib/trpc'
import { DynamicIcon } from './DynamicIcon'
import PublicProfileScreen from './PublicProfileScreen'

// --- Helper Components ---
function PodiumItem({ user, rank, delay, onClick }: { user: any; rank: number; delay: number; onClick: () => void }) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;
  
  const heightClass = isFirst ? 'h-[110px]' : isSecond ? 'h-[80px]' : 'h-[60px]';
  const avatarSize = isFirst ? 'w-16 h-16 border-[3px]' : 'w-12 h-12 border-2';
  const badgeColor = isFirst ? 'bg-gradient-to-br from-[#FFE066] to-[#F59E0B] text-amber-950' : 
                     isSecond ? 'bg-gradient-to-br from-[#F1F5F9] to-[#94A3B8] text-slate-900' : 
                     'bg-gradient-to-br from-[#FDBA74] to-[#C2410C] text-orange-950';

  const podiumBg = isFirst ? 'bg-gradient-to-t from-[#F59E0B]/80 via-[#FBBF24]/40 to-[#FCD34D]/20 border-t-[3px] border-[#FBBF24] shadow-[0_-8px_30px_rgba(245,158,11,0.3),inset_0_4px_15px_rgba(255,255,255,0.4)]' : 
                   isSecond ? 'bg-gradient-to-t from-[#94A3B8]/80 via-[#CBD5E1]/40 to-[#E2E8F0]/20 border-t-[3px] border-[#CBD5E1] shadow-[0_-5px_20px_rgba(148,163,184,0.2),inset_0_4px_15px_rgba(255,255,255,0.4)]' : 
                   'bg-gradient-to-t from-[#C2410C]/80 via-[#EA580C]/40 to-[#F97316]/20 border-t-[3px] border-[#F97316] shadow-[0_-5px_20px_rgba(234,88,12,0.2),inset_0_4px_15px_rgba(255,255,255,0.3)]';

  const avatarGlow = isFirst ? 'shadow-[0_0_20px_rgba(245,158,11,0.5)] border-[#FCD34D]' : 
                     isSecond ? 'shadow-[0_0_15px_rgba(148,163,184,0.4)] border-[#E2E8F0]' : 
                     'shadow-[0_0_15px_rgba(234,88,12,0.4)] border-[#FDBA74]';

  return (
    <motion.button
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 120, damping: 14 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-end relative group"
    >
      {/* Crown */}
      <div className="absolute -top-6 z-20 flex justify-center w-full">
        {isFirst && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.3, type: 'spring' }}
          >
            <Crown className="text-[#FCD34D] drop-shadow-[0_0_12px_rgba(245,158,11,0.9)] fill-[#F59E0B]" size={36} />
          </motion.div>
        )}
      </div>
      
      {/* Avatar */}
      <div className={`relative z-10 ${avatarSize} rounded-full overflow-hidden bg-[#1A3D2B] ${avatarGlow} group-hover:border-white transition-colors`}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><DynamicIcon name="User" size={isFirst ? 28 : 20} className="text-white/60" /></div>
        )}
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${badgeColor} text-[10px] font-black px-2 py-0 rounded-full z-20 shadow-md border border-white/30`}>
          {rank}
        </div>
      </div>
      
      <div className="mt-3 mb-2 text-center w-full px-1">
        <h3 className="text-white font-bold text-[13px] truncate drop-shadow-md">{user.name}</h3>
        <p className="text-[#FFD700] font-black flex items-center justify-center gap-1 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)] mt-0.5">
          <div className="w-5 h-5 bg-[#FFD700]" style={{ maskImage: 'url(/images/ZUBR.svg)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url(/images/ZUBR.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
          <span className="text-[13px]">{user.zubriksCount}</span>
        </p>
      </div>

      {/* Podium Block */}
      <div className={`w-full rounded-t-[20px] ${heightClass} ${podiumBg} backdrop-blur-xl relative overflow-hidden flex flex-col items-center justify-start pt-3`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        <span className="text-white/80 font-black text-5xl drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">{rank}</span>
      </div>
    </motion.button>
  );
}

export default function LeaderboardScreen({ onClose }: { onClose: () => void }) {
  const { data, isLoading, isError, error } = trpc.getLeaderboard.useQuery()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const top3 = data?.leaderboard.slice(0, 3) || [];
  const rest = data?.leaderboard.slice(3) || [];

  return (
    <>
      <div className="fixed inset-0 bg-[#FAFAF7] z-[90] flex flex-col animate-in slide-in-from-bottom overflow-hidden">
        
        {/* --- Premium Header & Podium --- */}
        <div className="relative pt-6 px-5 bg-gradient-to-b from-[#0F2419] to-[#1A3D2B] shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex-shrink-0 rounded-b-[32px] z-20">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-[32px]">
            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-[#E8922A]/15 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-[#4ade80]/10 rounded-full blur-[80px]" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 left-5 z-20 flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={20} />
            <span>Назад</span>
          </button>

          <div className="flex flex-col items-center mt-10 text-white relative z-10">
            <h1 className="text-2xl font-black mb-1 drop-shadow-md">Топ исследователей</h1>
            <p className="text-white/60 text-[13px] text-center max-w-[250px] mb-8 font-medium">
              Соревнуйся с другими искателями Зубриков
            </p>
          </div>

          {/* Podium */}
          {!isLoading && !isError && top3.length > 0 && (
            <div className="flex items-end justify-center gap-2 max-w-sm mx-auto relative z-10 px-2">
              {top3[1] && <PodiumItem user={top3[1]} rank={2} delay={0.2} onClick={() => setSelectedUserId(top3[1].id)} />}
              {top3[0] && <PodiumItem user={top3[0]} rank={1} delay={0.1} onClick={() => setSelectedUserId(top3[0].id)} />}
              {top3[2] && <PodiumItem user={top3[2]} rank={3} delay={0.3} onClick={() => setSelectedUserId(top3[2].id)} />}
            </div>
          )}
          
          {/* Skeleton for Podium */}
          {isLoading && (
            <div className="flex items-end justify-center gap-2 max-w-sm mx-auto relative z-10 px-2 h-[220px] pb-0">
               <div className="flex-1 bg-white/5 animate-pulse h-[80px] rounded-t-2xl" />
               <div className="flex-1 bg-white/10 animate-pulse h-[110px] rounded-t-2xl" />
               <div className="flex-1 bg-white/5 animate-pulse h-[60px] rounded-t-2xl" />
            </div>
          )}
        </div>

        {/* --- List Section --- */}
        <div className="flex-1 overflow-y-auto px-5 py-6 pb-24 bg-[#FAFAF7] relative z-10 -mt-6 pt-10">
          {isError ? (
            <div className="text-center text-red-500 py-12 bg-red-50 rounded-2xl mx-4">
              Ошибка загрузки рейтинга: {error?.message}
            </div>
          ) : data?.leaderboard.length === 0 ? (
            <div className="text-center text-[#6B6B6B] py-12 bg-white rounded-3xl border border-[#E5E3DD] shadow-sm mx-4">
              <Trophy className="mx-auto mb-3 text-[#E8922A]/50" size={32} />
              Рейтинг пока пуст. Станьте первым!
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05, delayChildren: 0.4 } },
                hidden: {},
              }}
              className="flex flex-col gap-3"
            >
              {rest.map((user, index) => {
                const rank = index + 4; // Since top3 are 1,2,3
                return (
                  <motion.button
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0, transition: { ease: 'easeOut', duration: 0.3 } },
                    }}
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    whileHover={{ scale: 1.015, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative w-full bg-white rounded-[20px] p-4 flex items-center gap-4 text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#E5E3DD] hover:border-[#E8922A]/40 hover:shadow-md transition-all"
                  >
                    <div className="w-6 flex justify-center items-center">
                      <span className="font-bold text-[#A1A1AA] text-[15px] group-hover:text-[#E8922A] transition-colors">{rank}</span>
                    </div>

                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1A3D2B] flex items-center justify-center flex-shrink-0 border border-black/5 shadow-sm">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <DynamicIcon name="User" size={24} className="text-white/50" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate text-[15px] text-[#1C1C1E] group-hover:text-[#E8922A] transition-colors">
                        {user.name}
                      </h3>
                      <div className="flex gap-3 mt-1 font-medium items-center">
                        <span className="flex items-center gap-1.5 bg-[#FAFAF7] px-2.5 py-1 rounded-lg">
                          <div className="w-6 h-6 bg-[#E8922A]" style={{ maskImage: 'url(/images/ZUBR.svg)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url(/images/ZUBR.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                          <span className="text-sm font-bold text-[#4a4a4a]">{user.zubriksCount}</span>
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#FAFAF7] px-2.5 py-1 rounded-lg">
                          <DynamicIcon name="Route" size={18} className="text-[#4ade80]" />
                          <span className="text-sm font-bold text-[#4a4a4a]">{user.routesCount}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-[#E8922A] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                      <ChevronRight size={20} />
                    </div>
                  </motion.button>
                )
              })}
              
              {!isLoading && rest.length === 0 && top3.length > 0 && (
                <div className="text-center py-8 text-[#A1A1AA] text-sm font-medium">
                  Больше исследователей пока нет.
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {selectedUserId && (
        <PublicProfileScreen userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </>
  )
}

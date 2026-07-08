import { motion } from 'framer-motion'
import { ArrowLeft, Crown, Medal, Trophy } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '../lib/trpc'
import PublicProfileScreen from './PublicProfileScreen'

export default function LeaderboardScreen({ onClose }: { onClose: () => void }) {
  const { data, isLoading, isError, error } = trpc.getLeaderboard.useQuery()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  return (
    <>
      <div className="fixed inset-0 bg-[#FAFAF7] z-[90] flex flex-col animate-in slide-in-from-bottom overflow-hidden">
        <div className="px-5 pt-6 pb-6 bg-[#1A3D2B] relative shadow-md">
          <button
            onClick={onClose}
            className="absolute top-6 left-5 flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={20} />
            <span>Назад</span>
          </button>

          <div className="flex flex-col items-center mt-6 text-white">
            <div className="w-16 h-16 bg-[#E8922A] rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(232,146,42,0.4)]">
              <Trophy size={32} className="text-white drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Рейтинг исследователей</h1>
            <p className="text-white/70 text-sm text-center max-w-[250px]">
              Находите зубриков и проходите маршруты, чтобы подняться в топ
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 pb-24">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#E8922A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500 py-12">
              Ошибка загрузки рейтинга: {error?.message}
            </div>
          ) : data?.leaderboard.length === 0 ? (
            <div className="text-center text-[#6B6B6B] py-12">
              Рейтинг пока пуст. Станьте первым!
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } },
                hidden: {},
              }}
              className="flex flex-col gap-3"
            >
              {data?.leaderboard.map((user, index) => {
                const isTop1 = index === 0
                const isTop2 = index === 1
                const isTop3 = index === 2

                return (
                  <motion.button
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { ease: [0.16, 1, 0.3, 1], duration: 0.5 },
                      },
                    }}
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`relative w-full rounded-[24px] p-4 flex items-center gap-4 transition-transform active:scale-95 text-left
                      ${
                        isTop1
                          ? 'bg-gradient-to-r from-[#FFF9E6] to-[#FFE082] shadow-[0_8px_20px_rgba(232,146,42,0.15)] border border-[#FFE082]'
                          : isTop2
                          ? 'bg-gradient-to-r from-[#F5F7FA] to-[#E2E8F0] shadow-sm border border-[#E2E8F0]'
                          : isTop3
                          ? 'bg-gradient-to-r from-[#FFF5F0] to-[#FFDBCF] shadow-sm border border-[#FFDBCF]'
                          : 'bg-white shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-[#E5E3DD]'
                      }
                    `}
                  >
                    <div className="w-8 flex justify-center items-center">
                      {isTop1 ? (
                        <Crown className="text-[#E8922A] drop-shadow-sm" size={24} />
                      ) : isTop2 ? (
                        <Medal className="text-[#94A3B8]" size={24} />
                      ) : isTop3 ? (
                        <Medal className="text-[#D97757]" size={24} />
                      ) : (
                        <span className="font-bold text-[#6B6B6B] text-lg">{index + 1}</span>
                      )}
                    </div>

                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1A3D2B] flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-white">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🦬</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold truncate text-[15px] ${
                          isTop1 ? 'text-[#9A5C00]' : 'text-[#1C1C1E]'
                        }`}
                      >
                        {user.name}
                      </h3>
                      <div className="flex gap-3 text-xs text-[#6B6B6B] mt-0.5 font-medium">
                        <span className="flex items-center gap-1">
                          <span className="text-lg leading-none">🦬</span> {user.zubriksCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-lg leading-none">📍</span> {user.routesCount}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
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

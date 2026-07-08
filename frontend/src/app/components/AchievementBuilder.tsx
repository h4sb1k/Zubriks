import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import { AnimatePresence,motion } from 'framer-motion'
import { ArrowLeft, ImagePlus, SmilePlus,Trash2, Trophy } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '../lib/trpc'
import ConfirmModal from './ConfirmModal'

export type AchievementEditData = {
  id: string
  name: string
  description: string
  emoji: string | null
  imageUrl: string
}

export default function AchievementBuilder({ 
  initialData, 
  onClose 
}: { 
  initialData?: AchievementEditData 
  onClose: () => void 
}) {
  const utils = trpc.useUtils()
  
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [emoji, setEmoji] = useState(initialData?.emoji || '🏆')
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const createAchievement = trpc.adminCreateAchievement.useMutation({
    onSuccess: () => {
      utils.adminGetAchievements.invalidate()
      onClose()
    },
    onError: (err) => alert('Ошибка при создании: ' + err.message)
  })

  const updateAchievement = trpc.adminUpdateAchievement.useMutation({
    onSuccess: () => {
      utils.adminGetAchievements.invalidate()
      onClose()
    },
    onError: (err) => alert('Ошибка при обновлении: ' + err.message)
  })

  const deleteAchievement = trpc.adminDeleteAchievement.useMutation({
    onSuccess: () => {
      utils.adminGetAchievements.invalidate()
      onClose()
    },
    onError: (err) => alert('Ошибка при удалении: ' + err.message)
  })

  const isPending = createAchievement.isPending || updateAchievement.isPending || deleteAchievement.isPending
  const isValid = name.trim() && description.trim()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!isValid) return
    if (!imageUrl.trim()) {
      alert('Ошибка: необходимо загрузить иконку достижения!')
      return
    }

    if (initialData) {
      updateAchievement.mutate({
        id: initialData.id,
        name,
        description,
        emoji,
        imageUrl,
      })
    } else {
      createAchievement.mutate({
        name,
        description,
        emoji,
        imageUrl,
      })
    }
  }

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-[#F5F2EB] flex flex-col"
    >
      <div className="px-5 pt-safe-top pb-4 bg-white border-b border-[#E5E3DD] flex items-center justify-between shadow-sm shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F5F2EB] active:scale-95 transition-all text-[#1C1C1E]"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">
          {initialData ? 'Редактировать' : 'Новое достижение'}
        </h1>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Название</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Например: Легенда Орла"
            className="w-full bg-white border-2 border-[#E5E3DD] rounded-[20px] px-5 py-4 text-[16px] focus:border-[#E8922A] focus:outline-none transition-colors text-[#1C1C1E] font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Описание</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Что нужно сделать для получения?"
            rows={3}
            className="w-full bg-white border-2 border-[#E5E3DD] rounded-[20px] px-5 py-4 text-[16px] focus:border-[#E8922A] focus:outline-none transition-colors text-[#1C1C1E] resize-none"
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Эмодзи (для карточек)</label>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-20 bg-white border-2 border-[#E5E3DD] rounded-[20px] px-5 py-4 text-2xl focus:border-[#E8922A] focus:outline-none transition-colors flex items-center justify-center hover:bg-[#F5F2EB] active:scale-95"
          >
            {emoji}
          </button>
          
          <AnimatePresence>
            {showEmojiPicker && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowEmojiPicker(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute z-50 top-full mt-2 left-0 shadow-2xl rounded-2xl overflow-hidden"
                >
                  <EmojiPicker 
                    onEmojiClick={(emojiData: EmojiClickData) => {
                      setEmoji(emojiData.emoji)
                      setShowEmojiPicker(false)
                    }}
                    autoFocusSearch={false}
                    theme={Theme.LIGHT}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Изображение (Иконка)</label>
          
          <label className={`relative flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
            imageUrl 
              ? 'w-full min-h-[220px] bg-[#F5F2EB] rounded-[24px] p-4 border border-[#E5E3DD] shadow-inner group'
              : 'w-full bg-white rounded-[24px] p-8 flex-col shadow-sm border-2 border-dashed border-[#E5E3DD] hover:border-[#E8922A] hover:bg-[#FFF9E6]/30 active:scale-[0.99] group'
          }`}>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {imageUrl ? (
              <>
                <div className="w-[180px] h-[180px] bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 rounded-full flex items-center justify-center p-1.5 drop-shadow-xl transition-transform group-hover:scale-[1.02]">
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover rounded-full bg-white" />
                </div>
                <div className="absolute inset-0 bg-[#1C1C1E]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-[20px] font-bold text-[16px] text-[#1C1C1E] shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <ImagePlus size={20} className="text-[#E8922A]" />
                    Заменить иконку
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    setImageUrl('')
                  }}
                  className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-red-500 hover:text-red-600 hover:bg-white hover:scale-105 active:scale-95 transition-all z-10"
                  title="Удалить"
                >
                  <Trash2 size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-[#F5F2EB] group-hover:bg-[#FFF9E6] rounded-full flex items-center justify-center transition-colors mb-3">
                  <Trophy size={28} className="text-[#6B6B6B] group-hover:text-[#E8922A] transition-colors" />
                </div>
                <span className="font-bold text-[#6B6B6B] group-hover:text-[#E8922A] transition-colors">Загрузить иконку достижения</span>
              </>
            )}
          </label>
        </div>
      </div>

      <div className="p-5 bg-white border-t border-[#E5E3DD] shrink-0 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={!isValid || isPending}
          className="w-full bg-[#E8922A] text-white rounded-[24px] py-4 font-bold disabled:opacity-50 shadow-lg active:scale-95 transition-transform text-[16px]"
        >
          {isPending ? 'Сохранение...' : (initialData ? 'Применить изменения' : 'Создать достижение')}
        </button>

        {initialData && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteAchievement.isPending}
            className="w-full mt-3 bg-red-500 text-white rounded-[24px] py-4 flex justify-center items-center gap-2 font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50 text-[16px]"
          >
            <Trash2 size={20} />
            {deleteAchievement.isPending ? 'Удаление...' : 'Удалить достижение'}
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Удалить достижение?"
        message="Вы уверены, что хотите удалить это достижение? Прогресс пользователей по нему также будет удален."
        confirmText={deleteAchievement.isPending ? "Удаление..." : "Удалить"}
        onConfirm={() => {
          if (initialData) {
            deleteAchievement.mutate({ id: initialData.id })
          }
          setShowDeleteConfirm(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </motion.div>
  )
}

import { AnimatePresence,motion } from 'framer-motion'
import { ArrowLeft, ImagePlus, SmilePlus,Trash2, Trophy } from 'lucide-react'
import { useState } from 'react'
import React from 'react'

import { trpc } from '../lib/trpc'
import ConfirmModal from './ConfirmModal'
import { DynamicIcon } from './DynamicIcon'
import { IconPicker } from './IconPicker'

export type AchievementEditData = {
  id: string
  name: string
  description: string
  icon: string | null
  imageUrl: string
  conditionType: string
  conditionTarget: string | null
  conditionCount: number
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
  const [icon, setIcon] = useState(initialData?.icon || 'Trophy')
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  
  const [conditionType, setConditionType] = useState(initialData?.conditionType || 'MANUAL')
  const [conditionTarget, setConditionTarget] = useState<string | null>(initialData?.conditionTarget || null)
  const [conditionCount, setConditionCount] = useState(initialData?.conditionCount || 1)
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)

  // Получаем список зубриков для дропдауна SPECIFIC_ZUBRIK
  const { data: zubriksData } = trpc.adminGetZubriksList.useQuery(undefined, {
    enabled: conditionType === 'SPECIFIC_ZUBRIK'
  })

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

  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setIsUploading(true)
    try {
      // The proxy in vite.config.ts will route this to the backend
      const res = await fetch('/admin-api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const data = await res.json()
      setImageUrl(data.url)
    } catch (err) {
      alert('Ошибка при загрузке картинки. Проверьте размер и формат.')
      console.error(err)
    } finally {
      setIsUploading(false)
    }
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
        icon,
        imageUrl,
        conditionType,
        conditionTarget,
        conditionCount,
      })
    } else {
      createAchievement.mutate({
        name,
        description,
        icon,
        imageUrl,
        conditionType,
        conditionTarget,
        conditionCount,
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
          <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Иконка (для карточек)</label>
          <button
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="w-20 bg-white border-2 border-[#E5E3DD] rounded-[20px] px-5 py-4 text-2xl focus:border-[#E8922A] focus:outline-none transition-colors flex items-center justify-center hover:bg-[#F5F2EB] active:scale-95"
          >
            <DynamicIcon name={icon || 'Trophy'} size={32} />
          </button>
          
          <AnimatePresence>
            {showIconPicker && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowIconPicker(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute z-50 top-full mt-2 left-0 shadow-2xl rounded-2xl overflow-hidden"
                >
                  <IconPicker 
                    onIconSelect={(iconName) => {
                      setIcon(iconName)
                      setShowIconPicker(false)
                    }}
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

        {/* УСЛОВИЯ ПОЛУЧЕНИЯ */}
        <div className="bg-[#F5F2EB] -mx-5 px-5 py-6 space-y-5 border-y border-[#E5E3DD]">
          <h2 className="text-[18px] font-bold text-[#1C1C1E] flex items-center gap-2">
            <Trophy size={20} className="text-[#E8922A]" /> Условие получения
          </h2>
          
          <div>
            <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Тип условия</label>
            <div className="relative">
              <select
                value={conditionType}
                onChange={e => {
                  setConditionType(e.target.value)
                  // Сбрасываем значения при смене типа
                  if (e.target.value !== 'SPECIFIC_ZUBRIK') setConditionTarget(null)
                  if (['MANUAL', 'ZUBRIK_ALL', 'MAIN_ROUTE_COMPLETE'].includes(e.target.value)) setConditionCount(1)
                }}
                className="w-full bg-white border-2 border-[#E5E3DD] rounded-[20px] px-5 py-4 text-[16px] focus:border-[#E8922A] focus:outline-none transition-colors text-[#1C1C1E] font-medium appearance-none"
              >
                <option value="MANUAL">Выдаётся вручную (без автоматики)</option>
                <option value="ZUBRIK_COUNT">Найти определённое количество зубриков</option>
                <option value="ZUBRIK_ALL">Найти всех зубриков в городе</option>
                <option value="SPECIFIC_ZUBRIK">Найти конкретного зубрика</option>
                <option value="ROUTE_COMPLETE">Пройти определённое количество маршрутов</option>
                <option value="ROUTE_CREATE">Создать определённое количество маршрутов</option>
                <option value="MAIN_ROUTE_COMPLETE">Завершить главный тур "Зубрики"</option>
              </select>
              <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {['ZUBRIK_COUNT', 'ROUTE_COMPLETE', 'ROUTE_CREATE'].includes(conditionType) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2 mt-1">
                  Необходимое количество
                </label>
                <input
                  type="number"
                  min="1"
                  value={conditionCount}
                  onChange={e => setConditionCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border-2 border-[#E5E3DD] rounded-[20px] px-5 py-4 text-[16px] focus:border-[#E8922A] focus:outline-none transition-colors text-[#1C1C1E] font-bold"
                />
              </motion.div>
            )}

            {conditionType === 'SPECIFIC_ZUBRIK' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2 mt-1">
                  Выберите зубрика
                </label>
                <div className="relative">
                  <select
                    value={conditionTarget || ''}
                    onChange={e => setConditionTarget(e.target.value || null)}
                    className="w-full bg-white border-2 border-[#E5E3DD] rounded-[20px] px-5 py-4 text-[16px] focus:border-[#E8922A] focus:outline-none transition-colors text-[#1C1C1E] font-medium appearance-none"
                  >
                    <option value="" disabled>-- Не выбран --</option>
                    {zubriksData?.zubriks.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

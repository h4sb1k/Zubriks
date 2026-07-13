import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Shield,ShieldAlert, Trash2, User } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '../lib/trpc'
import ConfirmModal from './ConfirmModal'

export type UserEditData = {
  id: string
  name: string | null
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: Date | string
  avatarUrl: string | null
}

export default function UserBuilder({ 
  initialData, 
  onClose 
}: { 
  initialData: UserEditData
  onClose: () => void 
}) {
  const utils = trpc.useUtils()
  
  const [name, setName] = useState(initialData.name || '')
  const [role, setRole] = useState<'USER' | 'ADMIN'>(initialData.role)
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRoleConfirm, setShowRoleConfirm] = useState(false)
  const [pendingRole, setPendingRole] = useState<'USER' | 'ADMIN' | null>(null)

  const updateUser = trpc.adminUpdateUser.useMutation({
    onSuccess: () => {
      utils.adminGetUsers.invalidate()
      onClose()
    },
    onError: (err) => alert('Ошибка: ' + err.message)
  })

  const deleteUser = trpc.adminDeleteUser.useMutation({
    onSuccess: () => {
      utils.adminGetUsers.invalidate()
      onClose()
    },
    onError: (err) => alert('Ошибка при удалении: ' + err.message)
  })

  const handleSubmit = () => {
    updateUser.mutate({
      id: initialData.id,
      name: name.trim() || undefined,
      role
    })
  }

  const handleRoleChange = (newRole: 'USER' | 'ADMIN') => {
    if (initialData.role === 'ADMIN' && newRole === 'USER') {
      setPendingRole(newRole)
      setShowRoleConfirm(true)
    } else {
      setRole(newRole)
    }
  }

  const confirmRoleChange = () => {
    if (pendingRole) {
      setRole(pendingRole)
    }
    setShowRoleConfirm(false)
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
        <h1 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Редактирование</h1>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Info Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E5E3DD]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#F5F2EB] rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm">
              {initialData.avatarUrl ? (
                <img src={initialData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-[#6B6B6B]" />
              )}
            </div>
            <div>
              <div className="text-sm text-[#6B6B6B] mb-1">ID пользователя</div>
              <div className="font-mono text-xs text-[#1C1C1E] bg-[#F5F2EB] px-2 py-1 rounded-md">
                {initialData.id}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">
                <Mail size={16} /> Email
              </label>
              <div className="w-full bg-[#F5F2EB] rounded-[20px] px-5 py-4 text-[16px] text-[#6B6B6B] cursor-not-allowed">
                {initialData.email}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">
                <User size={16} /> Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Имя пользователя"
                className="w-full bg-white border-2 border-[#E5E3DD] rounded-[20px] px-5 py-4 text-[16px] focus:border-[#E8922A] focus:outline-none transition-colors text-[#1C1C1E] shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Role Selector */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-3">
            <Shield size={16} /> Роль в системе
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRoleChange('USER')}
              className={`p-4 rounded-[20px] border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                role === 'USER'
                  ? 'border-[#1A3D2B] bg-[#1A3D2B]/10 text-[#1A3D2B]'
                  : 'border-[#E5E3DD] bg-white text-[#6B6B6B] hover:border-[#1A3D2B]/50'
              }`}
            >
              <User size={24} />
              <span className="font-bold">Пользователь</span>
            </button>
            <button
              onClick={() => handleRoleChange('ADMIN')}
              className={`p-4 rounded-[20px] border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                role === 'ADMIN'
                  ? 'border-[#E8922A] bg-[#E8922A]/10 text-[#E8922A]'
                  : 'border-[#E5E3DD] bg-white text-[#6B6B6B] hover:border-[#E8922A]/50'
              }`}
            >
              <ShieldAlert size={24} />
              <span className="font-bold">Администратор</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 bg-white border-t border-[#E5E3DD] shrink-0 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={updateUser.isPending}
          className="w-full bg-[#E8922A] text-white rounded-[24px] py-4 font-bold disabled:opacity-50 shadow-lg active:scale-95 transition-transform text-[16px]"
        >
          {updateUser.isPending ? 'Сохранение...' : 'Сохранить изменения'}
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteUser.isPending}
          className="w-full mt-3 bg-red-500 text-white rounded-[24px] py-4 flex justify-center items-center gap-2 font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50 text-[16px]"
        >
          <Trash2 size={20} />
          {deleteUser.isPending ? 'Удаление...' : 'Удалить пользователя'}
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Удалить пользователя?"
        message={`Вы уверены, что хотите удалить ${initialData.email}? Это действие необратимо.`}
        confirmText={deleteUser.isPending ? "Удаление..." : "Удалить"}
        onConfirm={() => {
          deleteUser.mutate({ id: initialData.id })
          setShowDeleteConfirm(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmModal
        isOpen={showRoleConfirm}
        title="Снять права администратора?"
        message="Вы уверены, что хотите забрать права администратора у этого пользователя? Он потеряет доступ к панели управления."
        confirmText="Да, понизить"
        onConfirm={confirmRoleChange}
        onCancel={() => setShowRoleConfirm(false)}
      />
    </motion.div>
  )
}

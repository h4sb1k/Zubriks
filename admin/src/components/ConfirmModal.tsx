import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

type ConfirmModalProps = {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Удалить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#FAFAF7] rounded-[32px] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)] w-full max-w-sm relative z-10 flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4 shadow-inner">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-[#1C1C1E] mb-2">{title}</h3>
        <p className="text-[#6B6B6B] text-sm mb-6 leading-relaxed">{message}</p>
        
        <div className="flex w-full gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-[#E5E3DD] text-[#1C1C1E] font-bold py-3.5 rounded-full active:scale-95 transition-transform"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white font-bold py-3.5 rounded-full shadow-[0_8px_20px_rgba(239,68,68,0.3)] active:scale-95 transition-transform"
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

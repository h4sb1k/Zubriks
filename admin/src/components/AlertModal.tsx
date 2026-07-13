import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

type AlertModalProps = {
  isOpen: boolean
  title: string
  message: string
  buttonText?: string
  onClose: () => void
}

export default function AlertModal({
  isOpen,
  title,
  message,
  buttonText = 'Понятно',
  onClose,
}: AlertModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#FAFAF7] rounded-[32px] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)] w-full max-w-sm relative z-10 flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-full bg-[#FFF9E6] flex items-center justify-center text-[#E8922A] mb-4 shadow-inner">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-[#1C1C1E] mb-2">{title}</h3>
        <p className="text-[#6B6B6B] text-sm mb-6 leading-relaxed">{message}</p>
        
        <div className="flex w-full">
          <button
            onClick={onClose}
            className="w-full bg-[#E8922A] text-white font-bold py-3.5 rounded-full shadow-[0_8px_20px_rgba(232,146,42,0.3)] active:scale-95 transition-transform"
          >
            {buttonText}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

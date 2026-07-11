import { motion } from 'framer-motion'

type LoadingZubrikProps = {
  text?: string
  fullScreen?: boolean
}

export default function LoadingZubrik({ text = 'Загрузка...', fullScreen = false }: LoadingZubrikProps) {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F5F2EB]/90 backdrop-blur-md'
    : 'flex flex-col items-center justify-center py-12 w-full h-full min-h-[200px]'

  return (
    <div className={containerClasses}>
      <div className="relative flex flex-col items-center">
        {/* Видео-прелоадер */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 relative rounded-[32px] overflow-hidden shadow-[0_12px_40px_rgba(26,61,43,0.12)] border-[3px] border-white/50 bg-[#F5F2EB]">
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            poster="/images/preloader-poster.webp"
          >
            <source src="/images/preloader.mp4" type="video/mp4" />
          </video>
        </div>
        
        {/* Текст */}
        {text && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="mt-6 text-[#1A3D2B] font-bold tracking-widest uppercase text-xs sm:text-sm bg-[#1A3D2B]/5 px-4 py-1.5 rounded-full"
          >
            {text}
          </motion.div>
        )}
      </div>
    </div>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useCallback, useState, useEffect } from 'react'
import Cropper, { Area } from 'react-easy-crop'

import { getCroppedImg } from '../utils/cropImage'

interface ImageCropperModalProps {
  imageSrc: string | null
  isOpen: boolean
  onClose: () => void
  onCropComplete: (croppedBlob: Blob) => void
  aspectRatio?: number
  cropShape?: 'rect' | 'round'
  allowShapeToggle?: boolean
}

export default function ImageCropperModal({ 
  imageSrc, 
  isOpen, 
  onClose, 
  onCropComplete,
  aspectRatio: initialAspectRatio = 1,
  cropShape: initialCropShape = 'round',
  allowShapeToggle = false
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [currentAspect, setCurrentAspect] = useState(initialAspectRatio)
  const [currentShape, setCurrentShape] = useState(initialCropShape)

  useEffect(() => {
    if (isOpen) {
      setCurrentAspect(initialAspectRatio)
      setCurrentShape(initialCropShape)
      setZoom(1)
      setCrop({ x: 0, y: 0 })
    }
  }, [isOpen, initialAspectRatio, initialCropShape])

  const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return
    setIsProcessing(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (croppedBlob) {
        onCropComplete(croppedBlob)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen || !imageSrc) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col bg-black">
        <div className="flex items-center justify-between p-4 bg-black/50 text-white z-10 shrink-0">
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all">
            <X size={24} />
          </button>
          <h2 className="font-bold text-lg">Обрезка фото</h2>
          <button 
            onClick={handleSave} 
            disabled={isProcessing}
            className="p-2 bg-[#E8922A] rounded-full hover:bg-[#E8922A]/80 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={24} />
            {isProcessing && <span className="text-sm font-bold">Ожидайте...</span>}
          </button>
        </div>
        <div className="relative flex-1 bg-black">
          {allowShapeToggle && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/60 p-1.5 rounded-full backdrop-blur-sm">
              <button
                onClick={() => {
                  setCurrentShape('round')
                  setCurrentAspect(1)
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  currentShape === 'round' ? 'bg-[#E8922A] text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                Круг 1:1
              </button>
              <button
                onClick={() => {
                  setCurrentShape('rect')
                  setCurrentAspect(16 / 9)
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  currentShape === 'rect' ? 'bg-[#E8922A] text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                Обложка 16:9
              </button>
            </div>
          )}
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={currentAspect}
            cropShape={currentShape}
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
          />
        </div>
        <div className="p-8 bg-black/50 z-10 shrink-0 flex flex-col items-center gap-4">
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full max-w-sm accent-[#E8922A]"
          />
        </div>
      </div>
    </AnimatePresence>
  )
}

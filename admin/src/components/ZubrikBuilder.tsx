import * as L from 'leaflet'
import { ArrowLeft, ImagePlus, MapPin, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import React from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'

import { trpc } from '../lib/trpc'
import AlertModal from './AlertModal'
import ConfirmModal from './ConfirmModal'
import ImageCropperModal from './ImageCropperModal'

const customIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-10 h-10 flex items-center justify-center bg-[#E8922A] text-white rounded-full shadow-md text-xl border-2 border-white">🦬</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

function MapEvents({ position, setTempPos }: { position: [number, number] | null, setTempPos: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setTempPos([e.latlng.lat, e.latlng.lng])
    },
  })
  
  useEffect(() => {
    if (position) {
      map.setView(position, 15)
    }
  }, [map, position])
  
  return null
}

function MapPicker({
  position,
  onSelect,
  onClose,
}: {
  position: [number, number] | null
  onSelect: (pos: [number, number]) => void
  onClose: () => void
}) {
  const [tempPos, setTempPos] = useState<[number, number] | null>(position)

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
      <div className="flex items-center p-5 bg-[#F5F2EB] safe-top shrink-0">
        <button type="button" onClick={onClose} className="p-2 -ml-2 mr-2">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-medium">Выберите точку</h2>
      </div>
      <div className="flex-1 relative">
        <MapContainer center={tempPos || [52.9701, 36.0732]} zoom={14.5} zoomControl={false} attributionControl={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <MapEvents position={position} setTempPos={setTempPos} />
          {tempPos && <Marker position={tempPos} icon={customIcon} />}
        </MapContainer>
        <div className="absolute bottom-6 left-5 right-5 z-[400]">
          <button
            type="button"
            onClick={() => {
              if (tempPos) {
                onSelect(tempPos)
                onClose()
              }
            }}
            disabled={!tempPos}
            className="w-full bg-[#E8922A] text-white rounded-2xl py-4 flex items-center justify-center font-medium disabled:opacity-50 shadow-lg active:scale-95 transition-transform"
          >
            Подтвердить
          </button>
        </div>
        <div className="absolute top-4 left-4 right-4 z-[400] bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-md text-sm text-center text-[#1C1C1E]">
          Нажмите на карту, чтобы установить метку
        </div>
      </div>
    </div>
  )
}

export type ZubrikEditData = {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  imageUrl?: string
}

export default function ZubrikBuilder({
  initialData,
  onClose,
}: {
  initialData?: ZubrikEditData | null
  onClose: () => void
}) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [position, setPosition] = useState<[number, number] | null>(
    initialData ? [initialData.latitude, initialData.longitude] : null
  )
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')

  const [isPickingMap, setIsPickingMap] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const utils = trpc.useUtils()

  const createZubrik = trpc.adminCreateZubrik.useMutation({
    onSuccess: () => {
      utils.adminGetZubriks.invalidate()
      onClose()
    },
    onError: (err) => setUploadError('Ошибка при создании Зубрика: ' + err.message),
  })

  const updateZubrik = trpc.adminUpdateZubrik.useMutation({
    onSuccess: () => {
      utils.adminGetZubriks.invalidate()
      onClose()
    },
    onError: (err) => setUploadError('Ошибка при обновлении Зубрика: ' + err.message),
  })

  const deleteZubrik = trpc.adminDeleteZubrik.useMutation({
    onSuccess: () => {
      utils.adminGetZubriks.invalidate()
      onClose()
    },
    onError: (err) => setUploadError('Ошибка при удалении Зубрика: ' + err.message),
  })

  // imageUrl is checked separately in handleSubmit to show a specific error
  const isValid = name.trim() && description.trim() && position

  const [isUploading, setIsUploading] = useState(false)
  
  // Cropper states
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Read file as data URL to pass to cropper
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setCropperImageSrc(reader.result?.toString() || null)
      setShowCropper(true)
    })
    reader.readAsDataURL(file)

    // Clear input so same file can be selected again
    e.target.value = ''
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false)
    setCropperImageSrc(null)

    const formData = new FormData()
    formData.append('file', croppedBlob, 'cropped_zubrik.jpg')

    setIsUploading(true)
    try {
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
      setUploadError('Ошибка при загрузке картинки. Проверьте размер (до 5 МБ) и формат (только изображения).')
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = () => {
    if (!isValid) return
    if (!imageUrl.trim()) {
      alert('Ошибка: необходимо загрузить изображение Зубрика!')
      return
    }

    if (initialData) {
      updateZubrik.mutate({
        id: initialData.id,
        name,
        description,
        latitude: position![0],
        longitude: position![1],
        imageUrl,
      })
    } else {
      createZubrik.mutate({
        name,
        description,
        latitude: position![0],
        longitude: position![1],
        imageUrl,
      })
    }
  }

  const isPending = createZubrik.isPending || updateZubrik.isPending

  if (isPickingMap) {
    return <MapPicker position={position} onSelect={setPosition} onClose={() => setIsPickingMap(false)} />
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAFAF7] flex flex-col animate-in slide-in-from-bottom-full duration-300">
      <div className="flex items-center p-5 bg-white border-b border-[#E5E3DD] safe-top shrink-0 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 mr-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">{initialData ? 'Редактировать Зубрика' : 'Новый Зубрик'}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-24">
        <div>
          <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Название</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white rounded-[20px] px-5 py-4 outline-none text-[16px] focus:ring-2 focus:ring-[#E8922A]/50 transition-shadow shadow-sm font-bold"
            placeholder="Имя Зубрика"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white rounded-[20px] px-5 py-4 outline-none text-[16px] focus:ring-2 focus:ring-[#E8922A]/50 transition-shadow shadow-sm min-h-[100px]"
            placeholder="Описание, история или загадка..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Локация</label>
          {position ? (
            <div className="w-full h-40 rounded-[20px] overflow-hidden relative border border-[#E5E3DD] shadow-inner mb-3 pointer-events-none">
              <MapContainer center={position} zoom={15} zoomControl={false} attributionControl={false} dragging={false} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <Marker position={position} icon={customIcon} />
              </MapContainer>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setIsPickingMap(true)}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-[20px] text-[15px] font-bold border active:scale-95 transition-all ${
              position
                ? 'bg-white border-[#E8922A] text-[#E8922A] shadow-sm'
                : 'bg-[#1A3D2B] border-transparent text-white shadow-[0_8px_20px_rgba(26,61,43,0.3)]'
            }`}
          >
            <MapPin size={20} />
            {position ? 'Изменить координаты' : 'Указать на карте'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Изображение</label>
          
          <label className={`relative flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
            imageUrl 
              ? 'w-full min-h-[220px] bg-[#F5F2EB] rounded-[24px] p-6 border border-[#E5E3DD] shadow-inner group'
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
                <img src={imageUrl} alt="preview" className="max-w-full max-h-[260px] object-contain drop-shadow-lg rounded-[12px] transition-transform group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-[#1C1C1E]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-[20px] font-bold text-[15px] text-[#1C1C1E] shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <ImagePlus size={18} className="text-[#E8922A]" />
                    Изменить фото
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
                  <ImagePlus size={28} className="text-[#6B6B6B] group-hover:text-[#E8922A] transition-colors" />
                </div>
                <span className="font-bold text-[#6B6B6B] group-hover:text-[#E8922A] transition-colors">Загрузить фото Зубрика</span>
              </>
            )}
          </label>
        </div>
      </div>

      <div className="p-5 bg-white border-t border-[#E5E3DD] shrink-0 safe-bottom">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isPending}
          className="w-full bg-[#E8922A] text-white rounded-2xl py-4 font-bold disabled:opacity-50 shadow-lg active:scale-95 transition-transform"
        >
          {isPending ? 'Сохранение...' : (initialData ? 'Применить' : 'Создать Зубрика')}
        </button>

        {initialData && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteZubrik.isPending}
            className="w-full mt-3 bg-red-500 text-white rounded-2xl py-4 flex justify-center items-center gap-2 font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            <Trash2 size={20} />
            {deleteZubrik.isPending ? 'Удаление...' : 'Удалить Зубрика'}
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Удалить Зубрика?"
        message="Вы уверены, что хотите удалить этого Зубрика навсегда? Это действие нельзя отменить."
        confirmText={deleteZubrik.isPending ? "Удаление..." : "Удалить"}
        onConfirm={() => {
          if (initialData) {
            deleteZubrik.mutate({ id: initialData.id })
          }
          setShowDeleteConfirm(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <AlertModal
        isOpen={!!uploadError}
        title="Ошибка загрузки"
        message={uploadError || ''}
        onClose={() => setUploadError(null)}
      />

      <ImageCropperModal
        isOpen={showCropper}
        imageSrc={cropperImageSrc}
        onClose={() => {
          setShowCropper(false)
          setCropperImageSrc(null)
        }}
        onCropComplete={handleCropComplete}
        aspectRatio={3 / 4}
        cropShape="rect"
      />
    </div>
  )
}

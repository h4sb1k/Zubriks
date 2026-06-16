import { ArrowLeft, MapPin, Navigation, Share2 } from 'lucide-react'
import { useState } from 'react'

import HomeScreen from './HomeScreen'

type ZubrikDetailProps = {
  name: string
  unlocked: boolean
  onClose: () => void
}

export default function ZubrikDetail({ name, unlocked, onClose }: ZubrikDetailProps) {
  const [activeTab, setActiveTab] = useState('История')

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAF7] overflow-y-auto">
      <div className="relative">
        <div className="h-72 bg-gradient-to-br from-[#1A3D2B] to-[#E8922A] relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onClose()
            }}
            className="absolute top-6 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer z-50"
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>

          <button className="absolute top-6 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <Share2 size={20} />
          </button>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-9xl">🦬</div>
          </div>

          {unlocked && (
            <div className="absolute bottom-4 right-4 bg-[#34C759] text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
              <span>✓</span>
              <span>Найден</span>
            </div>
          )}
        </div>

        <div className="px-5 py-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-2">{name}</h1>
              <p className="text-[#6B6B6B]">Коллекционный персонаж</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-[#E5E3DD]">
            {['История', 'Где найти', 'Фото'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm transition-colors relative ${
                  activeTab === tab ? 'text-[#1C1C1E]' : 'text-[#6B6B6B]'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8922A] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'История' && (
            <div className="space-y-4">
              <p className="text-[#1C1C1E] leading-relaxed">
                <span className="text-5xl float-left mr-3 mt-1 text-[#1A3D2B]">З</span>
                убрик-Путешественник — это один из самых популярных персонажей коллекции. Он символизирует дух
                исследования и открытий, который живёт в каждом жителе Орла.
              </p>
              <p className="text-[#1C1C1E] leading-relaxed">
                Этот зубрик любит посещать исторические места города и знает множество интересных историй о каждом
                уголке Орла. Его можно встретить возле главных достопримечательностей, где он с радостью делится своими
                знаниями.
              </p>
              <p className="text-[#1C1C1E] leading-relaxed">
                Найди его, чтобы узнать больше об истории города и получить первое достижение в своей коллекции!
              </p>
            </div>
          )}

          {activeTab === 'Где найти' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="h-48 bg-[#E5E3DD] flex items-center justify-center">
                  <div className="text-center text-[#6B6B6B]">
                    <MapPin size={48} className="mx-auto mb-2" />
                    <p>Карта местоположения</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin size={20} className="text-[#E8922A] mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="mb-1">Площадь Ленина</h3>
                      <p className="text-sm text-[#6B6B6B]">г. Орёл, пл. Ленина, 1</p>
                    </div>
                  </div>
                  <button className="w-full bg-[#E8922A] text-white rounded-2xl py-3 flex items-center justify-center gap-2">
                    <Navigation size={20} />
                    <span>Построить маршрут</span>
                  </button>
                </div>
              </div>

              {!unlocked && (
                <button className="w-full bg-[#1A3D2B] text-white rounded-2xl py-4 text-lg">Найти меня!</button>
              )}
            </div>
          )}

          {activeTab === 'Фото' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-[#E5E3DD] rounded-2xl flex items-center justify-center">
                    <span className="text-4xl">📷</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-[#6B6B6B] text-sm py-4">Здесь будут фотографии от сообщества</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

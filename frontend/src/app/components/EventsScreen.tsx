import { Calendar, MapPin, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'

import { trpc } from '../lib/trpc'
import LoadingZubrik from './LoadingZubrik'

// Дефолтные эмодзи по категориям — используются, если у события нет imageUrl
const categoryEmoji: Record<string, string> = {
  Выставка: '🎨',
  Концерт: '🎵',
  Фестиваль: '🍔',
  Театр: '🎭',
  'Мастер-класс': '🏺',
  Кино: '🎬',
}

/** Форматирует ISO-дату в читаемый вид: «3 июля» */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export default function EventsScreen() {
  const { data: eventsData, isLoading, isError, error } = trpc.getEvents.useQuery()

  // Собираем уникальные даты из данных API
  const dates = useMemo(() => {
    if (!eventsData?.events) return []
    const unique = [...new Set(eventsData.events.map((e) => formatDate(e.date)))]
    return unique
  }, [eventsData])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Автоматически выбираем первую дату при загрузке
  const activeDate = selectedDate ?? dates[0] ?? null

  const filteredEvents = useMemo(() => {
    if (!eventsData?.events || !activeDate) return []
    return eventsData.events.filter((event) => formatDate(event.date) === activeDate)
  }, [eventsData, activeDate])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAF7]">
        <LoadingZubrik text="Загрузка событий..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAF7] p-5">
        <span className="text-red-500">Ошибка загрузки: {error?.message || 'Неизвестная ошибка'}</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl mb-1">Что происходит в Орле</h1>
        <p className="text-[#6B6B6B] mb-6">События и мероприятия</p>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide mb-6">
          {dates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm transition-colors ${
                activeDate === date ? 'bg-[#E8922A] text-white' : 'bg-[#F5F2EB] text-[#1C1C1E]'
              }`}
            >
              {date}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6 space-y-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="h-40 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A3D2B, #E8922A)' }}>
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">{categoryEmoji[event.category] ?? '📅'}</span>
                )}
                <div className="absolute top-3 right-3 bg-[#F5F2EB] px-3 py-1.5 rounded-full text-xs">
                  {event.category}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base mb-3 line-clamp-2">{event.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <Calendar size={16} />
                    <span>
                      {formatDate(event.date)} · {event.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <MapPin size={16} />
                    <span>{event.venue}</span>
                  </div>
                  {event.price && (
                    <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                      <Tag size={16} />
                      <span className={event.price === 'Бесплатно' ? 'text-[#34C759]' : ''}>{event.price}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-[#6B6B6B]">
            <span className="text-4xl block mb-3">📅</span>
            <p>Нет событий на эту дату</p>
          </div>
        )}
      </div>

      <div className="px-5 pb-6">
        <div className="text-xs text-[#6B6B6B] text-center">Источник: Яндекс Афиша</div>
      </div>
    </div>
  )
}

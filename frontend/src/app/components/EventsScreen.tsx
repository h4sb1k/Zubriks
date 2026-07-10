import { Calendar, MapPin, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'

import { trpc } from '../lib/trpc'
import { DynamicIcon } from './DynamicIcon'
import LoadingZubrik from './LoadingZubrik'

// Дефолтные иконки по категориям — используются, если у события нет imageUrl
const categoryIcon: Record<string, string> = {
  Выставка: 'Palette',
  Концерт: 'Music',
  Фестиваль: 'Ticket',
  Театр: 'Sparkles',
  'Мастер-класс': 'Brush',
  Кино: 'Film',
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
    <div className="flex-1 overflow-y-auto pb-20 bg-[#FAFAF7]">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-bold text-[#1C1C1E] mb-1 tracking-tight">Что происходит в Орле</h1>
        <p className="text-[14px] text-[#6B6B6B] mb-6 font-medium">События и мероприятия</p>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide mb-4">
          {dates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeDate === date ? 'bg-[#E8922A] text-white shadow-md' : 'bg-[#F5F2EB] text-[#6B6B6B] hover:bg-[#E5E3DD]'
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
            <div 
              key={event.id} 
              className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-all border border-transparent hover:border-[#E5E3DD]/50 cursor-pointer"
            >
              <div className="h-44 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A3D2B, #E8922A)' }}>
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex-1 w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-md">
                    <DynamicIcon name={categoryIcon[event.category] ?? 'Calendar'} size={56} className="text-white drop-shadow-md" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold text-[#1C1C1E] uppercase tracking-wider shadow-sm">
                  {event.category}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-[17px] font-bold text-[#1C1C1E] mb-4 line-clamp-2 leading-tight">{event.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-[14px] text-[#6B6B6B] font-medium">
                    <Calendar size={18} className="text-[#E8922A] mt-0.5 shrink-0" />
                    <span className="leading-tight">
                      {formatDate(event.date)} · {event.time}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-[14px] text-[#6B6B6B] font-medium">
                    <MapPin size={18} className="text-[#E8922A] mt-0.5 shrink-0" />
                    <span className="leading-tight line-clamp-2">{event.venue}</span>
                  </div>
                  {event.price && (
                    <div className="flex items-center gap-2.5 text-[14px] font-bold">
                      <Tag size={18} className="text-[#E8922A] shrink-0" />
                      <span className={event.price === 'Бесплатно' ? 'text-[#34C759]' : 'text-[#1C1C1E]'}>{event.price}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-[#6B6B6B] flex flex-col items-center">
            <div className="bg-[#F5F2EB] rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow-inner">
              <Calendar size={36} className="text-[#6B6B6B]/50" />
            </div>
            <p className="font-medium">Нет событий на эту дату</p>
          </div>
        )}
      </div>

      <div className="px-5 pb-6">
        <div className="text-[11px] font-medium text-[#6B6B6B]/60 text-center uppercase tracking-wider">Источник: Яндекс Афиша</div>
      </div>
    </div>
  )
}

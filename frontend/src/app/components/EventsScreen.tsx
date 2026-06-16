import { Calendar, MapPin, Tag } from 'lucide-react'
import { useState } from 'react'

type Event = {
  id: string
  title: string
  date: string
  time: string
  venue: string
  category: string
  price: string
  imageEmoji: string
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Выставка современного искусства «Новый взгляд»',
    date: '3 мая',
    time: '14:00',
    venue: 'Галерея «Орёл»',
    category: 'Выставка',
    price: '200 ₽',
    imageEmoji: '🎨',
  },
  {
    id: '2',
    title: 'Концерт симфонического оркестра',
    date: '3 мая',
    time: '19:00',
    venue: 'Филармония',
    category: 'Концерт',
    price: '500 ₽',
    imageEmoji: '🎵',
  },
  {
    id: '3',
    title: 'Фестиваль уличной еды',
    date: '3 мая',
    time: '12:00',
    venue: 'Парк Культуры',
    category: 'Фестиваль',
    price: 'Бесплатно',
    imageEmoji: '🍔',
  },
  {
    id: '4',
    title: 'Театральная постановка «Вишнёвый сад»',
    date: '4 мая',
    time: '18:00',
    venue: 'Театр «Свободное пространство»',
    category: 'Театр',
    price: '350 ₽',
    imageEmoji: '🎭',
  },
  {
    id: '5',
    title: 'Мастер-класс по керамике',
    date: '4 мая',
    time: '15:00',
    venue: 'Творческая мастерская',
    category: 'Мастер-класс',
    price: '800 ₽',
    imageEmoji: '🏺',
  },
  {
    id: '6',
    title: 'Киноклуб: классика советского кино',
    date: '5 мая',
    time: '20:00',
    venue: 'Кинотеатр «Победа»',
    category: 'Кино',
    price: '150 ₽',
    imageEmoji: '🎬',
  },
]

const dates = ['3 мая', '4 мая', '5 мая', '6 мая', '7 мая']

export default function EventsScreen() {
  const [selectedDate, setSelectedDate] = useState('3 мая')

  const filteredEvents = mockEvents.filter((event) => event.date === selectedDate)

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
                selectedDate === date ? 'bg-[#E8922A] text-white' : 'bg-[#F5F2EB] text-[#1C1C1E]'
              }`}
            >
              {date}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6 space-y-4">
        {filteredEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="h-40 bg-gradient-to-br from-[#1A3D2B] to-[#E8922A] flex items-center justify-center relative">
              <span className="text-6xl">{event.imageEmoji}</span>
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
                    {event.date} · {event.time}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                  <MapPin size={16} />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                  <Tag size={16} />
                  <span className={event.price === 'Бесплатно' ? 'text-[#34C759]' : ''}>{event.price}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-6">
        <div className="text-xs text-[#6B6B6B] text-center">Источник: Яндекс Афиша</div>
      </div>
    </div>
  )
}

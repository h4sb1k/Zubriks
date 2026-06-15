import { Calendar, ChevronRight,MapPin, Trophy } from 'lucide-react';
import { useState } from 'react';

import RouteActive from './RouteActive';
import ZubrikDetail from './ZubrikDetail';

type Zubrik = {
  id: string;
  name: string;
  distance: string;
  unlocked: boolean;
  imageColor: string;
}

const mockZubriks: Zubrik[] = [
  { id: '1', name: 'Зубрик-Путешественник', distance: '150м', unlocked: true, imageColor: '#34C759' },
  { id: '2', name: 'Зубрик-Художник', distance: '320м', unlocked: true, imageColor: '#E8922A' },
  { id: '3', name: 'Зубрик-Музыкант', distance: '500м', unlocked: false, imageColor: '#6B6B6B' },
  { id: '4', name: 'Зубрик-Историк', distance: '780м', unlocked: false, imageColor: '#6B6B6B' },
  { id: '5', name: 'Зубрик-Гурман', distance: '1.2км', unlocked: false, imageColor: '#6B6B6B' },
];

const mockEvents = [
  { id: '1', title: 'Выставка современного искусства', time: '14:00', venue: 'Галерея «Орёл»', category: 'Выставка' },
  { id: '2', title: 'Концерт симфонического оркестра', time: '19:00', venue: 'Филармония', category: 'Концерт' },
  { id: '3', title: 'Фестиваль уличной еды', time: '12:00', venue: 'Парк Культуры', category: 'Фестиваль' },
];

export default function HomeScreen() {
  const [selectedZubrik, setSelectedZubrik] = useState<Zubrik | null>(null);
  const [showRouteActive, setShowRouteActive] = useState(false);
  return (
    <>
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-5 pt-6 pb-8 bg-[#F5F2EB]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl mb-1">Привет, Исследователь! 👋</h1>
              <p className="text-[#6B6B6B]">Исследуй Орёл</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#1A3D2B] flex items-center justify-center">
              <span className="text-white text-lg">🦬</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <div className="h-44 bg-gradient-to-br from-[#1A3D2B] to-[#2A5D3B] flex items-center justify-center relative">
              <div className="absolute top-4 right-4 bg-[#E8922A] text-white px-3 py-1.5 rounded-full text-sm">
                Главный маршрут
              </div>
              <div className="text-center">
                <div className="text-6xl mb-2">🦬</div>
                <h2 className="text-white text-xl">Тур «Зубрики»</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[#6B6B6B] mb-4">
                Пройди по главным достопримечательностям Орла и собери всех зубриков
              </p>
              <button
                onClick={() => setShowRouteActive(true)}
                className="w-full bg-[#E8922A] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2"
              >
                <span>Начать путешествие</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Зубрики рядом</h2>
            <MapPin size={20} className="text-[#E8922A]" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {mockZubriks.map((zubrik) => (
              <button
                key={zubrik.id}
                onClick={() => setSelectedZubrik(zubrik)}
                className="flex-shrink-0 w-40 bg-white rounded-2xl p-4 shadow-sm"
              >
                <div
                  className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl"
                  style={{ backgroundColor: zubrik.imageColor + '20' }}
                >
                  🦬
                </div>
                <h3 className="text-sm mb-1 line-clamp-2 min-h-[2.5rem]">{zubrik.name}</h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B6B6B]">{zubrik.distance}</span>
                  {zubrik.unlocked ? (
                    <span className="text-[#34C759]">✓</span>
                  ) : (
                    <span className="text-[#6B6B6B]">🔒</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">События сегодня</h2>
            <Calendar size={20} className="text-[#E8922A]" />
          </div>
          <div className="space-y-3">
            {mockEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="h-24 bg-gradient-to-r from-[#1A3D2B] to-[#E8922A] flex items-center justify-center">
                  <span className="text-4xl">🎭</span>
                </div>
                <div className="p-4">
                  <div className="inline-block bg-[#F5F2EB] px-2.5 py-1 rounded-full text-xs text-[#6B6B6B] mb-2">
                    {event.category}
                  </div>
                  <h3 className="text-sm mb-2 line-clamp-2">{event.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
                    <span>{event.time}</span>
                    <span>•</span>
                    <span>{event.venue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedZubrik && (
        <ZubrikDetail
          name={selectedZubrik.name}
          unlocked={selectedZubrik.unlocked}
          onClose={() => setSelectedZubrik(null)}
        />
      )}

      {showRouteActive && (
        <RouteActive onClose={() => setShowRouteActive(false)} />
      )}
    </>
  );
}

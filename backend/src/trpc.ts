import { initTRPC } from '@trpc/server'
import _ from 'lodash'

const trpc = initTRPC.create()

type Zubrik = {
  id: string
  name: string
  description: string
  distance: string
  unlocked: boolean
  imageColor: string
  imageUrl: string
  coordinates: [number, number, string]
}
export const mockZubriks: Zubrik[] = [
  {
    id: '1',
    name: 'Зубрик-Путешественник',
    description:
      'Зубрик-Путешественник символизирует дух исследования и открытий Орла. Он обожает путешествовать, изучать новые тропы и вдохновлять жителей и гостей города на новые приключения!',
    distance: '150м',
    unlocked: true,
    imageColor: '#CEE6B6',
    imageUrl: '/images/Zubrik-1-Travel.png',
    coordinates: [52.9701, 36.0732, 'Парк Культуры'],
  },
  {
    id: '2',
    name: 'Зубрик-Художник',
    description:
      'Зубрик-Художник — покровитель всех творцов Орла. Его часто замечают с блокнотом около Музея изобразительных искусств, где он увлечённо рисует старинные здания и парки.',
    distance: '320м',
    unlocked: true,
    imageColor: '#FEA35A',
    imageUrl: '/images/Zubrik-2-Drawer.png',
    coordinates: [52.9722, 36.0753, 'Музей изобразительных искусств'],
  },
  {
    id: '3',
    name: 'Зубрик-Музыкант',
    description:
      'Зубрик-Музыкант наполняет Орёл звуками радости. Он обожает уличные выступления на пешеходной Ленинской улице и набережной, играя на своей крошечной гитаре.',
    distance: '500м',
    unlocked: false,
    imageColor: '#B0B0B0',
    imageUrl: '/images/Zubrik-3-Singer.png',
    coordinates: [52.9681, 36.0695, 'Центральная площадь'],
  },
  {
    id: '4',
    name: 'Зубрик-Историк',
    description:
      'Зубрик-Историк знает всё о великом прошлом нашего города. Он хранит легенды об орловской крепости и с удовольствием делится старинными преданиями.',
    distance: '780м',
    unlocked: false,
    imageColor: '#ACACAC',
    imageUrl: '/images/Zubrik-4-Reader.png',
    coordinates: [52.9754, 36.0812, 'Исторический музей писателей'],
  },
  {
    id: '5',
    name: 'Зубрик-Литератор',
    description:
      'Зубрик-Литератор напоминает о том, что Орёл — третья литературная столица России. Он обожает книги Тургенева и Лескова и всегда носит с собой любимый томик стихов.',
    distance: '1.0км',
    unlocked: false,
    imageColor: '#B1B1AF',
    imageUrl: '/images/Zubrik-5-Booker.png',
    coordinates: [52.9655, 36.0671, 'Музей Тургенева'],
  },
  {
    id: '6',
    name: 'Зубрик-Гурман',
    description:
      'Зубрик-Гурман знает все лучшие кулинарные места Орла. Он коллекционирует традиционные рецепты Орловщины и очень любит сытно и вкусно поесть.',
    distance: '1.2км',
    unlocked: false,
    imageColor: '#BFB5AC',
    imageUrl: '/images/Zubrik-6-Cooker.png',
    coordinates: [52.9712, 36.0785, 'Площадь Ленина'],
  },
]

type Event = {
  id: string
  title: string
  time: string
  venue: string
  category: string
  imageUrl?: string
  Url?: string
}
const mockEvents: Event[] = [
  { id: '1', title: 'Выставка современного искусства', time: '14:00', venue: 'Галерея «Орёл»', category: 'Выставка' },
  { id: '2', title: 'Концерт симфонического оркестра', time: '19:00', venue: 'Филармония', category: 'Концерт' },
  { id: '3', title: 'Фестиваль уличной еды', time: '12:00', venue: 'Парк Культуры', category: 'Фестиваль' },
]

type Route = {
  id: string
  name: string
  distance: string
  duration: string
  stops: number
  author: string
  description?: string
  liked: boolean
  imageColor: string
}
export const mockRoutes: Route[] = [
  {
    id: '1',
    name: 'Исторический центр',
    distance: '3.5 км',
    duration: '1.5 ч',
    stops: 5,
    author: 'Анна К.',
    liked: false,
    imageColor: '#1A3D2B',
  },
  {
    id: '2',
    name: 'Парки и скверы',
    distance: '4.2 км',
    duration: '2 ч',
    stops: 6,
    author: 'Дмитрий М.',
    liked: true,
    imageColor: '#34C759',
  },
  {
    id: '3',
    name: 'Музеи Орла',
    distance: '2.8 км',
    duration: '3 ч',
    stops: 4,
    author: 'Елена В.',
    liked: false,
    imageColor: '#E8922A',
  },
  {
    id: '4',
    name: 'Архитектура модерна',
    distance: '3.0 км',
    duration: '1 ч',
    stops: 7,
    author: 'Игорь С.',
    liked: false,
    imageColor: '#D4A017',
  },
]

export const mainRoute = {
  id: 'main',
  name: 'Тур «Зубрики»',
  distance: '5.2 км',
  duration: '2-3 часа',
  stops: 8,
  description: 'Пройди по главным достопримечательностям Орла и собери всех зубриков',
}

export const trpcRouter = trpc.router({
  getZubriks: trpc.procedure.query(() => {
    return {
      zubriks: mockZubriks.map((zubrik) =>
        _.pick(zubrik, ['id', 'name', 'description', 'distance', 'unlocked', 'imageColor', 'imageUrl', 'coordinates'])
      ),
    }
  }),
  getEvents: trpc.procedure.query(() => {
    return {
      events: mockEvents.map((event) => _.pick(event, ['id', 'title', 'time', 'venue', 'category'])),
    }
  }),
  getRoutes: trpc.procedure.query(() => {
    return {
      routes: mockRoutes.map((route) =>
        _.pick(route, ['id', 'name', 'distance', 'duration', 'stops', 'author', 'description', 'liked', 'imageColor'])
      ),
      mainRoute: _.pick(mainRoute, ['id', 'name', 'distance', 'duration', 'stops', 'description']),
    }
  }),
  //   getIdeas: trpc.procedure.query(() => {
  //     return {
  //       ideas: ideas.map((idea) => _.pick(idea, ["nick", "name", "description"])),
  //     };
  //   }),
  //   getIdea: trpc.procedure
  //     .input(
  //       z.object({
  //         ideaNick: z.string(),
  //       }),
  //     )
  //     .query(({ input }) => {
  //       const idea = ideas.find((idea) => idea.nick === input.ideaNick);
  //       // if (!idea) throw new Error(`Idea ${input.ideaNick} not found`)
  //       return { idea: idea || null };
  //     }),
})

export type TrpcRouter = typeof trpcRouter

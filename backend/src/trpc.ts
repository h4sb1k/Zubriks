import { initTRPC } from '@trpc/server'
import _ from 'lodash'
import { z } from 'zod'

const trpc = initTRPC.create()

type Zubrik = {
  id: string
  name: string
  description: string
  distance: string
  unlocked: boolean
  imageColor: string
  imageUrl: string
}
export const mockZubriks: Zubrik[] = [
  {
    id: '1',
    name: 'Зубрик-Путешественник',
    description: 'Зубрик-Путешественник символизирует дух исследования и открытий Орла. Он обожает путешествовать, изучать новые тропы и вдохновлять жителей и гостей города на новые приключения!',
    distance: '150м',
    unlocked: true,
    imageColor: '#CEE6B6',
    imageUrl: '/images/Zubrik-1-Travel.png',
  },
  {
    id: '2',
    name: 'Зубрик-Художник',
    description: 'Зубрик-Художник — покровитель всех творцов Орла. Его часто замечают с блокнотом около Музея изобразительных искусств, где он увлечённо рисует старинные здания и парки.',
    distance: '320м',
    unlocked: true,
    imageColor: '#FEA35A',
    imageUrl: '/images/Zubrik-2-Drawer.png',
  },
  {
    id: '3',
    name: 'Зубрик-Музыкант',
    description: 'Зубрик-Музыкант наполняет Орёл звуками радости. Он обожает уличные выступления на пешеходной Ленинской улице и набережной, играя на своей крошечной гитаре.',
    distance: '500м',
    unlocked: false,
    imageColor: '#B0B0B0',
    imageUrl: '/images/Zubrik-3-Singer.png',
  },
  {
    id: '4',
    name: 'Зубрик-Историк',
    description: 'Зубрик-Историк знает всё о великом прошлом нашего города. Он хранит легенды об орловской крепости и с удовольствием делится старинными преданиями.',
    distance: '780м',
    unlocked: false,
    imageColor: '#ACACAC',
    imageUrl: '/images/Zubrik-4-Reader.png',
  },
  {
    id: '5',
    name: 'Зубрик-Литератор',
    description: 'Зубрик-Литератор напоминает о том, что Орёл — третья литературная столица России. Он обожает книги Тургенева и Лескова и всегда носит с собой любимый томик стихов.',
    distance: '1.0км',
    unlocked: false,
    imageColor: '#B1B1AF',
    imageUrl: '/images/Zubrik-5-Booker.png',
  },
  {
    id: '6',
    name: 'Зубрик-Гурман',
    description: 'Зубрик-Гурман знает все лучшие кулинарные места Орла. Он коллекционирует традиционные рецепты Орловщины и очень любит сытно и вкусно поесть.',
    distance: '1.2км',
    unlocked: false,
    imageColor: '#BFB5AC',
    imageUrl: '/images/Zubrik-6-Cooker.png',
  },
]

type Event = {
  id: string
  title: string
  time: string
  venue: string
  category: string
}
const mockEvents: Event[] = [
  { id: '1', title: 'Выставка современного Хуюсства', time: '14:00', venue: 'Галерея «Орёл»', category: 'Выставка' },
  { id: '2', title: 'Концерт симфонического оркестра', time: '19:00', venue: 'Филармония', category: 'Концерт' },
  { id: '3', title: 'Фестиваль уличной еды', time: '12:00', venue: 'Парк Культуры', category: 'Фестиваль' },
]

export const trpcRouter = trpc.router({
  getZubriks: trpc.procedure.query(() => {
    return {
      zubriks: mockZubriks.map((zubrik) =>
        _.pick(zubrik, ['id', 'name', 'description', 'distance', 'unlocked', 'imageColor', 'imageUrl'])
      ),
    }
  }),
  getEvents: trpc.procedure.query(() => {
    return {
      events: mockEvents.map((event) => _.pick(event, ['id', 'title', 'time', 'venue', 'category'])),
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

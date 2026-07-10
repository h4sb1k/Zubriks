import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.info('🌱 Seeding database...')

  // ──────────────────────────────────────────────────────────────────
  // 1. Зубрики
  // ──────────────────────────────────────────────────────────────────
  await prisma.zubrik.createMany({
    data: [
      {
        name: 'Зубрик-Путешественник',
        description:
          'Зубрик-Путешественник символизирует дух исследования и открытий Орла. Он обожает путешествовать, изучать новые тропы и вдохновлять жителей и гостей города на новые приключения!',
        imageUrl: '/images/Zubrik-1-Travel.webp',
        latitude: 52.9701,
        longitude: 36.0732,
        locationName: 'Парк Культуры',
      },
      {
        name: 'Зубрик-Художник',
        description:
          'Зубрик-Художник — покровитель всех творцов Орла. Его часто замечают с блокнотом около Музея изобразительных искусств, где он увлечённо рисует старинные здания и парки.',
        imageUrl: '/images/Zubrik-2-Drawer.webp',
        latitude: 52.9722,
        longitude: 36.0753,
        locationName: 'Музей изобразительных искусств',
      },
      {
        name: 'Зубрик-Музыкант',
        description:
          'Зубрик-Музыкант наполняет Орёл звуками радости. Он обожает уличные выступления на пешеходной Ленинской улице и набережной, играя на своей крошечной гитаре.',
        imageUrl: '/images/Zubrik-3-Singer.webp',
        latitude: 52.9681,
        longitude: 36.0695,
        locationName: 'Центральная площадь',
      },
      {
        name: 'Зубрик-Историк',
        description:
          'Зубрик-Историк знает всё о великом прошлом нашего города. Он хранит легенды об орловской крепости и с удовольствием делится старинными преданиями.',
        imageUrl: '/images/Zubrik-4-Reader.webp',
        latitude: 52.9754,
        longitude: 36.0812,
        locationName: 'Исторический музей писателей',
      },
      {
        name: 'Зубрик-Литератор',
        description:
          'Зубрик-Литератор напоминает о том, что Орёл — третья литературная столица России. Он обожает книги Тургенева и Лескова и всегда носит с собой любимый томик стихов.',
        imageUrl: '/images/Zubrik-5-Booker.webp',
        latitude: 52.9655,
        longitude: 36.0671,
        locationName: 'Музей Тургенева',
      },
      {
        name: 'Зубрик-Гурман',
        description:
          'Зубрик-Гурман знает все лучшие кулинарные места Орла. Он коллекционирует традиционные рецепты Орловщины и очень любит сытно и вкусно поесть.',
        imageUrl: '/images/Zubrik-6-Cooker.webp',
        latitude: 52.9712,
        longitude: 36.0785,
        locationName: 'Площадь Ленина',
      },
    ],
    skipDuplicates: true,
  })
  console.info('  ✅ Zubriks seeded')

  // ──────────────────────────────────────────────────────────────────
  // 2. События
  // ──────────────────────────────────────────────────────────────────
  await prisma.event.createMany({
    data: [
      {
        title: 'Выставка современного искусства «Новый взгляд»',
        date: new Date('2026-07-03'),
        time: '14:00',
        venue: 'Галерея «Орёл»',
        category: 'Выставка',
        price: '200 ₽',
      },
      {
        title: 'Концерт симфонического оркестра',
        date: new Date('2026-07-03'),
        time: '19:00',
        venue: 'Филармония',
        category: 'Концерт',
        price: '500 ₽',
      },
      {
        title: 'Фестиваль уличной еды',
        date: new Date('2026-07-03'),
        time: '12:00',
        venue: 'Парк Культуры',
        category: 'Фестиваль',
        price: 'Бесплатно',
      },
      {
        title: 'Театральная постановка «Вишнёвый сад»',
        date: new Date('2026-07-04'),
        time: '18:00',
        venue: 'Театр «Свободное пространство»',
        category: 'Театр',
        price: '350 ₽',
      },
      {
        title: 'Мастер-класс по керамике',
        date: new Date('2026-07-04'),
        time: '15:00',
        venue: 'Творческая мастерская',
        category: 'Мастер-класс',
        price: '800 ₽',
      },
      {
        title: 'Киноклуб: классика советского кино',
        date: new Date('2026-07-05'),
        time: '20:00',
        venue: 'Кинотеатр «Победа»',
        category: 'Кино',
        price: '150 ₽',
      },
    ],
    skipDuplicates: true,
  })
  console.info('  ✅ Events seeded')

  // ──────────────────────────────────────────────────────────────────
  // 3. Маршруты + Waypoints
  // ──────────────────────────────────────────────────────────────────

  // Главный маршрут с точками (nested create)
  await prisma.route.create({
    data: {
      name: 'Тур «Зубрики»',
      distance: '5.2 км',
      duration: '2-3 часа',
      description: 'Пройди по главным достопримечательностям Орла и собери всех зубриков',
      isMain: true,
      waypoints: {
        create: [
          {
            name: 'Площадь Ленина',
            description: 'Главная площадь города',
            icon: 'Landmark',
            latitude: 52.9674,
            longitude: 36.0694,
            orderIndex: 0,
          },
          {
            name: 'Парк Культуры',
            description: 'Исторический парк',
            icon: 'TreePine',
            latitude: 52.9688,
            longitude: 36.071,
            orderIndex: 1,
          },
          {
            name: 'Зубрик-Путешественник',
            description: 'Найди первого зубрика',
            icon: 'Cat',
            latitude: 52.9701,
            longitude: 36.0732,
            orderIndex: 2,
          },
          {
            name: 'Музей изобразительных искусств',
            description: 'Посети музей',
            icon: 'Palette',
            latitude: 52.972,
            longitude: 36.0755,
            orderIndex: 3,
          },
          {
            name: 'Набережная',
            description: 'Прогуляйся вдоль реки',
            icon: '🌊',
            latitude: 52.975,
            longitude: 36.08,
            orderIndex: 4,
          },
        ],
      },
    },
  })

  // ──────────────────────────────────────────────────────────────────
  // 4. Ачивки
  // ──────────────────────────────────────────────────────────────────
  // Находим ID зубриков для SPECIFIC_ZUBRIK ачивок
  const zubrikHistorik = await prisma.zubrik.findFirst({ where: { name: 'Зубрик-Историк' } })
  const zubrikLiterator = await prisma.zubrik.findFirst({ where: { name: 'Зубрик-Литератор' } })
  const zubrikGurman = await prisma.zubrik.findFirst({ where: { name: 'Зубрик-Гурман' } })
  const zubrikPuteshestvennik = await prisma.zubrik.findFirst({ where: { name: 'Зубрик-Путешественник' } })
  const zubrikHudozhnik = await prisma.zubrik.findFirst({ where: { name: 'Зубрик-Художник' } })
  const zubrikMuzykant = await prisma.zubrik.findFirst({ where: { name: 'Зубрик-Музыкант' } })

  await prisma.achievement.createMany({
    data: [
      {
        name: 'Первая находка',
        description: 'Найди своего первого зубрика',
        imageUrl: '/images/Achievement-1.webp',
        icon: 'Cat',
        conditionType: 'ZUBRIK_COUNT',
        conditionCount: 1,
        conditionTarget: null,
      },
      {
        name: 'Путешественник',
        description: 'Пройди 10 км по городу',
        imageUrl: '/images/Achievement-3.webp',
        icon: 'Footprints',
        conditionType: 'MANUAL',
        conditionCount: 1,
        conditionTarget: null,
      },
      {
        name: 'Коллекционер',
        description: 'Найди 10 зубриков',
        imageUrl: '/images/Achievement-4.webp',
        icon: 'Package',
        conditionType: 'ZUBRIK_COUNT',
        conditionCount: 10,
        conditionTarget: null,
      },
      {
        name: 'Знаток истории',
        description: 'Найди Зубрика-Историка',
        imageUrl: '/images/Achievement-5.webp',
        icon: 'Landmark',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionCount: 1,
        conditionTarget: zubrikHistorik?.id ?? null,
      },
      {
        name: 'Мастер маршрутов',
        description: 'Создай 5 маршрутов',
        imageUrl: '/images/Achievement-6.webp',
        icon: 'Map',
        conditionType: 'ROUTE_CREATE',
        conditionCount: 5,
        conditionTarget: null,
      },
      {
        name: 'Легенда Орла',
        description: 'Найди всех зубриков',
        imageUrl: '/images/Achievement-7.webp',
        icon: 'Crown',
        conditionType: 'ZUBRIK_ALL',
        conditionCount: 1,
        conditionTarget: null,
      },
      {
        name: 'Знаток классики',
        description: 'Найди Зубрика-Литератора',
        imageUrl: '/images/Achievement-1.webp',
        icon: 'BookOpen',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionCount: 1,
        conditionTarget: zubrikLiterator?.id ?? null,
      },
      {
        name: 'Главный дегустатор',
        description: 'Найди Зубрика-Гурмана',
        imageUrl: '/images/Achievement-1.webp',
        icon: 'Pizza',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionCount: 1,
        conditionTarget: zubrikGurman?.id ?? null,
      },
      {
        name: 'Мастер-турист',
        description: 'Пройти главный экскурсионный тур "Зубрики"',
        imageUrl: '/images/Avhievement-Zubriki.webp',
        icon: 'Map',
        conditionType: 'MAIN_ROUTE_COMPLETE',
        conditionCount: 1,
        conditionTarget: null,
      },
      {
        name: 'Исследователь',
        description: 'Найди 5 зубриков',
        imageUrl: '/images/Achievement-2.webp',
        icon: 'Map',
        conditionType: 'ZUBRIK_COUNT',
        conditionCount: 5,
        conditionTarget: null,
      },
      {
        name: 'Активист',
        description: 'Посети 10 событий',
        imageUrl: '/images/Achievement-8.webp',
        icon: 'PartyPopper',
        conditionType: 'MANUAL',
        conditionCount: 1,
        conditionTarget: null,
      },
      {
        name: 'Начало пути',
        description: 'Ты начал своё путешествие по Орлу!',
        imageUrl: '/images/Achievement-1.webp',
        icon: 'Hand',
        conditionType: 'MANUAL',
        conditionCount: 1,
        conditionTarget: null,
      },
      {
        name: 'Зубрик-Путешественник',
        description: 'Найди Зубрика-Путешественника',
        imageUrl: '/images/Achievements/Achievement-Zubrik-1-Travel.webp',
        icon: 'Compass',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionCount: 1,
        conditionTarget: zubrikPuteshestvennik?.id ?? null,
      },
      {
        name: 'Зубрик-Художник',
        description: 'Найди Зубрика-Художника',
        imageUrl: '/images/Achievements/Achievement-Zubrik-2-Drawer.webp',
        icon: 'Palette',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionCount: 1,
        conditionTarget: zubrikHudozhnik?.id ?? null,
      },
      {
        name: 'Зубрик-Музыкант',
        description: 'Найди Зубрика-Музыканта',
        imageUrl: '/images/Achievements/Achievement-Zubrik-3-Singer.webp',
        icon: 'Music',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionCount: 1,
        conditionTarget: zubrikMuzykant?.id ?? null,
      },
      {
        name: 'Зубрик-Историк',
        description: 'Найди Зубрика-Историка',
        imageUrl: '/images/Achievements/Achievement-Zubrik-4-Reader.webp',
        icon: 'Hourglass',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionCount: 1,
        conditionTarget: zubrikHistorik?.id ?? null,
      },
      {
        name: 'Зубрик-Литератор',
        description: 'Найди Зубрика-Литератора',
        imageUrl: '/images/Achievements/Achievement-Zubrik-5-Booker.webp',
        icon: 'Library',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionCount: 1,
        conditionTarget: zubrikLiterator?.id ?? null,
      },
      {
        name: 'Зубрик-Гурман',
        description: 'Найди Зубрика-Гурмана',
        imageUrl: '/images/Achievements/Achievement-Zubrik-6-Cooker.webp',
        icon: 'CakeSlice',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionCount: 1,
        conditionTarget: zubrikGurman?.id ?? null,
      }
    ],
    skipDuplicates: true,
  })
  console.info('  ✅ Achievements seeded')

  console.info('PartyPopper Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

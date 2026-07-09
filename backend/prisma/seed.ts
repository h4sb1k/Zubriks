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
            emoji: '🏛️',
            latitude: 52.9674,
            longitude: 36.0694,
            orderIndex: 0,
          },
          {
            name: 'Парк Культуры',
            description: 'Исторический парк',
            emoji: '🌳',
            latitude: 52.9688,
            longitude: 36.071,
            orderIndex: 1,
          },
          {
            name: 'Зубрик-Путешественник',
            description: 'Найди первого зубрика',
            emoji: '🦬',
            latitude: 52.9701,
            longitude: 36.0732,
            orderIndex: 2,
          },
          {
            name: 'Музей изобразительных искусств',
            description: 'Посети музей',
            emoji: '🎨',
            latitude: 52.972,
            longitude: 36.0755,
            orderIndex: 3,
          },
          {
            name: 'Набережная',
            description: 'Прогуляйся вдоль реки',
            emoji: '🌊',
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

  await prisma.achievement.createMany({
    data: [
      {
        name: 'Начало пути',
        description: 'Ты начал своё путешествие по Орлу!',
        imageUrl: '/images/Achievement-1.webp',
        emoji: '👋',
        conditionType: 'MANUAL',
        conditionCount: 1,
      },
      {
        name: 'Первая находка',
        description: 'Найди своего первого зубрика',
        imageUrl: '/images/Achievement-1.webp',
        emoji: '🦬',
        conditionType: 'ZUBRIK_COUNT',
        conditionCount: 1,
      },
      {
        name: 'Исследователь',
        description: 'Найди 5 зубриков',
        imageUrl: '/images/Achievement-2.webp',
        emoji: '🗺️',
        conditionType: 'ZUBRIK_COUNT',
        conditionCount: 5,
      },
      {
        name: 'Путешественник',
        description: 'Пройди 10 км по городу',
        imageUrl: '/images/Achievement-3.webp',
        emoji: '🚶',
        conditionType: 'MANUAL',
        conditionCount: 1,
      },
      {
        name: 'Коллекционер',
        description: 'Найди 10 зубриков',
        imageUrl: '/images/Achievement-4.webp',
        emoji: '📦',
        conditionType: 'ZUBRIK_COUNT',
        conditionCount: 10,
      },
      {
        name: 'Знаток истории',
        description: 'Найди Зубрика-Историка',
        imageUrl: '/images/Achievement-5.webp',
        emoji: '🏛️',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionTarget: zubrikHistorik?.id ?? null,
        conditionCount: 1,
      },
      {
        name: 'Мастер маршрутов',
        description: 'Создай 5 маршрутов',
        imageUrl: '/images/Achievement-6.webp',
        emoji: '🗺️',
        conditionType: 'ROUTE_CREATE',
        conditionCount: 5,
      },
      {
        name: 'Легенда Орла',
        description: 'Найди всех зубриков',
        imageUrl: '/images/Achievement-7.webp',
        emoji: '👑',
        conditionType: 'ZUBRIK_ALL',
        conditionCount: 1,
      },
      {
        name: 'Активист',
        description: 'Посети 10 событий',
        imageUrl: '/images/Achievement-8.webp',
        emoji: '🎉',
        conditionType: 'MANUAL',
        conditionCount: 1,
      },
      {
        name: 'Знаток классики',
        description: 'Найди Зубрика-Литератора',
        imageUrl: '/images/Achievement-1.webp',
        emoji: '📖',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionTarget: zubrikLiterator?.id ?? null,
        conditionCount: 1,
      },
      {
        name: 'Главный дегустатор',
        description: 'Найди Зубрика-Гурмана',
        imageUrl: '/images/Achievement-1.webp',
        emoji: '🍕',
        conditionType: 'SPECIFIC_ZUBRIK',
        conditionTarget: zubrikGurman?.id,
      },
      {
        name: 'Мастер-турист',
        description: 'Пройти главный экскурсионный тур "Зубрики"',
        imageUrl: '/images/Avhievement-Zubriki.webp',
        emoji: '🗺️',
        conditionType: 'MAIN_ROUTE_COMPLETE',
      },
    ],
    skipDuplicates: true,
  })
  console.info('  ✅ Achievements seeded')

  console.info('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

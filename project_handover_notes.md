# Handover Notes: Zubriks Project

Этот документ содержит краткую справку по текущей архитектуре, выполненным задачам и окружению проекта **Zubriks**, чтобы помочь быстро войти в курс дела при следующем запуске.

---

## 📌 Обзор проекта
**Zubriks (Зубрики)** — это интерактивный пешеходный гид по городу Орёл. Пользователи могут исследовать карту, искать коллекционных персонажей (Зубриков), проходить экскурсионные маршруты и просматривать городские события.

* **Архитектура**: Монорепозиторий (pnpm workspace).
* **Бэкенд**: Node.js + Express + tRPC API + **Prisma ORM** + **PostgreSQL**. Находится в каталоге [backend/](file:///home/invigar/IT/Development/Zubriks/backend).
* **Фронтенд**: React + TypeScript + TailwindCSS + Leaflet + Vite. Находится в каталоге [frontend/](file:///home/invigar/IT/Development/Zubriks/frontend).
* **БД**: PostgreSQL 16 через Docker Compose ([docker-compose.yml](file:///home/invigar/IT/Development/Zubriks/docker-compose.yml)).

---

## ⚙️ Окружение и Запуск
* **Node.js**: Версия `>=22.0.0` (настроена по умолчанию `v22.22.3` через `nvm alias default`).
* **Docker**: Требуется для запуска PostgreSQL.
* **Скрипты монорепозитория** (в корневом [package.json](file:///home/invigar/IT/Development/Zubriks/package.json)):
  * `pnpm dev` — запуск бэкенда и фронтенда параллельно (поддерживает флаг `--host` для локальной сети).
  * `pnpm lint` — проверка линтинга всего проекта.
  * `pnpm types` — проверка типов TypeScript для фронтенда и бэкенда.
  * `pnpm prettify` — автоматическое форматирование кода Prettier.
  * `pnpm db:up` — запуск PostgreSQL через Docker.
  * `pnpm db:down` — остановка PostgreSQL.
  * `pnpm db:migrate` — применение миграций Prisma.
  * `pnpm db:seed` — заполнение БД начальными данными.
  * `pnpm db:studio` — веб-интерфейс Prisma Studio.
  * `pnpm db:reset` — полный сброс БД (миграции + seed заново).

---

## 🗄️ База данных (Prisma + PostgreSQL)

### Модели
Схема находится в [backend/prisma/schema.prisma](file:///home/invigar/IT/Development/Zubriks/backend/prisma/schema.prisma).

| Модель | Описание |
|--------|----------|
| **User** | Авторизация (email + пароль; позже OAuth через VK/Yandex) |
| **Zubrik** | Коллекционный персонаж с координатами (`latitude`, `longitude`, `locationName`) |
| **UserZubrik** | Связь пользователь ↔ найденный зубрик |
| **Event** | Городское событие (дата, время, место, категория, цена, imageUrl) |
| **Route** | Маршрут. `isMain=true` — главный тур «Зубрики» |
| **Waypoint** | Точка маршрута с `orderIndex` для гарантированного порядка |
| **UserRoute** | Связь пользователь ↔ маршрут (liked, started, completed) |
| **UserWaypoint** | Связь пользователь ↔ пройденная точка маршрута |
| **Achievement** | Игровое достижение (картинка `imageUrl`, описание) |
| **UserAchievement**| Связь пользователь ↔ достижение (earned, progress, earnedAt) |

### Ключевые решения
* `coordinates: [number, number, string]` разбиты на 3 поля в БД для индексации и типобезопасности.
* `unlocked` / `liked` перенесены в связующие таблицы (привязка к User).
* `stops` вычисляется из `waypoints._count` (не хранится отдельно).
* Seed-скрипт: [backend/prisma/seed.ts](file:///home/invigar/IT/Development/Zubriks/backend/prisma/seed.ts).
* Prisma Client singleton: [backend/src/prisma.ts](file:///home/invigar/IT/Development/Zubriks/backend/src/prisma.ts).

### Первый запуск БД
```bash
pnpm db:up          # Поднять PostgreSQL в Docker
pnpm db:migrate     # Создать таблицы (первая миграция)
pnpm db:seed        # Заполнить данными
pnpm dev            # Запустить проект
```

---

## 🛠️ Выполненные доработки
В ходе сессий были сделаны следующие улучшения:

1. **Функция «Найти меня» и Карты**:
   * Интегрирована утилита [openInMaps.ts](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/utils/openInMaps.ts) для открытия координат Зубрика в системных картах (Google Maps, Яндекс.Карты) через `geo:` ссылки.
   * На экране деталей [ZubrikDetail.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/ZubrikDetail.tsx) встроена интерактивная мини-карта (`react-leaflet`) с кастомной иконкой Зубрика и отключенными жестами зума/скролла для удобства мобильного скроллинга.
   * Убрана панель копирайтов (`attributionControl={false}`) в превью-картах.
   * Реализовано плавное центрирование карты при выборе Зубрика как на самой карте, так и из горизонтального списка внизу.

2. **Клиентский расчёт расстояния**:
   * Создана утилита [distance.ts](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/utils/distance.ts) для расчёта расстояния по формуле гаверсинусов (Haversine).
   * Вычисление дистанции перенесено на клиентскую сторону (работает на [HomeScreen.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/HomeScreen.tsx) и [MapScreen.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/MapScreen.tsx)).

3. **Интеграция Маршрутов**:
   * Подключен эндпоинт `getRoutes` в API бэкенда [trpc.ts](file:///home/invigar/IT/Development/Zubriks/backend/src/trpc.ts).
   * На экране [RoutesScreen.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/RoutesScreen.tsx) реализовано получение списка маршрутов с сервера, фильтрация по вкладкам («Все», «Избранные») и возможность открывать оверлей активного прохождения [RouteActive.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/RouteActive.tsx).

4. **Интерактивный Поиск**:
   * На карте реализована поисковая строка, фильтрующая персонажей по имени и названию места с отображением результатов в выпадающем окне. Клик по результату центрирует карту и открывает карточку.

5. **Ошибки и Сеть**:
   * Для тестирования в LAN бэкенд-хост в [trpc.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/lib/trpc.tsx) вычисляется динамически из `window.location.hostname` (решает ошибку `Failed to Fetch`).
   * Внедрены типы-заглушки для `react-dom/client` and `canvas-confetti`, исправлены опечатки в скриптах запуска.

6. **База данных (Prisma + PostgreSQL)**:
   * Создана Prisma-схема с 8 моделями (User, Zubrik, Event, Route, Waypoint + 3 связующие таблицы).
   * PostgreSQL поднимается через Docker Compose.
   * Mock-данные мигрированы в seed-скрипт.
   * tRPC-роутер переписан на Prisma-запросы.
   * Добавлен новый эндпоинт `getRouteWaypoints` для получения точек конкретного маршрута.
   * Модель User подготовлена для будущей авторизации (email/пароль → VK/Yandex OAuth).

 7. **Подключение Экрана Событий (EventsScreen)**:
    * Экран событий [EventsScreen.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/EventsScreen.tsx) успешно подключен к API через tRPC (`getEvents`).
    * Добавлено получение реальных данных: дата, время, цена, место проведения и изображения (`imageUrl`).
    * Реализовано динамическое извлечение уникальных дат для навигационных вкладок. Если у события нет изображения, отображается подходящее по категории эмодзи-фолбек.

 8. **Оформление и оптимизация Главного маршрута (Тур Зубрики)**:
    * Заменена старая иконка-эмодзи на полноразмерное изображение `Tour-Zubriki.png` (находится в `frontend/public/images/Tour-Zubriki.png`, доступно по пути `/images/Tour-Zubriki.png`).
    * В [RoutesScreen.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/RoutesScreen.tsx) и [HomeScreen.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/HomeScreen.tsx) баннер главного маршрута был переделан: изображение растянуто во всю ширину и высоту шапки (`absolute inset-0 w-full h-full object-cover`).
    * Добавлен затемняющий градиент поверх изображения (`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent`) для обеспечения высокой читаемости текста названия маршрута.
    * **Оптимизация API**: На бэкенде в [trpc.ts](file:///home/invigar/IT/Development/Zubriks/backend/src/trpc.ts) добавлен новый эндпоинт `getMainRoute`. В [HomeScreen.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/HomeScreen.tsx) тяжелый вызов `getRoutes` заменен на `getMainRoute`, устранены дублирующиеся запросы, исправлены конфликты переменных и очищен неиспользуемый код.

 9. **Интеграция системы достижений (Ачивок)**:
    * В схему БД добавлены модели `Achievement` и связующая `UserAchievement` (для отслеживания прогресса и статуса "earned" для каждого пользователя).
    * `seed.ts` дополнен 8 базовыми достижениями. У каждого теперь есть `imageUrl` вместо старых эмодзи.
    * В tRPC (`backend/src/trpc.ts`) добавлен эндпоинт `getAchievements` для получения списка достижений из базы.
    * Экран профиля [ProfileScreen.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/ProfileScreen.tsx) переведен с моковых данных на серверные (`trpc.getAchievements.useQuery()`), реализована отрисовка изображений и UI-состояний загрузки.

 10. **Система Авторизации и Онбординга**:
     * Спроектирована архитектура для сессий на основе JWT (`accessToken`, `refreshToken`) с хранением в безопасных **HttpOnly** куках.
     * В Prisma-схему добавлены модели `RefreshToken` и `OAuthAccount` (задел для будущей интеграции VK и Яндекс авторизации).
     * В API бэкенда (`backend/src/trpc.ts` и `auth.ts`) реализованы эндпоинты `register`, `login`, `logout` и `me`, а также middleware `protectedProcedure`.
     * Настроена передача кук между фронтендом и бэкендом (свойство `credentials: 'include'` в tRPC-клиенте).
     * Старые моковые проверки (`unlocked: false`) в `getZubriks` и `getAchievements` переписаны на проверку реального прогресса авторизованного пользователя (`ctx.userId`).
     * Экран авторизации элегантно объединен с онбордингом (`OnboardingScreen.tsx`): 3-й слайд теперь отображает кнопки "Использовать E-mail", "ВКонтакте", "Яндекс", при нажатии на E-mail открывается инлайн-форма с перехватчиком Zod-ошибок.
     * `App.tsx` обновлен: теперь онбординг является обязательным шлюзом перед доступом к главному приложению. Возвращающиеся пользователи (у которых протухла сессия) автоматически попадают на 3-й экран авторизации.

 11. **Оживление Профиля (Статистика Пользователя)**:
     * На бэкенде создан новый эндпоинт `getProfileStats`, который собирает полную сводку по пользователю: количество дней с момента регистрации, найденные зубрики, пройденные маршруты, а также списки созданных (`createdRoutes`) и лайкнутых (`likedRoutes`) маршрутов.
     * `ProfileScreen.tsx` подключен к реальным данным: в шапке отображается аватарка, имя и почта. Вкладки «Маршруты» и «Избранное» теперь рендерят настоящие карточки маршрутов (через компонент `RouteCard`).

 12. **Аудит и рефакторинг кода (19 исправлений)**:
     * **Безопасность (6 критических)**:
       * JWT-секреты: убраны хардкод-фоллбеки, добавлена функция `requireEnv()` — в production крашится без env-переменных, в dev использует детерминированные фоллбеки.
       * CORS: `origin: true` заменён на `process.env.CORS_ORIGINS` (whitelist), в dev по-прежнему разрешает все.
       * Добавлена **ротация refresh-токенов** прямо в `createContext` — при протухшем access-токене автоматически проверяет refresh, генерит новую пару и ставит куки. Больше нет «вечного разлогина через 15 минут».
       * Очистка просроченных refresh-токенов при каждом `login`/`register`.
       * `clearAuthCookies` теперь передаёт те же `httpOnly`/`secure`/`sameSite` флаги, что и при установке (иначе браузер не удалял куки).
       * URL API на фронтенде: вместо хардкода `http://` теперь `${window.location.protocol}//...` + поддержка `VITE_API_URL`.
     * **Бизнес-логика (6 средних)**:
       * `liked: false` в `getRoutes` заменён на реальный запрос к `UserRoute` для текущего пользователя.
       * `completed: false` в `getRouteWaypoints` заменён на реальный запрос к `UserWaypoint`.
       * Все процедуры переведены на `ctx.prisma` (ранее некоторые использовали модульный импорт `prisma` напрямую).
       * Расчёт `daysInApp` исправлен: `Math.floor(...) + 1` вместо `Math.max(1, Math.floor(...))`.
       * `initialStep` в `OnboardingScreen` теперь приоритетнее stale значения из `sessionStorage`.
       * Фоллбек ошибок заменён с `err.message` на «Произошла ошибка. Попробуйте позже.» (защита от утечки серверных сообщений).
     * **Чистота кода (6)**:
       * Удалены неиспользуемые: импорт `orderBy` из lodash, тип `Achievement`, 10 строк закомментированного мок-кода, экспорт `verifyRefreshToken` (теперь используется).
       * `mapRoute` типизирован (убран `any`).
       * `RouteCard` вынесен из тела `ProfileScreen` в отдельный компонент с типом `RouteInfo`.
       * Добавлена кнопка **«Выйти»** в профиль с `trpc.logout.useMutation`.
       * Порт сервера вынесен в `process.env.PORT`.
     * **Производительность (1 + миграция)**:
       * Добавлены индексы в БД: `RefreshToken.userId`, `Event.date`, `UserRoute.userId`, `UserAchievement.userId`.
       * Миграция: `20260620170447_add_indexes_and_optimizations`.

---

## 🚀 Вектор дальнейшего развития
* **OAuth Интеграция**: Прикрутить реальные ключи VK API / Яндекс API к созданным кнопкам-заглушкам и реализовать обмен кодов на JWT-сессии + CSRF state параметр.
* **RouteActive → БД**: Подключить [RouteActive.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/RouteActive.tsx) к `getRouteWaypoints` вместо захардкоженных `mockWaypoints`.
* **Геймификация**: Реализовать проверку приближения игрока к Зубрику по GPS-координатам для его автоматической разблокировки и открытия ачивки через [AchievementUnlock.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/AchievementUnlock.tsx).
* **Маршруты на карте**: Добавить прорисовку линий маршрута непосредственно на карте с использованием Leaflet Polyline.
* **Создание маршрутов**: Функция добавления собственных маршрутов пользователями (Route + Waypoints).
* **Оптимизация `getRoutes`**: Объединить 2 отдельных запроса (main + non-main) в один с пост-фильтрацией.


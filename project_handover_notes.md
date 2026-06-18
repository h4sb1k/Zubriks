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
* **Node.js**: Версия `>=22.0.0` (в сессии использовалась установленная через NVM `v22.22.3`).
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
   * Внедрены типы-заглушки для `react-dom/client` и `canvas-confetti`, исправлены опечатки в скриптах запуска.

6. **База данных (Prisma + PostgreSQL)**:
   * Создана Prisma-схема с 8 моделями (User, Zubrik, Event, Route, Waypoint + 3 связующие таблицы).
   * PostgreSQL поднимается через Docker Compose.
   * Mock-данные мигрированы в seed-скрипт.
   * tRPC-роутер переписан на Prisma-запросы.
   * Добавлен новый эндпоинт `getRouteWaypoints` для получения точек конкретного маршрута.
   * Модель User подготовлена для будущей авторизации (email/пароль → VK/Yandex OAuth).

---

## 🚀 Вектор дальнейшего развития
* **Авторизация**: Реализовать регистрацию/логин (email → VK/Yandex OAuth). Привязка `unlocked`, `liked`, `completed` к конкретному пользователю.
* **EventsScreen**: Подключить экран событий [EventsScreen.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/EventsScreen.tsx) к обновлённому `getEvents` из tRPC (дата, цена, imageUrl уже в БД).
* **RouteActive → БД**: Подключить [RouteActive.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/RouteActive.tsx) к `getRouteWaypoints` вместо захардкоженных `mockWaypoints`.
* **Геймификация**: Реализовать проверку приближения игрока к Зубрику по GPS-координатам для его автоматической разблокировки и открытия ачивки через [AchievementUnlock.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/AchievementUnlock.tsx).
* **Маршруты на карте**: Добавить прорисовку линий маршрута непосредственно на карте с использованием Leaflet Polyline.
* **Создание маршрутов**: Функция добавления собственных маршрутов пользователями (Route + Waypoints).

# Handover Notes: Zubriks Project

Этот документ содержит краткую справку по текущей архитектуре, выполненным задачам и окружению проекта **Zubriks**, чтобы помочь быстро войти в курс дела при следующем запуске.

---

## 📌 Обзор проекта
**Zubriks (Зубрики)** — это интерактивный пешеходный гид по городу Орёл. Пользователи могут исследовать карту, искать коллекционных персонажей (Зубриков), проходить экскурсионные маршруты и просматривать городские события.

* **Архитектура**: Монорепозиторий (pnpm workspace).
* **Бэкенд**: Node.js + Express + tRPC API. Находится в каталоге [backend/](file:///home/invigar/IT/Development/Zubriks/backend).
* **Фронтенд**: React + TypeScript + TailwindCSS + Leaflet + Vite. Находится в каталоге [frontend/](file:///home/invigar/IT/Development/Zubriks/frontend).

---

## ⚙️ Окружение и Запуск
* **Node.js**: Версия `>=22.0.0` (в сессии использовалась установленная через NVM `v22.22.3`).
* **Скрипты монорепозитория** (в корневом [package.json](file:///home/invigar/IT/Development/Zubriks/package.json)):
  * `pnpm dev` — запуск бэкенда и фронтенда параллельно (поддерживает флаг `--host` для локальной сети).
  * `pnpm lint` — проверка линтинга всего проекта.
  * `pnpm types` — проверка типов TypeScript для фронтенда и бэкенда.
  * `pnpm prettify` — автоматическое форматирование кода Prettier.

---

## 🛠️ Выполненные доработки
В ходе текущей сессии были сделаны следующие улучшения:

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

---

## 🚀 Вектор дальнейшего развития
* **EventsScreen**: Подключить экран событий [EventsScreen.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/EventsScreen.tsx) к эндпоинту `getEvents` из tRPC API бэкенда.
* **Геймификация**: Реализовать проверку приближения игрока к Зубрику по GPS-координатам для его автоматической разблокировки и открытия ачивки через [AchievementUnlock.tsx](file:///home/invigar/IT/Development/Zubriks/frontend/src/app/components/AchievementUnlock.tsx).
* **Маршруты**: Добавить прорисовку линий маршрута непосредственно на карте с использованием Leaflet Polyline.

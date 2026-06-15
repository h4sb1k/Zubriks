Design a mobile application called "Зубрики" — a city guide for Orel, Russia, 
inspired by the "Homlin" figurines concept from Kaliningrad. The app helps users 
discover the city through collectible mascot characters called "Zubrik", 
earn achievements, and build custom routes.

---

BRAND & VISUAL IDENTITY

App name: Зубрики
Tagline: Открой Орёл по-новому
Character: A stylized bison calf (зубрёнок) — cute, slightly mischievous, 
urban explorer aesthetic. Used as mascot icons throughout the UI.

Color palette:
- Primary: Deep forest green #1A3D2B (trust, nature, Oryol region)
- Accent: Warm amber #E8922A (energy, discovery, achievement glow)
- Surface: Off-white #F5F2EB (warm, paper-like, not harsh white)
- Text primary: #1C1C1E
- Text secondary: #6B6B6B
- Background: #FAFAF7
- Achievement gold: #D4A017
- Success GPS ping: #34C759

Typography:
- Headlines: Rounded, slightly playful sans-serif (e.g. Nunito or Unbounded)
- Body: Clean modern sans (Inter or SF Pro)
- Accent labels: Uppercase tracking 0.08em, small size

Style: Minimalist, warm, adventurous. NOT cartoonish. NOT corporate. 
Think: Duolingo's approachability × Airbnb's polish × Strava's energy.
Subtle use of soft shadows, rounded corners (radius 16-24px on cards), 
micro-illustrations of Zubrik characters. No heavy gradients — use 
flat color blocks with occasional warm amber accents.

---

SCREENS TO DESIGN (iPhone 14 Pro, 393×852pt)

1. SPLASH / ONBOARDING (3 screens)
- Screen 1: Full-bleed illustration of Orel city skyline at golden hour with 
  a Zubrik character in foreground. App name centered. "Начать путешествие" CTA button.
- Screen 2: Feature highlight — map with pins shaped like Zubrik heads. 
  Text: "Найди всех зубриков в городе"
- Screen 3: Achievement preview — grid of blurred achievement badges, 
  one unlocked (glowing amber). Text: "Собери свою коллекцию"
- Auth buttons: ВКонтакте (blue), Яндекс (red), Макс (purple). 
  Pill-shaped, full width, with brand logos. "Войти как гость" text link below.

2. HOME SCREEN (Главная)
- Top: Greeting + user avatar. "Привет, [Имя]! 👋 Исследуй Орёл"
- Featured card (large, full width): "Тур «Зубрики»" — hero image of Orel 
  landmark, amber badge "Главный маршрут", start button
- Section "Зубрики рядом": horizontal scroll of character cards. 
  Each card: Zubrik illustration + name + distance + lock/unlock state
- Section "События сегодня": compact event cards from Yandex Afisha 
  (image thumbnail, title, time, venue pill tag)
- Bottom tab bar: Home · Map · Routes · Events · Profile
  Icons: outline style, amber fill when active. Smooth pill indicator.

3. MAP SCREEN (Карта)
- Full-screen map (Yandex Maps style, warm muted color scheme)
- Custom pins: Zubrik head icons (green = not visited, amber = visited, 
  gray = locked). Slight drop shadow on pins.
- Floating search bar at top: rounded, "Найти место или зубрика..."
- Bottom sheet (draggable): shows nearby Zubrik cards in horizontal scroll
- GPS ping animation: pulsing green circle when user is within 15m of a point
- Active route overlay: dashed amber line connecting route waypoints
- FAB button: "Мои маршруты" with route icon

4. ZUBRIK CHARACTER DETAIL PAGE
- Full-width header image: Zubrik character illustration + real photo 
  of their physical location in Orel
- Character name in large rounded font. Small status badge: "Найден ✓" or "Не найден"
- Tabs: "История" · "Где найти" · "Фото сообщества"
- Story section: flowing paragraph text with decorative chapter initial letter
- Location card: mini-map thumbnail + address + "Построить маршрут" button
- "Найди меня!" button — large amber CTA, leads to GPS verification flow

5. ROUTES SCREEN (Маршруты)
- Top: Filter pills — "Все" · "Зубрики" · "Мои" · "Избранные"
- "Тур «Зубрики»" hero card: full-width with route stats 
  (distance, stops count, avg time). "В путь →" amber button.
- Regular route cards: 2-column grid. Card shows: cover image, 
  route name, distance tag, duration tag, author avatar + name, 
  heart icon for save.
- FAB: "+" to create new route
- Route builder flow: map with tap-to-add waypoints, name field, 
  cover photo upload, "Опубликовать" button

6. ROUTE ACTIVE / "В ПУТЬ" SCREEN
- Compact top bar: route name + progress (step 2 of 5)
- Progress bar: segmented, green fill for completed steps
- Next waypoint card: large, shows Zubrik illustration + location name 
  + distance remaining
- "Открыть в картах" button: shows Yandex Maps / Google Maps / 2GIS icons 
  in a bottom sheet selector
- GPS status indicator: live pulsing dot
- "Маршрут завершён" celebration screen: confetti, unlocked achievement 
  badge animation, amber glow effect, "Поделиться" button

7. EVENTS SCREEN (События)
- Header: "Что происходит в Орле"
- Date selector: horizontal scroll of date pills (today highlighted in amber)
- Event cards (list view): 
  - Large cover image (16:9)
  - Title (2 lines max)
  - Date + time · Venue name · Price or "Бесплатно"
  - Category tag (pill): Концерт / Выставка / Фестиваль
- "Источник: Яндекс Афиша" attribution at bottom

8. PROFILE SCREEN (Профиль)
- Top section: Avatar (large circle) + Username + "Исследователь Орла" subtitle
- Stats row: visited Zubriks count · routes completed · days active
- Achievement showcase: top 3 earned badges displayed prominently. 
  Tap to see all. Locked achievements shown as silhouettes.
- Tabs: Ачивки · Маршруты · Избранное · Отзывы
- Ачивки tab: masonry grid of achievement badges. Earned = full color + glow. 
  Locked = grayscale + lock overlay. Progress ring on partially unlocked ones.
- Achievement badge design: hexagonal shape, Zubrik motif, amber/gold palette, 
  name below.

9. ACHIEVEMENT UNLOCK ANIMATION SCREEN (modal overlay)
- Dark overlay background
- Achievement badge scales in from center with bounce easing
- Particle/sparkle effect around badge (amber + gold)
- Badge name in large text: "Начало пути"
- Subtitle: "Ты нашёл своего первого зубрика!"
- "Поделиться" secondary CTA · "Продолжить" primary CTA

---

COMPONENT LIBRARY TO INCLUDE

- Button variants: Primary (amber fill, white text, 52pt height, 24pt radius) · 
  Secondary (outlined) · Ghost (text only) · Icon button
- Cards: Route card · Event card · Zubrik character card · Achievement badge card
- Map pins: Zubrik head silhouette in 3 states (visited/unvisited/locked)
- Achievement badge: Hexagonal, 3 states (locked/in-progress/earned)
- Tab bar with active state
- Bottom sheet component
- GPS status indicator with pulse animation spec
- Progress bar (segmented for route steps)
- Tag/pill variants: category tag, distance tag, duration tag, status badge

---

INTERACTION NOTES FOR PROTOTYPING

- Tab bar: smooth fade + scale on active state
- Route card: tap → slide up to detail
- "В путь" launch → bottom sheet with map app selector
- Achievement unlock: spring animation on badge scale-in
- Map pins: tap → bottom sheet slides up with Zubrik preview
- Zubrik cards: horizontal scroll with snap points

---

DESIGN PRINCIPLES

1. Warmth over coolness — amber accents, off-white backgrounds, rounded everything
2. Characters first — Zubrik illustrations are never decoration, always meaningful
3. Progress is visible — the user always knows how far they've come
4. One action per screen — clear primary CTA, no confusion about what to do next
5. City authenticity — use real Orel landmarks in imagery direction, 
   not generic stock photos
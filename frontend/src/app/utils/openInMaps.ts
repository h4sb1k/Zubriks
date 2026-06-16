/**
 * openInMaps.ts
 *
 * Открывает точку или маршрут через универсальный geo: URI.
 *
 * geo: — стандарт RFC 5870, который понимают ВСЕ картографические приложения
 * на Android и iOS (Яндекс Карты, Google Maps, 2GIS, Maps.me и др.).
 * При переходе по geo: ОС сама показывает системную шторку «Открыть с помощью»
 * и предлагает установленные приложения карт — без какого-либо кода с нашей стороны.
 *
 * Fallback на ПК: если geo: не поддерживается (десктопный браузер не знает
 * как его открыть) — открываем Google Maps в браузере.
 */

export type MapPoint = {
  lat: number
  lon: number
  name?: string
}

// ─── Одна точка ───────────────────────────────────────────────────────────────

/**
 * Открыть одну точку — системная шторка ОС выберет приложение.
 *
 * @example
 * openPointInMaps({ lat: 52.9674, lon: 36.0694, name: 'Площадь Ленина' });
 */
export function openPointInMaps(point: MapPoint): void {
  const { lat, lon, name } = point

  // geo:lat,lon?q=lat,lon(Label) — формат с меткой, понимают все приложения
  const label = encodeURIComponent(name ?? '')
  const geoUri = `geo:${lat},${lon}?q=${lat},${lon}(${label})`

  // Fallback для ПК — Google Maps в браузере
  const webFallback = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`

  openGeoUri(geoUri, webFallback)
}

// ─── Маршрут с несколькими точками ────────────────────────────────────────────

/**
 * Открыть маршрут через несколько точек.
 * Первая — старт, последняя — финиш, остальные — промежуточные.
 *
 * Минимум 2 точки. При одной точке вызывает openPointInMaps.
 *
 * @example
 * openRouteInMaps([
 *   { lat: 52.9674, lon: 36.0694, name: 'Старт' },
 *   { lat: 52.9701, lon: 36.0732 },
 *   { lat: 52.9750, lon: 36.0800, name: 'Финиш' },
 * ]);
 */
export function openRouteInMaps(points: MapPoint[]): void {
  if (points.length === 0) return
  if (points.length === 1) {
    openPointInMaps(points[0])
    return
  }

  const finish = points[points.length - 1]

  // geo: не поддерживает промежуточные точки — это ограничение стандарта.
  // Все приложения получат маршрут «до финиша», используя текущую геолокацию
  // пользователя как старт (самый удобный UX для пешеходных маршрутов).
  const label = encodeURIComponent(finish.name ?? '')
  const geoUri = `geo:${finish.lat},${finish.lon}?q=${finish.lat},${finish.lon}(${label})`

  // Fallback для ПК — Google Maps с полным маршрутом через waypoints
  const webFallback = buildGoogleMapsWebUrl(points)

  openGeoUri(geoUri, webFallback)
}

// ─── Вспомогательные ─────────────────────────────────────────────────────────

/**
 * Выполняет переход по geo: URI.
 * На мобильном — ОС показывает системную шторку выбора приложения.
 * На ПК — через 1.5 с открывает webFallback (Google Maps в браузере),
 * если страница не ушла в фон.
 */
function openGeoUri(geoUri: string, webFallback: string): void {
  const startedAt = Date.now()

  const fallbackTimer = setTimeout(() => {
    // Страница осталась активной → geo: не был обработан (ПК)
    if (Date.now() - startedAt < 2500) {
      window.open(webFallback, '_blank', 'noopener,noreferrer')
    }
  }, 1500)

  const onHide = () => {
    // Страница ушла в фон → приложение открылось, fallback не нужен
    clearTimeout(fallbackTimer)
    document.removeEventListener('visibilitychange', onHide)
  }
  document.addEventListener('visibilitychange', onHide)

  window.location.href = geoUri
}

/** Google Maps Web URL с полным маршрутом — используется только как ПК-fallback */
function buildGoogleMapsWebUrl(points: MapPoint[]): string {
  const start = points[0]
  const finish = points[points.length - 1]
  const via = points.slice(1, -1)

  const waypointsParam =
    via.length > 0 ? `&waypoints=${encodeURIComponent(via.map((p) => `${p.lat},${p.lon}`).join('|'))}` : ''

  return (
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${start.lat},${start.lon}` +
    `&destination=${finish.lat},${finish.lon}` +
    `&travelmode=walking` +
    waypointsParam
  )
}

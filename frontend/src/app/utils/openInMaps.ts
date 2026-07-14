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

// ─── Определение устройства ───────────────────────────────────────────────────

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// ─── Одна точка ───────────────────────────────────────────────────────────────

/**
 * Открыть одну точку.
 * На мобильных (Android/iOS) — системная шторка ОС выберет установленное приложение карт.
 * На ПК — сразу открываем Яндекс.Карты в новой вкладке браузера.
 */
export function openPointInMaps(point: MapPoint): void {
  const { lat, lon, name } = point

  if (isMobile()) {
    const label = encodeURIComponent(name ?? '')
    window.location.href = `geo:${lat},${lon}?q=${lat},${lon}(${label})`
  } else {
    const yandexUrl = `https://yandex.ru/maps/?rtext=~${lat},${lon}&rtt=pd`
    window.open(yandexUrl, '_blank', 'noopener,noreferrer')
  }
}

// ─── Маршрут с несколькими точками ────────────────────────────────────────────

/**
 * Открыть маршрут.
 */
export function openRouteInMaps(points: MapPoint[]): void {
  if (points.length === 0) return
  if (points.length === 1) {
    openPointInMaps(points[0])
    return
  }

  if (isMobile()) {
    const finish = points[points.length - 1]
    const label = encodeURIComponent(finish.name ?? 'Финиш маршрута')
    window.location.href = `geo:${finish.lat},${finish.lon}?q=${finish.lat},${finish.lon}(${label})`
  } else {
    const rtext = '~' + points.map((p) => `${p.lat},${p.lon}`).join('~')
    const yandexUrl = `https://yandex.ru/maps/?rtext=${rtext}&rtt=pd`
    window.open(yandexUrl, '_blank', 'noopener,noreferrer')
  }
}

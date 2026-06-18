/**
 * Вычисляет расстояние между двумя гео-координатами по формуле гаверсинусов (Haversine formula).
 * Возвращает отформатированную строку расстояния (например, "150м" или "1.2км").
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371000 // Радиус Земли в метрах
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Расстояние в метрах

  if (distance < 1000) {
    return `${Math.round(distance)}м`
  } else {
    return `${(distance / 1000).toFixed(1)}км`
  }
}

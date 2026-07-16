export type POI = {
  id: string
  lat: number
  lon: number
  name: string
  type: string
}

let poiCache: POI[] | null = null
let lastFetch = 0
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

export async function fetchOrelPOIs(): Promise<POI[]> {
  if (poiCache && Date.now() - lastFetch < CACHE_TTL) {
    return poiCache
  }

  // Bounding box for Orel city
  const query = `
    [out:json][timeout:15];
    (
      node["historic"](52.88,35.95,53.02,36.25);
      node["tourism"~"museum|attraction|gallery|viewpoint"](52.88,35.95,53.02,36.25);
    );
    out body;
  `

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Zubriks-App/1.0',
      },
    })

    if (!response.ok) {
      console.error('Overpass API error:', response.statusText)
      return poiCache || []
    }

    const data: any = await response.json()
    const elements = data.elements || []

    const pois: POI[] = elements
      .filter((el: any) => el.tags && el.tags.name) // Only keep named POIs
      .map((el: any) => ({
        id: el.id.toString(),
        lat: el.lat,
        lon: el.lon,
        name: el.tags.name,
        type: el.tags.historic || el.tags.tourism || 'attraction',
      }))

    poiCache = pois
    lastFetch = Date.now()
    return pois
  } catch (error) {
    console.error('Error fetching POIs from Overpass:', error)
    return poiCache || []
  }
}

import { fetchWeatherApi } from './liveWeather'

const GEOCODE_CACHE_KEY = 'kerala-geo-v1'
const WEATHER_CACHE_PREFIX = 'kerala-weather-'
const WEATHER_CACHE_TTL = 1000 * 60 * 10 // 10 minutes
const DYNAMIC_LOC_KEY = 'dynamic-locs-v1'

const districtCatalog = [
  { district: 'Thiruvananthapuram', towns: ['Thiruvananthapuram', 'Neyyattinkara', 'Nedumangad', 'Attingal', 'Varkala', 'Kilimanoor', 'Vizhinjam', 'Kattakada', 'Kazhakkoottam'] },
  { district: 'Kollam', towns: ['Kollam', 'Punalur', 'Karunagappalli', 'Paravur', 'Kottarakara', 'Chavara', 'Pathanapuram', 'Kundara', 'Anchal'] },
  { district: 'Pathanamthitta', towns: ['Pathanamthitta', 'Thiruvalla', 'Adoor', 'Pandalam', 'Konni', 'Mallappally', 'Ranni', 'Kozhencherry'] },
  { district: 'Alappuzha', towns: ['Alappuzha', 'Kayamkulam', 'Cherthala', 'Chengannur', 'Mavelikkara', 'Haripad', 'Ambalappuzha', 'Aroor', 'Kuttanad'] },
  { district: 'Kottayam', towns: ['Kottayam', 'Changanassery', 'Pala', 'Vaikom', 'Ettumanoor', 'Erattupetta', 'Kanjirappally', 'Pambady', 'Kaduthuruthy'] },
  { district: 'Idukki', towns: ['Thodupuzha', 'Kattappana', 'Munnar', 'Adimali', 'Kumily', 'Nedumkandam', 'Vagamon', 'Idukki Township'] },
  { district: 'Ernakulam', towns: ['Kochi', 'Aluva', 'Angamaly', 'North Paravur', 'Perumbavoor', 'Muvattupuzha', 'Kothamangalam', 'Thrippunithura', 'Kalamassery', 'Thrikkakkara', 'Maradu', 'Piravom', 'Koothattukulam'] },
  { district: 'Thrissur', towns: ['Thrissur', 'Guruvayur', 'Kunnamkulam', 'Chavakkad', 'Kodungallur', 'Irinjalakuda', 'Chalakudy', 'Wadakkancherry', 'Ollur', 'Pudukad'] },
  { district: 'Palakkad', towns: ['Palakkad', 'Ottappalam', 'Shornur', 'Chittur', 'Thathamangalam', 'Cherpulassery', 'Mannarkkad', 'Alathur', 'Pattambi'] },
  { district: 'Malappuram', towns: ['Malappuram', 'Manjeri', 'Tirur', 'Ponnani', 'Perinthalmanna', 'Nilambur', 'Kottakkal', 'Kondotty', 'Valanchery', 'Tanur', 'Parappanangadi', 'Tirurangadi'] },
  { district: 'Kozhikode', towns: ['Kozhikode', 'Vatakara', 'Koyilandy', 'Ramanattukara', 'Feroke', 'Mukkam', 'Koduvally', 'Payyoli', 'Thamarassery', 'Balussery'] },
  { district: 'Wayanad', towns: ['Kalpetta', 'Mananthavady', 'Sultan Bathery', 'Vythiri', 'Meenangadi', 'Panamaram'] },
  { district: 'Kannur', towns: ['Kannur', 'Thalassery', 'Taliparamba', 'Payyanur', 'Mattannur', 'Koothuparamba', 'Iritty', 'Panoor', 'Sreekandapuram', 'Anthoor'] },
  { district: 'Kasaragod', towns: ['Kasaragod', 'Kanhangad', 'Nileshwaram', 'Uppala', 'Manjeshwar', 'Kumbla', 'Cheruvathur'] },
]

// Per-town lat/lon to guarantee precise coordinates (fallback to district centroid if missing)
const townCoordinates = {
  // Thiruvananthapuram
  'thiruvananthapuram-thiruvananthapuram': { lat: 8.5241, lon: 76.9366 },
  'neyyattinkara-thiruvananthapuram': { lat: 8.3989, lon: 77.085 },
  'nedumangad-thiruvananthapuram': { lat: 8.6027, lon: 77.0015 },
  'attingal-thiruvananthapuram': { lat: 8.6962, lon: 76.8168 },
  'varkala-thiruvananthapuram': { lat: 8.7379, lon: 76.7166 },
  'kilimanoor-thiruvananthapuram': { lat: 8.7415, lon: 76.8507 },
  'vizhinjam-thiruvananthapuram': { lat: 8.3986, lon: 76.9947 },
  'kattakada-thiruvananthapuram': { lat: 8.5402, lon: 77.0604 },
  'kazhakkoottam-thiruvananthapuram': { lat: 8.5714, lon: 76.8641 },

  // Kollam
  'kollam-kollam': { lat: 8.8932, lon: 76.6141 },
  'punalur-kollam': { lat: 9.005, lon: 76.9226 },
  'karunagappalli-kollam': { lat: 9.0504, lon: 76.544 },
  'paravur-kollam': { lat: 8.7832, lon: 76.6997 },
  'kottarakara-kollam': { lat: 9.0062, lon: 76.7732 },
  'chavara-kollam': { lat: 9.0146, lon: 76.5332 },
  'pathanapuram-kollam': { lat: 9.0999, lon: 76.861 },
  'kundara-kollam': { lat: 8.9684, lon: 76.6996 },
  'anchal-kollam': { lat: 9.0, lon: 76.93 },

  // Pathanamthitta
  'pathanamthitta-pathanamthitta': { lat: 9.2648, lon: 76.787 },
  'thiruvalla-pathanamthitta': { lat: 9.381, lon: 76.5741 },
  'adoor-pathanamthitta': { lat: 9.1591, lon: 76.7336 },
  'pandalam-pathanamthitta': { lat: 9.2235, lon: 76.68 },
  'konni-pathanamthitta': { lat: 9.216, lon: 76.8545 },
  'mallappally-pathanamthitta': { lat: 9.3885, lon: 76.5758 },
  'ranni-pathanamthitta': { lat: 9.3531, lon: 76.8105 },
  'kozhencherry-pathanamthitta': { lat: 9.3209, lon: 76.7027 },

  // Alappuzha
  'alappuzha-alappuzha': { lat: 9.4981, lon: 76.3388 },
  'kayamkulam-alappuzha': { lat: 9.1789, lon: 76.5 },
  'cherthala-alappuzha': { lat: 9.6874, lon: 76.3357 },
  'chengannur-alappuzha': { lat: 9.3152, lon: 76.6151 },
  'mavelikkara-alappuzha': { lat: 9.2593, lon: 76.556 },
  'haripad-alappuzha': { lat: 9.2798, lon: 76.509 },
  'ambalappuzha-alappuzha': { lat: 9.3841, lon: 76.3389 },
  'aroor-alappuzha': { lat: 9.8695, lon: 76.2999 },
  'kuttanad-alappuzha': { lat: 9.4177, lon: 76.475 },

  // Kottayam
  'kottayam-kottayam': { lat: 9.5916, lon: 76.5222 },
  'changanassery-kottayam': { lat: 9.442, lon: 76.5365 },
  'pala-kottayam': { lat: 9.7122, lon: 76.6768 },
  'vaikom-kottayam': { lat: 9.7498, lon: 76.3964 },
  'ettumanoor-kottayam': { lat: 9.6682, lon: 76.5741 },
  'erattupetta-kottayam': { lat: 9.6884, lon: 76.7797 },
  'kanjirappally-kottayam': { lat: 9.5734, lon: 76.7879 },
  'pambady-kottayam': { lat: 9.5462, lon: 76.6297 },
  'kaduthuruthy-kottayam': { lat: 9.7547, lon: 76.4766 },

  // Idukki
  'thodupuzha-idukki': { lat: 9.9038, lon: 76.7184 },
  'kattappana-idukki': { lat: 9.7419, lon: 77.1164 },
  'munnar-idukki': { lat: 10.0892, lon: 77.0597 },
  'adimali-idukki': { lat: 10.0184, lon: 76.9563 },
  'kumily-idukki': { lat: 9.6069, lon: 77.1621 },
  'nedumkandam-idukki': { lat: 9.978, lon: 77.1675 },
  'vagamon-idukki': { lat: 9.6863, lon: 76.9057 },
  'idukki-township-idukki': { lat: 9.8433, lon: 76.9712 },

  // Ernakulam
  'kochi-ernakulam': { lat: 9.9312, lon: 76.2673 },
  'aluva-ernakulam': { lat: 10.1076, lon: 76.3516 },
  'angamaly-ernakulam': { lat: 10.19, lon: 76.3871 },
  'north-paravur-ernakulam': { lat: 10.1412, lon: 76.231 },
  'perumbavoor-ernakulam': { lat: 10.1154, lon: 76.473 },
  'muvattupuzha-ernakulam': { lat: 9.9876, lon: 76.5783 },
  'kothamangalam-ernakulam': { lat: 10.0647, lon: 76.6282 },
  'thrippunithura-ernakulam': { lat: 9.9455, lon: 76.3458 },
  'kalamassery-ernakulam': { lat: 10.051, lon: 76.3344 },
  'thrikkakkara-ernakulam': { lat: 10.048, lon: 76.339 },
  'maradu-ernakulam': { lat: 9.9385, lon: 76.3223 },
  'piravom-ernakulam': { lat: 9.8669, lon: 76.5077 },
  'koothattukulam-ernakulam': { lat: 9.8875, lon: 76.607 },

  // Thrissur
  'thrissur-thrissur': { lat: 10.5276, lon: 76.2144 },
  'guruvayur-thrissur': { lat: 10.5945, lon: 76.0411 },
  'kunnamkulam-thrissur': { lat: 10.6466, lon: 76.0705 },
  'chavakkad-thrissur': { lat: 10.5872, lon: 76.01 },
  'kodungallur-thrissur': { lat: 10.2347, lon: 76.1949 },
  'irinjalakuda-thrissur': { lat: 10.3427, lon: 76.2081 },
  'chalakudy-thrissur': { lat: 10.301, lon: 76.337 },
  'wadakkancherry-thrissur': { lat: 10.6545, lon: 76.2688 },
  'ollur-thrissur': { lat: 10.4944, lon: 76.2141 },
  'pudukad-thrissur': { lat: 10.4085, lon: 76.2715 },

  // Palakkad
  'palakkad-palakkad': { lat: 10.7867, lon: 76.6548 },
  'ottappalam-palakkad': { lat: 10.7722, lon: 76.374 },
  'shornur-palakkad': { lat: 10.7613, lon: 76.2702 },
  'chittur-palakkad': { lat: 10.6992, lon: 76.7474 },
  'thathamangalam-palakkad': { lat: 10.7431, lon: 76.7447 },
  'cherpulassery-palakkad': { lat: 10.8606, lon: 76.3093 },
  'mannarkkad-palakkad': { lat: 10.9936, lon: 76.4591 },
  'alathur-palakkad': { lat: 10.6925, lon: 76.5169 },
  'pattambi-palakkad': { lat: 10.803, lon: 76.1899 },

  // Malappuram
  'malappuram-malappuram': { lat: 11.0732, lon: 76.074 },
  'manjeri-malappuram': { lat: 11.1194, lon: 76.1196 },
  'tirur-malappuram': { lat: 10.908, lon: 75.921 },
  'ponnani-malappuram': { lat: 10.7731, lon: 75.9252 },
  'perinthalmanna-malappuram': { lat: 10.9769, lon: 76.2267 },
  'nilambur-malappuram': { lat: 11.2858, lon: 76.2251 },
  'kottakkal-malappuram': { lat: 10.9945, lon: 76.0056 },
  'kondotty-malappuram': { lat: 11.14, lon: 75.963 },
  'valanchery-malappuram': { lat: 10.8825, lon: 76.0717 },
  'tanur-malappuram': { lat: 10.977, lon: 75.8706 },
  'parappanangadi-malappuram': { lat: 11.057, lon: 75.8614 },
  'tirurangadi-malappuram': { lat: 11.054, lon: 75.938 },

  // Kozhikode
  'kozhikode-kozhikode': { lat: 11.2588, lon: 75.7804 },
  'vatakara-kozhikode': { lat: 11.6087, lon: 75.5918 },
  'koyilandy-kozhikode': { lat: 11.444, lon: 75.6954 },
  'ramanattukara-kozhikode': { lat: 11.1366, lon: 75.8719 },
  'feroke-kozhikode': { lat: 11.1806, lon: 75.8414 },
  'mukkam-kozhikode': { lat: 11.33, lon: 75.997 },
  'koduvally-kozhikode': { lat: 11.3042, lon: 75.8957 },
  'payyoli-kozhikode': { lat: 11.5079, lon: 75.6341 },
  'thamarassery-kozhikode': { lat: 11.4157, lon: 75.932 },
  'balussery-kozhikode': { lat: 11.4346, lon: 75.8302 },

  // Wayanad
  'kalpetta-wayanad': { lat: 11.6106, lon: 76.0826 },
  'mananthavady-wayanad': { lat: 11.802, lon: 76.0053 },
  'sultan-bathery-wayanad': { lat: 11.6621, lon: 76.255 },
  'vythiri-wayanad': { lat: 11.5229, lon: 76.0073 },
  'meenangadi-wayanad': { lat: 11.633, lon: 76.134 },
  'panamaram-wayanad': { lat: 11.705, lon: 76.068 },

  // Kannur
  'kannur-kannur': { lat: 11.8745, lon: 75.3704 },
  'thalassery-kannur': { lat: 11.7488, lon: 75.4923 },
  'taliparamba-kannur': { lat: 12.0415, lon: 75.3599 },
  'payyanur-kannur': { lat: 12.1058, lon: 75.2024 },
  'mattannur-kannur': { lat: 11.9261, lon: 75.5804 },
  'koothuparamba-kannur': { lat: 11.823, lon: 75.5684 },
  'iritty-kannur': { lat: 11.9828, lon: 75.6742 },
  'panoor-kannur': { lat: 11.7358, lon: 75.5675 },
  'sreekandapuram-kannur': { lat: 12.0767, lon: 75.3792 },
  'anthoor-kannur': { lat: 11.9179, lon: 75.3817 },

  // Kasaragod
  'kasaragod-kasaragod': { lat: 12.4996, lon: 74.9869 },
  'kanhangad-kasaragod': { lat: 12.3316, lon: 75.087 },
  'nileshwaram-kasaragod': { lat: 12.25, lon: 75.107 },
  'uppala-kasaragod': { lat: 12.6839, lon: 74.9045 },
  'manjeshwar-kasaragod': { lat: 12.7066, lon: 74.8889 },
  'kumbla-kasaragod': { lat: 12.562, lon: 74.9668 },
  'cheruvathur-kasaragod': { lat: 12.2843, lon: 75.15 },
}

// District-level centroids (approx) to guarantee coordinates even if geocoding fails
const districtCentroids = {
  Thiruvananthapuram: { lat: 8.5241, lon: 76.9366 },
  Kollam: { lat: 8.8932, lon: 76.6141 },
  Pathanamthitta: { lat: 9.2648, lon: 76.787 },
  Alappuzha: { lat: 9.4981, lon: 76.3388 },
  Kottayam: { lat: 9.5916, lon: 76.5222 },
  Idukki: { lat: 9.85, lon: 76.97 },
  Ernakulam: { lat: 9.9312, lon: 76.2673 },
  Thrissur: { lat: 10.5276, lon: 76.2144 },
  Palakkad: { lat: 10.7867, lon: 76.6548 },
  Malappuram: { lat: 11.0732, lon: 76.074 },
  Kozhikode: { lat: 11.2588, lon: 75.7804 },
  Wayanad: { lat: 11.6106, lon: 76.0835 },
  Kannur: { lat: 11.8745, lon: 75.3704 },
  Kasaragod: { lat: 12.4996, lon: 74.9869 },
}

// --- Dynamic locations (non-Kerala / live search) --------------------------
const loadDynamicLocations = () => {
  try {
    const raw = localStorage.getItem(DYNAMIC_LOC_KEY)
    if (!raw) return []
    return JSON.parse(raw) || []
  } catch {
    return []
  }
}

const saveDynamicLocations = (list) => {
  try {
    localStorage.setItem(DYNAMIC_LOC_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

const dynamicLocations = new Map()
loadDynamicLocations().forEach((loc) => dynamicLocations.set(loc.id, loc))

export const registerDynamicLocation = (loc) => {
  if (!loc?.id) return
  const next = {
    ...loc,
    country: loc.country || 'India',
    region: loc.region || loc.country || '',
    tags: loc.tags || ['Live city'],
    zone: loc.zone || loc.region || loc.country || 'Live city',
    provider: 'weatherapi',
  }
  dynamicLocations.set(next.id, next)
  saveDynamicLocations(Array.from(dynamicLocations.values()))
  return next
}

export const listDynamicLocations = () => Array.from(dynamicLocations.values())

export const geocodeGenericCity = async (name) => {
  if (!name) return null
  if (import.meta.env.MODE === 'test') return null
  // Try open-meteo geocoder without country restriction for global coverage
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const hit = data?.results?.[0]
  if (!hit) return null
  const slug = slugify(`${hit.name}-${hit.country_code || hit.country || 'city'}`)
  return registerDynamicLocation({
    id: slug,
    name: hit.name,
    region: [hit.admin1, hit.country].filter(Boolean).join(', '),
    country: hit.country || hit.country_code,
    lat: hit.latitude,
    lon: hit.longitude,
    tags: ['Live city'],
    zone: hit.admin1 || hit.country || 'Live city',
  })
}

const weatherCodeSummary = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
}

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const flattenPlaces = () =>
  districtCatalog.flatMap(({ district, towns }) =>
    towns.map((name) => ({
      id: slugify(`${name}-${district}`),
      name,
      district,
    })),
  )

const loadGeoCache = () => {
  try {
    const raw = localStorage.getItem(GEOCODE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.ts && Date.now() - parsed.ts < 1000 * 60 * 60 * 24 ? parsed.data : null
  } catch {
    return null
  }
}

const saveGeoCache = (data) => {
  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    // ignore
  }
}

const geocodePlace = async (name) => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json&country=IN`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding failed for ${name}`)
  const data = await res.json()
  return data?.results?.[0] || null
}

const buildGeoQueries = (place) => {
  const base = place.zone || place.district || 'Kerala'
  return [
    `${place.name}, ${base}, Kerala, India`,
    `${place.name}, Kerala, India`,
    `${place.name}, India`,
  ]
}

export const getKeralaLocations = async () => {
  const cached = loadGeoCache()
  if (cached) return cached

  // If not yet geocoded, return catalog seeded with district centroids (never null coords)
  const fallback = flattenPlaces().map((place) => {
    const centroid = districtCentroids[place.district] || {}
    const slug = slugify(`${place.name}-${place.district}`)
    const town = townCoordinates[slug] || {}
    return {
      id: place.id,
      name: place.name,
      region: `${place.district}, Kerala`,
      country: 'India',
      lat: town.lat ?? centroid.lat ?? null,
      lon: town.lon ?? centroid.lon ?? null,
      tags: [place.district],
      zone: place.district,
    }
  })
  return fallback.concat(listDynamicLocations())
}

export const getLocationById = async (id) => {
  // First check dynamic (non-Kerala) locations
  if (dynamicLocations.has(id)) return dynamicLocations.get(id)

  const list = await getKeralaLocations()
  const found = list.find((l) => l.id === id) || null
  if (!found) return null

  // If coordinates are missing, geocode on-demand and persist for future requests.
  if (found.lat == null || found.lon == null) {
    try {
      const queries = buildGeoQueries(found)
      let geo = null
      for (const q of queries) {
        geo = await geocodePlace(q)
        if (geo) break
      }
      if (!geo) throw new Error('Geocoding failed')

      const updated = { ...found, lat: geo.latitude, lon: geo.longitude, country: geo.country || 'India' }
      const nextList = list.map((item) => (item.id === updated.id ? updated : item))
      saveGeoCache(nextList)
      return updated
    } catch {
      // Last resort: fill with district centroid to avoid null coords
      const slug = slugify(`${found.name}-${found.district}`)
      const coord = townCoordinates[slug] || {}
      const centroid = districtCentroids[found.district] || {}
      const lat = coord.lat ?? centroid.lat
      const lon = coord.lon ?? centroid.lon
      if (centroid.lat != null && centroid.lon != null) {
        const updated = { ...found, lat, lon }
        const nextList = list.map((item) => (item.id === updated.id ? updated : item))
        saveGeoCache(nextList)
        return updated
      }
    }
  }
  return found
}

const loadWeatherCache = (id) => {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_PREFIX + id)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.ts && Date.now() - parsed.ts < WEATHER_CACHE_TTL) return parsed.data
    return null
  } catch {
    return null
  }
}

const saveWeatherCache = (id, data) => {
  try {
    localStorage.setItem(WEATHER_CACHE_PREFIX + id, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    // ignore
  }
}

const retry = async (fn, attempts = 10) => {
  let lastError
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

const fetchWeatherRaw = async (lat, lon) => {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: ['temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'wind_speed_10m', 'precipitation', 'cloud_cover', 'uv_index', 'weathercode'].join(','),
    hourly: ['temperature_2m', 'relative_humidity_2m', 'uv_index', 'precipitation_probability', 'precipitation', 'cloud_cover', 'wind_speed_10m', 'weathercode'].join(','),
    daily: ['temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max', 'sunrise', 'sunset', 'uv_index_max', 'weathercode'].join(','),
    forecast_days: 14,
    timezone: 'auto',
  })
  const res = await retry(() => fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`))
  if (!res.ok) throw new Error('Weather fetch failed')
  return res.json()
}

const formatDay = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short' })
}

const mapWeather = (raw, location) => {
  const current = raw.current || {}
  const daily = raw.daily || {}
  const hourly = raw.hourly || {}

  const weather = {
    locationId: location.id,
    temp: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    wind: current.wind_speed_10m,
    precip: typeof current.precipitation === 'number' ? current.precipitation : 0,
    cloudCover: typeof current.cloud_cover === 'number' ? current.cloud_cover / 100 : null,
    uv: current.uv_index,
    summary: weatherCodeSummary[current.weathercode] || 'Weather',
    weathercode: current.weathercode,
    currentTime: current.time,
    sunrise: daily.sunrise?.[0],
    sunset: daily.sunset?.[0],
    rainStreakDays: 0,
    comfortIndex: current.relative_humidity_2m ? Math.max(50, 100 - current.relative_humidity_2m) : 70,
    visibility: null,
    seaTemp: null,
    dewPoint: null,
    locationMeta: {
      name: location.name,
      region: location.region,
      country: location.country,
      lat: location.lat,
      lon: location.lon,
    },
  }

  const hourlyData = []
  const limit = Math.min(24, hourly.time?.length || 0)
  for (let i = 0; i < limit; i += 1) {
    hourlyData.push({
      hour: i + 1,
      temp: hourly.temperature_2m?.[i],
      aqi: null,
      uv: hourly.uv_index?.[i],
      precip: (hourly.precipitation_probability?.[i] || 0) / 100,
      cloud: (hourly.cloud_cover?.[i] || 0) / 100,
    })
  }

  const forecast3 = []
  const forecast14 = []
  const dailyLen = daily.time?.length || 0
  for (let i = 0; i < dailyLen; i += 1) {
    const entry = {
      day: formatDay(daily.time[i]),
      high: daily.temperature_2m_max?.[i],
      low: daily.temperature_2m_min?.[i],
      precip: (daily.precipitation_probability_max?.[i] || 0) / 100,
      uv: daily.uv_index_max?.[i],
      weathercode: daily.weathercode?.[i],
    }
    if (i < 3) forecast3.push(entry)
    if (i < 14) forecast14.push(entry)
  }

  return { weather, hourlyData, forecast3, forecast14 }
}

const weatherCache = new Map()

const mapWeatherApiBundle = (res, location) => {
  if (!res) throw new Error('WeatherAPI response empty')
  const weather = {
    locationId: location.id,
    temp: res.temp,
    feelsLike: res.feelsLike ?? res.temp,
    humidity: res.humidity,
    wind: res.wind,
    precip: res.precip,
    cloudCover: null,
    uv: res.uv,
    summary: res.summary,
    weathercode: null,
    currentTime: res.currentTime,
    sunrise: res.forecast14?.[0]?.sunrise,
    sunset: res.forecast14?.[0]?.sunset,
    rainStreakDays: 0,
    comfortIndex: null,
    visibility: null,
    seaTemp: null,
    dewPoint: null,
    locationMeta: {
      name: location.name,
      region: location.region,
      country: location.country,
      lat: location.lat,
      lon: location.lon,
    },
  }

  const hourlyData = Array.isArray(res.hourly)
    ? res.hourly.map((h, idx) => ({
        hour: h.hour ?? idx + 1,
        temp: h.temp,
        aqi: h.aqi,
        uv: h.uv,
        precip: h.precip,
        cloud: null,
      }))
    : []

  const forecast3 = Array.isArray(res.forecast) ? res.forecast.map((d) => ({ ...d, precip: d.precip ?? 0 })) : []
  const forecast14 = Array.isArray(res.forecast14) ? res.forecast14.map((d) => ({ ...d, precip: d.precip ?? 0 })) : []

  return { weather, hourlyData, forecast3, forecast14 }
}

export const getWeatherBundle = async (locationId) => {
  if (!locationId) return { weather: {}, hourlyData: [], forecast3: [], forecast14: [] }

  const cachedMem = weatherCache.get(locationId)
  if (cachedMem && Date.now() - cachedMem.ts < WEATHER_CACHE_TTL) return cachedMem.data

  const cachedStorage = loadWeatherCache(locationId)
  if (cachedStorage) {
    weatherCache.set(locationId, { ts: Date.now(), data: cachedStorage })
    return cachedStorage
  }

  const location = await getLocationById(locationId)
  if (!location) throw new Error('Unknown location')
  if (location.lat == null || location.lon == null) throw new Error('Coordinates unavailable for this location')

  const useWeatherApi = location.provider === 'weatherapi' || (location.country && location.country.toLowerCase() !== 'india')

  let mapped
  try {
    if (useWeatherApi) {
      const res = await fetchWeatherApi({ lat: location.lat, lon: location.lon })
      mapped = mapWeatherApiBundle(res, location)
    } else {
      const raw = await fetchWeatherRaw(location.lat, location.lon)
      mapped = mapWeather(raw, location)
    }
  } catch (error) {
    console.warn('Weather fetch failed, returning placeholder', error)
    mapped = {
      weather: {
        locationId: location.id,
        temp: '—',
        summary: 'Live data unavailable',
        aqi: null,
        uv: null,
        humidity: null,
        wind: null,
        precip: null,
        currentTime: new Date().toISOString(),
        locationMeta: {
          name: location.name,
          region: location.region,
          country: location.country,
          lat: location.lat,
          lon: location.lon,
        },
      },
      hourlyData: [],
      forecast3: [],
      forecast14: [],
    }
  }

  weatherCache.set(locationId, { ts: Date.now(), data: mapped })
  saveWeatherCache(locationId, mapped)
  return mapped
}

export const emptyAlerts = async () => []
export const emptyRisk = async () => ({})


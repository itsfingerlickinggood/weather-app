import { HttpResponse, delay, http } from 'msw'
import { buildLiveWeather, fetchWeatherApi, searchWeatherApi, shouldUseLiveWeather } from '../lib/liveWeather'

const users = [
  { id: '1', email: 'admin@example.com', password: 'password', name: 'Ava Admin', roles: ['admin', 'user'] },
  { id: '2', email: 'user@example.com', password: 'password', name: 'Uma User', roles: ['user'] },
]

const locationCatalog = {
  tvm: {
    id: 'tvm',
    name: 'Thiruvananthapuram',
    region: 'Kerala, India',
    lat: 8.5241,
    lon: 76.9366,
    provider: 'india',
    city: 'Thiruvananthapuram',
    cityId: 'thiruvananthapuram',
    zone: 'Capital coast',
    tags: ['Arabian Sea breeze', 'Evening showers', 'Beachfront sunsets'],
  },
  cok: {
    id: 'cok',
    name: 'Kochi',
    region: 'Kerala, India',
    lat: 9.9312,
    lon: 76.2673,
    provider: 'india',
    city: 'Kochi',
    cityId: 'kochi',
    zone: 'Backwater & port',
    tags: ['Humid marine layer', 'Backwater breeze', 'Harbour showers'],
  },
  clt: {
    id: 'clt',
    name: 'Kozhikode',
    region: 'Kerala, India',
    lat: 11.2588,
    lon: 75.7804,
    provider: 'india',
    city: 'Kozhikode',
    cityId: 'kozhikode',
    zone: 'Malabar coast',
    tags: ['Sea haze', 'Spice trade winds', 'Warm evenings'],
  },
  idk: {
    id: 'idk',
    name: 'Idukki (Munnar)',
    region: 'Kerala Highlands, India',
    lat: 10.0889,
    lon: 77.0595,
    provider: 'india',
    city: 'Munnar',
    cityId: 'munnar',
    zone: 'High-range hills',
    tags: ['Tea estate mist', 'Cool mornings', 'Valley clouds'],
  },
  alp: {
    id: 'alp',
    name: 'Alappuzha',
    region: 'Kerala, India',
    lat: 9.4981,
    lon: 76.3388,
    provider: 'india',
    city: 'Alappuzha',
    cityId: 'alappuzha',
    zone: 'Backwater belt',
    tags: ['Canal humidity', 'Monsoon downpours', 'Houseboat haze'],
  },
  way: {
    id: 'way',
    name: 'Wayanad',
    region: 'Kerala Highlands, India',
    lat: 11.6854,
    lon: 76.132,
    provider: 'india',
    city: 'Kalpetta',
    cityId: 'kalpetta',
    zone: 'Plateau forests',
    tags: ['Mist trail', 'Cool nights', 'Forest moisture'],
  },
}

const locations = Object.values(locationCatalog)

// Helpers for richer mock data
const makeHours = ({ baseTemp, baseAqi, baseUv, basePrecip, tempStep = 1, precipStep = 0.01 }) =>
  Array.from({ length: 24 }).map((_, idx) => ({
    hour: idx + 1,
    temp: Math.round(baseTemp + tempStep * idx * 0.8),
    aqi: Math.round(baseAqi + idx * 0.6),
    uv: Math.max(0, Math.round(baseUv - idx * 0.4)),
    precip: Math.max(basePrecip, basePrecip + precipStep * idx),
  }))

const buildForecast14 = (baseHigh, baseLow, precipBase = 0.1) =>
  Array.from({ length: 14 }).map((_, idx) => ({
    day: dayLabel(idx),
    high: Math.round(baseHigh + Math.sin(idx / 2) * 3 - idx * 0.2),
    low: Math.round(baseLow + Math.cos(idx / 2) * 2 - idx * 0.1),
    precip: Math.min(1, Math.max(0, precipBase + 0.02 * idx)),
  }))

const climateTrends = {
  tvm: {
    monthlyTemp: [82, 84, 86, 87, 88, 86, 85, 84, 84, 83, 82, 82],
    monthlyRain: [2.5, 1.8, 3.2, 6.8, 11.1, 21.5, 18.4, 15.6, 10.2, 7.5, 4.0, 2.9],
    monthlyHumidity: [75, 76, 78, 80, 82, 86, 88, 87, 85, 82, 78, 76],
  },
  cok: {
    monthlyTemp: [80, 82, 84, 85, 86, 84, 83, 83, 83, 82, 81, 80],
    monthlyRain: [1.9, 1.6, 2.4, 6.1, 13.4, 23.2, 20.1, 16.8, 11.5, 6.4, 3.1, 2.2],
    monthlyHumidity: [78, 79, 80, 82, 84, 87, 89, 88, 86, 83, 80, 79],
  },
  clt: {
    monthlyTemp: [79, 81, 83, 84, 85, 84, 83, 82, 82, 81, 79, 78],
    monthlyRain: [1.6, 1.4, 2.1, 5.9, 12.8, 20.4, 18.9, 15.1, 10.8, 6.0, 3.0, 2.0],
    monthlyHumidity: [74, 75, 77, 79, 81, 84, 86, 85, 83, 80, 76, 75],
  },
  idk: {
    monthlyTemp: [68, 70, 72, 74, 75, 74, 73, 73, 72, 71, 69, 68],
    monthlyRain: [1.8, 1.5, 2.2, 6.3, 13.9, 19.5, 17.6, 14.3, 9.7, 6.2, 3.4, 2.1],
    monthlyHumidity: [80, 81, 82, 83, 85, 86, 87, 86, 84, 82, 80, 79],
  },
  alp: {
    monthlyTemp: [78, 79, 81, 82, 83, 82, 81, 81, 81, 80, 79, 78],
    monthlyRain: [2.0, 1.7, 2.6, 6.9, 14.5, 24.1, 22.4, 19.2, 12.8, 7.1, 3.8, 2.5],
    monthlyHumidity: [82, 83, 84, 86, 88, 90, 91, 90, 88, 85, 83, 82],
  },
  way: {
    monthlyTemp: [70, 71, 73, 75, 76, 75, 74, 74, 73, 72, 71, 70],
    monthlyRain: [1.7, 1.5, 2.3, 6.5, 13.2, 18.6, 17.2, 14.0, 9.4, 5.8, 3.2, 2.0],
    monthlyHumidity: [77, 78, 79, 81, 83, 85, 86, 85, 83, 81, 78, 77],
  },
}

const dayLabel = (offset) => new Date(Date.now() + offset * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })

const weatherById = {
  tvm: {
    summary: 'Sea breeze with stray showers',
    temp: 86,
    feelsLike: 93,
    aqi: 52,
    uv: 8,
    humidity: 78,
    wind: 11,
    precip: 0.18,
    currentTime: '2026-01-13T10:00:00+05:30',
    sunrise: '2026-01-13T06:12:00+05:30',
    sunset: '2026-01-13T18:08:00+05:30',
    seaTemp: 84,
    dewPoint: 77,
    visibility: 7,
    cloudCover: 0.64,
    comfortIndex: 72,
    monsoonPhase: 'Sea breeze + active drizzle',
    rainStreakDays: 2,
    hourly: makeHours({ baseTemp: 84, baseAqi: 50, baseUv: 8, basePrecip: 0.14, tempStep: 1.2, precipStep: 0.02 }),
    forecast: [
      { day: 'Tue', high: 88, low: 79, precip: 0.32 },
      { day: 'Wed', high: 87, low: 78, precip: 0.26 },
      { day: 'Thu', high: 86, low: 78, precip: 0.22 },
    ],
    forecast14: buildForecast14(88, 79, 0.28),
  },
  cok: {
    summary: 'Humid harbour haze with showers',
    temp: 84,
    feelsLike: 91,
    aqi: 58,
    uv: 7,
    humidity: 82,
    wind: 9,
    precip: 0.24,
    currentTime: '2026-01-13T10:00:00+05:30',
    sunrise: '2026-01-13T06:16:00+05:30',
    sunset: '2026-01-13T18:09:00+05:30',
    seaTemp: 85,
    dewPoint: 78,
    visibility: 6,
    cloudCover: 0.7,
    comfortIndex: 68,
    monsoonPhase: 'Port monsoon pulse',
    rainStreakDays: 3,
    hourly: makeHours({ baseTemp: 83, baseAqi: 55, baseUv: 7, basePrecip: 0.18, tempStep: 1, precipStep: 0.03 }),
    forecast: [
      { day: 'Tue', high: 86, low: 79, precip: 0.38 },
      { day: 'Wed', high: 85, low: 78, precip: 0.34 },
      { day: 'Thu', high: 84, low: 77, precip: 0.3 },
    ],
    forecast14: buildForecast14(86, 78, 0.34),
  },
  clt: {
    summary: 'Warm Malabar air with haze',
    temp: 85,
    feelsLike: 90,
    aqi: 62,
    uv: 8,
    humidity: 74,
    wind: 10,
    precip: 0.16,
    currentTime: '2026-01-13T10:00:00+05:30',
    sunrise: '2026-01-13T06:17:00+05:30',
    sunset: '2026-01-13T18:14:00+05:30',
    seaTemp: 83,
    dewPoint: 75,
    visibility: 8,
    cloudCover: 0.55,
    comfortIndex: 74,
    monsoonPhase: 'Humid with late storms',
    rainStreakDays: 1,
    hourly: makeHours({ baseTemp: 83, baseAqi: 60, baseUv: 8, basePrecip: 0.1, tempStep: 1, precipStep: 0.02 }),
    forecast: [
      { day: 'Tue', high: 87, low: 78, precip: 0.28 },
      { day: 'Wed', high: 86, low: 77, precip: 0.24 },
      { day: 'Thu', high: 85, low: 76, precip: 0.2 },
    ],
    forecast14: buildForecast14(87, 78, 0.26),
  },
  idk: {
    summary: 'Mist-laced hills and cool breeze',
    temp: 72,
    feelsLike: 72,
    aqi: 34,
    uv: 6,
    humidity: 82,
    wind: 6,
    precip: 0.12,
    currentTime: '2026-01-13T10:00:00+05:30',
    sunrise: '2026-01-13T06:14:00+05:30',
    sunset: '2026-01-13T18:08:00+05:30',
    seaTemp: null,
    dewPoint: 66,
    visibility: 10,
    cloudCover: 0.5,
    comfortIndex: 88,
    monsoonPhase: 'High-range drizzle',
    rainStreakDays: 1,
    hourly: makeHours({ baseTemp: 71, baseAqi: 32, baseUv: 6, basePrecip: 0.08, tempStep: 0.6, precipStep: 0.01 }),
    forecast: [
      { day: 'Tue', high: 74, low: 64, precip: 0.24 },
      { day: 'Wed', high: 73, low: 63, precip: 0.2 },
      { day: 'Thu', high: 72, low: 62, precip: 0.16 },
    ],
    forecast14: buildForecast14(74, 64, 0.2),
  },
  alp: {
    summary: 'Backwater humidity with steady rain',
    temp: 83,
    feelsLike: 89,
    aqi: 48,
    uv: 6,
    humidity: 85,
    wind: 7,
    precip: 0.3,
    currentTime: '2026-01-13T10:00:00+05:30',
    sunrise: '2026-01-13T06:15:00+05:30',
    sunset: '2026-01-13T18:10:00+05:30',
    seaTemp: 85,
    dewPoint: 79,
    visibility: 6,
    cloudCover: 0.72,
    comfortIndex: 66,
    monsoonPhase: 'Backwater monsoon surge',
    rainStreakDays: 4,
    hourly: makeHours({ baseTemp: 82, baseAqi: 46, baseUv: 6, basePrecip: 0.26, tempStep: 0.9, precipStep: 0.025 }),
    forecast: [
      { day: 'Tue', high: 85, low: 78, precip: 0.46 },
      { day: 'Wed', high: 84, low: 77, precip: 0.4 },
      { day: 'Thu', high: 83, low: 77, precip: 0.36 },
    ],
    forecast14: buildForecast14(85, 78, 0.42),
  },
  way: {
    summary: 'Cool plateau with broken clouds',
    temp: 75,
    feelsLike: 75,
    aqi: 36,
    uv: 6,
    humidity: 78,
    wind: 8,
    precip: 0.1,
    currentTime: '2026-01-13T10:00:00+05:30',
    sunrise: '2026-01-13T06:16:00+05:30',
    sunset: '2026-01-13T18:11:00+05:30',
    seaTemp: null,
    dewPoint: 68,
    visibility: 12,
    cloudCover: 0.48,
    comfortIndex: 84,
    monsoonPhase: 'Light orographic showers',
    rainStreakDays: 1,
    hourly: makeHours({ baseTemp: 74, baseAqi: 34, baseUv: 6, basePrecip: 0.06, tempStep: 0.7, precipStep: 0.015 }),
    forecast: [
      { day: 'Tue', high: 77, low: 66, precip: 0.22 },
      { day: 'Wed', high: 76, low: 65, precip: 0.18 },
      { day: 'Thu', high: 75, low: 65, precip: 0.16 },
    ],
    forecast14: buildForecast14(77, 66, 0.2),
  },
}

const alertsById = {
  tvm: [{ id: 'a1', title: 'Coastal shower band', severity: 'moderate', detail: 'Short, gusty showers expected near Kovalam coast.' }],
  cok: [{ id: 'a2', title: 'Harbour squall watch', severity: 'high', detail: 'Marine winds picking up with choppy backwaters by late afternoon.' }],
  clt: [{ id: 'a3', title: 'Heat and haze', severity: 'moderate', detail: 'Warm Malabar afternoon with reduced visibility; hydrate.' }],
  idk: [{ id: 'a4', title: 'Hill track slippery', severity: 'low', detail: 'Drizzle keeping trails damp around Munnar estates.' }],
  alp: [{ id: 'a5', title: 'Backwater downpour', severity: 'high', detail: 'Monsoon cell could bring 25–40mm rain over canals.' }],
  way: [{ id: 'a6', title: 'Light fog pockets', severity: 'low', detail: 'Early morning mist along forest routes.' }],
}

const disasterRisk = {
  tvm: { score: 26, threats: ['Coastal inundation', 'Urban waterlogging'] },
  cok: { score: 34, threats: ['Harbour flood', 'Lightning near port'] },
  clt: { score: 24, threats: ['Sea haze', 'Localized flood'] },
  idk: { score: 18, threats: ['Landslip on steep roads'] },
  alp: { score: 36, threats: ['Canal flood', 'Thunder gusts'] },
  way: { score: 20, threats: ['Fog-limited visibility'] },
}

const sessions = new Map()
const favorites = { '1': ['tvm'], '2': ['cok'] }
const feedback = [
  { id: 'fb1', userId: '2', message: 'Loving the radar overlay!', createdAt: new Date().toISOString(), status: 'open', response: '' },
]

const apiConfig = {
  primary: 'IndianAPI',
  backup: 'Open-Meteo',
  primaryKey: 'demo-primary',
  backupKey: 'demo-backup',
}

const storyRules = [
  { id: 'rule-1', name: 'Heat narrative', condition: 'temp > 95', template: 'Heat precautions needed.' },
  { id: 'rule-2', name: 'Rain narrative', condition: 'precip > 0.4', template: 'Carry a shell; frequent rain.' },
]

const radarSettings = { layer: 'precip', intervalMinutes: 5 }

const disasterThresholds = { flood: 70, heat: 95, wind: 60, aqi: 150 }

const analyticsUsage = {
  peakUsage: '18:00 IST',
  mostSearched: ['Kochi', 'Thiruvananthapuram', 'Idukki'],
  rateLimit: { limit: 500, remaining: 420, resetInMinutes: 12 },
  views: {
    daily: { users: 128, requests: 420, errors: 2 },
    weekly: { users: 820, requests: 3100, errors: 12 },
    monthly: { users: 3120, requests: 12200, errors: 38 },
  },
}

const useLiveWeather = shouldUseLiveWeather()

const makeToken = (userId, type) => `${type}-${userId}-${Math.random().toString(16).slice(2)}`

const createSession = (userId) => {
  const accessToken = makeToken(userId, 'access')
  const refreshToken = makeToken(userId, 'refresh')
  sessions.set(refreshToken, { accessToken, refreshToken, userId, exp: Date.now() + 1000 * 60 * 15 })
  return { accessToken, refreshToken }
}

const getUserFromLocalHeader = (request) => {
  const header = request.headers.get('x-local-user')
  if (!header) return null
  try {
    const payload = JSON.parse(header)
    const user = users.find((u) => u.email === payload.email) || users[1]
    return user
  } catch (_err) {
    return null
  }
}

const getUserFromRequest = (request) => {
  const local = getUserFromLocalHeader(request)
  if (local) return local

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  const session = [...sessions.values()].find((sess) => sess.accessToken === token && sess.exp > Date.now())
  if (!session) return null
  const user = users.find((u) => u.id === session.userId)
  return user || null
}

const requireAuth = (request) => {
  const user = getUserFromRequest(request)
  if (!user) throw HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return user
}

export const handlers = [
  http.post('/auth/login', async ({ request }) => {
    const body = await request.json()
    const user = users.find((u) => u.email === body.email && u.password === body.password)
    await delay(300)
    if (!user) {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }
    const session = createSession(user.id)
    return HttpResponse.json({
      ...session,
      user: { id: user.id, email: user.email, name: user.name, roles: user.roles },
    })
  }),

  http.post('/auth/refresh', async ({ request }) => {
    const { refreshToken } = await request.json()
    const session = sessions.get(refreshToken)
    await delay(150)
    if (!session) {
      return HttpResponse.json({ message: 'Invalid refresh' }, { status: 401 })
    }
    const nextAccess = makeToken(session.userId, 'access')
    sessions.set(refreshToken, { ...session, accessToken: nextAccess, exp: Date.now() + 1000 * 60 * 15 })
    return HttpResponse.json({ accessToken: nextAccess, refreshToken })
  }),

  http.get('/auth/me', async ({ request }) => {
    const user = getUserFromRequest(request)
    await delay(120)
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    return HttpResponse.json({ user: { id: user.id, email: user.email, name: user.name, roles: user.roles } })
  }),

  http.get('/locations', async () => {
    await delay(120)
    return HttpResponse.json({ locations })
  }),

  http.get('/locations/:id', async ({ params }) => {
    await delay(150)
    const location = locations.find((loc) => loc.id === params.id)
    if (location) return HttpResponse.json({ location })

    const deriveQuery = (val) => {
      if (!val) return null
      if (val.startsWith('q-')) return decodeURIComponent(val.slice(2))
      return val
    }

    if (useLiveWeather) {
      try {
        const query = deriveQuery(params.id)
        let live = await fetchWeatherApi({ q: query })
        if (!live) {
          const matches = await searchWeatherApi({ q: query })
          const first = matches?.[0]
          if (first) {
            live = await fetchWeatherApi({ lat: first.lat, lon: first.lon, q: first.name })
            if (live && first) live.locationMeta = { ...(live.locationMeta || {}), ...first }
          }
        }
        if (live?.locationMeta) {
          const loc = {
            id: params.id,
            name: live.locationMeta.name || params.id,
            region: [live.locationMeta.region, live.locationMeta.country].filter(Boolean).join(', '),
            lat: live.locationMeta.lat,
            lon: live.locationMeta.lon,
            provider: 'weatherapi',
            city: live.locationMeta.name,
            cityId: params.id,
            zone: live.locationMeta.region || live.locationMeta.country || 'Live city',
            tags: ['Live city'],
          }
          return HttpResponse.json({ location: loc })
        }
      } catch (err) {
        console.warn('Live location lookup failed', err)
      }
    }

    return HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  http.get('/weather/:id', async ({ params, request }) => {
    const user = requireAuth(request)
    await delay(140)
    const meta = locationCatalog[params.id]
    const fallback = weatherById[params.id]

    const deriveQuery = (val) => {
      if (!val) return null
      if (val.startsWith('q-')) return decodeURIComponent(val.slice(2))
      return val
    }

    if ((!meta || !fallback) && useLiveWeather) {
      try {
        const query = deriveQuery(params.id)
        let live = await fetchWeatherApi({ q: query })
        if (!live) {
          const matches = await searchWeatherApi({ q: query })
          const first = matches?.[0]
          if (first) {
            live = await fetchWeatherApi({ lat: first.lat, lon: first.lon, q: first.name })
          }
        }
        if (live) return HttpResponse.json({ locationId: params.id, ...live, user: user.id })
      } catch (err) {
        console.warn('Live weather lookup failed', err)
      }
    }

    if (!meta || !fallback) return HttpResponse.json({ message: 'Not found' }, { status: 404 })

    const payload = useLiveWeather ? await buildLiveWeather(meta, fallback) : fallback
    return HttpResponse.json({ locationId: params.id, ...payload, user: user.id })
  }),

  http.get('/weather/:id/hourly', async ({ params, request }) => {
    requireAuth(request)
    await delay(120)
    const meta = locationCatalog[params.id]
    const fallback = weatherById[params.id]
    const deriveQuery = (val) => {
      if (!val) return null
      if (val.startsWith('q-')) return decodeURIComponent(val.slice(2))
      return val
    }
    if ((!meta || !fallback) && useLiveWeather) {
      try {
        const query = deriveQuery(params.id)
        let live = await fetchWeatherApi({ q: query })
        if (!live) {
          const matches = await searchWeatherApi({ q: query })
          const first = matches?.[0]
          if (first) live = await fetchWeatherApi({ lat: first.lat, lon: first.lon, q: first.name })
        }
        if (live) return HttpResponse.json({ hours: live.hourly || [] })
      } catch (err) {
        console.warn('Live hourly lookup failed', err)
      }
    }
    if (!meta || !fallback) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    const payload = useLiveWeather ? await buildLiveWeather(meta, fallback) : fallback
    return HttpResponse.json({ hours: payload.hourly })
  }),

  http.get('/weather/:id/forecast', async ({ params, request }) => {
    requireAuth(request)
    await delay(120)
    const meta = locationCatalog[params.id]
    const fallback = weatherById[params.id]
    const deriveQuery = (val) => {
      if (!val) return null
      if (val.startsWith('q-')) return decodeURIComponent(val.slice(2))
      return val
    }
    if ((!meta || !fallback) && useLiveWeather) {
      try {
        const query = deriveQuery(params.id)
        let live = await fetchWeatherApi({ q: query })
        if (!live) {
          const matches = await searchWeatherApi({ q: query })
          const first = matches?.[0]
          if (first) live = await fetchWeatherApi({ lat: first.lat, lon: first.lon, q: first.name })
        }
        if (live) return HttpResponse.json({ forecast: live.forecast || [] })
      } catch (err) {
        console.warn('Live forecast lookup failed', err)
      }
    }
    if (!meta || !fallback) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    const payload = useLiveWeather ? await buildLiveWeather(meta, fallback) : fallback
    return HttpResponse.json({ forecast: payload.forecast })
  }),

  http.get('/weather/:id/forecast14', async ({ params, request }) => {
    requireAuth(request)
    await delay(120)
    const meta = locationCatalog[params.id]
    const fallback = weatherById[params.id]
    const deriveQuery = (val) => {
      if (!val) return null
      if (val.startsWith('q-')) return decodeURIComponent(val.slice(2))
      return val
    }
    if ((!meta || !fallback) && useLiveWeather) {
      try {
        const query = deriveQuery(params.id)
        let live = await fetchWeatherApi({ q: query })
        if (!live) {
          const matches = await searchWeatherApi({ q: query })
          const first = matches?.[0]
          if (first) live = await fetchWeatherApi({ lat: first.lat, lon: first.lon, q: first.name })
        }
        if (live) return HttpResponse.json({ forecast: live.forecast14 || live.forecast || [] })
      } catch (err) {
        console.warn('Live forecast14 lookup failed', err)
      }
    }
    if (!meta || !fallback) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    const payload = useLiveWeather ? await buildLiveWeather(meta, fallback) : fallback
    return HttpResponse.json({ forecast: payload.forecast14 || fallback.forecast14 })
  }),

  http.get('/alerts/:id', async ({ params, request }) => {
    requireAuth(request)
    await delay(90)
    return HttpResponse.json({ alerts: alertsById[params.id] || [] })
  }),

  http.get('/disaster-risk/:id', async ({ params, request }) => {
    requireAuth(request)
    await delay(120)
    return HttpResponse.json({ risk: disasterRisk[params.id] || { score: 10, threats: [] } })
  }),

  http.get('/favorites', async ({ request }) => {
    const user = requireAuth(request)
    await delay(80)
    return HttpResponse.json({ favorites: favorites[user.id] || [] })
  }),

  http.post('/favorites', async ({ request }) => {
    const user = requireAuth(request)
    const { locationId } = await request.json()
    const list = favorites[user.id] || []
    if (!list.includes(locationId)) {
      favorites[user.id] = [...list, locationId]
    }
    await delay(60)
    return HttpResponse.json({ favorites: favorites[user.id] })
  }),

  http.delete('/favorites', async ({ request }) => {
    const user = requireAuth(request)
    const { locationId } = await request.json()
    const list = favorites[user.id] || []
    favorites[user.id] = list.filter((id) => id !== locationId)
    await delay(60)
    return HttpResponse.json({ favorites: favorites[user.id] })
  }),

  http.post('/feedback', async ({ request }) => {
    const user = requireAuth(request)
    const { message } = await request.json()
    const item = { id: `fb-${Date.now()}`, userId: user.id, message, createdAt: new Date().toISOString() }
    feedback.push(item)
    await delay(80)
    return HttpResponse.json({ feedback: item })
  }),

  http.get('/feedback', async ({ request }) => {
    const user = requireAuth(request)
    await delay(80)
    if (!user.roles.includes('admin')) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    return HttpResponse.json({ feedback })
  }),

  http.get('/admin/usage', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    await delay(100)
    return HttpResponse.json({
      uptime: '99.9%',
      activeUsers: 128,
      requestsLastHour: 420,
      cacheHit: '87%',
      rateLimit: analyticsUsage.rateLimit,
      peakUsage: analyticsUsage.peakUsage,
      mostSearched: analyticsUsage.mostSearched,
      views: analyticsUsage.views,
    })
  }),

  http.get('/admin/health', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    await delay(100)
    return HttpResponse.json({
      services: [
        { name: 'Weather core API', status: 'up', latencyMs: 120 },
        { name: 'IndianAPI bridge', status: useLiveWeather ? 'up' : 'mocked', latencyMs: useLiveWeather ? 180 : 20 },
        { name: 'Open-Meteo', status: useLiveWeather ? 'up' : 'mocked', latencyMs: useLiveWeather ? 140 : 20 },
        { name: 'Alerts feed', status: 'up', latencyMs: 95 },
      ],
      updatedAt: new Date().toISOString(),
    })
  }),

  http.get('/climate/:id/historical', async ({ params, request }) => {
    requireAuth(request)
    await delay(80)
    const trends = climateTrends[params.id]
    if (!trends) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ trends })
  }),

  http.post('/feedback/:id', async ({ params, request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    const { status, response } = await request.json()
    const item = feedback.find((f) => f.id === params.id)
    if (!item) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    item.status = status || item.status
    item.response = response ?? item.response
    await delay(60)
    return HttpResponse.json({ feedback: item })
  }),

  http.post('/admin/locations', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const id = body.id || body.name?.toLowerCase().slice(0, 3) || `loc-${Date.now()}`
    const loc = { ...body, id }
    locationCatalog[id] = loc
    locations.push(loc)
    await delay(80)
    return HttpResponse.json({ location: loc, locations })
  }),

  http.put('/admin/locations/:id', async ({ params, request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const existing = locationCatalog[params.id]
    if (!existing) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    const updated = { ...existing, ...body, id: params.id }
    locationCatalog[params.id] = updated
    const idx = locations.findIndex((l) => l.id === params.id)
    if (idx >= 0) locations[idx] = updated
    await delay(80)
    return HttpResponse.json({ location: updated, locations })
  }),

  http.delete('/admin/locations/:id', async ({ params, request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    delete locationCatalog[params.id]
    const idx = locations.findIndex((l) => l.id === params.id)
    if (idx >= 0) locations.splice(idx, 1)
    await delay(60)
    return HttpResponse.json({ locations })
  }),

  http.get('/admin/api-config', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    await delay(60)
    return HttpResponse.json({ config: apiConfig })
  }),

  http.post('/admin/api-config', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    Object.assign(apiConfig, body)
    await delay(80)
    return HttpResponse.json({ config: apiConfig })
  }),

  http.get('/admin/story-rules', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    await delay(60)
    return HttpResponse.json({ rules: storyRules })
  }),

  http.post('/admin/story-rules', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const rule = body.id ? storyRules.find((r) => r.id === body.id) : null
    if (rule) {
      Object.assign(rule, body)
    } else {
      const next = { id: body.id || `rule-${Date.now()}`, ...body }
      storyRules.push(next)
    }
    await delay(80)
    return HttpResponse.json({ rules: storyRules })
  }),

  http.get('/admin/radar-settings', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    await delay(40)
    return HttpResponse.json({ radar: radarSettings })
  }),

  http.get('/radar-settings', async ({ request }) => {
    requireAuth(request)
    await delay(40)
    return HttpResponse.json({ radar: radarSettings })
  }),

  http.post('/admin/radar-settings', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    Object.assign(radarSettings, body)
    await delay(60)
    return HttpResponse.json({ radar: radarSettings })
  }),

  http.get('/admin/disaster-thresholds', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    await delay(40)
    return HttpResponse.json({ thresholds: disasterThresholds })
  }),

  http.post('/admin/disaster-thresholds', async ({ request }) => {
    const user = requireAuth(request)
    if (!user.roles.includes('admin')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    Object.assign(disasterThresholds, body)
    await delay(60)
    return HttpResponse.json({ thresholds: disasterThresholds })
  }),
]

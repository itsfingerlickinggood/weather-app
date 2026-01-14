const IS_TEST = import.meta.env.MODE === 'test'
// Default to false to avoid noisy upstream failures; enable via VITE_USE_LIVE_WEATHER=true when desired
const USE_LIVE_WEATHER = IS_TEST ? false : (import.meta.env.VITE_USE_LIVE_WEATHER ?? 'false') !== 'false'
const INDIANAPI_BASE = import.meta.env.VITE_INDIANAPI_BASE || 'https://weather.indianapi.in'
const INDIANAPI_KEY = import.meta.env.VITE_INDIANAPI_KEY || ''
const OPEN_METEO_BASE = import.meta.env.VITE_OPENMETEO_BASE || 'https://api.open-meteo.com/v1'
const WEATHERAPI_BASE = import.meta.env.VITE_WEATHERAPI_BASE || 'https://api.weatherapi.com/v1'
const WEATHERAPI_KEY = import.meta.env.VITE_WEATHERAPI_KEY || ''

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
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
}

const safeNumber = (value, fallback = null) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const toFahrenheit = (tempC) => (tempC == null ? null : Math.round((tempC * 9) / 5 + 32))

const normalizeTemp = (value) => {
  const num = safeNumber(value, null)
  if (num == null) return null
  if (num > 65) return Math.round(num)
  return toFahrenheit(num)
}

const kmhToMph = (kmh) => {
  const num = safeNumber(kmh, null)
  if (num == null) return null
  return Math.round(num * 0.621371)
}

const summarize = (code) => weatherCodeSummary[code] || 'Weather update'

const mapWeatherApi = (payload) => {
  if (!payload?.location || !payload?.current) return null
  const current = payload.current
  const forecastDays = payload.forecast?.forecastday || []
  const today = forecastDays[0]

  const hourly = Array.isArray(today?.hour)
    ? today.hour.slice(0, 24).map((h, idx) => ({
        hour: idx + 1,
        temp: normalizeTemp(h.temp_c) ?? 0,
        aqi: safeNumber(h.air_quality?.['us-epa-index'] ?? h.air_quality?.pm2_5, 0),
        uv: safeNumber(h.uv, 0),
        precip: safeNumber(h.precip_mm, 0),
      }))
    : fallbackHourly()

  const forecast = forecastDays.slice(0, 3).map((d) => ({
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    high: normalizeTemp(d.day?.maxtemp_c) ?? 0,
    low: normalizeTemp(d.day?.mintemp_c) ?? 0,
    precip: safeNumber(d.day?.daily_chance_of_rain ?? d.day?.totalprecip_mm ?? 0, 0) / 100,
  }))

  const forecast14 = forecastDays.slice(0, 14).map((d) => ({
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    high: normalizeTemp(d.day?.maxtemp_c) ?? 0,
    low: normalizeTemp(d.day?.mintemp_c) ?? 0,
    precip: safeNumber(d.day?.daily_chance_of_rain ?? d.day?.totalprecip_mm ?? 0, 0) / 100,
  }))

  return {
    summary: current.condition?.text || 'Weather update',
    temp: normalizeTemp(current.temp_c) ?? 0,
    aqi: safeNumber(current.air_quality?.['us-epa-index'] ?? current.air_quality?.pm2_5, 0),
    uv: safeNumber(current.uv, 0),
    humidity: safeNumber(current.humidity, null),
    wind: safeNumber(current.wind_kph, null) ? kmhToMph(current.wind_kph) : safeNumber(current.wind_mph, null),
    precip: safeNumber(current.precip_mm, 0),
    currentTime: current.last_updated_epoch ? new Date(current.last_updated_epoch * 1000).toISOString() : new Date().toISOString(),
    hourly,
    forecast,
    forecast14,
  }
}

const buildHourlyFromOpenMeteo = (hourly) => {
  if (!hourly?.time || !hourly?.temperature_2m) return null
  const hours = []
  for (let i = 0; i < Math.min(hourly.temperature_2m.length, 6); i += 1) {
    hours.push({
      hour: i + 1,
      temp: normalizeTemp(hourly.temperature_2m[i]) ?? 0,
      aqi: safeNumber(hourly.aqi?.[i], null) || safeNumber(hourly.pm2_5?.[i], null) || 0,
      uv: safeNumber(hourly.uv_index?.[i], 0),
      precip: safeNumber(hourly.precipitation?.[i], 0),
    })
  }
  return hours
}

const buildForecastFromOpenMeteo = (daily, limit = 3) => {
  if (!daily?.time || !daily?.temperature_2m_max) return null
  const items = []
  for (let i = 0; i < Math.min(daily.temperature_2m_max.length, limit); i += 1) {
    const precipProbability = daily.precipitation_probability_max?.[i]
    const precipAmount = daily.precipitation_sum?.[i]
    items.push({
      day: new Date(daily.time[i]).toLocaleDateString('en-US', { weekday: 'short' }),
      high: normalizeTemp(daily.temperature_2m_max[i]) ?? 0,
      low: normalizeTemp(daily.temperature_2m_min?.[i]) ?? 0,
      precip:
        precipProbability != null
          ? safeNumber(precipProbability / 100, 0)
          : Math.min(1, safeNumber(precipAmount, 0) / 10),
    })
  }
  return items
}

const mapOpenMeteo = (payload) => {
  const { current, hourly, daily } = payload || {}
  if (!current) return null
  const parseTime = (value, offsetSeconds = 0) => {
    const num = Number(value)
    if (Number.isFinite(num)) {
      const epochMs = (num + offsetSeconds) * 1000
      const dt = new Date(epochMs)
      if (!Number.isNaN(dt.getTime())) return dt.toISOString()
    }
    if (value) {
      const dt = new Date(value)
      if (!Number.isNaN(dt.getTime())) return dt.toISOString()
    }
    return new Date().toISOString()
  }

  const currentTime = parseTime(current.time, payload?.utc_offset_seconds || 0)
  const summary = summarize(current.weather_code)
  return {
    summary,
    temp: normalizeTemp(current.temperature_2m) ?? 0,
    aqi: safeNumber(current.european_aqi ?? current.us_aqi ?? current.pm2_5, 0),
    uv: safeNumber(current.uv_index, 0),
    humidity: safeNumber(current.relative_humidity_2m, null),
    wind: kmhToMph(current.wind_speed_10m),
    precip: safeNumber(current.precipitation, 0),
    currentTime,
    hourly: buildHourlyFromOpenMeteo(hourly),
    forecast: buildForecastFromOpenMeteo(daily, 3),
    forecast14: buildForecastFromOpenMeteo(daily, 14),
  }
}

const fallbackForecast = () => [
  { day: 'Day 1', high: 75, low: 62, precip: 0.2 },
  { day: 'Day 2', high: 73, low: 61, precip: 0.1 },
  { day: 'Day 3', high: 70, low: 59, precip: 0.05 },
]

const fallbackHourly = () =>
  Array.from({ length: 6 }).map((_, idx) => ({
    hour: idx + 1,
    temp: 70 + idx,
    aqi: 40 + idx,
    uv: Math.max(0, 4 - idx * 0.5),
    precip: Math.max(0, 0.05 * idx),
  }))

const mapIndian = (payload) => {
  if (!payload) return null
  const root = payload.data || payload.weather || payload.current || payload
  const summary = root.summary || root.condition || root.description || 'Weather update'
  const temp = normalizeTemp(root.temperature ?? root.temp ?? root.temperature_c ?? root.temp_c)
  const humidity = safeNumber(root.humidity ?? root.rh, null)
  const wind = safeNumber(root.wind_speed ?? root.wind_kph ?? root.wind_mph, null)
  const precip = safeNumber(root.precipitation ?? root.rain ?? root.precip_mm, null)
  const uv = safeNumber(root.uv_index ?? root.uv, null)
  const aqi = safeNumber(root.aqi ?? root.air_quality_index, null)
  const currentTime = root.timestamp || root.time || new Date().toISOString()
  const hourly = root.hourly || root.hourly_forecast
  const forecastRaw = root.forecast || root.daily

  return {
    summary,
    temp,
    aqi,
    uv,
    humidity,
    wind,
    precip,
    currentTime,
    hourly: Array.isArray(hourly)
      ? hourly.slice(0, 6).map((h, idx) => ({
          hour: idx + 1,
          temp: normalizeTemp(h.temp ?? h.temperature ?? h.temp_c) ?? 0,
          aqi: safeNumber(h.aqi ?? h.pm2_5, 0),
          uv: safeNumber(h.uv_index ?? h.uv, 0),
          precip: safeNumber(h.precip ?? h.precipitation ?? h.rain, 0),
        }))
      : fallbackHourly(),
    forecast: Array.isArray(forecastRaw)
      ? forecastRaw.slice(0, 3).map((d) => ({
          day: d.day || d.date || 'Day',
          high: normalizeTemp(d.high ?? d.max_temp ?? d.max_temp_c) ?? 0,
          low: normalizeTemp(d.low ?? d.min_temp ?? d.min_temp_c) ?? 0,
          precip: safeNumber(d.precip ?? d.precipitation ?? d.rain, 0),
        }))
      : fallbackForecast(),
    forecast14: Array.isArray(forecastRaw)
      ? forecastRaw.slice(0, 14).map((d, idx) => ({
          day: d.day || d.date || `Day ${idx + 1}`,
          high: normalizeTemp(d.high ?? d.max_temp ?? d.max_temp_c) ?? 0,
          low: normalizeTemp(d.low ?? d.min_temp ?? d.min_temp_c) ?? 0,
          precip: safeNumber(d.precip ?? d.precipitation ?? d.rain, 0),
        }))
      : Array.from({ length: 14 }).map((_, idx) => {
          const base = fallbackForecast()[idx % fallbackForecast().length]
          return { ...base, day: `Day ${idx + 1}` }
        }),
  }
}

export const shouldUseLiveWeather = () => USE_LIVE_WEATHER

export const fetchIndianWeather = async ({ city, cityId }) => {
  if (!USE_LIVE_WEATHER) return null
  const params = new URLSearchParams()
  if (city) params.set('city', city)
  if (cityId) params.set('id', cityId)
  if (INDIANAPI_KEY) params.set('apikey', INDIANAPI_KEY)

  const resp = await fetch(`${INDIANAPI_BASE}/india/weather?${params.toString()}`, {
    headers: INDIANAPI_KEY
      ? {
          'x-api-key': INDIANAPI_KEY,
        }
      : {},
  })
  if (!resp.ok) throw new Error(`Indian API error ${resp.status}`)
  const data = await resp.json()
  return mapIndian(data)
}

export const fetchOpenMeteoWeather = async ({ lat, lon }) => {
  if (!USE_LIVE_WEATHER) return null
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,precipitation,uv_index',
    hourly: 'temperature_2m,uv_index,pm2_5,precipitation',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
    forecast_days: '14',
    timezone: 'auto',
  })
  const resp = await fetch(`${OPEN_METEO_BASE}/forecast?${params.toString()}`)
  if (!resp.ok) throw new Error(`Open-Meteo error ${resp.status}`)
  const data = await resp.json()
  return mapOpenMeteo(data)
}

export const fetchWeatherApi = async ({ q }) => {
  if (!USE_LIVE_WEATHER || !WEATHERAPI_KEY) return null
  const params = new URLSearchParams({
    key: WEATHERAPI_KEY,
    q,
    days: '14',
    aqi: 'yes',
    alerts: 'yes',
  })
  const resp = await fetch(`${WEATHERAPI_BASE}/forecast.json?${params.toString()}`)
  if (!resp.ok) throw new Error(`WeatherAPI error ${resp.status}`)
  const data = await resp.json()
  const mapped = mapWeatherApi(data)
  if (mapped && data.location) mapped.locationMeta = data.location
  return mapped
}

export const searchWeatherApi = async ({ q }) => {
  if (!USE_LIVE_WEATHER || !WEATHERAPI_KEY || !q) return null
  const params = new URLSearchParams({ key: WEATHERAPI_KEY, q })
  const resp = await fetch(`${WEATHERAPI_BASE}/search.json?${params.toString()}`)
  if (!resp.ok) throw new Error(`WeatherAPI search error ${resp.status}`)
  const data = await resp.json()
  return Array.isArray(data) ? data : null
}

export const mergeWithFallback = (liveData, fallbackData) => {
  if (!liveData) return fallbackData
  return {
    ...fallbackData,
    ...liveData,
    hourly: liveData.hourly || fallbackData.hourly,
    forecast: liveData.forecast || fallbackData.forecast,
    forecast14: liveData.forecast14 || fallbackData.forecast14,
  }
}

export const buildLiveWeather = async (meta, fallbackData) => {
  if (!USE_LIVE_WEATHER || !meta) return fallbackData

  try {
    const query = meta.city ? meta.city : meta.lat && meta.lon ? `${meta.lat},${meta.lon}` : null
    const liveData =
      (await fetchWeatherApi({ q: query })) ||
      (meta.provider === 'india'
        ? await fetchIndianWeather({ city: meta.city, cityId: meta.cityId })
        : await fetchOpenMeteoWeather({ lat: meta.lat, lon: meta.lon }))

    return mergeWithFallback(liveData, fallbackData)
  } catch (error) {
    console.warn('Live weather fetch failed, using fallback', error)
    return fallbackData
  }
}

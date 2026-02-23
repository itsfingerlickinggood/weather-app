import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather } from '../hooks/queries'
import { usePinnedCities } from '../hooks/usePinnedCities'
import { resolveWeatherIcon } from '../lib/weatherIcons'
import { useAuth } from '../context/auth'

const rainProfile = (rain = 0) => {
  if (rain >= 78) return 'Monsoon pulse'
  if (rain >= 62) return 'Shower risk'
  return 'Calmer window'
}

const aqiCallout = (aqi) => {
  if (aqi == null) return 'No data'
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Sensitive'
  if (aqi <= 200) return 'Unhealthy'
  return 'Very unhealthy'
}

const uvCallout = (uv) => {
  if (uv == null) return 'No data'
  if (uv <= 2) return 'Low'
  if (uv <= 5) return 'Moderate'
  if (uv <= 7) return 'High'
  if (uv <= 10) return 'Very high'
  return 'Extreme'
}

const mechanicalButton = 'focus-ring select-none transition-all duration-150 ease-out hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.98] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_14px_rgba(2,6,23,0.35)] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(2,6,23,0.35)]'

const microclimateTheme = (data, metrics) => {
  const summary = (data?.summary || '').toLowerCase()
  const precip = data?.precip || 0
  const cloud = data?.cloudCover || 0
  const humid = metrics.humidity >= 82
  const temp = data?.temp ?? null
  const wind = data?.wind ?? metrics.wind
  const hour = data?.currentTime ? new Date(data.currentTime).getHours() : 12
  const isNight = hour < 6 || hour >= 18

  const isStorm = /thunder|storm/.test(summary)
  const isRain = precip >= 0.2 || /rain|shower|drizzle/.test(summary)
  const isHeavyRain = precip >= 0.5 || /heavy rain|downpour/.test(summary)
  const isFog = /fog|mist|haze/.test(summary)
  const isCloud = cloud >= 0.55 || /cloud|overcast/.test(summary)
  const isWindy = (wind || 0) >= 30 || /windy|breeze|gust/.test(summary)
  const isHotDry = (temp || 0) >= 35 && precip < 0.1 && cloud < 0.35

  const textures = {
    storm: '/card-bg-pic/thunderstorm.jpg',
    heavyRain: '/card-bg-pic/heavy-rain.jpg',
    lightRain: '/card-bg-pic/light-rain.jpg',
    cloud: '/card-bg-pic/cloudy.jpg',
    fog: '/card-bg-pic/fog.jpg',
    clearDay: '/card-bg-pic/clear-day.jpg',
    clearNight: '/card-bg-pic/clear-night.jpg',
    hotDry: '/card-bg-pic/hot-dry.jpg',
    humid: '/card-bg-pic/humid-tropical.jpg',
    windy: '/card-bg-pic/windy.jpg',
  }

  const createTheme = (overrides) => ({
    gradient: 'from-slate-700/62 via-slate-700/24 to-slate-950/18',
    glowA: 'bg-slate-200/14',
    glowB: 'bg-slate-300/10',
    chip: 'bg-slate-950/44',
    texture: textures.clearDay,
    textureOpacity: 'opacity-28',
    textureBlend: 'mix-blend-soft-light',
    textureTone: 'brightness-95 contrast-110 saturate-110',
    veil: 'from-slate-950/58 via-slate-900/16 to-white/8',
    metricChip: 'bg-white/14 backdrop-blur-sm',
    ...overrides,
  })

  if (isStorm) {
    return createTheme({
      gradient: 'from-slate-700/76 via-indigo-700/40 to-slate-900/28',
      glowA: 'bg-indigo-300/14',
      glowB: 'bg-slate-200/6',
      texture: textures.storm,
      textureOpacity: 'opacity-30',
      textureTone: 'brightness-90 contrast-125 saturate-95',
      veil: 'from-slate-950/62 via-slate-900/18 to-indigo-100/8',
      metricChip: 'bg-slate-100/14 backdrop-blur-sm',
    })
  }

  if (isHeavyRain) {
    return createTheme({
      gradient: 'from-slate-700/72 via-slate-600/36 to-slate-900/24',
      glowA: 'bg-slate-200/12',
      glowB: 'bg-blue-200/8',
      texture: textures.heavyRain,
      textureOpacity: 'opacity-30',
      textureTone: 'brightness-92 contrast-118 saturate-100',
      metricChip: 'bg-slate-100/14 backdrop-blur-sm',
    })
  }

  if (isRain) {
    return createTheme({
      gradient: 'from-slate-600/70 via-slate-500/34 to-slate-900/22',
      glowA: 'bg-slate-200/11',
      glowB: 'bg-sky-300/10',
      texture: textures.lightRain,
      textureOpacity: 'opacity-29',
      textureTone: 'brightness-94 contrast-112 saturate-105',
      metricChip: 'bg-slate-100/14 backdrop-blur-sm',
    })
  }

  if (isFog) {
    return createTheme({
      gradient: 'from-slate-500/55 via-slate-400/24 to-slate-900/15',
      glowA: 'bg-slate-100/10',
      glowB: 'bg-violet-200/8',
      texture: textures.fog,
      textureOpacity: 'opacity-32',
      textureBlend: 'mix-blend-screen',
      textureTone: 'brightness-105 contrast-95 saturate-90',
      veil: 'from-slate-950/52 via-slate-900/12 to-slate-50/10',
      metricChip: 'bg-slate-100/16 backdrop-blur-sm',
    })
  }

  if (isCloud) {
    return createTheme({
      gradient: 'from-slate-600/56 via-sky-600/26 to-slate-900/16',
      glowA: 'bg-sky-200/10',
      glowB: 'bg-slate-200/7',
      texture: textures.cloud,
      textureOpacity: 'opacity-29',
      textureTone: 'brightness-97 contrast-106 saturate-102',
      metricChip: 'bg-slate-100/14 backdrop-blur-sm',
    })
  }

  if (isWindy) {
    return createTheme({
      gradient: 'from-slate-600/48 via-cyan-600/20 to-slate-900/12',
      glowA: 'bg-cyan-200/12',
      glowB: 'bg-slate-200/7',
      texture: textures.windy,
      textureOpacity: 'opacity-28',
      textureTone: 'brightness-98 contrast-108 saturate-110',
      metricChip: 'bg-slate-100/14 backdrop-blur-sm',
    })
  }

  if (isHotDry) {
    return createTheme({
      gradient: 'from-amber-500/34 via-orange-400/22 to-slate-900/10',
      glowA: 'bg-amber-200/15',
      glowB: 'bg-cyan-200/8',
      texture: textures.hotDry,
      textureOpacity: 'opacity-27',
      textureTone: 'brightness-108 contrast-104 saturate-120',
      veil: 'from-slate-950/48 via-amber-950/14 to-amber-50/8',
      metricChip: 'bg-amber-100/16 backdrop-blur-sm',
    })
  }

  if (humid) {
    return createTheme({
      gradient: 'from-emerald-500/35 via-cyan-500/20 to-slate-900/10',
      glowA: 'bg-emerald-200/15',
      glowB: 'bg-cyan-200/10',
      texture: textures.humid,
      textureOpacity: 'opacity-27',
      textureTone: 'brightness-102 contrast-103 saturate-116',
      veil: 'from-slate-950/50 via-emerald-950/14 to-cyan-50/8',
      metricChip: 'bg-emerald-100/16 backdrop-blur-sm',
    })
  }

  if (isNight) {
    return createTheme({
      gradient: 'from-slate-800/66 via-indigo-700/26 to-slate-950/20',
      glowA: 'bg-indigo-200/10',
      glowB: 'bg-blue-200/7',
      texture: textures.clearNight,
      textureOpacity: 'opacity-30',
      textureTone: 'brightness-90 contrast-116 saturate-102',
      metricChip: 'bg-indigo-100/16 backdrop-blur-sm',
    })
  }

  return createTheme({
    gradient: 'from-amber-400/28 via-sky-400/20 to-slate-900/10',
    glowA: 'bg-amber-200/13',
    glowB: 'bg-cyan-200/10',
    texture: textures.clearDay,
    textureOpacity: 'opacity-26',
    textureTone: 'brightness-108 contrast-102 saturate-112',
    veil: 'from-slate-950/46 via-sky-950/12 to-amber-50/8',
    metricChip: 'bg-sky-100/16 backdrop-blur-sm',
  })
}

const buildKeralaSignals = (payload) => {
  if (!payload || !payload.temp) return [
    { title: 'Monsoon pulse active', detail: 'Evening showers along the coast; carry light shell.', tone: 'bg-blue-500/15 border-blue-400/30', icon: '/icons/weather/rain.png' },
    { title: 'Backwater humidity', detail: 'High moisture boosts heat index near canals.', tone: 'bg-emerald-500/15 border-emerald-400/30', icon: '/icons/weather/cloud.png' },
    { title: 'Hill escapes cooler', detail: 'Idukki & Wayanad sitting ~6°C cooler with mist.', tone: 'bg-purple-500/15 border-purple-400/30', icon: '/icons/weather/foggy-pier.png' },
  ]
  const signals = []
  if ((payload.precip || 0) > 0.3 || (payload.rain || 0) > 0.5) {
    signals.push({ title: 'Active rain risk', detail: `Current precip ${payload.rain ?? 0} mm/h. Evening showers along the coast; carry a rain shell.`, tone: 'bg-blue-500/15 border-blue-400/30', icon: '/icons/weather/rain.png' })
  } else {
    signals.push({ title: 'Mostly dry now', detail: 'Precipitation low; best window for outdoor commutes.', tone: 'bg-emerald-500/15 border-emerald-400/30', icon: '/icons/weather/sun.png' })
  }
  if ((payload.humidity || 0) >= 80) {
    signals.push({ title: `Humid – ${payload.humidity}% RH`, detail: `Dew point ${payload.dewPoint != null ? payload.dewPoint + '°C' : 'high'}. Muggy near backwaters and canals — hydrate frequently.`, tone: 'bg-emerald-500/15 border-emerald-400/30', icon: '/icons/weather/cloud.png' })
  } else {
    signals.push({ title: `Humidity ${payload.humidity ?? '—'}%`, detail: 'Comfortable moisture levels. Inland breeze active.', tone: 'bg-cyan-500/15 border-cyan-400/30', icon: '/icons/weather/cloud.png' })
  }
  if ((payload.uv || 0) >= 7) {
    signals.push({ title: `High UV – ${payload.uv}`, detail: `Solar radiation ${payload.solarRad != null ? payload.solarRad + ' W/m²' : 'elevated'}. Apply SPF and avoid midday sun.`, tone: 'bg-amber-500/15 border-amber-400/30', icon: '/icons/weather/sun.png' })
  } else if ((payload.windGusts || 0) > 40) {
    signals.push({ title: `Gusty winds ${payload.windGusts} km/h`, detail: `Direction ${payload.windDirection != null ? payload.windDirection + '°' : 'variable'}. Hill areas and coast may see stronger gusts.`, tone: 'bg-purple-500/15 border-purple-400/30', icon: '/icons/weather/wind.png' })
  } else {
    signals.push({ title: 'Hill escapes cooler', detail: 'Idukki & Wayanad typically 4–6°C cooler with mist potential.', tone: 'bg-purple-500/15 border-purple-400/30', icon: '/icons/weather/foggy-pier.png' })
  }
  return signals
}

const MicroclimateTile = ({ loc, onRemove }) => {
  const { data } = useWeather(loc.id)
  const humidity = data?.humidity ?? null
  const rain = data ? Math.round((data.precip || 0) * 100) : null
  const wind = data?.wind ?? null
  const icon = resolveWeatherIcon({
    summary: data?.summary, weathercode: data?.weathercode, precip: data?.precip,
    cloudCover: data?.cloudCover, wind: data?.wind, temp: data?.temp,
  })
  const zone = (loc.zone || loc.region || '').toLowerCase()
  const zoneLabel = ((loc.zone || loc.region || 'Kerala').toString().toLowerCase() === loc.name.toString().toLowerCase() ? 'Kerala micro-zone' : (loc.zone || loc.region || 'Kerala'))
  const mc = { humidity: humidity ?? 72, rain: rain ?? 60, wind: wind ?? 48 }
  const theme = microclimateTheme(data, mc)
  const aqiValue = data?.aqi
  const aqiLabel = aqiCallout(aqiValue)
  const aqiTagTone = aqiValue == null
    ? 'bg-slate-500/22 text-slate-100 hover:bg-slate-400/30'
    : aqiValue <= 50
      ? 'bg-emerald-500/24 text-emerald-100 hover:bg-emerald-400/34'
      : aqiValue <= 100
        ? 'bg-yellow-500/24 text-yellow-100 hover:bg-yellow-400/34'
        : aqiValue <= 150
          ? 'bg-orange-500/26 text-orange-100 hover:bg-orange-400/36'
          : 'bg-rose-500/28 text-rose-100 hover:bg-rose-400/38'
  const uvValue = data?.uv
  const uvLabel = uvCallout(uvValue)
  const uvTagTone = uvValue == null
    ? 'bg-slate-500/22 text-slate-100 hover:bg-slate-400/30'
    : uvValue <= 2
      ? 'bg-sky-500/24 text-sky-100 hover:bg-sky-400/34'
      : uvValue <= 5
        ? 'bg-amber-500/24 text-amber-100 hover:bg-amber-400/34'
        : uvValue <= 7
          ? 'bg-orange-500/26 text-orange-100 hover:bg-orange-400/36'
          : 'bg-rose-500/28 text-rose-100 hover:bg-rose-400/38'
  const localTime = data?.currentTime ? new Date(data.currentTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null
  const tempNow = data?.temp != null ? Math.round(data.temp) : null
  const hi = tempNow != null ? tempNow + (mc.rain >= 30 ? 2 : 4) : null
  const low = tempNow != null ? tempNow - (mc.humidity >= 85 ? 2 : 4) : null

  return (
    <article className="relative min-h-[235px] overflow-hidden rounded-2xl bg-slate-950/72 shadow-2xl shadow-slate-950/45">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.gradient} transition-all duration-700`} aria-hidden="true" />
      <img src={theme.texture} alt="" aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${theme.textureOpacity} ${theme.textureBlend} ${theme.textureTone}`} />
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${theme.veil}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl ${theme.glowA}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -left-10 -bottom-10 h-24 w-24 rounded-full blur-3xl ${theme.glowB}`} aria-hidden="true" />

      <div className="relative z-10 flex h-full flex-col p-4">
        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-100/84">{zoneLabel}</p>
            <p className="mt-1 text-[1.82rem] font-semibold leading-none tracking-tight text-white">{loc.name}</p>
            {localTime ? <p className="mt-1 text-[12px] font-medium text-slate-100/86">{localTime}</p> : null}
          </div>
          <button className={`${mechanicalButton} rounded-full ${theme.chip} px-2.5 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-900/68`} onClick={() => onRemove(loc.id)} aria-label={`Remove ${loc.name}`}>
            Remove
          </button>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="space-y-1.5 self-end">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 backdrop-blur-sm">
              <img src={icon} alt={`${loc.name} icon`} className="h-9 w-9 object-cover" />
            </div>
            <p className="max-w-[14.5rem] text-[14px] font-medium leading-[1.28rem] text-slate-100/95">{data?.summary || rainProfile(mc.rain)}</p>
          </div>
          <div className="self-end text-right">
            <p className="text-[3.65rem] font-thin leading-[0.92] tracking-tight text-white">{tempNow != null ? `${tempNow}°` : '—'}</p>
            <p className="mt-1 text-[12px] font-medium tracking-[0.01em] text-slate-100/90">H:{hi != null ? `${hi}°` : '—'} L:{low != null ? `${low}°` : '—'}</p>
          </div>
        </div>

        <div className="mt-auto pt-3">
          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
            <span className={`inline-flex w-full cursor-default items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-colors duration-200 ${aqiTagTone}`}>
              <span className="font-semibold tracking-[0.01em]">AQI {aqiValue ?? '—'}</span>
              <span className="text-[10px] opacity-90">{aqiLabel}</span>
            </span>
            <span className={`inline-flex w-full cursor-default items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-colors duration-200 ${uvTagTone}`}>
              <span className="font-semibold tracking-[0.01em]">UV {uvValue ?? '—'}</span>
              <span className="text-[10px] opacity-90">{uvLabel}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

const CityWeatherCard = ({ id, name, onRemove }) => {
  const { data, isLoading, error } = useWeather(id)

  if (isLoading) return <Skeleton className="h-32" />
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">{error.message}</div>

  const payload = data
  const offline = data?.offline
  const weatherIcon = resolveWeatherIcon({
    summary: payload?.summary,
    weathercode: payload?.weathercode,
    precip: payload?.precip,
    cloudCover: payload?.cloudCover,
    wind: payload?.wind,
    uv: payload?.uv,
    temp: payload?.temp,
  })
  return (
    <div className="card-surface space-y-2 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-400">{name}</p>
          <p className="flex items-center gap-2 text-lg font-semibold text-white">
            <img src={weatherIcon} alt={payload?.summary || 'Weather icon'} className="h-6 w-6 rounded object-cover" />
            <span>{payload?.summary}</span>
          </p>
        </div>
        <button className={`${mechanicalButton} rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-100 hover:bg-amber-400/30`} onClick={() => onRemove(id)}>
          Remove
        </button>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-200">
        <span>{payload?.temp ?? '—'}°C <span className="text-slate-400 text-xs">feels {payload?.feelsLike ?? payload?.temp ?? '—'}°C</span></span>
        <span>AQI {payload?.aqi ?? '—'}</span>
        <span>UV {payload?.uv ?? '—'}</span>
        <span>Humidity {payload?.humidity ?? '—'}%</span>
        {payload?.windGusts != null && <span>Gusts {payload.windGusts} km/h</span>}
        {payload?.visibility != null && <span>Vis {payload.visibility} km</span>}
        {payload?.pressure != null && <span>{Math.round(payload.pressure)} hPa</span>}
      </div>
      {payload?.solarRad != null && (
        <p className="text-[11px] text-amber-200">☀ Solar {payload.solarRad} W/m²</p>
      )}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Badge tone={offline ? 'warning' : 'neutral'} label={offline ? 'Offline: cached' : 'Live'} />
        <span>Updated {new Date(payload?.currentTime).toLocaleTimeString()}</span>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { hasRole } = useAuth()
  const { pinned, addPin, removePin } = usePinnedCities()
  const { data: locations, isLoading } = useLocations()
  const [selected, setSelected] = useState('')
  const [hiddenMicroIds, setHiddenMicroIds] = useState([])
  const heroLocationId = pinned[0] || locations?.[0]?.id || null
  const heroWeather = useWeather(heroLocationId)

  const validPinned = useMemo(() => {
    if (!locations) return pinned
    const set = new Set(locations.map((l) => l.id))
    return pinned.filter((id) => set.has(id))
  }, [locations, pinned])

  const availableOptions = useMemo(() => {
    if (!locations) return []
    return locations.filter((loc) => !pinned.includes(loc.id))
  }, [locations, pinned])

  const microclimates = useMemo(() => {
    if (!locations) return []
    const zone = (loc) => (loc.zone || loc.region || '').toLowerCase()
    return locations
      .map((loc) => ({
        ...loc,
        gradient: zone(loc).includes('hill') || zone(loc).includes('high') ? 'from-emerald-400 to-cyan-300' : 'from-blue-400 to-amber-300',
      }))
      .slice(0, 8)
  }, [locations])

  const visibleMicroclimates = useMemo(
    () => microclimates.filter((item) => !hiddenMicroIds.includes(item.id)).slice(0, 4),
    [hiddenMicroIds, microclimates],
  )

  const keralaSignals = useMemo(() => buildKeralaSignals(heroWeather.data), [heroWeather.data])

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="section-kicker">Overview</p>
        <h1 className="type-display tracking-tight text-slate-50">Weather intelligence at a glance</h1>
        <p className="max-w-3xl type-body text-slate-400">Pin key cities, compare Kerala microclimates, and scan actionable daily signals in seconds.</p>
      </section>

      <Card title={`Now in ${locations?.find((l) => l.id === heroLocationId)?.name || 'your city'}`} description="Primary conditions and outdoor window">
        {heroWeather.isLoading ? (
          <Skeleton className="h-28" />
        ) : (
          (() => {
            const payload = heroWeather.data || {}
            const icon = resolveWeatherIcon({
              summary: payload.summary,
              weathercode: payload.weathercode,
              precip: payload.precip,
              cloudCover: payload.cloudCover,
              wind: payload.wind,
              uv: payload.uv,
              temp: payload.temp,
            })
            const window = (payload.precip || 0) > 0.35 ? 'Best outdoor window: late morning' : 'Best outdoor window: 6–9 AM'
            return (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="panel-subtle card-elevated space-y-1">
                  <p className="section-kicker">Current</p>
                  <p className="flex items-center gap-2 text-slate-50">
                    <img src={icon} alt={payload.summary || 'Weather icon'} className="h-7 w-7 rounded object-cover" />
                    <span className="type-display">{payload.temp ?? '—'}°C</span>
                  </p>
                  <p className="type-body text-slate-300">{payload.summary || 'Conditions unavailable'}</p>
                </div>
                <div className="panel-subtle space-y-2">
                  <p className="section-kicker">Signals</p>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-200">
                    <Badge tone={(payload.aqi || 0) > 120 ? 'warning' : 'success'} label={`AQI ${payload.aqi ?? '—'}`} />
                    <Badge tone={(payload.uv || 0) > 7 ? 'warning' : 'neutral'} label={`UV ${payload.uv ?? '—'}`} />
                    <Badge tone="neutral" label={`Humidity ${payload.humidity ?? '—'}%`} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-slate-300">
                    {payload.windGusts != null && <span>Gusts {payload.windGusts} km/h</span>}
                    {payload.pressure != null && <span>{Math.round(payload.pressure)} hPa</span>}
                    {payload.visibility != null && <span>Vis {payload.visibility} km</span>}
                    {payload.dewPoint != null && <span>Dew {payload.dewPoint}°C</span>}
                    {payload.solarRad != null && <span>☀ {payload.solarRad} W/m²</span>}
                    {payload.cape != null && payload.cape > 100 && <span className="text-amber-300">⚡ CAPE {Math.round(payload.cape)}</span>}
                  </div>
                </div>
                <div className="panel-subtle space-y-1">
                  <p className="section-kicker">Planner note</p>
                  <p className="type-body text-slate-200">{window}</p>
                  <p className="type-caption text-slate-400">{(payload.humidity || 0) > 80 ? 'Muggy afternoon expected.' : 'Moderate comfort through afternoon.'}</p>
                </div>
              </div>
            )
          })()
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Pinned cities" description="Add quick-access climate tiles">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <select
                className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select location</option>
                {availableOptions.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <button
                className={`${mechanicalButton} rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-60 disabled:hover:translate-y-0`}
                onClick={() => {
                  if (selected) {
                    addPin(selected)
                    setSelected('')
                  }
                }}
                disabled={!selected}
              >
                Add
              </button>
            </div>
            <p className="text-xs text-slate-400">Pins are stored locally.</p>
          </div>
        </Card>
        <Card title="Accessibility" description="Quick toggles">
          <p className="text-sm text-slate-200">
            Use the header toggles for theme, reduced motion, and high-contrast preferences.
          </p>
        </Card>
      </div>

      {hasRole('admin') ? (
        <Card title="System status" description="Admin-only technical health">
          <ul className="space-y-2 text-sm text-slate-200">
            <li><span className="font-semibold text-slate-100">Coverage:</span> Auth, weather, AQI, UV, alerts, favorites, feedback.</li>
            <li><span className="font-semibold text-slate-100">Data:</span> WeatherAPI live feed with open-meteo fallback.</li>
            <li><span className="font-semibold text-slate-100">Sessions:</span> Persisted in MongoDB backend.</li>
          </ul>
        </Card>
      ) : null}

      <Card title="Kerala microclimates" description="Live weather across coast, backwaters, and high-range hills">
        <div className="grid gap-3 md:grid-cols-2">
          {visibleMicroclimates.map((loc) => (
            <MicroclimateTile
              key={loc.id}
              loc={loc}
              onRemove={(id) => setHiddenMicroIds((prev) => [...prev, id])}
            />
          ))}
        </div>
        {!visibleMicroclimates.length ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-300">
            <span>All microclimate cards removed.</span>
            <button
              className={`${mechanicalButton} rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-white/24`}
              onClick={() => setHiddenMicroIds([])}
            >
              Restore cards
            </button>
          </div>
        ) : null}
      </Card>

      <Card title="Daily Kerala signals" description="Plan quickly with visual cues instead of text blocks">
        <div className="grid gap-3 md:grid-cols-3">
          {keralaSignals.map((sig) => (
            <div key={sig.title} className={`rounded-2xl p-4 text-sm text-slate-200 ${sig.tone}`}>
              <div className="flex items-center gap-2 text-base font-semibold text-white">
                <img src={sig.icon} alt={`${sig.title} icon`} className="h-6 w-6 rounded object-cover" />
                <span>{sig.title}</span>
              </div>
              <p className="mt-2 text-xs text-slate-200/80">{sig.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {validPinned.map((id) => {
          const locName = locations?.find((l) => l.id === id)?.name || id
          return <CityWeatherCard key={id} id={id} name={locName} onRemove={removePin} />
        })}
        {validPinned.length === 0 ? <Card title="No pins yet">Add a location to start tracking live tiles.</Card> : null}
      </div>
    </div>
  )
}

export default Dashboard

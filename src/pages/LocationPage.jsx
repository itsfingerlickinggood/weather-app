import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import {
  useAlerts,
  useFavorites,
  useForecast,
  useExtendedForecast,
  useHourly,
  useLocationDetail,
  useRisk,
  useWeather,
} from '../hooks/queries'
import { useUI } from '../context/ui'

const Stat = ({ label, value, tone = 'neutral' }) => (
  <div className="panel-subtle px-3 py-2">
    <p className="text-xs uppercase text-slate-400">{label}</p>
    <p className={`text-lg font-semibold ${tone === 'warning' ? 'text-amber-200' : 'text-white'}`}>{value}</p>
  </div>
)

const VisualMeter = ({ label, value = 0, suffix = '%', gradient = 'from-blue-400 to-emerald-300' }) => {
  const width = Math.max(6, Math.min(100, value))
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-slate-300">
        <span>{label}</span>
        <span className="text-slate-50">{Math.round(value)}{suffix}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full bg-gradient-to-r ${gradient}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

const categorizeAqi = (aqi) => {
  if (aqi == null) return { label: 'Unknown', tone: 'neutral', tip: 'AQI unavailable.' }
  if (aqi <= 50) return { label: 'Good', tone: 'success', tip: 'Air quality is good for all groups.' }
  if (aqi <= 100) return { label: 'Moderate', tone: 'neutral', tip: 'Sensitive groups can proceed with brief breaks.' }
  if (aqi <= 150) return { label: 'Unhealthy (SG)', tone: 'warning', tip: 'Limit long outdoor exposure; consider a mask.' }
  return { label: 'Unhealthy', tone: 'danger', tip: 'Stay indoors when possible and use filtration.' }
}

const selectSky = (payload, alerts = []) => {
  if (!payload) return ''
  const summary = (payload.summary || '').toLowerCase()
  if (alerts.length) return 'storm'
  if (summary.includes('rain') || summary.includes('shower')) return 'rain'
  if (summary.includes('storm')) return 'storm'
  if (payload.uv > 8 || payload.temp > 35) return 'heat'
  return 'clear'
}

const buildClothingAdvice = (payload) => {
  if (!payload) return []
  const advice = []
  if (payload.temp >= 30) advice.push('Light fabrics and breathable layers recommended.')
  if (payload.temp <= 13) advice.push('Add a warm layer or windbreaker.')
  if (payload.precip > 0.15) advice.push('Carry a waterproof shell or umbrella.')
  if (payload.uv >= 7) advice.push('Use sunscreen, hat, and UV sunglasses.')
  if (payload.aqi > 120) advice.push('Mask advised for sensitive groups (AQI elevated).')
  return advice.length ? advice : ['Standard comfortable wear is fine today.']
}

const profileWeights = {
  general: { aqi: 1, uv: 1, precip: 1, temp: 1 },
  child: { aqi: 1.2, uv: 1.2, precip: 1, temp: 1 },
  elderly: { aqi: 1.3, uv: 1, precip: 1.1, temp: 1.2 },
  respiratory: { aqi: 1.5, uv: 1, precip: 1, temp: 1 },
}

const buildActivityAdvice = (payload, profile = 'general') => {
  if (!payload) return { score: 0, summary: 'No data', suggestions: [] }
  const weight = profileWeights[profile] || profileWeights.general
  let score = 5
  if (payload.aqi > 120) score -= 2 * weight.aqi
  if (payload.uv > 8) score -= 1 * weight.uv
  if (payload.precip > 0.25) score -= 2 * weight.precip
  if (payload.temp < 5 || payload.temp > 35) score -= 1 * weight.temp
  const clamped = Math.max(1, Math.min(5, Math.round(score)))
  const suggestions = []
  if (clamped >= 4) suggestions.push('Great for running, cycling, and outdoor sports.')
  else if (clamped >= 3) suggestions.push('Good for walks; schedule breaks in shade.')
  else suggestions.push('Prefer indoor activities or short outings.')
  if (payload.uv > 7) suggestions.push('Plan for shade during mid-day hours.')
  if (payload.aqi > 150) suggestions.push('Keep activities light to moderate due to AQI.')
  if (profile === 'respiratory') suggestions.push('Carry a mask; avoid peak traffic corridors.')
  return { score: clamped, summary: suggestions[0], suggestions }
}

const bestHours = (hours = []) => {
  const scored = hours.map((h) => {
    let score = 100
    score -= (h.precip || 0) * 80
    if (h.aqi > 120) score -= 20
    if (h.uv > 7) score -= 10
    return { ...h, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, 3)
}

const buildSafetyStatus = (payload, risk) => {
  if (!payload) return { label: 'Unknown', tone: 'neutral', detail: 'No live data available.' }
  let score = 100
  if (payload.aqi > 150) score -= 30
  if (payload.uv > 8) score -= 20
  if (payload.precip > 0.35) score -= 20
  if (payload.wind > 40) score -= 10
  const riskScore = risk ? Math.round(((risk.flood || 0) + (risk.heat || 0) + (risk.wind || 0) + (risk.aqi || 0)) / 4 * 100) : 0
  if (riskScore > 50) score -= 15
  if (riskScore > 70) score -= 20

  if (score >= 80) return { label: 'Safe to go outside', tone: 'success', detail: 'Great conditions for most activities.' }
  if (score >= 60) return { label: 'Caution advised', tone: 'warning', detail: 'Stay hydrated and watch UV/AQI if sensitive.' }
  return { label: 'Limit outdoor time', tone: 'danger', detail: 'Prefer indoor plans; monitor alerts and AQI.' }
}

const formatClock = (value) => {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const LocationPage = () => {
  const { id } = useParams()
  const locationQuery = useLocationDetail(id)
  const weatherQuery = useWeather(id)
  const hourlyQuery = useHourly(id)
  const forecastQuery = useForecast(id)
  const extendedForecastQuery = useExtendedForecast(id)
  const alertsQuery = useAlerts(id)
  const riskQuery = useRisk(id)
  const { favoritesQuery, addFavorite, removeFavorite } = useFavorites()
  const { pushToast } = useUI()
  const firedRef = useRef({})

  // All useState hooks must be at the top, before any early returns
  const [profile, setProfile] = useState('general')

  // Get weather data (may be empty object if loading)
  const weatherPayload = weatherQuery.data || {}

  // All useMemo hooks must be at the top, before any early returns
  const isFavorite = useMemo(() => favoritesQuery.data?.includes(id), [favoritesQuery.data, id])
  const aqiMeta = useMemo(() => categorizeAqi(weatherPayload?.aqi), [weatherPayload?.aqi])
  const activityMeta = useMemo(() => buildActivityAdvice(weatherPayload, profile), [profile, weatherPayload])
  const clothingAdvice = useMemo(() => buildClothingAdvice(weatherPayload), [weatherPayload])
  const safety = useMemo(() => buildSafetyStatus(weatherPayload, riskQuery.data), [riskQuery.data, weatherPayload])

  const locationFallback = useMemo(() => {
    if (!weatherPayload?.locationMeta) return null
    return {
      name: weatherPayload.locationMeta.name,
      region: [weatherPayload.locationMeta.region, weatherPayload.locationMeta.country].filter(Boolean).join(', '),
      lat: weatherPayload.locationMeta.lat,
      lon: weatherPayload.locationMeta.lon,
      tags: ['Live city'],
      zone: weatherPayload.locationMeta.region || weatherPayload.locationMeta.country || 'Live city',
    }
  }, [weatherPayload?.locationMeta])

  const locationData = locationQuery.data || locationFallback

  // All useEffect hooks must be at the top, before any early returns
  useEffect(() => {
    if (!weatherPayload || !Object.keys(weatherPayload).length) return
    const fireOnce = (key, msg, tone) => {
      if (firedRef.current[key]) return
      firedRef.current[key] = true
      pushToast(msg, tone)
    }
    if (weatherPayload.uv >= 8) fireOnce('uv', 'High UV right now – cover up.', 'warning')
    if (weatherPayload.aqi >= 150) fireOnce('aqi', 'AQI is unhealthy; consider masking.', 'danger')
    if (hourlyQuery.data?.some((h) => h.precip > 0.3)) fireOnce('rain', 'Rain expected soon – keep a shell handy.', 'warning')
  }, [hourlyQuery.data, pushToast, weatherPayload])

  useEffect(() => {
    const variant = selectSky(weatherPayload, alertsQuery.data)
    if (variant) document.body.dataset.sky = variant
    return () => {
      document.body.dataset.sky = ''
    }
  }, [alertsQuery.data, weatherPayload])

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFavorite.mutate(id)
    } else {
      addFavorite.mutate(id)
    }
  }

  // Early returns for loading/error states - AFTER all hooks
  if (locationQuery.isLoading || weatherQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-40" />
        <Skeleton className="h-20" />
      </div>
    )
  }

  if ((!locationData && locationQuery.error) || weatherQuery.error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">Unable to load location.</div>
  }

  // Derived values (not hooks, so they can be after early returns)
  const offline = weatherQuery.data?.offline
  const cloudCoverPct = Math.round(Math.max(0, Math.min(100, (weatherPayload?.cloudCover ?? 0) * 100)))
  const comfortIndex = weatherPayload?.comfortIndex ?? 70
  const rainStreak = weatherPayload?.rainStreakDays ?? 0
  const seaTemp = weatherPayload?.seaTemp
  const feelsLike = weatherPayload?.feelsLike ?? weatherPayload?.temp
  const seaMeter = seaTemp ? Math.min(100, Math.max(0, (seaTemp - 20) * 5)) : 0

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <p className="section-kicker">Location view</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">{locationData?.name}</h1>
        <p className="text-sm text-slate-400">{locationData?.region} · Lat {locationData?.lat} / Lon {locationData?.lon}</p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mt-2 flex flex-wrap gap-2">
            {locationData?.zone ? <Badge tone="neutral" label={locationData.zone} /> : null}
            {(locationData?.tags || []).map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-slate-100">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={offline ? 'warning' : 'success'} label={offline ? 'Offline cache' : 'Live'} />
          <button
            className="focus-ring rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={toggleFavorite}
            disabled={addFavorite.isPending || removeFavorite.isPending || favoritesQuery.isLoading}
          >
            {isFavorite ? 'Unfavorite' : 'Favorite'}
          </button>
        </div>
      </div>

      <Card title="Current conditions" description="Real-time snapshot + cached fallback">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="panel-subtle space-y-2">
            <p className="metric-value text-white">{weatherPayload?.temp}°C</p>
            <p className="text-sm text-slate-300">{weatherPayload?.summary}</p>
            <p className="text-xs text-slate-400">Updated {new Date(weatherPayload?.currentTime).toLocaleTimeString()}</p>
          </div>
          <div className="space-y-2">
            <Stat label="AQI" value={weatherPayload?.aqi} tone={weatherPayload?.aqi > 80 ? 'warning' : 'neutral'} />
            <Stat label="UV" value={weatherPayload?.uv} tone={weatherPayload?.uv > 7 ? 'warning' : 'neutral'} />
          </div>
          <div className="space-y-2">
            <Stat label="Wind" value={`${weatherPayload?.wind} km/h`} />
            <Stat label="Humidity" value={`${weatherPayload?.humidity}%`} />
          </div>
        </div>
        <p className="text-xs text-slate-400">AQI {aqiMeta.label}: {aqiMeta.tip}</p>
      </Card>

      <Card title="Outdoor safety status" description="Blends AQI, UV, precip, and disaster risk">
        <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-slate-900/60 p-3 text-sm text-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={safety.tone} label={safety.label} />
            {riskQuery.isLoading ? <span className="text-xs text-slate-400">Loading risk…</span> : <span className="text-xs text-slate-400">Risk score {riskQuery.data ? Math.round(((riskQuery.data.flood || 0) + (riskQuery.data.heat || 0) + (riskQuery.data.wind || 0) + (riskQuery.data.aqi || 0)) / 4 * 100) : '—'}/100</span>}
          </div>
          <p className="text-slate-300">{safety.detail}</p>
          <p className="text-[11px] text-slate-400">Factors: AQI {weatherPayload?.aqi}, UV {weatherPayload?.uv}, precip {Math.round((weatherPayload?.precip || 0) * 100)}%, wind {weatherPayload?.wind} km/h.</p>
        </div>
      </Card>

      <Card title="Kerala visual board" description="Read the day through gauges and cues, not walls of text">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <p className="text-[11px] uppercase text-slate-400">Thermal feel</p>
              <p className="text-3xl font-semibold text-white">{feelsLike}°C</p>
            <p className="text-xs text-slate-400">Actual {weatherPayload?.temp}°C • Feels driven by humidity</p>
            <div className="mt-3 space-y-2">
              <VisualMeter label="Comfort index" value={comfortIndex} suffix="/100" gradient="from-amber-300 to-pink-400" />
              <VisualMeter label="Humidity" value={weatherPayload?.humidity ?? 0} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <p className="text-[11px] uppercase text-slate-400">Moisture + monsoon</p>
            <div className="space-y-2 text-sm text-slate-200">
              <VisualMeter label="Cloud cover" value={cloudCoverPct} />
              <VisualMeter label="Rain streak" value={Math.min(100, rainStreak * 20)} suffix="%" gradient="from-blue-400 to-emerald-300" />
              <p className="text-[11px] text-amber-100">{weatherPayload?.monsoonPhase || 'Stable phase today'}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <p className="text-[11px] uppercase text-slate-400">Sun & water</p>
            <div className="space-y-2 text-sm text-slate-200">
              <p className="flex items-center gap-2"><span>🌅</span><span>Sunrise {formatClock(weatherPayload?.sunrise)}</span></p>
              <p className="flex items-center gap-2"><span>🌇</span><span>Sunset {formatClock(weatherPayload?.sunset)}</span></p>
              <VisualMeter label="Sea warmth" value={seaMeter} suffix="%" gradient="from-cyan-300 to-blue-400" />
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-100">
                {seaTemp ? <span className="rounded-full bg-white/10 px-2 py-1">Sea {seaTemp}°C</span> : null}
                {weatherPayload?.dewPoint ? <span className="rounded-full bg-white/10 px-2 py-1">Dew {weatherPayload.dewPoint}°C</span> : null}
                {weatherPayload?.visibility ? <span className="rounded-full bg-white/10 px-2 py-1">{weatherPayload.visibility} km vis</span> : null}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Next hours" description="Hourly temp + rain chance">
          {hourlyQuery.isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div role="list" className="grid grid-cols-3 gap-2 text-sm">
              {(hourlyQuery.data || []).slice(0, 9).map((h) => (
                <div key={h.hour} role="listitem" className="rounded-xl border border-white/5 bg-slate-900/50 p-3">
                  <p className="text-xs text-slate-400">+{h.hour}h</p>
                  <p className="font-semibold text-white">{h.temp}\u00b0C</p>
                  <p className="text-[11px] text-slate-400">Rain {Math.round((h.precip || 0) * 100)}%</p>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Next 3 days" description="High / Low / Precip">
          {forecastQuery.isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="divide-y divide-white/5 text-sm">
              {(forecastQuery.data || []).map((day) => (
                <div key={day.day} className="flex items-center justify-between py-2">
                  <span className="text-slate-200">{day.day}</span>
                  <span className="text-slate-300">{day.high}\u00b0 / {day.low}\u00b0</span>
                  <span className="text-amber-200">{Math.round(day.precip * 100)}% precip</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="7-day graph" description="Trend view for the next week">
        {extendedForecastQuery.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {(extendedForecastQuery.data || []).slice(0, 7).map((day) => (
              <div key={day.day} className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{day.day}</span>
                  <span className="text-slate-300">{day.high}° / {day.low}°</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-blue-500" style={{ width: `${Math.min(100, Math.max(15, (day.high || 0) / 1.5))}%` }} />
                </div>
                <p className="text-[11px] text-slate-400">Precip {Math.round((day.precip || 0) * 100)}% • Humidity trend steady</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Alerts" description="Live environmental alerts">
          {alertsQuery.isLoading ? (
            <Skeleton className="h-20" />
          ) : alertsQuery.data?.length ? (
            <ul className="space-y-2">
              {alertsQuery.data.map((alert) => (
                <li key={alert.id} className="rounded-lg border border-white/5 bg-amber-500/10 p-3 text-sm text-amber-50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{alert.title}</span>
                    <Badge tone="warning" label={alert.severity} />
                  </div>
                  <p className="text-amber-100/80">{alert.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No active alerts.</p>
          )}
        </Card>

        <Card title="Disaster risk" description="Composite risk score">
          {riskQuery.isLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="space-y-2 text-sm text-slate-200">
              <p className="text-lg font-semibold text-white">Score {riskQuery.data ? Math.round(((riskQuery.data.flood || 0) + (riskQuery.data.heat || 0) + (riskQuery.data.wind || 0) + (riskQuery.data.aqi || 0)) / 4 * 100) : '—'}/100</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-300">
                {riskQuery.data ? [
                  ['Flood', riskQuery.data.flood],
                  ['Heat', riskQuery.data.heat],
                  ['Wind', riskQuery.data.wind],
                  ['AQI', riskQuery.data.aqi],
                ].map(([label, val]) => (
                  <span key={label}>{label}: {val != null ? Math.round(val * 100) : '—'}%</span>
                )) : null}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="14-day outlook" description="Extended temps and precipitation trend">
        {extendedForecastQuery.isLoading ? (
          <Skeleton className="h-28" />
        ) : (
          <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
            {extendedForecastQuery.data?.map((day, idx) => (
              <div key={`${day.day}-${idx}`} className="rounded-xl border border-white/5 bg-slate-900/50 p-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{day.day}</span>
                  <span className="text-slate-300">{day.high}° / {day.low}°</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-amber-300"
                    style={{ width: `${Math.min(100, Math.max(20, (day.high || 0) / 1.2))}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">Precip {Math.round((day.precip || 0) * 100)}% • Trend {idx === 0 ? 'start' : day.high >= extendedForecastQuery.data?.[idx - 1]?.high ? 'warming' : 'cooling'}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Clothing guide" description="AI-lite recommendations based on conditions">
          <ul className="space-y-2 text-sm text-slate-200">
            {clothingAdvice.map((tip, idx) => (
              <li key={idx} className="rounded-lg border border-white/5 bg-slate-900/50 p-2">
                {tip}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Activity suitability" description="Scores adapt to AQI, UV, precip">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span>Profile:</span>
            {['general', 'child', 'elderly', 'respiratory'].map((p) => (
              <button
                key={p}
                className={`focus-ring rounded-full px-3 py-1 ${profile === p ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-100'}`}
                onClick={() => setProfile(p)}
                type="button"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="space-y-3 text-sm text-slate-200">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <span
                  key={step}
                  className={`h-2 flex-1 rounded-full ${step <= activityMeta.score ? 'bg-emerald-400' : 'bg-white/10'}`}
                  aria-label={step <= activityMeta.score ? 'Suitable' : 'Less suitable'}
                />
              ))}
              <span className="text-xs text-slate-400">Score {activityMeta.score}/5</span>
            </div>
            <p className="font-semibold text-white">{activityMeta.summary}</p>
            <ul className="space-y-1 text-xs text-slate-300">
              {activityMeta.suggestions.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card title="Best hours today" description="Pick the top windows for outdoor plans">
        {hourlyQuery.isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="grid gap-2 md:grid-cols-3">
            {bestHours(hourlyQuery.data || []).map((h) => (
              <div key={h.hour} className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-sm text-slate-200">
                <p className="text-xs text-slate-400">+{h.hour}h</p>
                <p className="font-semibold text-white">{h.temp}°C</p>
                <p className="text-[11px] text-emerald-200">Rain {Math.round((h.precip || 0) * 100)}%</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default LocationPage

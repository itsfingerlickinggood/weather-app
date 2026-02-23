import { useMemo, useState } from 'react'
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
import { resolveWeatherIcon } from '../lib/weatherIcons'

const tabs = ['today', 'week', 'health', 'planning']

const aqiMeta = (aqi) => {
  if (aqi == null) return { label: 'Unknown', tone: 'neutral', tip: 'AQI unavailable.' }
  if (aqi <= 50) return { label: 'Good', tone: 'success', tip: 'Air quality is good for most people.' }
  if (aqi <= 100) return { label: 'Moderate', tone: 'neutral', tip: 'Sensitive groups should pace activity.' }
  if (aqi <= 150) return { label: 'Unhealthy (SG)', tone: 'warning', tip: 'Limit prolonged outdoor exertion.' }
  return { label: 'Unhealthy', tone: 'danger', tip: 'Prefer indoor plans where possible.' }
}

const buildClothingAdvice = (payload) => {
  if (!payload) return []
  const advice = []
  if (payload.temp >= 31) advice.push('Use breathable fabrics and keep hydration handy.')
  if (payload.temp <= 14) advice.push('Carry one warm outer layer for early/late hours.')
  if ((payload.precip || 0) > 0.25) advice.push('Pack a waterproof shell or umbrella.')
  if ((payload.uv || 0) >= 7) advice.push('Use SPF and a hat for daytime exposure.')
  return advice.length ? advice : ['Standard comfortable wear is fine today.']
}

const bestHours = (hours = []) => {
  const scored = hours.map((hour) => {
    let score = 100
    score -= (hour.precip || 0) * 70
    if ((hour.aqi || 0) > 120) score -= 15
    if ((hour.uv || 0) > 7) score -= 10
    return { ...hour, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, 3)
}

const tabButtonClass = (active) =>
  `chip-control ${active ? 'chip-control-active' : ''}`

const LocationPage = () => {
  const { id } = useParams()
  const [tab, setTab] = useState('today')

  const locationQuery = useLocationDetail(id)
  const weatherQuery = useWeather(id)
  const hourlyQuery = useHourly(id)
  const forecastQuery = useForecast(id)
  const extendedForecastQuery = useExtendedForecast(id)
  const alertsQuery = useAlerts(id)
  const riskQuery = useRisk(id)
  const { favoritesQuery, addFavorite, removeFavorite } = useFavorites()

  const location = locationQuery.data
  const payload = useMemo(() => weatherQuery.data || {}, [weatherQuery.data])
  const isFavorite = useMemo(() => favoritesQuery.data?.includes(id), [favoritesQuery.data, id])
  const isNum = (value) => typeof value === 'number' && Number.isFinite(value)
  const oneDec = (value) => (isNum(value) ? value.toFixed(1) : '—')
  const zeroDec = (value) => (isNum(value) ? Math.round(value) : '—')
  const icon = resolveWeatherIcon({
    summary: payload.summary,
    weathercode: payload.weathercode,
    precip: payload.precip,
    cloudCover: payload.cloudCover,
    wind: payload.wind,
    uv: payload.uv,
    temp: payload.temp,
  })
  const aqi = aqiMeta(payload.aqi)
  const clothing = useMemo(() => buildClothingAdvice(payload), [payload])
  const best = useMemo(() => bestHours(hourlyQuery.data || []), [hourlyQuery.data])
  const riskBreakdown = useMemo(
    () => [
      { label: 'Flood', value: riskQuery.data?.flood },
      { label: 'Heat', value: riskQuery.data?.heat },
      { label: 'Wind', value: riskQuery.data?.wind },
      { label: 'AQI', value: riskQuery.data?.aqi },
    ],
    [riskQuery.data],
  )
  const compositeRisk = useMemo(() => {
    const values = riskBreakdown.map((item) => item.value).filter((value) => typeof value === 'number')
    if (!values.length) return null
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100)
  }, [riskBreakdown])
  const uvAdvice = (payload.uv || 0) > 7 ? 'High-UV period likely at midday.' : 'Moderate UV profile.'

  if (locationQuery.isLoading || weatherQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-40" />
        <Skeleton className="h-28" />
      </div>
    )
  }

  if (!location && (locationQuery.error || weatherQuery.error)) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">Unable to load location.</div>
  }

  return (
    <div className="space-y-4">
      <section className="space-y-1">
        <p className="section-kicker">Location</p>
        <h1 className="type-display tracking-tight text-slate-50">{location?.name}</h1>
        <p className="type-body text-slate-400">{location?.region} · Lat {location?.lat} / Lon {location?.lon}</p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge tone={weatherQuery.data?.offline ? 'warning' : 'success'} label={weatherQuery.data?.offline ? 'Offline cache' : 'Live'} />
          {location?.zone ? <Badge tone="neutral" label={location.zone} /> : null}
          <Badge tone={aqi.tone} label={`AQI ${payload.aqi ?? '—'}`} />
        </div>
        <button
          className="focus-ring rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          onClick={() => (isFavorite ? removeFavorite.mutate(id) : addFavorite.mutate(id))}
          disabled={addFavorite.isPending || removeFavorite.isPending || favoritesQuery.isLoading}
        >
          {isFavorite ? 'Unfavorite' : 'Favorite'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Location sections">
        {tabs.map((item) => (
          <button
            key={item}
            role="tab"
            id={`tab-${item}`}
            aria-selected={tab === item}
            aria-controls={`panel-${item}`}
            className={tabButtonClass(tab === item)}
            onClick={() => setTab(item)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setTab(item)
              }
            }}
          >
            {item === 'today' ? 'Today' : item === 'week' ? 'Week' : item === 'health' ? 'Health' : 'Planning'}
          </button>
        ))}
      </div>

      {tab === 'today' ? (
        <div role="tabpanel" id="panel-today" aria-labelledby="tab-today" className="space-y-4">
          <Card title="Current" description="Primary conditions now">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="panel-subtle card-elevated space-y-1">
                <img src={icon} alt={payload.summary || 'Weather icon'} className="h-10 w-10 rounded-lg object-cover" />
                <p className="type-display text-white">{payload.temp ?? '—'}°C</p>
                <p className="type-body text-slate-300">{payload.summary || 'Conditions unavailable'}</p>
              </div>
              <div className="panel-subtle space-y-2 md:col-span-2">
                <p className="section-kicker">Current metrics</p>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: 'Feels like', value: `${oneDec(payload.feelsLike ?? payload.temp)}°C`, iconSrc: '/icons/weather/sunny.png' },
                    { label: 'Humidity', value: `${zeroDec(payload.humidity)}%`, iconSrc: '/icons/weather/cloud.png' },
                    { label: 'Dew point', value: `${oneDec(payload.dewPoint)}°C`, iconSrc: '/icons/weather/foggy-pier.png' },
                    { label: 'Pressure', value: `${zeroDec(payload.pressure)} hPa`, iconSrc: '/icons/weather/earth.png' },
                    {
                      label: 'Wind',
                      value: `${oneDec(payload.wind)} km/h${isNum(payload.windDirection) ? ` (${Math.round(payload.windDirection)}°)` : ''}`,
                      iconSrc: '/icons/weather/wind.png',
                    },
                    { label: 'Gusts', value: `${zeroDec(payload.windGusts)} km/h`, iconSrc: '/icons/weather/desert-wind-farm.png' },
                    { label: 'Visibility', value: `${oneDec(payload.visibility)} km`, iconSrc: '/icons/weather/cloudless-sulphur.png' },
                    { label: 'UV', value: `${oneDec(payload.uv)}`, iconSrc: '/icons/weather/sun.png' },
                    { label: 'Solar', value: `${zeroDec(payload.solarRad)} W/m²`, iconSrc: '/icons/weather/aztec-sun-stone.png' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <img src={item.iconSrc} alt="" aria-hidden="true" className="h-6 w-6 rounded object-cover" loading="eager" decoding="async" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400">{item.label}</p>
                        <p className="truncate text-[13px] font-semibold text-slate-100">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel-subtle space-y-1 text-sm text-slate-200">
                <p className="section-kicker">Alert status</p>
                {alertsQuery.data?.length ? (
                  <>
                    <Badge tone="warning" label={alertsQuery.data[0].severity} />
                    <p>{alertsQuery.data[0].title}</p>
                  </>
                ) : (
                  <p className="text-slate-300">No active alerts right now.</p>
                )}
              </div>
            </div>
          </Card>

          <Card title="Next 24 hours" description="Hourly conditions and best windows">
            {hourlyQuery.isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6 text-sm">
                  {(hourlyQuery.data || []).slice(0, 12).map((hour) => (
                    <div key={hour.hour} className="rounded-xl border border-white/5 bg-slate-900/50 p-2 text-slate-200">
                      <p className="text-[11px] text-slate-400">+{hour.hour}h</p>
                      <p className="font-semibold text-white">{hour.temp}°C</p>
                      <p className="text-[11px] text-slate-400">Rain {Math.round((hour.precip || 0) * 100)}%</p>
                      {hour.wind != null && <p className="text-[11px] text-slate-400">Wind {hour.wind} km/h</p>}
                      {hour.uv != null && <p className="text-[11px] text-amber-300">UV {hour.uv}</p>}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm text-slate-200">
                  <p className="section-kicker">Best outdoor windows</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {best.map((hour) => (
                      <span key={`best-${hour.hour}`} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                        +{hour.hour}h · {hour.temp}°C
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {tab === 'week' ? (
        <div role="tabpanel" id="panel-week" aria-labelledby="tab-week" className="space-y-4">
          <Card title="Next 7 days" description="High / low and rain signal">
            {forecastQuery.isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="divide-y divide-white/5 text-sm">
                {(forecastQuery.data || []).map((day) => (
                  <div key={day.day} className="grid gap-1 py-2 text-slate-200 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-3">
                    <span className="font-semibold text-white">{day.day}</span>
                    <span>{day.high}° / {day.low}°</span>
                    <span className="text-[11px] text-amber-200">{Math.round((day.precip || 0) * 100)}% precip</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="14-day outlook" description="Extended signal for planning confidence">
            {extendedForecastQuery.isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              (() => {
                const days = (extendedForecastQuery.data || []).slice(0, 14)
                if (!days.length) return <p className="text-sm text-slate-400">No extended outlook available.</p>

                const wetDays = days.filter((day) => (day.precip || 0) >= 0.35).length
                const hotDays = days.filter((day) => day.high >= 35).length
                const avgHigh = Math.round(days.reduce((sum, day) => sum + day.high, 0) / days.length)

                return (
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-3 text-xs">
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300">
                        Avg high <span className="ml-1 font-semibold text-white">{avgHigh}°C</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300">
                        Rain-prone days <span className="ml-1 font-semibold text-cyan-200">{wetDays}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300">
                        Hot days <span className="ml-1 font-semibold text-amber-200">{hotDays}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {days.map((day, index) => {
                        const precipPct = Math.round((day.precip || 0) * 100)
                        const rainTone = precipPct >= 60 ? 'text-cyan-200' : precipPct >= 25 ? 'text-sky-200' : 'text-slate-300'
                        const tempTone = day.high >= 35 ? 'text-amber-200' : 'text-slate-100'
                        const prediction = precipPct >= 60
                          ? 'Rain-heavy day expected'
                          : precipPct >= 25
                            ? 'Passing showers likely'
                            : day.high >= 35
                              ? 'Hot and mostly dry'
                              : 'Stable outdoor window'
                        return (
                          <div key={`${day.day}-${index}`} className="rounded-xl border border-white/10 bg-slate-900/55 px-3 py-2 text-sm text-slate-200">
                            <div className="grid items-center gap-2 md:grid-cols-[52px_1fr_auto]">
                              <span className="font-semibold text-white">{day.day}</span>
                              <div>
                                <p className={tempTone}>{day.high}° / {day.low}°</p>
                                <div className="mt-1 h-1.5 rounded-full bg-slate-800">
                                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${precipPct}%` }} />
                                </div>
                                <p className="mt-1 text-[11px] text-slate-400">Forecast: {prediction}</p>
                              </div>
                              <span className={`text-xs ${rainTone}`}>Precip {precipPct}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()
            )}
          </Card>
        </div>
      ) : null}

      {tab === 'health' ? (
        <div role="tabpanel" id="panel-health" aria-labelledby="tab-health" className="space-y-4">
          <Card title="Health Center" description="AQI, UV, and risk synthesis">
            <div className="grid gap-3 lg:grid-cols-3 text-sm text-slate-200">
              <div className="panel-subtle space-y-2">
                <p className="section-kicker">Air quality</p>
                <div className="flex items-center gap-2">
                  <img src="/icons/weather/health.png" alt="" aria-hidden="true" className="h-8 w-8 rounded object-cover" />
                  <p className="type-title text-white">{aqi.label}</p>
                </div>
                <p className="text-slate-300">{aqi.tip}</p>
                <div className="space-y-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <p>PM2.5 {payload.pm25 != null ? payload.pm25.toFixed(1) : '—'} · PM10 {payload.pm10?.toFixed(1) ?? '—'} µg/m³</p>
                  <p>NO₂ {payload.no2 != null ? payload.no2.toFixed(1) : '—'} · O₃ {payload.o3?.toFixed(1) ?? '—'} µg/m³</p>
                </div>
              </div>
              <div className="panel-subtle space-y-2">
                <p className="section-kicker">UV guidance</p>
                <div className="flex items-center gap-2">
                  <img src="/icons/weather/sun.png" alt="" aria-hidden="true" className="h-8 w-8 rounded object-cover" />
                  <p className="type-title text-white">UV {payload.uv ?? '—'}</p>
                </div>
                <p className="text-slate-300">{uvAdvice}</p>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <p>Solar {payload.solarRad != null ? `${payload.solarRad} W/m²` : '—'}</p>
                </div>
              </div>
              <div className="panel-subtle space-y-2">
                <p className="section-kicker">Atmospheric</p>
                <div className="space-y-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <p>{payload.pressure != null ? `${Math.round(payload.pressure)} hPa` : '—'}</p>
                  <p>
                    CAPE {payload.cape != null ? Math.round(payload.cape) : '—'} J/kg{' '}
                    {payload.cape > 1000 ? '⚡ Storm risk' : payload.cape > 500 ? '⚡ Possible' : '✓ Stable'}
                  </p>
                  <p>Cloud: {payload.cloudLow ?? '—'}% low · {payload.cloudMid ?? '—'}% mid · {payload.cloudHigh ?? '—'}% high</p>
                  <p>Vis {payload.visibility != null ? payload.visibility : '—'} km · Dew {payload.dewPoint != null ? `${payload.dewPoint}°C` : '—'}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[260px_1fr] text-sm text-slate-200">
              <div className="panel-subtle space-y-2">
                <p className="section-kicker">Composite risk</p>
                <p className="type-title text-white">{compositeRisk != null ? compositeRisk : '—'}/100</p>
                <p className="text-slate-300">Use alerts + AQI for go/no-go activity decisions.</p>
              </div>
              <div className="panel-subtle space-y-2">
                <p className="section-kicker">Risk breakdown</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {riskBreakdown.map((item) => {
                    const pct = item.value != null ? Math.round(item.value * 100) : null
                    return (
                      <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-slate-300">{item.label}</span>
                          <span className="font-semibold text-white">{pct != null ? `${pct}%` : '—'}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${pct != null ? pct : 0}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'planning' ? (
        <div role="tabpanel" id="panel-planning" aria-labelledby="tab-planning" className="space-y-4">
          <Card title="Clothing and activity" description="Simple outfit and schedule guidance">
            <div className="grid gap-3 lg:grid-cols-2 text-sm text-slate-200">
              <div className="panel-subtle space-y-2">
                <p className="section-kicker">What to wear</p>
                <ul className="space-y-1.5">
                  {clothing.map((line) => (
                    <li key={line} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                      <img src="/icons/weather/backpack-rain-cover.png" alt="" aria-hidden="true" className="mt-0.5 h-4 w-4 rounded object-cover" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="panel-subtle space-y-2">
                <p className="section-kicker">Plan windows</p>
                <p className="text-slate-300">Best slots are based on lower rain, AQI, and UV values.</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {best.map((hour) => (
                    <div key={`plan-${hour.hour}`} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                      <p className="font-semibold text-white">+{hour.hour}h</p>
                      <p className="text-slate-300">{hour.temp}°C</p>
                      <p className="text-slate-400">Rain {Math.round((hour.precip || 0) * 100)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

export default LocationPage

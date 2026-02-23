import { useMemo, useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather, useForecast, useExtendedForecast } from '../hooks/queries'
import LocationSearch from '../components/LocationSearch'
import { resolveWeatherIcon } from '../lib/weatherIcons'

const ForecastPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const [hover14, setHover14] = useState(null)
  const weather = useWeather(selected)
  const forecast = useForecast(selected)
  const extended = useExtendedForecast(selected)

  const shortLanguage = useMemo(() => {
    const payload = weather.data
    if (!payload) return 'Guidance unavailable'
    if ((payload.precip || 0) > 0.35) return 'Rain-prone day. Keep a light shell handy.'
    if ((payload.humidity || 0) > 82) return 'Muggy afternoon likely. Hydrate and pace activity.'
    if ((payload.temp || 0) > 34) return 'Heat risk after noon. Favor shaded windows.'
    return 'Best outdoor window 6–9 AM.'
  }, [weather.data])

  return (
    <div className="space-y-4">
      <section className="space-y-1">
        <p className="section-kicker">Forecast</p>
        <h1 className="type-display tracking-tight text-slate-50">Plan from now to 14 days</h1>
      </section>

      <div className="w-full max-w-xs">
        <LocationSearch
          locations={locations}
          value={selected}
          onChange={setSelected}
          label="City"
          placeholder="Type to search city"
        />
      </div>

      <Card title="Now" description="Current snapshot and concise guidance">
        {weather.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          (() => {
            const payload = weather.data || {}
            const icon = resolveWeatherIcon({
              summary: payload.summary,
              weathercode: payload.weathercode,
              precip: payload.precip,
              cloudCover: payload.cloudCover,
              wind: payload.wind,
              uv: payload.uv,
              temp: payload.temp,
            })

            const isNum = (value) => typeof value === 'number' && Number.isFinite(value)
            const oneDec = (value) => (isNum(value) ? value.toFixed(1) : '—')
            const zeroDec = (value) => (isNum(value) ? Math.round(value) : '—')

            const metricItems = [
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
            ]

            return (
              <div className="grid gap-3 text-sm text-slate-200 lg:grid-cols-[240px_1fr]">
                <div className="panel-subtle card-elevated space-y-2">
                  <p className="section-kicker">Current</p>
                  <p className="flex items-center gap-2.5 text-white">
                    <img src={icon} alt="Current weather icon" className="h-10 w-10 rounded-md object-cover ring-1 ring-white/15" />
                    <span className="type-display">{payload.temp ?? '—'}°C</span>
                  </p>
                  <p className="text-slate-200">{payload.summary || 'Conditions unavailable'}</p>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-full bg-white/10 px-2 py-1">AQI {payload.aqi ?? '—'}</span>
                    <span className="rounded-full bg-white/10 px-2 py-1">UV {oneDec(payload.uv)}</span>
                  </div>
                </div>

                <div className="panel-subtle space-y-2">
                  <p className="section-kicker">Current metrics</p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {metricItems.map((item) => (
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

                <div className="panel-subtle space-y-1 lg:col-span-2">
                  <p className="section-kicker">Language</p>
                  <p className="type-body text-slate-200">{shortLanguage}</p>
                </div>
              </div>
            )
          })()
        )}
      </Card>

      <Card title="Next 3 days" description="High/low and outdoor-readiness">
        {forecast.isLoading ? (
          <Skeleton className="h-20" />
        ) : (
            <div className="divide-y divide-white/5 text-sm text-slate-200">
             {(forecast.data || []).map((day, index) => {
               const note =
                 (day.precip || 0) > 0.35
                   ? 'Rain windows likely'
                   : day.high > 34
                   ? 'Warm peak by afternoon'
                   : 'Comfortable day profile'
               return (
                 <div key={day.day || index} className="grid gap-1 py-2 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-3">
                   <span className="font-semibold text-white">{day.day}</span>
                   <span className="text-slate-200">{day.high}° / {day.low}°</span>
                   {day.windMax != null && <span className="text-[11px] text-sky-300">💨 {day.windMax} km/h</span>}
                   <span className="text-[11px] text-amber-200">{note}</span>
                 </div>
               )
             })}
          </div>
        )}
      </Card>

      <Card title="14-day forecast" description="Breathable trend chart with hover details on all 14 days">
        {extended.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          (() => {
            const data = (extended.data || []).slice(0, 14)
            if (!data.length) return <p className="text-sm text-slate-400">No extended data available.</p>

            const chartW = 760
            const chartH = 320
            const margin = { top: 26, right: 22, bottom: 52, left: 54 }
            const plotW = chartW - margin.left - margin.right
            const plotH = chartH - margin.top - margin.bottom

            const minLow = Math.min(...data.map((d) => d.low))
            const maxHigh = Math.max(...data.map((d) => d.high))
            const yMin = Math.floor((minLow - 2) / 2) * 2
            const yMax = Math.ceil((maxHigh + 2) / 2) * 2
            const yRange = Math.max(1, yMax - yMin)

            const xAt = (index) => margin.left + (index / Math.max(1, data.length - 1)) * plotW
            const yAt = (temp) => margin.top + ((yMax - temp) / yRange) * plotH

            const highPath = data.map((d, i) => `${xAt(i)},${yAt(d.high)}`).join(' ')
            const lowPath = data.map((d, i) => `${xAt(i)},${yAt(d.low)}`).join(' ')
            const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (yRange / 4) * i)

            const showDayInfo = (day, pointIndex) => {
              setHover14({
                day: day.day,
                pointIndex,
                high: day.high,
                low: day.low,
                precip: day.precipSum,
                wind: day.windMax,
              })
            }

            const clearDayInfo = () => setHover14(null)
            const hoverLeft = hover14 ? Math.min(92, Math.max(8, (hover14.pointIndex / Math.max(1, data.length - 1)) * 100)) : 50

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="section-kicker">14-day trend</span>
                  <span>Hover any day point for details</span>
                </div>

                <div className="relative rounded-2xl border border-white/10 bg-slate-900/55 p-3">
                  {hover14 ? (
                    <div
                      className="pointer-events-none absolute top-2 z-20 w-max -translate-x-1/2 rounded-lg border border-white/15 bg-slate-950/90 px-2.5 py-1.5 text-[11px] text-slate-100 shadow-lg"
                      style={{ left: `${hoverLeft}%` }}
                    >
                      <p className="font-semibold text-white">{hover14.day}</p>
                      <p className="text-slate-300">H {hover14.high}° · L {hover14.low}°</p>
                      <p className="text-slate-400">Rain {hover14.precip > 0 ? `${hover14.precip.toFixed(1)} mm` : 'Dry'} · Wind {hover14.wind != null ? `${hover14.wind} km/h` : '—'}</p>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-white/10 bg-slate-950/65 p-2" onMouseLeave={clearDayInfo}>
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full aspect-[760/320]" preserveAspectRatio="xMidYMid meet" role="img" aria-label="14-day high and low trend with axes">
                      <defs>
                        <linearGradient id="forecastHigh" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgba(56,189,248,0.95)" />
                          <stop offset="100%" stopColor="rgba(59,130,246,0.95)" />
                        </linearGradient>
                        <linearGradient id="forecastLow" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgba(52,211,153,0.95)" />
                          <stop offset="100%" stopColor="rgba(16,185,129,0.95)" />
                        </linearGradient>
                      </defs>

                      {yTicks.map((tick, idx) => {
                        const y = yAt(tick)
                        return (
                          <g key={`y-${idx}`}>
                            <line x1={margin.left} y1={y} x2={chartW - margin.right} y2={y} stroke="rgba(148,163,184,0.14)" strokeDasharray="2 4" />
                            <text x={margin.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="rgba(148,163,184,0.9)">{Math.round(tick)}°</text>
                          </g>
                        )
                      })}

                      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={chartH - margin.bottom} stroke="rgba(226,232,240,0.45)" />
                      <line x1={margin.left} y1={chartH - margin.bottom} x2={chartW - margin.right} y2={chartH - margin.bottom} stroke="rgba(226,232,240,0.45)" />

                      {data.map((day, i) => {
                        const x = xAt(i)
                        return (
                          <g key={`hover-band-${day.day}-${i}`}>
                            <rect
                              x={x - plotW / Math.max(1, data.length - 1) / 2}
                              y={margin.top}
                              width={plotW / Math.max(1, data.length - 1)}
                              height={plotH}
                              fill="transparent"
                              onMouseEnter={() => showDayInfo(day, i)}
                              onFocus={() => showDayInfo(day, i)}
                            />
                          </g>
                        )
                      })}

                      <polyline fill="none" stroke="url(#forecastHigh)" strokeWidth="2" points={highPath} />
                      <polyline fill="none" stroke="url(#forecastLow)" strokeWidth="2" points={lowPath} />

                      {data.map((d, i) => {
                        const x = xAt(i)
                        const active = hover14?.pointIndex === i
                        return (
                          <g key={`${d.day}-${i}`}>
                            <circle cx={x} cy={yAt(d.high)} r={active ? '4' : '3'} fill="rgba(56,189,248,1)" onMouseEnter={() => showDayInfo(d, i)} onTouchStart={() => showDayInfo(d, i)} />
                            <circle cx={x} cy={yAt(d.low)} r={active ? '4' : '3'} fill="rgba(52,211,153,1)" onMouseEnter={() => showDayInfo(d, i)} onTouchStart={() => showDayInfo(d, i)} />
                            <text x={x} y={chartH - margin.bottom + 14} textAnchor="middle" fontSize="10" fill="rgba(148,163,184,0.9)">{String(d.day || '').slice(0, 3)}</text>
                          </g>
                        )
                      })}

                      <text x={margin.left + plotW / 2} y={chartH - 6} textAnchor="middle" fontSize="10" fill="rgba(148,163,184,0.9)">Day</text>
                      <text x={12} y={margin.top + plotH / 2} textAnchor="middle" fontSize="10" fill="rgba(148,163,184,0.9)" transform={`rotate(-90 12 ${margin.top + plotH / 2})`}>Temperature °C</text>
                    </svg>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-cyan-100"><span className="inline-block h-2 w-3 rounded bg-cyan-400" /> Daily high</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-100"><span className="inline-block h-2 w-3 rounded bg-emerald-400" /> Daily low</span>
                </div>
              </div>
            )
          })()
        )}
      </Card>
    </div>
  )
}

export default ForecastPage

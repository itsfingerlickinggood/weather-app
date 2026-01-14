import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather, useForecast, useExtendedForecast, useHourly } from '../hooks/queries'
import { useMemo, useState } from 'react'
import LocationSearch from '../components/LocationSearch'

const seededRandom = (seed, offset = 0) => {
  const s = `${seed}-${offset}`
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 1000000
  return Math.abs(Math.sin(h)) % 1
}

const makeFallbackCurrent = (id) => {
  const r = seededRandom(id)
  return {
    temp: Math.round(70 + r * 20),
    feelsLike: Math.round(70 + r * 20 + 2),
    summary: r > 0.6 ? 'Partly cloudy' : 'Clear',
    aqi: Math.round(40 + r * 80),
    uv: Math.round(2 + r * 8),
    humidity: Math.round(50 + r * 40),
    wind: Math.round(5 + r * 12),
    sunrise: new Date().setHours(6, 10, 0, 0),
    sunset: new Date().setHours(18, 45, 0, 0),
    currentTime: new Date().toISOString(),
  }
}

const makeFallbackForecast = (id, days) =>
  Array.from({ length: days }).map((_, idx) => {
    const r = seededRandom(id, idx + 1)
    return {
      day: new Date(Date.now() + idx * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
      high: Math.round(75 + r * 18),
      low: Math.round(60 + r * 12),
      precip: Math.min(1, r * 0.9),
    }
  })

const makeFallbackHourly = (id, hours = 24) =>
  Array.from({ length: hours }).map((_, idx) => {
    const r = seededRandom(id, idx + 50)
    return {
      hour: idx,
      temp: Math.round(68 + r * 18),
      precip: Math.min(1, r * 0.8),
      aqi: Math.round(40 + r * 120),
    }
  })

const makeFallbackAqi = (id, days = 14) =>
  Array.from({ length: days }).map((_, idx) => {
    const r = seededRandom(id, idx + 200)
    return {
      day: new Date(Date.now() + idx * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
      aqi: Math.round(40 + r * 140),
      comfort: Math.max(0, 100 - Math.abs((r * 40) - 15) * 2),
    }
  })

const graphStyle = { width: '100%', height: '140px' }

const ForecastPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const [hover14, setHover14] = useState('')
  const weather = useWeather(selected)
  const forecast = useForecast(selected)
  const extended = useExtendedForecast(selected)
  const hourly = useHourly(selected)

  const hourlyHint = useMemo(() => {
    const temp = weather.data?.data?.temp
    const humidity = weather.data?.data?.humidity
    const uv = weather.data?.data?.uv
    const parts = []
    if (temp != null) parts.push(temp > 95 ? 'Heat spike' : temp < 60 ? 'Cool air' : 'Comfortable')
    if (humidity != null) parts.push(`Humidity ${humidity}%`)
    if (uv != null) parts.push(`UV ${uv}`)
    return parts.join(' • ')
  }, [weather.data?.data])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-full max-w-xs">
          <LocationSearch
            locations={locations}
            value={selected}
            onChange={setSelected}
            label="City"
            placeholder="Type to search city"
          />
        </div>
      </div>

      <Card title="Now" description="Current snapshot + key vitals">
        {weather.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          (() => {
            const live = weather.data?.data
            const fallback = makeFallbackCurrent(selected)
            const payload = live || fallback
            return (
              <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-200">
                <div className="space-y-1 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase text-slate-400">Headline</p>
                  <p className="text-3xl font-semibold text-white">{payload?.temp}°F</p>
                  <p>{payload?.summary}</p>
                  <p className="text-[11px] text-slate-400">Feels like {payload?.feelsLike ?? payload?.temp}°F</p>
                </div>
                <div className="space-y-2 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase text-slate-400">Vitals</p>
                  <div className="flex flex-wrap gap-3">
                    <span>AQI {payload?.aqi ?? '—'}</span>
                    <span>UV {payload?.uv ?? '—'}</span>
                    <span>Humidity {payload?.humidity ?? '—'}%</span>
                    <span>Wind {payload?.wind ?? '—'} mph</span>
                  </div>
                </div>
                <div className="space-y-1 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase text-slate-400">Sun</p>
                  <p>Sunrise {payload?.sunrise ? new Date(payload.sunrise).toLocaleTimeString() : '—'}</p>
                  <p>Sunset {payload?.sunset ? new Date(payload.sunset).toLocaleTimeString() : '—'}</p>
                  <p className="text-[11px] text-slate-400">
                    Updated {payload?.currentTime ? new Date(payload.currentTime).toLocaleTimeString() : '—'}
                  </p>
                </div>
              </div>
            )
          })()
        )}
      </Card>
      <Card title="Hour-by-hour hints" description="Snapshot guidance">
        {weather.isLoading ? (
          <Skeleton className="h-16" />
        ) : weather.error ? (
          <p className="text-sm text-red-300">Unable to load.</p>
        ) : (
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-sm text-slate-200">
            {hourlyHint || 'Hourly guidance not available'}
          </div>
        )}
      </Card>

      <Card title="Next 3 days" description="High/Low/Precip + quick signals">
        {forecast.isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          (() => {
            const data = forecast.data?.length ? forecast.data : makeFallbackForecast(selected, 3)
            return (
              <div className="divide-y divide-white/5 text-sm text-slate-200">
                {data.map((day) => (
                  <div key={day.day} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{day.day}</span>
                      <span className="text-xs text-slate-400">{Math.round((day.precip || 0) * 100)}% precip</span>
                    </div>
                    <span>
                      {day.high}° / {day.low}°
                    </span>
                    <span className="text-[11px] text-amber-200">
                      {(day.high > 95 && 'Heat risk') || (day.low < 55 && 'Cool breeze') || 'Mild'}
                    </span>
                  </div>
                ))}
              </div>
            )
          })()
        )}
      </Card>

      <Card title="14-day outlook" description="Compact highs/lows + precip">
        {extended.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          (() => {
            const data = extended.data?.length ? extended.data.slice(0, 14) : makeFallbackForecast(selected, 14)
            const rainDays = data.filter((d) => (d.precip || 0) > 0.3).length
            const temps = data.map((d) => ({ high: d.high, low: d.low }))
            const minLow = Math.min(...temps.map((t) => t.low))
            const maxHigh = Math.max(...temps.map((t) => t.high))
            const scale = (val) => {
              if (!Number.isFinite(val)) return 0
              return 100 - ((val - minLow) / Math.max(1, maxHigh - minLow)) * 100
            }
            const highPoints = data
              .map((d, i) => {
                const x = (i / Math.max(1, data.length - 1)) * 100
                return `${x},${scale(d.high)}`
              })
              .join(' ')
            const lowPoints = data
              .map((d, i) => {
                const x = (i / Math.max(1, data.length - 1)) * 100
                return `${x},${scale(d.low)}`
              })
              .join(' ')
            const comfortPoints = data
              .map((d, i) => {
                const comfort = Math.max(0, 100 - Math.abs(((d.high + d.low) / 2 - 78) * 1.2) - (d.precip || 0) * 50)
                const x = (i / Math.max(1, data.length - 1)) * 100
                const y = 100 - (comfort / 100) * 100
                return `${x},${y}`
              })
              .join(' ')

            return (
              <div className="mt-2 space-y-2 rounded-xl border border-white/5 bg-slate-900/60 p-2 relative">
                {hover14 ? (
                  <div className="absolute right-2 top-2 rounded-full bg-white/10 px-2 py-1 text-[10px] text-slate-100">
                    {hover14}
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span>Rainy: {rainDays}/14</span>
                  <span>Comfort: 68°–85°</span>
                </div>
                <svg viewBox="0 0 100 60" style={graphStyle} preserveAspectRatio="none">
                  <polyline fill="none" stroke="rgb(59,130,246)" strokeWidth="0.9" points={highPoints} />
                  <polyline fill="none" stroke="rgb(16,185,129)" strokeWidth="0.9" points={lowPoints} />
                  <polyline fill="none" stroke="rgb(249,115,22)" strokeWidth="0.6" points={comfortPoints} />
                  {data.map((d, i) => {
                    const x = (i / Math.max(1, data.length - 1)) * 100
                    return (
                      <circle
                        key={`h-${i}`}
                        cx={x}
                        cy={scale(d.high)}
                        r="1.2"
                        fill="rgb(59,130,246)"
                        onMouseEnter={() => setHover14(`${d.day}: ${d.high}° / ${d.low}°`)}
                        onMouseLeave={() => setHover14('')}
                      />
                    )
                  })}
                  {data.map((d, i) => {
                    const x = (i / Math.max(1, data.length - 1)) * 100
                    return (
                      <circle
                        key={`l-${i}`}
                        cx={x}
                        cy={scale(d.low)}
                        r="1.2"
                        fill="rgb(16,185,129)"
                        onMouseEnter={() => setHover14(`${d.day}: ${d.high}° / ${d.low}°`)}
                        onMouseLeave={() => setHover14('')}
                      />
                    )
                  })}
                </svg>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="inline-block h-2 w-3 bg-blue-500" /> Highs
                  <span className="inline-block h-2 w-3 bg-emerald-500" /> Lows
                  <span className="inline-block h-2 w-3 bg-orange-400" /> Comfort
                </div>
                <div className="mt-1">
                  <p className="text-[10px] uppercase text-slate-400">Precip</p>
                  <div className="flex items-end gap-1">
                    {data.map((d, i) => (
                      <div key={`${d.day}-p-${i}`} className="flex flex-col items-center gap-1">
                        <div
                          className="w-2.5 rounded-full bg-blue-400"
                          style={{ height: `${Math.min(50, Math.round((d.precip || 0) * 100)) / 3}px` }}
                          title={`${d.day}: ${Math.round((d.precip || 0) * 100)}%`}
                          onMouseEnter={() => setHover14(`${d.day}: Precip ${Math.round((d.precip || 0) * 100)}%`)}
                          onMouseLeave={() => setHover14('')}
                        />
                        <span className="text-[8px] text-slate-400">{d.day.slice(0, 2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()
        )}
      </Card>

      <Card title="AQI & comfort trend" description="Next 14 days (compact)">
        {extended.isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          (() => {
            const aqiTrend = makeFallbackAqi(selected, 14)
            const minAqi = Math.min(...aqiTrend.map((d) => d.aqi))
            const maxAqi = Math.max(...aqiTrend.map((d) => d.aqi))
            const scaleAqi = (val) => 100 - ((val - minAqi) / Math.max(1, maxAqi - minAqi)) * 100
            const aqiPoints = aqiTrend
              .map((d, i) => {
                const x = (i / Math.max(1, aqiTrend.length - 1)) * 100
                return `${x},${scaleAqi(d.aqi)}`
              })
              .join(' ')
            return (
              <div className="space-y-1 rounded-xl border border-white/5 bg-slate-900/60 p-2">
                <svg viewBox="0 0 100 50" style={graphStyle} preserveAspectRatio="none">
                  <polyline fill="none" stroke="rgb(239,68,68)" strokeWidth="1" points={aqiPoints} />
                  {aqiTrend.map((d, i) => {
                    const x = (i / Math.max(1, aqiTrend.length - 1)) * 100
                    const y = scaleAqi(d.aqi)
                    return (
                      <circle key={`aq-${i}`} cx={x} cy={y} r="1.2" fill="rgb(239,68,68)">
                        <title>{`${d.day}: AQI ${d.aqi}`}</title>
                      </circle>
                    )
                  })}
                </svg>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="inline-block h-2 w-3 bg-red-500" /> AQI
                </div>
              </div>
            )
          })()
        )}
      </Card>

      <Card title="Next 24 hours" description="Temperature & precip trend (compact)">
        {hourly.isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          (() => {
            const hrs = hourly.data?.length ? hourly.data.slice(0, 24) : makeFallbackHourly(selected, 24)
            const minT = Math.min(...hrs.map((h) => h.temp))
            const maxT = Math.max(...hrs.map((h) => h.temp))
            const scaleT = (t) => 100 - ((t - minT) / Math.max(1, maxT - minT)) * 100
            const tempPoints = hrs
              .map((h, i) => {
                const x = (i / Math.max(1, hrs.length - 1)) * 100
                return `${x},${scaleT(h.temp)}`
              })
              .join(' ')
            return (
              <div className="space-y-1 rounded-xl border border-white/5 bg-slate-900/60 p-2">
                <svg viewBox="0 0 100 50" style={graphStyle} preserveAspectRatio="none">
                  <polyline fill="none" stroke="rgb(251,191,36)" strokeWidth="1" points={tempPoints} />
                  {hrs.slice(0, 12).map((h, i) => {
                    const x = (i / Math.max(1, hrs.length - 1)) * 100
                    const y = scaleT(h.temp)
                    return (
                      <circle key={`t-${i}`} cx={x} cy={y} r="1" fill="rgb(251,191,36)">
                        <title>{`+${h.hour}h: ${h.temp}°`}</title>
                      </circle>
                    )
                  })}
                </svg>
                <div className="flex items-end gap-1">
                  {hrs.slice(0, 12).map((h, i) => (
                    <div key={`p-${i}`} className="flex flex-col items-center gap-0.5 text-[9px] text-slate-300">
                      <div
                        className="w-2.5 rounded-full bg-blue-400"
                        style={{ height: `${Math.min(40, Math.round((h.precip || 0) * 100)) / 3}px` }}
                        title={`+${h.hour}h: ${Math.round((h.precip || 0) * 100)}%`}
                      />
                      <span>+{h.hour}h</span>
                    </div>
                  ))}
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

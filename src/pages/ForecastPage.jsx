import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather, useForecast, useExtendedForecast, useHourly } from '../hooks/queries'
import { useMemo, useState } from 'react'
import LocationSearch from '../components/LocationSearch'

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
    const temp = weather.data?.temp
    const humidity = weather.data?.humidity
    const uv = weather.data?.uv
    const parts = []
    if (temp != null) parts.push(temp > 35 ? 'Heat spike' : temp < 15 ? 'Cool air' : 'Comfortable')
    if (humidity != null) parts.push(`Humidity ${humidity}%`)
    if (uv != null) parts.push(`UV ${uv}`)
    return parts.join(' • ')
  }, [weather.data])

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
            const live = weather.data
            const payload = live || {}
            return (
              <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-200">
                <div className="space-y-1 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase text-slate-400">Headline</p>
                  <p className="text-3xl font-semibold text-white">{payload?.temp}°C</p>
                  <p>{payload?.summary}</p>
                  <p className="text-[11px] text-slate-400">Feels like {payload?.feelsLike ?? payload?.temp}°C</p>
                </div>
                <div className="space-y-2 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase text-slate-400">Vitals</p>
                  <div className="flex flex-wrap gap-3">
                    <span>AQI {payload?.aqi ?? '—'}</span>
                    <span>UV {payload?.uv ?? '—'}</span>
                    <span>Humidity {payload?.humidity ?? '—'}%</span>
                    <span>Wind {payload?.wind ?? '—'} km/h</span>
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
            const data = forecast.data?.length ? forecast.data : []
            return (
              <div className="divide-y divide-white/5 text-sm text-slate-200">
                {data.map((day, i) => (
                  <div key={day.day || day.date || i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{day.day}</span>
                      <span className="text-xs text-slate-400">{Math.round((day.precip || 0) * 100)}% precip</span>
                    </div>
                    <span>
                      {day.high}° / {day.low}°
                    </span>
                    <span className="text-[11px] text-amber-200">
                      {(day.high > 35 && 'Heat risk') || (day.low < 13 && 'Cool breeze') || 'Mild'}
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
            const data = extended.data?.length ? extended.data.slice(0, 14) : []
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
                const comfort = Math.max(0, 100 - Math.abs(((d.high + d.low) / 2 - 25) * 1.2) - (d.precip || 0) * 50)
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
                  <span>Comfort: 20–29°C</span>
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
                      <div key={`${d.day || d.date || i}-p-${i}`} className="flex flex-col items-center gap-1">
                        <div
                          className="w-2.5 rounded-full bg-blue-400"
                          style={{ height: `${Math.min(50, Math.round((d.precip || 0) * 100)) / 3}px` }}
                          title={`${d.day || d.date}: ${Math.round((d.precip || 0) * 100)}%`}
                          onMouseEnter={() => setHover14(`${d.day || d.date}: Precip ${Math.round((d.precip || 0) * 100)}%`)}
                          onMouseLeave={() => setHover14('')}
                        />
                        <span className="text-[8px] text-slate-400">{(d.day || d.date || '').slice(0, 2)}</span>
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
            const aqiTrend = (extended.data || []).map((d, i) => ({
              day: d.day || d.date || `Day ${i + 1}`,
              aqi: d.aqi ?? 60,
            }))
            if (!aqiTrend.length) return <p className="text-sm text-slate-400">No AQI trend data available.</p>
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
            const hrs = hourly.data?.length ? hourly.data.slice(0, 24) : []
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

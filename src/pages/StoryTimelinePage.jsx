import { useState } from 'react'
import Card from '../components/Card'
import LocationSearch from '../components/LocationSearch'
import Skeleton from '../components/Skeleton'
import { useExtendedForecast, useHourly, useLocations } from '../hooks/queries'
import { resolveWeatherIcon } from '../lib/weatherIcons'
import AppIcon from '../components/AppIcon'

const narrativeForDay = (day) => {
  if (!day) return 'No data available.'
  const precipText = day.precip > 0.5 ? 'Expect frequent rain.' : day.precip > 0.2 ? 'Spotty showers possible.' : 'Low chance of rain.'
  const tempText = day.high >= 35 ? 'Heat precautions needed.' : day.high <= 10 ? 'Chilly, layer up.' : 'Comfortable temperatures.'
  return `${tempText} ${precipText}`
}

const StoryTimelinePage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const { data, isLoading } = useExtendedForecast(selected)
  const hourlyQuery = useHourly(selected)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-full max-w-xs">
          <LocationSearch
            locations={locations}
            value={selected}
            onChange={setSelected}
            label="Location"
            placeholder="Type to search city"
          />
        </div>
      </div>
      <Card title="Story timeline" description="Narrative forecast">
        {isLoading ? (
          <Skeleton className="h-28" />
        ) : (
          <ol className="space-y-3 text-sm text-slate-200" role="list">
            {data?.slice(0, 14).map((day) => (
              <li key={day.day} className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-white">
                    <img
                      src={resolveWeatherIcon({ weathercode: day.weathercode, precip: day.precip, temp: day.high })}
                      alt={`${day.day} weather icon`}
                      className="h-5 w-5 rounded object-cover"
                    />
                    <span>{day.day}</span>
                    {day.summary && <span className="text-[11px] text-slate-400 font-normal">{day.summary}</span>}
                  </span>
                  <span className="text-slate-300">High {day.high}° / Low {day.low}°</span>
                </div>
                <p className="text-slate-300">{Math.round(day.precip * 100)}% chance of precip{day.precipSum > 0 ? ` · ${day.precipSum.toFixed(1)} mm` : ''}</p>
                <p className="text-slate-400">{narrativeForDay(day)}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 inline-flex items-center gap-1"><AppIcon name="thermometer" className="h-3 w-3" />{day.high > 34 ? 'Heat window' : 'Comfort window'}</span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 inline-flex items-center gap-1"><AppIcon name="droplet" className="h-3 w-3" />{day.precip > 0.35 ? 'Rain risk' : 'Low rain risk'}</span>
                  {day.windMax != null && <span className="rounded-full bg-white/10 px-2.5 py-1 inline-flex items-center gap-1"><AppIcon name="wind" className="h-3 w-3" />Wind {day.windMax} km/h</span>}
                  {day.uv != null && <span className="rounded-full bg-white/10 px-2.5 py-1 inline-flex items-center gap-1"><AppIcon name="sun" className="h-3 w-3" />UV {day.uv}</span>}
                  {day.sunrise && <span className="rounded-full bg-white/10 px-2.5 py-1 inline-flex items-center gap-1">🌅 {new Date(day.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                  {day.sunset && <span className="rounded-full bg-white/10 px-2.5 py-1 inline-flex items-center gap-1">🌇 {new Date(day.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title="24-hour story" description="Rolling narrative with hourly cues">
        {hourlyQuery.isLoading ? (
          <Skeleton className="h-28" />
        ) : (
          <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3 lg:grid-cols-4">
            {hourlyQuery.data?.map((hour) => (
              <div key={hour.hour} className="rounded-xl border border-white/5 bg-slate-900/60 p-2 text-sm text-slate-200">
                <p className="text-xs text-slate-400">+{hour.hour}h</p>
                <p className="font-semibold text-white">{hour.temp}°C {hour.feelsLike != null && <span className="text-xs text-slate-400">/{hour.feelsLike}°</span>}</p>
                <p className="text-[11px] text-slate-400">Rain {Math.round((hour.precip || 0) * 100)}%{hour.precipMm > 0 ? ` · ${hour.precipMm}mm` : ''}</p>
                {hour.wind != null && <p className="text-[11px] text-slate-400">💨 {hour.wind} km/h{hour.windGusts != null ? ` (g${hour.windGusts})` : ''}</p>}
                {hour.uv != null && hour.uv > 0 && <p className="text-[11px] text-amber-300">UV {hour.uv}</p>}
                {hour.aqi != null && <p className="text-[11px] text-emerald-300">AQI {hour.aqi}</p>}
                {hour.visibility != null && <p className="text-[11px] text-slate-400">Vis {hour.visibility}km</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Next 6 hours" description="Hourly narrative view">
        {hourlyQuery.isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="grid grid-cols-3 gap-2 text-sm text-slate-200">
            {hourlyQuery.data?.slice(0, 6).map((hour) => (
              <div key={hour.hour} className="rounded-xl border border-white/5 bg-slate-900/60 p-2">
                <p className="text-xs text-slate-400">+{hour.hour}h</p>
                <p className="font-semibold text-white">{hour.temp}°C</p>
                <p className="text-[11px] text-emerald-200">Rain {Math.round((hour.precip || 0) * 100)}%</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default StoryTimelinePage

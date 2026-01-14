import { useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useExtendedForecast, useHourly, useLocations } from '../hooks/queries'

const narrativeForDay = (day) => {
  if (!day) return 'No data available.'
  const precipText = day.precip > 0.5 ? 'Expect frequent rain.' : day.precip > 0.2 ? 'Spotty showers possible.' : 'Low chance of rain.'
  const tempText = day.high >= 90 ? 'Heat precautions needed.' : day.high <= 50 ? 'Chilly, layer up.' : 'Comfortable temperatures.'
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
        <label className="text-sm text-slate-300">
          <span className="mr-2 text-xs uppercase text-slate-400">Location</span>
          <select
            className="focus-ring rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Card title="Story timeline" description="Narrative forecast">
        {isLoading ? (
          <Skeleton className="h-28" />
        ) : (
          <ol className="space-y-3 text-sm text-slate-200" role="list">
            {data?.slice(0, 14).map((day) => (
              <li key={day.day} className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{day.day}</span>
                  <span className="text-slate-300">High {day.high}° / Low {day.low}°</span>
                </div>
                <p className="text-slate-300">{Math.round(day.precip * 100)}% chance of precip</p>
                <p className="text-slate-400">{narrativeForDay(day)}</p>
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
                <p className="font-semibold text-white">{hour.temp}°F</p>
                <p className="text-[11px] text-slate-400">AQI {hour.aqi}</p>
                <p className="text-[11px] text-emerald-200">Precip {Math.round((hour.precip || 0) * 100)}%</p>
                <p className="text-[11px] text-slate-300">{hour.temp >= 90 ? 'Heat alert' : hour.precip > 0.4 ? 'Rainy window' : 'Calm hour'}</p>
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
            {hourlyQuery.data?.map((hour) => (
              <div key={hour.hour} className="rounded-xl border border-white/5 bg-slate-900/60 p-2">
                <p className="text-xs text-slate-400">+{hour.hour}h</p>
                <p className="font-semibold text-white">{hour.temp}°F</p>
                <p className="text-[11px] text-slate-400">AQI {hour.aqi}</p>
                <p className="text-[11px] text-emerald-200">Precip {Math.round((hour.precip || 0) * 100)}%</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default StoryTimelinePage

import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather, useForecast, useExtendedForecast } from '../hooks/queries'
import { useState } from 'react'

const ForecastPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const weather = useWeather(selected)
  const forecast = useForecast(selected)
  const extended = useExtendedForecast(selected)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-200">
          <span className="mr-2 text-xs uppercase text-slate-400">City</span>
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

      <Card title="Now" description="Current snapshot">
        {weather.isLoading ? (
          <Skeleton className="h-24" />
        ) : weather.error ? (
          <p className="text-sm text-red-300">Unable to load.</p>
        ) : (
          <div className="flex flex-wrap gap-4 text-sm text-slate-200">
            <span className="text-3xl font-semibold text-white">{weather.data?.data?.temp}°F</span>
            <span>{weather.data?.data?.summary}</span>
            <span>AQI {weather.data?.data?.aqi}</span>
            <span>UV {weather.data?.data?.uv}</span>
          </div>
        )}
      </Card>

      <Card title="Next 3 days" description="High/Low/Precip">
        {forecast.isLoading ? (
          <Skeleton className="h-20" />
        ) : forecast.error ? (
          <p className="text-sm text-red-300">Unable to load forecast.</p>
        ) : (
          <div className="divide-y divide-white/5 text-sm text-slate-200">
            {forecast.data?.map((day) => (
              <div key={day.day} className="flex items-center justify-between py-2">
                <span>{day.day}</span>
                <span>{day.high}° / {day.low}°</span>
                <span className="text-amber-200">{Math.round((day.precip || 0) * 100)}% precip</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="14-day outlook" description="Extended view">
        {extended.isLoading ? (
          <Skeleton className="h-24" />
        ) : extended.error ? (
          <p className="text-sm text-red-300">Unable to load outlook.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {extended.data?.slice(0, 14).map((day, idx) => (
              <div key={`${day.day}-${idx}`} className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{day.day}</span>
                  <span>{day.high}° / {day.low}°</span>
                </div>
                <p className="text-xs text-amber-200">Precip {Math.round((day.precip || 0) * 100)}%</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default ForecastPage

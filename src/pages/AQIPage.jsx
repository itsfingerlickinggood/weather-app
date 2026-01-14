import { useState } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather } from '../hooks/queries'

const categorize = (aqi) => {
  if (aqi == null) return { label: 'Unknown', tip: 'AQI unavailable', tone: 'neutral' }
  if (aqi <= 50) return { label: 'Good', tip: 'Air quality is good for everyone.', tone: 'success' }
  if (aqi <= 100) return { label: 'Moderate', tip: 'Sensitive groups should pace activities.', tone: 'neutral' }
  if (aqi <= 150) return { label: 'Unhealthy (SG)', tip: 'Limit prolonged outdoor exertion.', tone: 'warning' }
  return { label: 'Unhealthy', tip: 'Move activities indoors and consider a mask.', tone: 'danger' }
}

const AQIPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const { data, isLoading } = useWeather(selected)
  const payload = data?.data
  const meta = categorize(payload?.aqi)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-300">
          <span className="mr-2 text-xs uppercase text-slate-400">Location</span>
          <select
            className="focus-ring rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Select location for AQI"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </label>
        {data?.offline ? <Badge tone="warning" label="Offline cache" /> : <Badge label="Live" tone="success" />}
      </div>
      <Card title="Air quality" description="Scaled 0-500">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="space-y-2 rounded-xl border border-white/5 bg-slate-900/60 p-3 text-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold">{payload?.aqi}</span>
              <Badge tone={meta.tone} label={meta.label} />
            </div>
            <p className="text-sm text-slate-300">{meta.tip}</p>
            <p className="text-xs text-slate-400">Protect sensitive groups with breaks and filtration when AQI rises.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AQIPage

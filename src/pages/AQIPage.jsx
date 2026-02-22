import { useState } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather } from '../hooks/queries'
import LocationSearch from '../components/LocationSearch'

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
  const payload = data || { aqi: null }
  const meta = categorize(payload?.aqi)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <LocationSearch
            locations={locations}
            value={selected}
            onChange={setSelected}
            label="Location"
            placeholder="Type to search city"
          />
        </div>
        {data?.offline ? <Badge tone="warning" label="Offline cache" /> : <Badge label="Live" tone="success" />}
      </div>
      <Card title="Air quality" description="Scaled 0-500 with health guidance">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="space-y-3 rounded-xl border border-white/5 bg-slate-900/60 p-3 text-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold">{payload?.aqi ?? '—'}</span>
              <Badge tone={meta.tone} label={meta.label} />
              {data?.offline ? <Badge tone="warning" label="Offline cache" /> : <Badge label="Live" tone="success" />}
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500"
                style={{ width: `${Math.min(100, Math.max(0, (payload?.aqi ?? 0) / 5))}%` }}
              />
            </div>
            <p className="text-sm text-slate-300">{meta.tip}</p>
            <div className="grid gap-2 md:grid-cols-2 text-xs text-slate-200">
              <div className="rounded-lg border border-white/5 bg-white/5 p-2">
                <p className="text-[11px] uppercase text-slate-400">Protective steps</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Limit intense outdoor activity if AQI &gt; 100.</li>
                  <li>Use an N95 if AQI &gt; 150 and sensitive.</li>
                  <li>Close windows; run filtration if available.</li>
                </ul>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/5 p-2">
                <p className="text-[11px] uppercase text-slate-400">Sensitive groups</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Kids, elderly, cardio/respiratory conditions.</li>
                  <li>Plan breaks and hydrate; avoid peak traffic corridors.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AQIPage

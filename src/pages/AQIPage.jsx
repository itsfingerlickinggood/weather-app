import { useState } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather } from '../hooks/queries'
import LocationSearch from '../components/LocationSearch'
import AppIcon from '../components/AppIcon'

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
  const marker = Math.min(100, Math.max(0, (payload?.aqi ?? 0) / 5))
  const isSensitive = (payload?.aqi || 0) > 100
  const uvRisk = (payload?.uv || 0) >= 7
  const healthIssues = [
    (payload?.aqi || 0) > 150 ? 'Breathing discomfort likely for most people outdoors.' : null,
    (payload?.aqi || 0) > 100 ? 'Sensitive groups may feel throat/eye irritation.' : null,
    uvRisk ? 'High UV may increase sun-stress and dehydration risk.' : null,
    (payload?.pm25 || 0) > 35 ? 'Fine particle exposure is elevated.' : null,
  ].filter(Boolean)
  const recommendations = [
    (payload?.aqi || 0) > 100 ? 'Reduce intense outdoor workouts during peak traffic hours.' : 'Normal outdoor activities are generally okay.',
    isSensitive ? 'Carry an N95 mask if you need prolonged outdoor exposure.' : 'Mask usually not necessary for short outdoor activity.',
    uvRisk ? 'Use SPF, sunglasses, and seek shade around noon.' : 'Moderate UV: basic sun protection is enough.',
    'Hydrate well and ventilate indoor spaces during cleaner air windows.',
  ]

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
      <Card title="Health Center · AQI" description="Scaled 0-500 with consistent risk guidance">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xl bg-white/5 p-2 text-emerald-200"><AppIcon name="pulse" className="h-5 w-5" /></span>
              <span className="type-display text-white">{payload?.aqi ?? '—'}</span>
              <Badge tone={meta.tone} label={meta.label} />
              {data?.offline ? <Badge tone="warning" label="Offline cache" /> : <Badge label="Live" tone="success" />}
            </div>
            <div className="space-y-2">
              <div className="risk-band relative">
                <div className="risk-marker absolute -top-0.5" style={{ left: `calc(${marker}% - 6px)` }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Good</span>
                <span>Moderate</span>
                <span>Unhealthy</span>
              </div>
            </div>
            <p className="type-body text-slate-300">{meta.tip}</p>
            <div className="grid gap-2 md:grid-cols-2 text-xs text-slate-200">
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400"><AppIcon name="alert" className="h-3.5 w-3.5" />Likely issues</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {(healthIssues.length ? healthIssues : ['No major AQI-linked issue expected right now.']).map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400"><AppIcon name="checklist" className="h-3.5 w-3.5" />Suggestions</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {recommendations.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
            {(payload?.pm25 != null || payload?.pm10 != null) && (
              <div className="grid gap-2 md:grid-cols-4 text-xs text-slate-200">
                {payload?.pm25 != null && (
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-[11px] uppercase text-slate-400">PM2.5</p>
                    <p className="font-semibold text-white">{payload.pm25.toFixed(1)} µg/m³</p>
                  </div>
                )}
                {payload?.pm10 != null && (
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-[11px] uppercase text-slate-400">PM10</p>
                    <p className="font-semibold text-white">{payload.pm10.toFixed(1)} µg/m³</p>
                  </div>
                )}
                {payload?.no2 != null && (
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-[11px] uppercase text-slate-400">NO₂</p>
                    <p className="font-semibold text-white">{payload.no2.toFixed(1)} µg/m³</p>
                  </div>
                )}
                {payload?.o3 != null && (
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-[11px] uppercase text-slate-400">Ozone</p>
                    <p className="font-semibold text-white">{payload.o3.toFixed(1)} µg/m³</p>
                  </div>
                )}
              </div>
            )}
            <div className="grid gap-2 md:grid-cols-2 text-xs text-slate-200">
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400"><AppIcon name="checklist" className="h-3.5 w-3.5" />Action checklist</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>Limit intense outdoor activity if AQI &gt; 100.</li>
                  <li>Use an N95 if AQI &gt; 150 and sensitive.</li>
                  <li>Run filtration or keep windows closed in traffic-heavy zones.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400"><AppIcon name="users" className="h-3.5 w-3.5" />Sensitive groups</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>Kids, elderly, cardio/respiratory conditions.</li>
                  <li>Plan breaks and hydrate; avoid peak traffic corridors.</li>
                </ul>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3 text-xs text-slate-200">
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="text-[11px] uppercase text-slate-400 inline-flex items-center gap-1"><AppIcon name="sun" className="h-3.5 w-3.5" />UV</p>
                <p className="font-semibold text-white">{payload?.uv != null ? payload.uv.toFixed(1) : '—'}</p>
                <p className="text-slate-400">{uvRisk ? 'High UV: plan shade breaks.' : 'UV manageable.'}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="text-[11px] uppercase text-slate-400 inline-flex items-center gap-1"><AppIcon name="wind" className="h-3.5 w-3.5" />Wind</p>
                <p className="font-semibold text-white">{payload?.wind != null ? `${payload.wind} km/h` : '—'}</p>
                <p className="text-slate-400">{payload?.windDirection != null ? `Direction ${Math.round(payload.windDirection)}°` : 'Direction unavailable'}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="text-[11px] uppercase text-slate-400 inline-flex items-center gap-1"><AppIcon name="droplet" className="h-3.5 w-3.5" />Humidity</p>
                <p className="font-semibold text-white">{payload?.humidity != null ? `${payload.humidity}%` : '—'}</p>
                <p className="text-slate-400">{payload?.dewPoint != null ? `Dew ${payload.dewPoint}°C` : 'Dew point unavailable'}</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AQIPage

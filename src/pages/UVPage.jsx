import { useState } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import LocationSearch from '../components/LocationSearch'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather } from '../hooks/queries'
import AppIcon from '../components/AppIcon'

const uvRisk = (value) => {
  if (value == null) return { label: 'Unknown', tip: 'UV data unavailable', tone: 'neutral' }
  if (value < 3) return { label: 'Low', tip: 'Minimal risk; sunglasses recommended.', tone: 'success' }
  if (value < 6) return { label: 'Moderate', tip: 'Seek shade at midday; SPF 30+', tone: 'neutral' }
  if (value < 8) return { label: 'High', tip: 'Limit direct sun 10am-4pm.', tone: 'warning' }
  return { label: 'Very high', tip: 'High-UV alert — cover up and reapply SPF frequently.', tone: 'danger' }
}

const UVPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const { data, isLoading } = useWeather(selected)
  const payload = data
  const meta = uvRisk(payload?.uv)
  const marker = Math.min(100, Math.max(0, ((payload?.uv ?? 0) / 12) * 100))

  const guidance = payload?.uv > 7 ? 'High – apply sunscreen and limit sun.' : 'Moderate – sunglasses recommended.'

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
        {data?.offline ? <Badge tone="warning" label="Offline cache" /> : <Badge tone="success" label="Live" />}
      </div>
      <Card title="Health Center · UV" description="Daily exposure risk and protection guidance">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xl bg-white/5 p-2 text-amber-200"><AppIcon name="sun" className="h-5 w-5" /></span>
              <p className="type-display text-white">{payload?.uv ?? '—'}</p>
              <Badge tone={meta.tone} label={meta.label} />
            </div>
            <div className="space-y-2">
              <div className="risk-band relative">
                <div className="risk-marker absolute -top-0.5" style={{ left: `calc(${marker}% - 6px)` }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Low</span>
                <span>Moderate</span>
                <span>Very high</span>
              </div>
            </div>
            <p className="type-body text-slate-300">{guidance}</p>
            <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-200">
              <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400"><AppIcon name="checklist" className="h-3.5 w-3.5" />Action checklist</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>Use SPF 30+ and reapply every 2 hours.</li>
                <li>Prefer shade from 10 AM to 4 PM.</li>
                <li>Wear sunglasses and a hat on outdoor commutes.</li>
              </ul>
            </div>
            {(payload?.solarRad != null || payload?.sunrise || payload?.sunset) && (
              <div className="grid gap-2 md:grid-cols-3 text-xs text-slate-200">
                {payload?.solarRad != null && (
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-[11px] uppercase text-slate-400">Solar Radiation</p>
                    <p className="font-semibold text-white">{payload.solarRad} W/m²</p>
                    <p className="text-[11px] text-slate-400">{payload.solarRad > 600 ? 'Intense solar exposure' : payload.solarRad > 200 ? 'Moderate solar load' : 'Low solar intensity'}</p>
                  </div>
                )}
                {payload?.sunrise && (
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-[11px] uppercase text-slate-400">🌅 Sunrise</p>
                    <p className="font-semibold text-white">{new Date(payload.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                )}
                {payload?.sunset && (
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-[11px] uppercase text-slate-400">🌇 Sunset</p>
                    <p className="font-semibold text-white">{new Date(payload.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-amber-200">{meta.tip}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default UVPage

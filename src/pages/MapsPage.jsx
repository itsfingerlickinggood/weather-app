import { useMemo, useState } from 'react'
import Card from '../components/Card'
import MapView from '../components/MapView'
import { useLocations, useAlerts, useRisk, useHourly } from '../hooks/queries'

const MapsPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const [layer, setLayer] = useState('precip')
  const [hours, setHours] = useState(12)
  const alerts = useAlerts(selected)
  const risk = useRisk(selected)
  const hourly = useHourly(selected)

  const center = useMemo(() => {
    const loc = locations.find((l) => l.id === selected)
    return loc ? [loc.lon, loc.lat] : [77.5, 12.9]
  }, [locations, selected])

  const points = useMemo(() => {
    const loc = locations.find((l) => l.id === selected)
    if (!loc) return []
    if (hourly.data?.length) {
      return hourly.data.slice(0, hours).map((h, idx) => ({
        lon: loc.lon + Math.cos(idx) * 0.08 * (idx / hours),
        lat: loc.lat + Math.sin(idx) * 0.08 * (idx / hours),
        intensity: layer === 'aqi' ? h.aqi || 0 : layer === 'uv' ? (h.uv || 0) * 10 : Math.round((h.precip || 0) * 100),
      }))
    }
    const alertIntensity = alerts.data?.length ? 80 : 20
    const riskIntensity = risk.data?.score || 10
    return [
      { lon: loc.lon, lat: loc.lat, intensity: alertIntensity },
      { lon: loc.lon + 0.1, lat: loc.lat + 0.1, intensity: riskIntensity },
    ]
  }, [alerts.data, hourly.data, hours, layer, locations, risk.data, selected])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
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
        <label className="text-sm text-slate-200">
          <span className="mr-2 text-xs uppercase text-slate-400">Layer</span>
          <select
            className="focus-ring rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
            value={layer}
            onChange={(e) => setLayer(e.target.value)}
          >
            <option value="precip">Precip</option>
            <option value="aqi">AQI</option>
            <option value="uv">UV</option>
          </select>
        </label>
        <label className="text-sm text-slate-200">
          <span className="mr-2 text-xs uppercase text-slate-400">Hours</span>
          <select
            className="focus-ring rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          >
            <option value={6}>Next 6h</option>
            <option value={12}>Next 12h</option>
            <option value={24}>Next 24h</option>
          </select>
        </label>
      </div>

      <Card title="Radar" description="Smooth pan/zoom with alert overlays">
        <MapView center={center} zoom={8} points={points} layer={layer} />
        <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-slate-200">
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Alerts</p>
            <p className="text-lg font-semibold text-white">{alerts.data?.length || 0}</p>
            <p className="text-[11px] text-slate-400">Latest: {alerts.data?.[0]?.title || 'None'}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Risk score</p>
            <p className="text-lg font-semibold text-white">{risk.data?.score ?? '—'}</p>
            <p className="text-[11px] text-slate-400">Threats: {risk.data?.threats?.slice(0, 2).join(', ') || 'None'}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Layer intensity</p>
            <p className="text-lg font-semibold text-white">
              {points.length ? Math.max(...points.map((p) => p.intensity)).toFixed(0) : '—'}
            </p>
            <p className="text-[11px] text-slate-400">Based on next {hours}h {layer.toUpperCase()} samples</p>
          </div>
        </div>
      </Card>

      <Card title="Legend & context" description="Understand what you see">
        <div className="grid gap-3 md:grid-cols-3 text-xs text-slate-200">
          <div className="space-y-1">
            <p className="text-[11px] uppercase text-slate-400">Layers</p>
            <p>Precip: blue/teal bubbles (mm/hr)</p>
            <p>AQI: green→amber→red bubbles</p>
            <p>UV: cyan→amber→orange bubbles</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase text-slate-400">Time window</p>
            <p>Uses next {hours} hours of hourly data for intensity spread.</p>
            <p>Switch hours to widen/narrow the sweep.</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase text-slate-400">Tips</p>
            <p>Zoom/pan to inspect local gradients.</p>
            <p>Change layer to compare AQI vs UV hotspots.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default MapsPage

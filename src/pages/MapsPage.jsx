import { useMemo, useState } from 'react'
import Card from '../components/Card'
import MapView from '../components/MapView'
import { useLocations, useAlerts, useRisk, useHourly } from '../hooks/queries'
import LocationSearch from '../components/LocationSearch'

const legendIcons = {
  precip: '/icons/weather/rain.png',
  aqi: '/icons/weather/health.png',
  uv: '/icons/weather/sun.png',
}

const legendScales = {
  precip: [
    { label: 'Low', value: '0–20', tone: 'bg-cyan-400/80' },
    { label: 'Moderate', value: '21–50', tone: 'bg-blue-400/80' },
    { label: 'High', value: '51+', tone: 'bg-indigo-400/80' },
  ],
  aqi: [
    { label: 'Good', value: '0–50', tone: 'bg-emerald-400/80' },
    { label: 'Moderate', value: '51–100', tone: 'bg-amber-400/80' },
    { label: 'Unhealthy', value: '101+', tone: 'bg-red-400/80' },
  ],
  uv: [
    { label: 'Low', value: '0–2', tone: 'bg-cyan-400/80' },
    { label: 'Moderate', value: '3–5', tone: 'bg-amber-400/80' },
    { label: 'High', value: '6+', tone: 'bg-orange-400/80' },
  ],
}

const MapsPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const [layer, setLayer] = useState('precip')
  const [hours, setHours] = useState(12)
  const alerts = useAlerts(selected)
  const risk = useRisk(selected)
  const hourly = useHourly(selected)

  const selectedLoc = useMemo(() => locations.find((l) => l.id === selected), [locations, selected])

  const center = useMemo(
    () => (selectedLoc ? [selectedLoc.lon, selectedLoc.lat] : [76.5, 10.0]),
    [selectedLoc],
  )

  const marker = useMemo(
    () => (selectedLoc ? { lat: selectedLoc.lat, lon: selectedLoc.lon, name: selectedLoc.name } : null),
    [selectedLoc],
  )

  // Single intensity point at the city centre — average of the selected hour window
  const points = useMemo(() => {
    if (!selectedLoc) return []
    const slice = hourly.data?.slice(0, hours) || []
    let intensity = 0
    if (slice.length) {
      const sum = slice.reduce((acc, h) => {
        const val =
          layer === 'aqi'
            ? h.aqi || 0
            : layer === 'uv'
              ? (h.uv || 0) * 10
              : Math.round((h.precip || 0) * 100)
        return acc + val
      }, 0)
      intensity = Math.round(sum / slice.length)
    }
    return [{ lon: selectedLoc.lon, lat: selectedLoc.lat, intensity }]
  }, [hourly.data, hours, layer, selectedLoc])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
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

      <Card title="Radar" description="Map-first view with quick controls">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-slate-400">Layer</span>
          {['precip', 'aqi', 'uv'].map((option) => (
            <button
              key={option}
              className={`chip-control ${layer === option ? 'chip-control-active' : ''}`}
              onClick={() => setLayer(option)}
            >
              {option.toUpperCase()}
            </button>
          ))}
          <span className="ml-1 text-[11px] uppercase tracking-wide text-slate-400">Window</span>
          {[6, 12, 24].map((window) => (
            <button
              key={window}
              className={`chip-control ${hours === window ? 'chip-control-active' : ''}`}
              onClick={() => setHours(window)}
            >
              {window}h
            </button>
          ))}
        </div>
        <MapView center={center} zoom={9} points={points} layer={layer} marker={marker} />
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
              {points.length ? points[0].intensity.toFixed(0) : '—'}
            </p>
            <p className="text-[11px] text-slate-400">Average for next {hours}h ({layer.toUpperCase()})</p>
          </div>
        </div>
      </Card>

      <Card title="Legend & context" description="Understand what you see">
        <details className="rounded-2xl border border-white/5 bg-slate-900/55 p-3 text-xs text-slate-200" open>
          <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Show map interpretation notes
          </summary>
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/65 p-3">
            <div className="flex items-center gap-2">
              <img src={legendIcons[layer]} alt="Active layer icon" className="h-6 w-6 rounded object-cover" />
              <p className="text-sm font-semibold text-white">{layer.toUpperCase()} layer scale</p>
              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-200">{hours}h avg</span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {(legendScales[layer] || []).map((step) => (
                <div key={step.label} className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-6 rounded ${step.tone}`} />
                    <span className="text-xs font-semibold text-slate-100">{step.label}</span>
                    <span className="ml-auto text-[11px] text-slate-400">{step.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4 text-xs text-slate-200">
          <div className="space-y-1">
            <p className="text-[11px] uppercase text-slate-400">Layers</p>
            <p>Precip: blue/teal bubble (mm/hr)</p>
            <p>AQI: green→amber→red bubble</p>
            <p>UV: cyan→amber→orange bubble</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase text-slate-400">Time window</p>
            <p>Uses next {hours} hours of hourly data averaged to one intensity point.</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase text-slate-400">Tips</p>
            <p>Zoom/pan to inspect your city and surroundings.</p>
            <p>Switch layers to compare AQI vs UV hotspots.</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase text-slate-400">Quick read</p>
            <p>Alerts &gt;0: watch advisory zones.</p>
            <p>Risk ≥50: prepare a backup plan.</p>
          </div>
          </div>
        </details>
      </Card>
    </div>
  )
}

export default MapsPage

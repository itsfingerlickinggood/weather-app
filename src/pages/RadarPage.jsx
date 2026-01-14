import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import MapView from '../components/MapView'
import { useHourly, useLocations, useRadarSettings } from '../hooks/queries'

const RadarPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const { data, isLoading } = useHourly(selected)
  const radarSettings = useRadarSettings()
  const [layer, setLayer] = useState('precip')
  const [intervalMinutes, setIntervalMinutes] = useState(5)

  useEffect(() => {
    if (radarSettings.data) {
      setLayer(radarSettings.data.layer || 'precip')
      setIntervalMinutes(radarSettings.data.intervalMinutes || 5)
    }
  }, [radarSettings.data])
  const maxPrecip = Math.max(...(data?.map((h) => h.precip || 0) || [0.01])) || 0.01

  const points = useMemo(() => {
    const loc = locations.find((l) => l.id === selected)
    if (!loc || !data) return []
    return data.map((h, idx) => ({ lat: loc.lat + idx * 0.02, lon: loc.lon + idx * 0.02, intensity: Math.round((h.precip || 0) * 100) }))
  }, [data, locations, selected])

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
      <Card title="Radar snapshot" description="Animated sweep driven by hourly precipitation">
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="radar-shell" role="presentation">
            <div className="radar-sweep" aria-hidden="true" />
            <div className="radar-overlay" aria-hidden="true" />
            <div className="grid grid-cols-6 gap-2" role="tablist" aria-label="Radar hourly bins">
              {data?.map((hour) => {
                const intensity = Math.max(8, ((hour.precip || 0) / maxPrecip) * 38)
                return (
                  <div
                    role="tab"
                    key={hour.hour}
                    className="flex flex-col items-center gap-1 rounded-xl border border-white/5 bg-slate-900/60 p-2"
                  >
                    <span className="text-xs text-slate-400">+{hour.hour}h</span>
                    <span
                      className="w-full rounded bg-gradient-to-b from-blue-400/70 to-emerald-400/30"
                      style={{ height: `${intensity}px` }}
                    />
                    <span className="text-[11px] text-slate-300">Precip {Math.round((hour.precip || 0) * 100)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      <Card title="Live map" description="OpenMap tiles with AQI/UV/precip layers">
        <div className="flex flex-wrap items-center gap-3 pb-3 text-xs text-slate-400">
          <span>Layer:</span>
          <select
            className="focus-ring rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
            value={layer}
            onChange={(e) => setLayer(e.target.value)}
          >
            <option value="precip">Precip</option>
            <option value="aqi">AQI</option>
            <option value="uv">UV</option>
          </select>
          <label className="flex items-center gap-2">
            <span>Interval (min)</span>
            <input
              className="focus-ring w-20 rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-white"
              type="number"
              min="1"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
            />
          </label>
          <span className="text-[11px] text-slate-400">Layer hint: circles reflect {selected} data; swap location to change.</span>
        </div>
        <MapView
          center={[locations.find((l) => l.id === selected)?.lon || 76.94, locations.find((l) => l.id === selected)?.lat || 8.52]}
          zoom={6}
          points={points}
          layer={layer}
        />
      </Card>
    </div>
  )
}

export default RadarPage

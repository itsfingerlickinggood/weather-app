import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather } from '../hooks/queries'
import { usePinnedCities } from '../hooks/usePinnedCities'

const Meter = ({ label, value = 0, suffix = '%', gradient = 'from-blue-400 to-emerald-300' }) => {
  const width = Math.max(6, Math.min(100, value))
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-slate-300">
        <span>{label}</span>
        <span className="text-slate-50">{Math.round(value)}{suffix}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full bg-gradient-to-r ${gradient}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

const CityWeatherCard = ({ id, name, onRemove }) => {
  const { data, isLoading, error } = useWeather(id)

  if (isLoading) return <Skeleton className="h-32" />
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">{error.message}</div>

  const payload = data
  const offline = data?.offline
  return (
    <div className="card-surface space-y-2 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-400">{name}</p>
          <p className="text-lg font-semibold text-white">{payload?.summary}</p>
        </div>
        <button className="text-xs text-amber-200 underline" onClick={() => onRemove(id)}>
          Remove
        </button>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-200">
        <span>{payload?.temp}°C</span>
        <span>AQI {payload?.aqi}</span>
        <span>UV {payload?.uv}</span>
        <span>Humidity {payload?.humidity}%</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Badge tone={offline ? 'warning' : 'neutral'} label={offline ? 'Offline: cached' : 'Live'} />
        <span>Updated {new Date(payload?.currentTime).toLocaleTimeString()}</span>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { pinned, addPin, removePin } = usePinnedCities()
  const { data: locations, isLoading } = useLocations()
  const [selected, setSelected] = useState('')

  const validPinned = useMemo(() => {
    if (!locations) return pinned
    const set = new Set(locations.map((l) => l.id))
    return pinned.filter((id) => set.has(id))
  }, [locations, pinned])

  const availableOptions = useMemo(() => {
    if (!locations) return []
    return locations.filter((loc) => !pinned.includes(loc.id))
  }, [locations, pinned])

  const microclimates = useMemo(() => {
    if (!locations) return []
    const presets = {
      tvm: { humidity: 82, rain: 70, wind: 54, icon: '🌊' },
      cok: { humidity: 84, rain: 78, wind: 48, icon: '⚓' },
      clt: { humidity: 78, rain: 64, wind: 56, icon: '🌅' },
      idk: { humidity: 72, rain: 58, wind: 44, icon: '⛰️' },
      alp: { humidity: 86, rain: 82, wind: 46, icon: '🛶' },
      way: { humidity: 74, rain: 60, wind: 50, icon: '🌿' },
    }
    return locations
      .map((loc) => {
        const preset = presets[loc.id] || { humidity: 72, rain: 60, wind: 48, icon: '🌀' }
        const zone = (loc.zone || loc.region || '').toLowerCase()
        const gradient = zone.includes('hill') || zone.includes('high') ? 'from-emerald-400 to-cyan-300' : 'from-blue-400 to-amber-300'
        return { ...loc, ...preset, gradient }
      })
      .slice(0, 5) // limit to 5 locations on home page to avoid overcrowding
  }, [locations])

  const keralaSignals = useMemo(
    () => [
      { title: 'Monsoon pulse active', detail: 'Evening showers along the coast; carry light shell.', tone: 'bg-blue-500/15 border-blue-400/30', icon: '🌧️' },
      { title: 'Backwater humidity', detail: 'High moisture boosts heat index near canals.', tone: 'bg-emerald-500/15 border-emerald-400/30', icon: '🛶' },
      { title: 'Hill escapes cooler', detail: 'Idukki & Wayanad sitting ~6°C cooler with mist.', tone: 'bg-purple-500/15 border-purple-400/30', icon: '⛰️' },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Pinned cities" description="Add quick-access climate tiles">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <select
                className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select location</option>
                {availableOptions.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <button
                className="focus-ring rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => {
                  if (selected) {
                    addPin(selected)
                    setSelected('')
                  }
                }}
                disabled={!selected}
              >
                Add
              </button>
            </div>
            <p className="text-xs text-slate-400">Pins are stored locally.</p>
          </div>
        </Card>
        <Card title="System status" description="MongoDB-backed API">
          <ul className="space-y-2 text-sm text-slate-200">
            <li>Auth, weather, AQI, UV, alerts, favorites, feedback endpoints</li>
            <li>Real WeatherAPI.com data with open-meteo fallback</li>
            <li>Session managed server-side via MongoDB</li>
          </ul>
        </Card>
        <Card title="Accessibility" description="Quick toggles">
          <p className="text-sm text-slate-200">
            Use the header toggles for theme, reduced motion, and high-contrast preferences.
          </p>
        </Card>
      </div>

      <Card title="Kerala microclimates" description="Visual splits across coast, backwaters, and high-range hills">
        <div className="grid gap-3 md:grid-cols-2">
          {microclimates.map((mc) => (
            <div key={mc.id} className="rounded-2xl border border-white/5 bg-slate-900/70 p-4 shadow-lg shadow-blue-950/40">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase text-slate-400">{mc.zone || mc.region}</p>
                  <p className="flex items-center gap-2 text-lg font-semibold text-white">
                    <span>{mc.icon}</span>
                    <span>{mc.name}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">{(mc.tags || []).join(' • ')}</p>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200">#{mc.id}</span>
              </div>
              <div className="mt-3 space-y-2">
                <Meter label="Humidity" value={mc.humidity} gradient="from-cyan-400 to-emerald-300" />
                <Meter label="Rain chance" value={mc.rain} gradient={mc.gradient} />
                <Meter label="Wind influence" value={mc.wind} gradient="from-amber-300 to-pink-400" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Daily Kerala signals" description="Plan quickly with visual cues instead of text blocks">
        <div className="grid gap-3 md:grid-cols-3">
          {keralaSignals.map((sig) => (
            <div key={sig.title} className={`rounded-2xl border p-4 text-sm text-slate-200 ${sig.tone}`}>
              <div className="flex items-center gap-2 text-base font-semibold text-white">
                <span>{sig.icon}</span>
                <span>{sig.title}</span>
              </div>
              <p className="mt-2 text-xs text-slate-200/80">{sig.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {validPinned.map((id) => {
          const locName = locations?.find((l) => l.id === id)?.name || id
          return <CityWeatherCard key={id} id={id} name={locName} onRemove={removePin} />
        })}
        {validPinned.length === 0 ? <Card title="No pins yet">Add a location to start tracking live tiles.</Card> : null}
      </div>
    </div>
  )
}

export default Dashboard

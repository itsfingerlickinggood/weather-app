import Card from '../components/Card'
import { useFavorites, useLocations, useWeather, useExtendedForecast } from '../hooks/queries'
import LocationSearch from '../components/LocationSearch'
import { useState } from 'react'

const SavedCitiesPage = () => {
  const { favoritesQuery, addFavorite, removeFavorite } = useFavorites()
  const { data: locations = [] } = useLocations()
  const favorites = (favoritesQuery.data || []).filter((id) => locations.some((l) => l.id === id))
  const [selected, setSelected] = useState('')

  return (
    <div className="space-y-4">
      <Card title="Saved cities" description="Quick glance tiles">
        <div className="mb-3 grid gap-2 md:grid-cols-[2fr_auto]">
          <div className="w-full">
            <LocationSearch
              locations={locations}
              value={selected}
              onChange={setSelected}
              label="Add city"
              placeholder="Type to search city"
            />
          </div>
          <button
            className="focus-ring rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => {
              if (selected) addFavorite.mutate(selected)
            }}
            disabled={!selected || addFavorite.isPending}
          >
            {addFavorite.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
        {!favorites.length ? (
          <p className="text-sm text-slate-300">No saved cities yet. Favorite one from a location page.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {favorites.map((id) => {
              const loc = locations.find((l) => l.id === id)
              return <SavedTile key={id} id={id} name={loc?.name || id} onRemove={() => removeFavorite.mutate(id)} />
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

const SavedTile = ({ id, name, onRemove }) => {
  const { data, isLoading, error } = useWeather(id)
  const forecastQuery = useExtendedForecast(id)
  const payload = data

  const forecast7 = forecastQuery.data?.length ? forecastQuery.data.slice(0, 7) : []
  const current = payload || {}

  if (isLoading) return <div className="h-24 rounded-xl border border-white/5 bg-slate-900/60" />
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">Unable to load {name}</div>
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 text-sm text-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-white">{name}</span>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{current?.summary}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5">{data?.offline ? 'Offline' : 'Live'}</span>
          <button className="text-red-200 underline" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-1 rounded-lg border border-white/5 bg-white/5 p-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-white">{current?.temp}°C</span>
            <span className="text-xs text-slate-400">Feels {current?.feelsLike ?? current?.temp}°C</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span>AQI {current?.aqi ?? '—'}</span>
            <span>UV {current?.uv ?? '—'}</span>
            <span>Humidity {current?.humidity ?? '—'}%</span>
            <span>Wind {current?.wind ?? '—'} km/h</span>
            {current?.windGusts != null && <span>Gusts {current.windGusts} km/h</span>}
            {current?.dewPoint != null && <span>Dew {current.dewPoint}°C</span>}
            {current?.pressure != null && <span>{Math.round(current.pressure)} hPa</span>}
            {current?.visibility != null && <span>Vis {current.visibility} km</span>}
            {current?.pm25 != null && <span>PM2.5 {current.pm25.toFixed(1)}</span>}
          </div>
          <p className="text-[11px] text-slate-400">
            Updated {current?.currentTime ? new Date(current.currentTime).toLocaleTimeString() : '—'}
          </p>
        </div>
        <div className="space-y-1 rounded-lg border border-white/5 bg-white/5 p-2 text-xs text-slate-200">
          <p className="text-[11px] uppercase text-slate-400">Sun</p>
          <p>Sunrise {current?.sunrise ? new Date(current.sunrise).toLocaleTimeString() : '—'}</p>
          <p>Sunset {current?.sunset ? new Date(current.sunset).toLocaleTimeString() : '—'}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 text-xs text-slate-200">
        <div className="rounded-lg border border-white/5 bg-slate-900/50 p-2">
          <p className="text-[11px] uppercase text-slate-400">AQI gauge</p>
          <div className="mt-1 flex h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500"
              style={{ width: `${Math.min(100, Math.max(0, (current?.aqi ?? 0) / 5))}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-slate-900/50 p-2">
          <p className="text-[11px] uppercase text-slate-400">7-day temps</p>
          <div className="mt-1 flex items-end gap-1">
            {forecast7.map((d, idx) => (
              <div key={`${d.day}-${idx}`} className="flex flex-col items-center gap-1">
                <div
                  className="w-3 rounded-full bg-gradient-to-t from-blue-400 to-emerald-300"
                  style={{ height: `${Math.min(100, Math.max(15, d.high)) / 2}px` }}
                  title={`${d.day}: ${d.high}°/${d.low}°`}
                />
                <span className="text-[9px] text-slate-400">{d.day.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-slate-900/50 p-2">
          <p className="text-[11px] uppercase text-slate-400">7-day precip</p>
          <div className="mt-1 flex items-end gap-1">
            {forecast7.map((d, idx) => (
              <div key={`${d.day}-p-${idx}`} className="flex flex-col items-center gap-1">
                <div
                  className="w-3 rounded-full bg-blue-400"
                  style={{ height: `${Math.min(100, Math.round((d.precip || 0) * 100)) / 2}px` }}
                  title={`${d.day}: ${Math.round((d.precip || 0) * 100)}%`}
                />
                <span className="text-[9px] text-slate-400">{d.day.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SavedCitiesPage

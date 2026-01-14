import Card from '../components/Card'
import { useFavorites, useLocations, useWeather } from '../hooks/queries'

const SavedCitiesPage = () => {
  const { favoritesQuery } = useFavorites()
  const { data: locations = [] } = useLocations()
  const favorites = (favoritesQuery.data || []).filter((id) => locations.some((l) => l.id === id))

  return (
    <div className="space-y-4">
      <Card title="Saved cities" description="Quick glance tiles">
        {!favorites.length ? (
          <p className="text-sm text-slate-300">No saved cities yet. Favorite one from a location page.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {favorites.map((id) => {
              const loc = locations.find((l) => l.id === id)
              return <SavedTile key={id} id={id} name={loc?.name || id} />
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

const SavedTile = ({ id, name }) => {
  const { data, isLoading, error } = useWeather(id)
  const payload = data?.data
  if (isLoading) return <div className="h-24 rounded-xl border border-white/5 bg-slate-900/60" />
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">Unable to load {name}</div>
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-sm text-slate-200">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-white">{name}</span>
        <span className="text-xs text-slate-400">{payload?.summary}</span>
      </div>
      <div className="mt-2 flex gap-4 text-sm">
        <span>{payload?.temp}°F</span>
        <span>AQI {payload?.aqi}</span>
        <span>UV {payload?.uv}</span>
      </div>
    </div>
  )
}

export default SavedCitiesPage

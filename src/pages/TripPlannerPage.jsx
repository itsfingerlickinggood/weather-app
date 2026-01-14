import { useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useExtendedForecast, useLocations } from '../hooks/queries'

const defaultTrips = [{ id: 'trip-1', locationId: 'tvm', label: 'Thiruvananthapuram coast weekend', days: 3 }]

const packList = (forecast = []) => {
  const needsRain = forecast.some((d) => d.precip > 0.3)
  const needsHeat = forecast.some((d) => d.high > 90)
  const needsCold = forecast.some((d) => d.low < 55)
  const items = ['Comfortable walking shoes', 'Reusable water bottle']
  if (needsRain) items.push('Light rain shell / umbrella')
  if (needsHeat) items.push('Sunscreen, hat, breathable layers')
  if (needsCold) items.push('Light jacket / layers')
  return items
}

const bestDay = (forecast = []) => {
  if (!forecast.length) return null
  const scored = forecast.map((d) => {
    let score = 100
    score -= (d.precip || 0) * 80
    if (d.high > 95 || d.low < 45) score -= 15
    return { ...d, score }
  })
  return scored.sort((a, b) => b.score - a.score)[0]
}

const TripCard = ({ trip, location }) => {
  const forecastQuery = useExtendedForecast(trip.locationId)
  const data = forecastQuery.data?.slice(0, trip.days)
  const best = bestDay(data)
  const pack = packList(data)

  return (
    <Card title={location?.name || trip.label} description={`${trip.days} days`}>
      {forecastQuery.isLoading ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="space-y-3 text-sm text-slate-200">
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/60 p-3">
            <span>Best day</span>
            <span className="font-semibold text-white">{best?.day}</span>
            <span className="text-emerald-200">{Math.round((best?.precip || 0) * 100)}% precip</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-slate-400">Packing list</p>
            <ul className="list-disc space-y-1 pl-5 text-slate-200">
              {pack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  )
}

const TripPlannerPage = () => {
  const { data: locations = [] } = useLocations()
  const [trips, setTrips] = useState(defaultTrips)
  const [selected, setSelected] = useState('tvm')
  const [days, setDays] = useState(3)

  const addTrip = () => {
    if (!selected) return
    const locLabel = locations.find((l) => l.id === selected)?.name || selected
    setTrips((prev) => [...prev, { id: crypto.randomUUID(), locationId: selected, label: `${locLabel} trip`, days: Number(days) }])
  }

  return (
    <div className="space-y-4">
      <Card title="Plan a trip" description="Pick a city and duration; we surface best day and packing list">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm text-slate-300">
            <span className="mb-1 block text-xs uppercase text-slate-400">City</span>
            <select
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
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
          <label className="text-sm text-slate-300">
            <span className="mb-1 block text-xs uppercase text-slate-400">Days</span>
            <input
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              type="number"
              min="2"
              max="14"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <button className="focus-ring w-full rounded-xl bg-blue-500 px-3 py-2 text-white" onClick={addTrip}>
              Add to itinerary
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {trips.map((trip) => {
          const loc = locations.find((l) => l.id === trip.locationId)
          return <TripCard key={trip.id} trip={trip} location={loc} />
        })}
      </div>
    </div>
  )
}

export default TripPlannerPage

import { useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useExtendedForecast, useLocations } from '../hooks/queries'
import LocationSearch from '../components/LocationSearch'

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

const TripCard = ({ trip, location, onUpdate }) => {
  const forecastQuery = useExtendedForecast(trip.locationId)
  const data = forecastQuery.data?.length ? forecastQuery.data.slice(0, trip.days) : null
  const fallback = !data
    ? Array.from({ length: trip.days }).map((_, idx) => ({
        day: new Date(Date.now() + idx * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
        high: 78 + (idx % 3) * 2,
        low: 64 + (idx % 2) * 2,
        precip: 0.2 + idx * 0.03,
      }))
    : null
  const daysData = data || fallback || []
  const best = bestDay(daysData)
  const pack = packList(daysData)
  const rainyDays = daysData.filter((d) => (d.precip || 0) > 0.3).length
  const hotDays = daysData.filter((d) => (d.high || 0) > 92).length

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
          <div className="grid gap-2 md:grid-cols-3 text-xs text-slate-200">
            <div className="rounded-lg border border-white/5 bg-white/5 p-2">
              <p className="text-[11px] uppercase text-slate-400">Rainy days</p>
              <p className="text-lg font-semibold text-white">{rainyDays}</p>
              <p className="text-[11px] text-slate-400">Carry shell/umbrella if >0</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/5 p-2">
              <p className="text-[11px] uppercase text-slate-400">Hot days</p>
              <p className="text-lg font-semibold text-white">{hotDays}</p>
              <p className="text-[11px] text-slate-400">Plan shade breaks if >0</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/5 p-2">
              <p className="text-[11px] uppercase text-slate-400">Prep</p>
              <p className="text-[11px] text-slate-300">Check best day for outdoor plans; keep a backup indoor option.</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-slate-400">Packing list</p>
            <ul className="list-disc space-y-1 pl-5 text-slate-200">
              {pack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2 md:grid-cols-2 text-xs text-slate-200">
            <label className="space-y-1">
              <span className="text-[11px] uppercase text-slate-400">Start date</span>
              <input
                type="date"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1"
                value={trip.startDate || ''}
                onChange={(e) => onUpdate?.(trip.id, { startDate: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] uppercase text-slate-400">Travelers</span>
              <input
                type="number"
                min="1"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1"
                value={trip.travelers || 1}
                onChange={(e) => onUpdate?.(trip.id, { travelers: Number(e.target.value) })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] uppercase text-slate-400">Style</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1"
                value={trip.style || 'leisure'}
                onChange={(e) => onUpdate?.(trip.id, { style: e.target.value })}
              >
                <option value="leisure">Leisure</option>
                <option value="outdoor">Outdoor</option>
                <option value="business">Business</option>
                <option value="family">Family</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] uppercase text-slate-400">Budget (est.)</span>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1"
                value={trip.budget || ''}
                onChange={(e) => onUpdate?.(trip.id, { budget: Number(e.target.value) })}
                placeholder="USD"
              />
            </label>
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
  const [notes, setNotes] = useState({})
  const [travelers, setTravelers] = useState(2)
  const [style, setStyle] = useState('leisure')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('')

  const addTrip = () => {
    if (!selected) return
    const locLabel = locations.find((l) => l.id === selected)?.name || selected
    setTrips((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        locationId: selected,
        label: `${locLabel} trip`,
        days: Number(days),
        travelers,
        style,
        budget: budget ? Number(budget) : undefined,
        startDate,
      },
    ])
  }

  const updateTrip = (id, patch) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  return (
    <div className="space-y-4">
      <Card title="Plan a trip" description="Pick a city and duration; we surface best day and packing list">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="w-full">
            <LocationSearch
              locations={locations}
              value={selected}
              onChange={setSelected}
              label="City"
              placeholder="Type to search city"
            />
          </div>
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
          <label className="text-sm text-slate-300">
            <span className="mb-1 block text-xs uppercase text-slate-400">Start date</span>
            <input
              type="date"
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-300">
            <span className="mb-1 block text-xs uppercase text-slate-400">Travelers</span>
            <input
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              type="number"
              min="1"
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
            />
          </label>
          <label className="text-sm text-slate-300">
            <span className="mb-1 block text-xs uppercase text-slate-400">Style</span>
            <select
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option value="leisure">Leisure</option>
              <option value="outdoor">Outdoor</option>
              <option value="business">Business</option>
              <option value="family">Family</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">
            <span className="mb-1 block text-xs uppercase text-slate-400">Budget (est.)</span>
            <input
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="USD"
            />
          </label>
        </div>
        <div className="mt-2 text-xs text-slate-400">Optional: add personal notes per trip below.</div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {trips.map((trip) => {
          const loc = locations.find((l) => l.id === trip.locationId)
          return (
            <div key={trip.id} className="space-y-2">
              <TripCard trip={trip} location={loc} onUpdate={updateTrip} />
              <textarea
                className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white"
                placeholder="Add personal notes, bookings, contacts"
                value={notes[trip.id] || ''}
                onChange={(e) => setNotes((prev) => ({ ...prev, [trip.id]: e.target.value }))}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TripPlannerPage

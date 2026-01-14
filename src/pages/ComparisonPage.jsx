import { useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather } from '../hooks/queries'

const ComparisonCard = ({ id, label }) => {
  const { data, isLoading } = useWeather(id)
  if (!id) return <div className="text-sm text-slate-400">Select a city</div>
  if (isLoading) return <Skeleton className="h-24" />
  const payload = data?.data
  return (
    <div className="space-y-2 text-sm text-slate-200">
      <p className="text-lg font-semibold text-white">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <span>Temp: {payload?.temp}°F</span>
        <span>AQI: {payload?.aqi}</span>
        <span>UV: {payload?.uv}</span>
        <span>Humidity: {payload?.humidity}%</span>
      </div>
    </div>
  )
}

const ComparisonPage = () => {
  const { data: locations = [] } = useLocations()
  const [left, setLeft] = useState('tvm')
  const [right, setRight] = useState('cok')

  return (
    <div className="space-y-4">
      <Card title="Compare two cities" description="Side-by-side climate indicators">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            <span className="mb-1 block text-xs uppercase text-slate-400">City A</span>
            <select
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-300">
            <span className="mb-1 block text-xs uppercase text-slate-400">City B</span>
            <select
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              value={right}
              onChange={(e) => setRight(e.target.value)}
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ComparisonCard id={left} label={locations.find((l) => l.id === left)?.name || left} />
          <ComparisonCard id={right} label={locations.find((l) => l.id === right)?.name || right} />
        </div>
      </Card>
    </div>
  )
}

export default ComparisonPage

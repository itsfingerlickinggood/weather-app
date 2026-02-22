import { useState } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import LocationSearch from '../components/LocationSearch'
import Skeleton from '../components/Skeleton'
import { useLocations, useWeather } from '../hooks/queries'

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
      <Card title="UV index" description="Protection guidance">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="space-y-2 rounded-xl border border-white/5 bg-slate-900/60 p-3 text-slate-100">
            <div className="flex items-center gap-3">
              <p className="text-4xl font-bold">{payload?.uv}</p>
              <Badge tone={meta.tone} label={meta.label} />
            </div>
            <p className="text-sm text-slate-300">{guidance}</p>
            <p className="text-xs text-amber-200">{meta.tip}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default UVPage

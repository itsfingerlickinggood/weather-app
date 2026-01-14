import { useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations, useRisk, useClimateTrends } from '../hooks/queries'

const SeasonalInsightsPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const { data, isLoading } = useRisk(selected)
  const trendsQuery = useClimateTrends(selected)

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
      <Card title="Seasonal insights" description="Composite disaster readiness">
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="space-y-2 text-sm text-slate-100">
            <p className="text-lg font-semibold text-white">Risk score {data?.score}/100</p>
            <p className="text-slate-300">Top threats: {data?.threats?.join(', ') || 'None'}</p>
            <p className="text-slate-400">Use this to shape preparedness and drills.</p>
          </div>
        )}
      </Card>

      <Card title="Historical climate" description="Monthly averages for temperature, rain, humidity">
        {trendsQuery.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-200">
            <div>
              <p className="text-xs uppercase text-slate-400">Temperature (°F)</p>
              <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300">
                {trendsQuery.data?.monthlyTemp.map((v, idx) => (
                  <span key={`t-${idx}`} className="flex items-center gap-1">
                    <span className="inline-block h-2 w-full rounded-full bg-gradient-to-r from-amber-300 to-pink-400" style={{ width: `${Math.min(100, v)}%` }} />
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Rain (in)</p>
              <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300">
                {trendsQuery.data?.monthlyRain.map((v, idx) => (
                  <span key={`r-${idx}`} className="flex items-center gap-1">
                    <span className="inline-block h-2 w-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-300" style={{ width: `${Math.min(100, v * 4)}%` }} />
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Humidity (%)</p>
              <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300">
                {trendsQuery.data?.monthlyHumidity.map((v, idx) => (
                  <span key={`h-${idx}`} className="flex items-center gap-1">
                    <span className="inline-block h-2 w-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${v}%` }} />
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default SeasonalInsightsPage

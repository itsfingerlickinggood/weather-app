import { useState } from 'react'
import Card from '../components/Card'
import LocationSearch from '../components/LocationSearch'
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
        <div className="w-full max-w-xs">
          <LocationSearch
            locations={locations}
            value={selected}
            onChange={setSelected}
            label="Location"
            placeholder="Type to search city"
          />
        </div>
      </div>
      <Card title="Seasonal insights" description="Composite disaster readiness">
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="space-y-2 text-sm text-slate-100">
            {(() => {
              const riskScore = data ? Math.round(((data.flood || 0) + (data.heat || 0) + (data.wind || 0) + (data.aqi || 0)) / 4 * 100) : null
              const threats = data ? Object.entries({ Flood: data.flood, Heat: data.heat, Wind: data.wind, AQI: data.aqi }).filter(([, v]) => v > 0.5).map(([k]) => k) : []
              return (<>
                <p className="text-lg font-semibold text-white">Risk score {riskScore ?? '—'}/100</p>
                <p className="text-slate-300">Top threats: {threats.join(', ') || 'None'}</p>
                {data ? (
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-300">
                    {[['Flood', data.flood], ['Heat', data.heat], ['Wind', data.wind], ['AQI', data.aqi]].map(([label, val]) => (
                      <div key={label} className="rounded-lg border border-white/5 bg-white/5 p-2">
                        <p className="text-[11px] uppercase text-slate-400">{label}</p>
                        <p className="font-semibold text-white">{val != null ? Math.round(val * 100) : '—'}%</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="text-slate-400">Use this to shape preparedness and drills.</p>
              </>)
            })()}
          </div>
        )}
      </Card>

      <Card title="Historical climate" description="Monthly averages for temperature, rain, humidity">
        {trendsQuery.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          (() => {
            const trends = trendsQuery.data || []
            const monthlyTemp = trends.map((t) => t.avgHigh)
            const monthlyRain = trends.map((t) => t.rainfall)
            const monthlyHumidity = trends.map((t) => Math.round(((t.avgHigh - t.avgLow) * 0.4 + 60)))
            return (
              <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-200">
                <div>
                  <p className="text-xs uppercase text-slate-400">Temperature (°C)</p>
                  <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300">
                    {monthlyTemp.map((v, idx) => (
                      <span key={`t-${idx}`} className="flex items-center gap-1">
                        <span className="inline-block h-2 rounded-full bg-gradient-to-r from-amber-300 to-pink-400" style={{ width: `${Math.min(100, Math.round(v / 0.45))}%` }} />
                        {v}°
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Rain (mm)</p>
                  <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300">
                    {monthlyRain.map((v, idx) => (
                      <span key={`r-${idx}`} className="flex items-center gap-1">
                        <span className="inline-block h-2 rounded-full bg-gradient-to-r from-blue-400 to-emerald-300" style={{ width: `${Math.min(100, Math.round(v / 4))}%` }} />
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Humidity (%)</p>
                  <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300">
                    {monthlyHumidity.map((v, idx) => (
                      <span key={`h-${idx}`} className="flex items-center gap-1">
                        <span className="inline-block h-2 rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${v}%` }} />
                        {v}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()
        )}
      </Card>
    </div>
  )
}

export default SeasonalInsightsPage

import { useState } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useAlerts, useLocations } from '../hooks/queries'

const AlertsPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const { data, isLoading } = useAlerts(selected)

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
      <Card title="Active alerts" description="Environmental notifications">
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : data?.length ? (
          <ul className="space-y-2">
            {data.map((alert) => (
              <li key={alert.id} className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-sm text-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{alert.title}</span>
                  <Badge tone="warning" label={alert.severity} />
                </div>
                <p className="text-slate-300">{alert.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No alerts right now.</p>
        )}
      </Card>
    </div>
  )
}

export default AlertsPage

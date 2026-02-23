import { useState } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useAlerts, useLocations } from '../hooks/queries'
import AppIcon from '../components/AppIcon'

const AlertsPage = () => {
  const { data: locations = [] } = useLocations()
  const [selected, setSelected] = useState('tvm')
  const { data, isLoading } = useAlerts(selected)
  const severityRank = { low: 25, moderate: 50, medium: 50, high: 78, severe: 92 }
  const topSeverity = data?.[0]?.severity?.toLowerCase?.() || 'low'
  const marker = severityRank[topSeverity] ?? 30

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
      <Card title="Health Center · Alerts" description="Active environmental notifications with action guidance">
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : data?.length ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-2xl border border-white/5 bg-slate-900/60 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-white/5 p-2 text-amber-200"><AppIcon name="alert" className="h-5 w-5" /></span>
                <p className="type-display text-white">{data.length}</p>
                <Badge tone="warning" label={`Top: ${data[0].severity}`} />
              </div>
              <div className="space-y-2">
                <div className="risk-band relative">
                  <div className="risk-marker absolute -top-0.5" style={{ left: `calc(${marker}% - 6px)` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Advisory</span>
                  <span>Watch</span>
                  <span>Severe</span>
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-200">
                <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400"><AppIcon name="checklist" className="h-3.5 w-3.5" />Action checklist</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>Check route and travel flexibility before departure.</li>
                  <li>Keep emergency contacts and power backup ready.</li>
                  <li>Follow local advisories for flood, wind, and lightning zones.</li>
                </ul>
              </div>
            </div>
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
          </div>
        ) : (
          <p className="text-sm text-slate-400">No alerts right now.</p>
        )}
      </Card>
    </div>
  )
}

export default AlertsPage

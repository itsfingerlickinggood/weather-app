import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import api from '../lib/api'
import {
  useApiHealth,
  useAdminApiConfig,
  useAdminStoryRules,
  useAdminRadarSettings,
  useDisasterThresholds,
} from '../hooks/queries'

const AdminUsagePage = () => {
  const usageQuery = useQuery({
    queryKey: ['admin-usage'],
    queryFn: async () => {
      const { data } = await api.get('/admin/usage')
      return data
    },
  })

  const healthQuery = useApiHealth()
  const apiConfigQuery = useAdminApiConfig()
  const storyRulesQuery = useAdminStoryRules()
  const radarSettingsQuery = useAdminRadarSettings()
  const thresholdsQuery = useDisasterThresholds()
  const [view, setView] = useState('daily')
  const [apiConfigDraft, setApiConfigDraft] = useState({ primary: '', backup: '', primaryKey: '', backupKey: '' })
  const [radarDraft, setRadarDraft] = useState({ layer: 'precip', intervalMinutes: 5 })
  const [thresholdDraft, setThresholdDraft] = useState({ flood: 70, heat: 95, wind: 60, aqi: 150 })
  const [ruleDraft, setRuleDraft] = useState({ name: '', condition: '', template: '' })

  const saveApiConfig = useMutation({
    mutationFn: async () => (await api.post('/admin/api-config', apiConfigDraft)).data.config,
    onSuccess: () => apiConfigQuery.refetch(),
  })

  const saveRadarSettings = useMutation({
    mutationFn: async () => (await api.post('/admin/radar-settings', radarDraft)).data.radar,
    onSuccess: () => radarSettingsQuery.refetch(),
  })

  const saveThresholds = useMutation({
    mutationFn: async () => (await api.post('/admin/disaster-thresholds', thresholdDraft)).data.thresholds,
    onSuccess: () => thresholdsQuery.refetch(),
  })

  const saveRule = useMutation({
    mutationFn: async () => (await api.post('/admin/story-rules', ruleDraft)).data.rules,
    onSuccess: () => {
      storyRulesQuery.refetch()
      setRuleDraft({ name: '', condition: '', template: '' })
    },
  })

  useEffect(() => {
    if (apiConfigQuery.data) setApiConfigDraft((prev) => ({ ...apiConfigQuery.data, ...prev }))
  }, [apiConfigQuery.data])

  useEffect(() => {
    if (radarSettingsQuery.data) setRadarDraft((prev) => ({ ...radarSettingsQuery.data, ...prev }))
  }, [radarSettingsQuery.data])

  useEffect(() => {
    if (thresholdsQuery.data) setThresholdDraft((prev) => ({ ...thresholdsQuery.data, ...prev }))
  }, [thresholdsQuery.data])

  return (
    <div className="space-y-4">
      <Card title="Usage" description="Mocked platform telemetry">
        {usageQuery.isLoading ? (
          <Skeleton className="h-24" />
        ) : usageQuery.error ? (
          <p className="text-sm text-red-300">{usageQuery.error.message}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-200">
            <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
              <p className="text-xs uppercase text-slate-400">Uptime</p>
              <p className="text-lg font-semibold text-white">{usageQuery.data?.uptime}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
              <p className="text-xs uppercase text-slate-400">Active users</p>
              <p className="text-lg font-semibold text-white">{usageQuery.data?.activeUsers}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
              <p className="text-xs uppercase text-slate-400">Requests (1h)</p>
              <p className="text-lg font-semibold text-white">{usageQuery.data?.requestsLastHour}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
              <p className="text-xs uppercase text-slate-400">Cache hit</p>
              <p className="text-lg font-semibold text-white">{usageQuery.data?.cacheHit}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
              <p className="text-xs uppercase text-slate-400">Rate limit</p>
              <p className="text-lg font-semibold text-white">{usageQuery.data?.rateLimit?.remaining} / {usageQuery.data?.rateLimit?.limit}</p>
              <p className="text-[11px] text-slate-400">Resets in {usageQuery.data?.rateLimit?.resetInMinutes}m</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
              <p className="text-xs uppercase text-slate-400">Peak usage</p>
              <p className="text-lg font-semibold text-white">{usageQuery.data?.peakUsage}</p>
              <p className="text-[11px] text-slate-400">Top searches: {(usageQuery.data?.mostSearched || []).join(', ')}</p>
            </div>
          </div>
        )}
      </Card>

      <Card title="Analytics window" description="Daily / weekly / monthly rollups">
        {usageQuery.isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="space-y-3 text-sm text-slate-200">
            <div className="flex flex-wrap gap-2 text-xs">
              {['daily', 'weekly', 'monthly'].map((v) => (
                <button key={v} className={`focus-ring rounded-full px-3 py-1 ${view === v ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-100'}`} onClick={() => setView(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                <p className="text-xs uppercase text-slate-400">Users</p>
                <p className="text-lg font-semibold text-white">{usageQuery.data?.views?.[view]?.users}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                <p className="text-xs uppercase text-slate-400">Requests</p>
                <p className="text-lg font-semibold text-white">{usageQuery.data?.views?.[view]?.requests}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                <p className="text-xs uppercase text-slate-400">Errors</p>
                <p className="text-lg font-semibold text-white">{usageQuery.data?.views?.[view]?.errors}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card title="API health" description="Monitors upstream dependencies">
        {healthQuery.isLoading ? (
          <Skeleton className="h-24" />
        ) : healthQuery.error ? (
          <p className="text-sm text-red-300">{healthQuery.error.message}</p>
        ) : (
          <div className="space-y-2 text-sm text-slate-200">
            <p className="text-xs text-slate-400">Updated {new Date(healthQuery.data?.updatedAt).toLocaleTimeString()}</p>
            <ul className="space-y-1">
              {healthQuery.data?.services?.map((svc) => (
                <li key={svc.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/60 px-3 py-2">
                  <span>{svc.name}</span>
                  <span className={`text-xs ${svc.status === 'up' ? 'text-emerald-200' : 'text-amber-200'}`}>
                    {svc.status} • {svc.latencyMs} ms
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title="API sources" description="Primary / backup weather keys">
        {apiConfigQuery.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-200">
            {['primary', 'backup', 'primaryKey', 'backupKey'].map((field) => (
              <label key={field} className="text-xs uppercase text-slate-400">
                <span className="block text-[11px] text-slate-400">{field}</span>
                <input
                  className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
                  value={apiConfigDraft[field] || apiConfigQuery.data?.[field] || ''}
                  onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                  placeholder={apiConfigQuery.data?.[field] || ''}
                />
              </label>
            ))}
            <button className="focus-ring rounded-xl bg-blue-500 px-3 py-2 text-white disabled:opacity-60" onClick={() => saveApiConfig.mutate()} disabled={saveApiConfig.isPending}>
              Save config
            </button>
          </div>
        )}
      </Card>

      <Card title="Story timeline rules" description="Templates driving narratives">
        {storyRulesQuery.isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="space-y-3 text-sm text-slate-200">
            <div className="grid gap-2 md:grid-cols-3">
              <input className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2" placeholder="Name" value={ruleDraft.name} onChange={(e) => setRuleDraft((prev) => ({ ...prev, name: e.target.value }))} />
              <input className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2" placeholder="Condition (e.g., temp > 95)" value={ruleDraft.condition} onChange={(e) => setRuleDraft((prev) => ({ ...prev, condition: e.target.value }))} />
              <input className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2" placeholder="Template text" value={ruleDraft.template} onChange={(e) => setRuleDraft((prev) => ({ ...prev, template: e.target.value }))} />
            </div>
            <button className="focus-ring rounded-xl bg-blue-500 px-3 py-2 text-white disabled:opacity-60" onClick={() => saveRule.mutate()} disabled={saveRule.isPending || !ruleDraft.name}>
              Save rule
            </button>
            <ul className="space-y-2 text-sm text-slate-200">
              {storyRulesQuery.data?.map((rule) => (
                <li key={rule.id} className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="font-semibold text-white">{rule.name}</p>
                  <p className="text-xs text-slate-400">{rule.condition}</p>
                  <p className="text-xs text-emerald-200">{rule.template}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title="Radar controls" description="Default layer + sweep interval">
        {radarSettingsQuery.isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="flex flex-wrap gap-3 text-sm text-slate-200">
            <select
              className="focus-ring rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
              value={radarDraft.layer || radarSettingsQuery.data?.layer}
              onChange={(e) => setRadarDraft((prev) => ({ ...prev, layer: e.target.value }))}
            >
              <option value="precip">Precip</option>
              <option value="aqi">AQI</option>
              <option value="uv">UV</option>
            </select>
            <input
              className="focus-ring w-24 rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
              type="number"
              min="1"
              value={radarDraft.intervalMinutes || radarSettingsQuery.data?.intervalMinutes || 5}
              onChange={(e) => setRadarDraft((prev) => ({ ...prev, intervalMinutes: Number(e.target.value) }))}
            />
            <button className="focus-ring rounded-xl bg-blue-500 px-3 py-2 text-white" onClick={() => saveRadarSettings.mutate()} disabled={saveRadarSettings.isPending}>
              Save radar defaults
            </button>
          </div>
        )}
      </Card>

      <Card title="Disaster thresholds" description="Admin-configurable safety rules">
        {thresholdsQuery.isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="grid gap-2 md:grid-cols-4 text-sm text-slate-200">
            {['flood', 'heat', 'wind', 'aqi'].map((key) => (
              <label key={key} className="text-xs uppercase text-slate-400">
                <span className="block text-[11px] text-slate-400">{key}</span>
                <input
                  className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
                  type="number"
                  value={thresholdDraft[key] ?? thresholdsQuery.data?.[key] ?? 0}
                  onChange={(e) => setThresholdDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                />
              </label>
            ))}
            <button className="focus-ring rounded-xl bg-blue-500 px-3 py-2 text-white" onClick={() => saveThresholds.mutate()} disabled={saveThresholds.isPending}>
              Save thresholds
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminUsagePage

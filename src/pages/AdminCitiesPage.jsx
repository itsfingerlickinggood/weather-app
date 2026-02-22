import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import { useLocations } from '../hooks/queries'
import api from '../lib/api'

const AdminCitiesPage = () => {
  const { data, isLoading } = useLocations()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ id: '', name: '', region: '', lat: '', lon: '' })
  const [editing, setEditing] = useState('')

  const resetForm = () => setForm({ id: '', name: '', region: '', lat: '', lon: '' })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, lat: Number(form.lat), lon: Number(form.lon) }
      if (!editing && !payload.id) delete payload.id   // don't send empty id on create
      if (editing) return (await api.put(`/admin/locations/${editing}`, payload)).data
      return (await api.post('/admin/locations', payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      resetForm()
      setEditing('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/locations/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  })
  return (
    <div className="space-y-4">
      <Card title="Cities" description="Manage locations in MongoDB">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5 text-sm text-slate-200">
            <input className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2" placeholder="ID (optional)" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} />
            <input className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2" placeholder="Region" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
            <input className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2" placeholder="Lat" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
            <input className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2" placeholder="Lon" value={form.lon} onChange={(e) => setForm((f) => ({ ...f, lon: e.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button className="focus-ring rounded-xl bg-blue-500 px-3 py-2 text-white disabled:opacity-60" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name}>
              {editing ? 'Update city' : 'Add city'}
            </button>
            <button className="focus-ring rounded-xl bg-white/10 px-3 py-2 text-slate-200" onClick={() => { resetForm(); setEditing('') }}>
              Clear
            </button>
          </div>
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Region</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.map((loc) => (
                  <tr key={loc.id}>
                    <td className="py-2">{loc.name}</td>
                    <td className="py-2">{loc.region}</td>
                    <td className="py-2 space-x-2 text-slate-400">
                      <button className="underline" onClick={() => { setEditing(loc.id); setForm({ id: loc.id, name: loc.name, region: loc.region, lat: loc.lat ?? '', lon: loc.lon ?? '' }) }}>
                        Edit
                      </button>
                      <button className="text-red-200 underline" onClick={() => deleteMutation.mutate(loc.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}

export default AdminCitiesPage

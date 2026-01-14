import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import Badge from '../components/Badge'
import api from '../lib/api'

const sentimentFromMessage = (message = '') => {
  const text = message.toLowerCase()
  let score = 0
  const positives = ['love', 'great', 'good', 'helpful', 'amazing', 'smooth']
  const negatives = ['slow', 'bad', 'hate', 'bug', 'issue', 'broken', 'terrible']
  positives.forEach((word) => {
    if (text.includes(word)) score += 1
  })
  negatives.forEach((word) => {
    if (text.includes(word)) score -= 1
  })
  if (score > 0) return { label: 'Positive', tone: 'success' }
  if (score < 0) return { label: 'Negative', tone: 'danger' }
  return { label: 'Neutral', tone: 'neutral' }
}

const AdminFeedbackPage = () => {
  const feedbackQuery = useQuery({
    queryKey: ['feedback'],
    queryFn: async () => {
      const { data } = await api.get('/feedback')
      return data.feedback
    },
  })

  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState({})

  const respondMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = drafts[id] || ''
      const { data } = await api.post(`/feedback/${id}`, { status, response })
      return data.feedback
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback'] }),
  })

  return (
    <div className="space-y-4">
      <Card title="Feedback" description="Admin-only">
        {feedbackQuery.isLoading ? (
          <Skeleton className="h-24" />
        ) : feedbackQuery.error ? (
          <p className="text-sm text-red-300">{feedbackQuery.error.message}</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-200">
            {feedbackQuery.data?.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.userId}</span>
                      <Badge {...sentimentFromMessage(item.message)} />
                      <Badge tone={item.status === 'resolved' ? 'success' : item.status === 'ack' ? 'neutral' : 'warning'} label={item.status || 'open'} />
                    </div>
                    <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-200">{item.message}</p>
                {item.response ? <p className="text-xs text-emerald-200">Response: {item.response}</p> : null}
                <div className="mt-2 flex flex-col gap-2 text-xs text-slate-300">
                  <textarea
                    className="focus-ring w-full rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1"
                    placeholder="Add a response or note"
                    value={drafts[item.id] ?? ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="focus-ring rounded-full bg-white/10 px-3 py-1"
                      onClick={() => respondMutation.mutate({ id: item.id, status: 'ack' })}
                      type="button"
                    >
                      Ack
                    </button>
                    <button
                      className="focus-ring rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100"
                      onClick={() => respondMutation.mutate({ id: item.id, status: 'resolved' })}
                      type="button"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export default AdminFeedbackPage

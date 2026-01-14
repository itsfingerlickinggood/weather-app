import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import api from '../lib/api'
import { useUI } from '../context/ui'

const FeedbackPage = () => {
  const [message, setMessage] = useState('')
  const [tag, setTag] = useState('issue')
  const { pushToast } = useUI()
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/feedback', { message, tag })
      return data.feedback
    },
    onSuccess: () => {
      pushToast('Feedback sent. Thank you!', 'success')
      setMessage('')
    },
    onError: () => pushToast('Could not send feedback. Try again.', 'danger'),
  })

  const canSubmit = message.trim().length >= 10

  return (
    <div className="space-y-4">
      <Card title="Submit feedback" description="Share issues or ideas with admins">
        <div className="space-y-2 text-sm text-slate-200">
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            {['issue', 'idea', 'praise'].map((t) => (
              <button
                key={t}
                className={`focus-ring rounded-full px-3 py-1 ${tag === t ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-200'}`}
                onClick={() => setTag(t)}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            className="focus-ring min-h-[140px] w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
            placeholder="Describe the issue, request, or improvement"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{message.length} / 500</span>
            <Badge tone={canSubmit ? 'success' : 'neutral'} label={canSubmit ? 'Ready' : 'Add more detail'} />
          </div>
          <button
            className="focus-ring rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => submitMutation.mutate()}
            disabled={!canSubmit || submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Sending…' : 'Send feedback'}
          </button>
          <p className="text-[11px] text-slate-400">Messages are routed to admins with your selected tag.</p>
        </div>
      </Card>
    </div>
  )
}

export default FeedbackPage

import { useUI } from '../context/ui'

const toneStyles = {
  info: 'bg-slate-800 text-slate-50 border-white/10',
  success: 'bg-emerald-700/90 text-emerald-50 border-emerald-400/40',
  warning: 'bg-amber-700/90 text-amber-50 border-amber-300/50',
  danger: 'bg-red-700/90 text-red-50 border-red-300/50',
}

const ToastCenter = () => {
  const { toasts, dismissToast } = useUI()
  if (!toasts.length) return null
  return (
    <div className="fixed right-4 top-16 z-50 flex w-80 flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`border ${toneStyles[toast.tone] || toneStyles.info} rounded-xl px-3 py-2 shadow-lg shadow-black/40`}
        >
          <div className="flex items-start justify-between gap-2 text-sm">
            <span>{toast.msg}</span>
            <button
              className="text-xs text-white/70 hover:text-white"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ToastCenter

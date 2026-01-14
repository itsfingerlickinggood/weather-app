const variants = {
  neutral: 'bg-white/10 text-slate-200',
  success: 'bg-emerald-500/20 text-emerald-100',
  warning: 'bg-amber-500/20 text-amber-100',
  danger: 'bg-red-500/20 text-red-100',
}

const Badge = ({ label, tone = 'neutral' }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${variants[tone] || variants.neutral}`}>
    {label}
  </span>
)

export default Badge

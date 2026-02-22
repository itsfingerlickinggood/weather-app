const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-white/10 ${className}`} aria-hidden="true" />
)

export default Skeleton

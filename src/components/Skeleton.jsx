const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} aria-hidden="true" />
)

export default Skeleton

import { useId } from 'react'

const Card = ({ title, description, children, footer }) => {
  const headingId = useId()
  const descriptionId = useId()

  return (
  <section
    className="card-surface px-[var(--space-card-x)] py-[var(--space-card-y)] md:px-6 md:py-5"
    aria-labelledby={headingId}
    aria-describedby={description ? descriptionId : undefined}
  >
    <header className="mb-3.5 flex items-start justify-between gap-3">
      <div>
        <h2 id={headingId} className="type-title text-slate-50">{title}</h2>
        {description ? <p id={descriptionId} className="type-body mt-1 text-slate-400">{description}</p> : null}
      </div>
      {footer}
    </header>
    <div className="type-body space-y-4 text-slate-200">{children}</div>
  </section>
  )
}

export default Card

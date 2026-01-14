const Card = ({ title, description, children, footer }) => (
  <section className="card-surface p-4">
    <header className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description ? <p className="text-xs text-slate-400">{description}</p> : null}
      </div>
      {footer}
    </header>
    <div className="space-y-3 text-sm text-slate-200">{children}</div>
  </section>
)

export default Card

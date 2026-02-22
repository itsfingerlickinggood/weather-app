const Card = ({ title, description, children, footer }) => (
  <section className="card-surface p-5 md:p-6">
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {footer}
    </header>
    <div className="space-y-4 text-sm text-slate-200">{children}</div>
  </section>
)

export default Card

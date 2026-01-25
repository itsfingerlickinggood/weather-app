export default function SimplePage() {
  return (
    <main className="bg-light py-5">
      <div className="container">
        <h1 className="display-6 fw-bold mb-3">Simple Bootstrap Page</h1>
        <p className="lead text-muted">A minimal React page styled with Bootstrap.</p>

        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <h5 className="card-title">Hello!</h5>
            <p className="card-text mb-3">
              This is a basic card. Use Bootstrap classes for quick layout and spacing.
            </p>
            <button className="btn btn-primary me-2">Primary</button>
            <button className="btn btn-outline-secondary">Secondary</button>
          </div>
        </div>
      </div>
    </main>
  );
}
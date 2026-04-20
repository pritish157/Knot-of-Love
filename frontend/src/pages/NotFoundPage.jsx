import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="surface-card flex max-w-lg flex-col items-center p-12">
        <span className="text-8xl font-black text-brand-500/20">404</span>
        <h1 className="mt-4 font-serif text-5xl text-ink">Page not found</h1>
        <p className="mt-4 text-base leading-8 text-muted">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/" className="btn-primary">
            Back to home
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary">
            Go back
          </button>
        </div>
      </div>
    </main>
  );
}

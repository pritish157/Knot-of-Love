import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function SiteLayout() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen px-3 py-4 sm:px-4">
      <header className="nav-glass mx-auto mb-6 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
        <Link to="/" className="inline-flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-gradient font-serif text-xl text-white">
            K
          </span>
          <span className="grid gap-0.5">
            <strong className="text-sm text-ink sm:text-base">Knot of Love</strong>
            <small className="text-xs text-muted">Modern matrimonial platform</small>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-bold text-muted lg:flex">
          <a href="#platform" className="transition hover:text-brand-700">
            Home
          </a>
          <a href="#how-it-works" className="transition hover:text-brand-700">
            How it works
          </a>
          <a href="#success-stories" className="transition hover:text-brand-700">
            Success stories
          </a>
        </nav>

        <div className="hidden flex-col items-stretch gap-3 sm:flex sm:w-auto sm:flex-row sm:items-center">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary w-full sm:w-auto">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary w-full sm:w-auto">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary w-full sm:w-auto">
                Create profile
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 bg-white/60 text-ink sm:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </header>

      {/* Mobile slide-down menu */}
      {menuOpen ? (
        <div className="nav-glass mx-auto -mt-4 mb-6 flex w-full max-w-6xl flex-col gap-3 px-5 py-5 sm:hidden">
          <a href="#platform" className="text-sm font-bold text-muted transition hover:text-brand-700" onClick={() => setMenuOpen(false)}>
            Home
          </a>
          <a href="#how-it-works" className="text-sm font-bold text-muted transition hover:text-brand-700" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#success-stories" className="text-sm font-bold text-muted transition hover:text-brand-700" onClick={() => setMenuOpen(false)}>
            Success stories
          </a>
          <div className="mt-2 flex flex-col gap-3 border-t border-ink/10 pt-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary w-full" onClick={() => setMenuOpen(false)}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary w-full" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary w-full" onClick={() => setMenuOpen(false)}>
                  Create profile
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className="page-fade">
        <Outlet />
      </div>

      <footer className="mx-auto mt-10 flex w-full max-w-6xl flex-col gap-3 border-t border-ink/10 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2026 Knot of Love. Crafted for meaningful connections.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/privacy" className="transition hover:text-brand-700">Privacy Policy</Link>
          <Link to="/terms" className="transition hover:text-brand-700">Terms of Use</Link>
          <Link to="/contact" className="transition hover:text-brand-700">Contact Us</Link>
        </div>
      </footer>
    </div>
  );
}

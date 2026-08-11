import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getProfileImageSrc, handleImageError } from "../utils/image";
import NotificationBell from "../components/NotificationBell";
import { useFCM } from "../hooks/useFCM";

// ─── Nav item icons ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Home",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    to: "/profiles",
    label: "Discover",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  },
  {
    to: "/chat",
    label: "Chat",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  {
    to: "/onboarding",
    label: "Profile",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
];

function DesktopNavLink({ to, label, pathname }) {
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
        active
          ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100"
          : "text-muted hover:bg-slate-100 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

function DesktopSecondaryLink({ to, label, pathname }) {
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors border shadow-sm ${
        active
          ? "border-brand-200 bg-brand-50 text-brand-700"
          : "border-ink/10 bg-white text-muted hover:border-ink/30 hover:text-ink hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Request notification permissions & register FCM token
  useFCM();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const avatarUrl = getProfileImageSrc(user?.profileImage, user?.name || "U", 48);
  // Chat page needs a special container — no overflow-hidden here
  const isChat = pathname === "/chat";

  return (
    <div className="min-h-screen bg-[#faf7f4]">

      {/* ──────────── MOBILE HEADER ──────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 nav-glass mx-3 mt-3 mb-4 flex items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <img
            src={avatarUrl}
            alt={user?.name}
            onError={(e) => handleImageError(e, user?.name || "U")}
            className="h-9 w-9 shrink-0 rounded-full border-2 border-white object-cover shadow"
          />
          <span className="min-w-0">
            <strong className="block truncate text-sm font-bold text-ink max-w-[130px] leading-tight">
              {user?.name || "Member"}
            </strong>
            <small className="block text-[10px] font-bold uppercase tracking-wide text-brand-600 leading-tight">
              {user?.memberId || "KOL-XXXXX"}
            </small>
          </span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <NotificationBell />
        </div>
      </header>

      {/* ──────────── DESKTOP HEADER ──────────────────────────────────────────── */}
      <header className="hidden md:flex sticky top-4 z-40 nav-glass mx-auto mb-8 w-full max-w-6xl items-center justify-between px-6 py-3 rounded-2xl border border-ink/5 shadow-md" style={{ maxWidth: "calc(100% - 2rem)", width: "100%", left: "1rem", right: "1rem", position: "sticky" }}>
        {/* LEFT: Identity */}
        <div className="flex items-center min-w-[200px]">
          <Link to="/dashboard" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
            <img
              src={avatarUrl}
              alt={user?.name}
              onError={(e) => handleImageError(e, user?.name || "U")}
              className="h-11 w-11 shrink-0 rounded-full border-2 border-white object-cover shadow-sm transition-transform group-hover:scale-105"
            />
            <span className="min-w-0">
              <strong className="block truncate text-base leading-tight text-ink max-w-[180px]">
                {user?.name || "Member"}
              </strong>
              <small className="block text-[11px] font-extrabold tracking-wide uppercase text-brand-600">
                {user?.memberId || "KOL-XXXXX"}
              </small>
            </span>
          </Link>
        </div>

        {/* CENTER: Primary Navigation */}
        <nav className="flex items-center gap-1">
          <DesktopNavLink to="/dashboard" label="Dashboard" pathname={pathname} />
          <DesktopNavLink to="/profiles" label="Discovery" pathname={pathname} />
          <DesktopNavLink to="/chat" label="Chat" pathname={pathname} />
        </nav>

        {/* RIGHT: Secondary Actions */}
        <div className="flex items-center justify-end gap-2 min-w-[200px]">
          <DesktopSecondaryLink to="/onboarding" label="Edit Profile" pathname={pathname} />
          <DesktopSecondaryLink to="/kyc" label="Verify" pathname={pathname} />
          <div className="h-5 w-px bg-ink/10 mx-1" />
          <NotificationBell />
          <button
            type="button"
            className="px-3 py-2 text-xs font-bold text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ──────────── PAGE CONTENT ────────────────────────────────────────────── */}
      {/* Chat page gets full remaining height; other pages get normal scroll */}
      <div className={`page-fade ${isChat ? "" : "pb-24 md:pb-8 px-3 sm:px-4"}`}>
        {isChat ? (
          <Outlet />
        ) : (
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        )}
      </div>

      {/* ──────────── MOBILE BOTTOM NAV ──────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 bg-white/95 backdrop-blur-xl border-t border-ink/8 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map(({ to, label, icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors ${
                active ? "text-brand-600" : "text-muted"
              }`}
            >
              <span className={`transition-transform ${active ? "scale-110" : ""}`}>
                {icon}
              </span>
              {label}
              {active && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

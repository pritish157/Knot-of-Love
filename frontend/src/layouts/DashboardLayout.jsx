import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getProfileImageSrc, handleImageError } from "../utils/image";
import NotificationBell from "../components/NotificationBell";

function PrimaryNav({ to, label, pathname }) {
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

function SecondaryNav({ to, label, pathname }) {
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

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const avatarUrl = getProfileImageSrc(user?.profileImage, user?.name || "U", 48);

  return (
    <div className="min-h-screen px-3 pt-4 pb-24 md:pb-4 sm:px-4">
      
      {/* ──── MOBILE HEADER (Safely preserved) ──── */}
      <header className="md:hidden nav-glass mx-auto mb-6 flex w-full flex-col gap-4 px-4 py-4 sm:px-5">
        <div className="flex w-full items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={user?.name}
              onError={(e) => handleImageError(e, user?.name || "U")}
              className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow"
            />
            <span className="grid gap-0.5 text-left">
              <strong className="truncate text-sm text-ink max-w-[140px] sm:max-w-xs">{user?.name || "Member"}</strong>
              <small className="text-xs text-muted">{user?.memberId || "Knot of Love"}</small>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* ──── DESKTOP HEADER (Clean 3-section layout) ──── */}
      <header className="hidden md:flex sticky top-4 z-40 nav-glass mx-auto mb-8 w-full max-w-6xl items-center justify-between px-6 py-3 shadow-md rounded-2xl border border-ink/5">
        
        {/* LEFT: Identity */}
        <div className="flex items-center min-w-[200px]">
          <Link to="/dashboard" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
            <img
              src={avatarUrl}
              alt={user?.name}
              onError={(e) => handleImageError(e, user?.name || "U")}
              className="h-11 w-11 shrink-0 rounded-full border-2 border-white object-cover shadow-sm transition-transform group-hover:scale-105"
            />
            <span className="grid gap-0 text-left">
              <strong className="truncate text-base leading-tight text-ink max-w-[180px]">{user?.name || "Member"}</strong>
              <small className="text-[11px] font-extrabold tracking-wide uppercase text-brand-600">{user?.memberId || "KOL-XXXXX"}</small>
            </span>
          </Link>
        </div>

        {/* CENTER: Primary Navigation */}
        <nav className="flex items-center gap-2">
          <PrimaryNav to="/dashboard" label="Dashboard" pathname={pathname} />
          <PrimaryNav to="/profiles" label="Discovery" pathname={pathname} />
          <PrimaryNav to="/chat" label="Chat" pathname={pathname} />
        </nav>

        {/* RIGHT: Secondary Actions */}
        <div className="flex items-center justify-end gap-3 min-w-[200px]">
          <SecondaryNav to="/onboarding" label="Edit Profile" pathname={pathname} />
          <SecondaryNav to="/kyc" label="Verify" pathname={pathname} />
          
          <div className="h-6 w-px bg-ink/10 mx-1"></div> {/* Divider */}
          
          <NotificationBell />
          
          <button 
            type="button" 
            className="px-3 py-2 text-xs font-bold text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

      </header>

      <div className="page-fade">
        <Outlet />
      </div>

      {/* NEW MOBILE NAV (Bottom Tabs) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white/90 backdrop-blur-md border-t border-ink/10 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <Link to="/dashboard" className={`flex flex-col items-center w-full py-3 text-xs font-bold transition-colors ${pathname === '/dashboard' ? 'text-brand-600' : 'text-muted hover:text-ink'}`}>
          <span className="text-xl mb-1">🏠</span>
          Home
        </Link>
        <Link to="/profiles" className={`flex flex-col items-center w-full py-3 text-xs font-bold transition-colors ${pathname === '/profiles' ? 'text-brand-600' : 'text-muted hover:text-ink'}`}>
          <span className="text-xl mb-1">🔍</span>
          Discover
        </Link>
        <Link to="/chat" className={`flex flex-col items-center w-full py-3 text-xs font-bold transition-colors ${pathname === '/chat' ? 'text-brand-600' : 'text-muted hover:text-ink'}`}>
          <span className="text-xl mb-1">💬</span>
          Chat
        </Link>
        <Link to="/onboarding" className={`flex flex-col items-center w-full py-3 text-xs font-bold transition-colors ${pathname === '/onboarding' ? 'text-brand-600' : 'text-muted hover:text-ink'}`}>
          <span className="text-xl mb-1">👤</span>
          Profile
        </Link>
      </nav>
    </div>
  );
}

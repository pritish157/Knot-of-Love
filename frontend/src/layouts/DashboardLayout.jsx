import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getProfileImageSrc, handleImageError } from "../utils/image";
import NotificationBell from "../components/NotificationBell";

function NavLink({ to, label, pathname }) {
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={active ? "btn-primary !min-h-10 px-4 py-2" : "btn-secondary !min-h-10 px-4 py-2"}
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
    <div className="min-h-screen px-3 py-4 sm:px-4">
      <header className="nav-glass mx-auto mb-6 flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        
        {/* TOP ROW (Mobile) / LEFT SIDE (Desktop) */}
        <div className="flex w-full items-center justify-between lg:w-auto">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={user?.name}
              onError={(e) => handleImageError(e, user?.name || "U")}
              className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow"
            />
            <span className="grid gap-0.5 text-left">
              <strong className="truncate text-sm text-ink sm:text-base max-w-[140px] sm:max-w-xs">{user?.name || "Member"}</strong>
              <small className="text-xs text-muted">{user?.memberId || "Knot of Love"}</small>
            </span>
          </Link>

          {/* Right side actions on Mobile */}
          <div className="flex items-center gap-3 lg:hidden">
            <NotificationBell />
            {/* The layout is cleaner without the logout button here on mobile; we'll put it in the scrollable nav */}
          </div>
        </div>

        {/* BOTTOM ROW (Mobile) / RIGHT SIDE (Desktop) */}
        <div className="flex w-full flex-col gap-4 lg:w-auto lg:flex-row lg:items-center">
          <nav className="flex w-full items-center gap-2 overflow-x-auto pb-1 lg:w-auto lg:pb-0 scrollbar-hide">
            <NavLink to="/dashboard" label="Dashboard" pathname={pathname} />
            <NavLink to="/profiles" label="Discovery" pathname={pathname} />
            <NavLink to="/chat" label="Chat" pathname={pathname} />
            <NavLink to="/onboarding" label="Edit Profile" pathname={pathname} />
            <NavLink to="/kyc" label="Verify" pathname={pathname} />
            
            {/* Logout is in the nav row on mobile, but next to bell on desktop */}
            <button type="button" className="btn-secondary shrink-0 !min-h-10 px-4 py-2 lg:hidden" onClick={handleLogout}>
              Log out
            </button>
          </nav>

          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <NotificationBell />
            <button type="button" className="btn-ghost shrink-0" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>

      </header>

      <div className="page-fade">
        <Outlet />
      </div>
    </div>
  );
}

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
      <header className="nav-glass mx-auto mb-6 flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-4 lg:flex-row lg:justify-between sm:px-5">
        <Link to="/dashboard" className="inline-flex w-full items-center justify-center gap-3 lg:w-auto lg:justify-start">
          <img
            src={avatarUrl}
            alt={user?.name}
            onError={(e) => handleImageError(e, user?.name || "U")}
            className="h-10 w-10 rounded-full border-2 border-white object-cover shadow"
          />
          <span className="grid gap-0.5 text-center lg:text-left">
            <strong className="text-sm text-ink sm:text-base">{user?.name || "Member"}</strong>
            <small className="text-xs text-muted">{user?.memberId || "Knot of Love"}</small>
          </span>
        </Link>

        <nav className="flex w-full flex-wrap items-center justify-center gap-2 lg:w-auto">
          <NavLink to="/dashboard" label="Dashboard" pathname={pathname} />
          <NavLink to="/profiles" label="Discovery" pathname={pathname} />
          <NavLink to="/chat" label="Chat" pathname={pathname} />
          <NavLink to="/onboarding" label="Edit Profile" pathname={pathname} />
          <NavLink to="/kyc" label="Verify" pathname={pathname} />
        </nav>

        <div className="flex w-full items-center justify-center gap-4 lg:w-auto lg:justify-end">
          <NotificationBell />
          <button type="button" className="btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="page-fade">
        <Outlet />
      </div>
    </div>
  );
}

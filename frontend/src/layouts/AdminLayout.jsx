import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getProfileImageSrc, handleImageError } from "../utils/image";

const NAV_ITEMS = [
  { to: "/admin",          label: "Overview",      icon: "📊", end: true },
  { to: "/admin/members",  label: "Members",       icon: "👥" },
  { to: "/admin/kyc",      label: "KYC Approvals", icon: "🔍" },
  { to: "/admin/activity", label: "Activity Log",  icon: "📋" },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const avatarUrl = getProfileImageSrc(user?.profileImage, user?.name || "A", 48);

  return (
    <div className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-sidebar__logo">
          <span className="admin-sidebar__logo-icon">💍</span>
          <div>
            <strong className="admin-sidebar__logo-name">Knot of Love</strong>
            <span className="admin-sidebar__logo-badge">Admin Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="admin-sidebar__nav">
          <p className="admin-sidebar__section-label">Main Menu</p>
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`
              }
            >
              <span className="admin-sidebar__link-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: back to user dashboard + admin info */}
        <div className="admin-sidebar__footer">
          <Link to="/dashboard" className="admin-sidebar__user-dash-link">
            ← User Dashboard
          </Link>
          <div className="admin-sidebar__profile">
            <img
              src={avatarUrl}
              alt={user?.name}
              onError={(e) => handleImageError(e, user?.name || "A")}
              className="admin-sidebar__avatar"
            />
            <div className="admin-sidebar__profile-info">
              <strong>{user?.name || "Administrator"}</strong>
              <small>{user?.email || ""}</small>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <div className="admin-topbar__breadcrumb">
            <span className="admin-topbar__site">Knot of Love</span>
            <span className="admin-topbar__sep">/</span>
            <span className="admin-topbar__current">Admin</span>
          </div>
          <button
            type="button"
            className="admin-topbar__logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </header>

        {/* Page */}
        <div className="admin-page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

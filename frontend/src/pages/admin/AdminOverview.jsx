import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../services/http";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/admin/stats")
      .then(d => setStats(d.stats))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1a0a0a", margin: 0 }}>
          Dashboard Overview
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#9a8a82", marginTop: 4 }}>
          Welcome back. Here's what's happening on Knot of Love.
        </p>
      </div>

      {error && (
        <div className="status-error" style={{ marginBottom: 20 }}>{error}</div>
      )}

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <KpiCard
          label="Total Members"
          value={loading ? "—" : stats?.totalUsers ?? 0}
          sub="Registered users"
          accent="#1e40af"
        />
        <KpiCard
          label="Verified"
          value={loading ? "—" : stats?.verifiedUsers ?? 0}
          sub="KYC approved"
          accent="#065f46"
        />
        <KpiCard
          label="Pending KYC"
          value={loading ? "—" : stats?.pendingDocs ?? 0}
          sub="Awaiting review"
          accent="#92400e"
        />
        <KpiCard
          label="Trust Rate"
          value={loading ? "—" : `${stats?.verificationRate ?? 0}%`}
          sub="Verification coverage"
          accent="#7c3aed"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 28 }}>
        <QuickAction
          icon="🔍"
          title="Review KYC Submissions"
          desc={`${stats?.pendingDocs ?? "..."} documents awaiting approval`}
          to="/admin/kyc"
          accent="#92400e"
          bg="#fef3c7"
        />
        <QuickAction
          icon="👥"
          title="Browse All Members"
          desc={`${stats?.totalUsers ?? "..."} registered members`}
          to="/admin/members"
          accent="#1e40af"
          bg="#dbeafe"
        />
        <QuickAction
          icon="📋"
          title="View Activity Log"
          desc="Full audit trail of admin actions"
          to="/admin/activity"
          accent="#065f46"
          bg="#d1fae5"
        />
      </div>

      {/* Platform info */}
      <div className="admin-section">
        <div className="admin-section__header">
          <div>
            <p className="admin-section__title">Platform Summary</p>
            <p className="admin-section__sub">Key metrics at a glance</p>
          </div>
        </div>
        <div style={{ padding: "20px 24px", display: "grid", gap: 16 }}>
          <MetricRow label="Total Registered Members" value={stats?.totalUsers ?? "—"} />
          <MetricRow label="KYC Verified Members" value={stats?.verifiedUsers ?? "—"} />
          <MetricRow label="Pending KYC Reviews" value={stats?.pendingDocs ?? "—"} />
          <MetricRow label="Verification Rate" value={`${stats?.verificationRate ?? "—"}%`} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="admin-kpi-card">
      <p className="admin-kpi-card__label">{label}</p>
      <p className="admin-kpi-card__value" style={{ color: accent }}>{value}</p>
      <p className="admin-kpi-card__sub">{sub}</p>
    </div>
  );
}

function QuickAction({ icon, title, desc, to, accent, bg }) {
  return (
    <Link
      to={to}
      style={{
        display: "block",
        background: "white",
        borderRadius: 16,
        padding: "20px 22px",
        textDecoration: "none",
        border: "1px solid rgba(24,29,39,0.05)",
        boxShadow: "0 1px 3px rgba(30,20,40,0.06)",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(30,20,40,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 3px rgba(30,20,40,0.06)"; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: 12 }}>
        {icon}
      </div>
      <p style={{ fontWeight: 800, color: "#1a0a0a", fontSize: "0.88rem", margin: 0 }}>{title}</p>
      <p style={{ fontSize: "0.75rem", color: "#9a8a82", marginTop: 4 }}>{desc}</p>
      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: accent, marginTop: 10 }}>Go →</p>
    </Link>
  );
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid rgba(24,29,39,0.05)" }}>
      <span style={{ fontSize: "0.83rem", color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a0a0a" }}>{value}</span>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../services/http";

export default function AdminMembers() {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [gender, setGender]     = useState("");
  const [verified, setVerified] = useState("");
  const searchTimer             = useRef(null);

  useEffect(() => {
    fetchMembers(1);
  }, [gender, verified]);

  function fetchMembers(targetPage, overrideSearch) {
    setLoading(true);
    setError("");
    const s = overrideSearch !== undefined ? overrideSearch : search;
    const params = new URLSearchParams({ page: targetPage, limit: 20 });
    if (s)       params.set("search",   s);
    if (gender)  params.set("gender",   gender);
    if (verified !== "") params.set("verified", verified);

    apiRequest(`/api/admin/members?${params}`)
      .then(d => {
        setUsers(d.users || []);
        setTotal(d.total || 0);
        setPage(d.page  || 1);
        setPages(d.pages || 1);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchMembers(1, val), 400);
  }

  function trustColor(score) {
    if (score >= 70) return "chip--green";
    if (score >= 40) return "chip--amber";
    return "chip--red";
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1a0a0a", margin: 0 }}>
          Members
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#9a8a82", marginTop: 4 }}>
          Browse and manage all registered members.
        </p>
      </div>

      {error && <div className="status-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-section">
        {/* Search / Filter bar */}
        <div className="admin-search-bar">
          <input
            className="admin-search-input"
            type="text"
            placeholder="Search by name, email, or member ID…"
            value={search}
            onChange={handleSearchChange}
          />
          <select
            className="admin-filter-select"
            value={gender}
            onChange={e => setGender(e.target.value)}
          >
            <option value="">All genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select
            className="admin-filter-select"
            value={verified}
            onChange={e => setVerified(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "#9a8a82", fontSize: "0.83rem" }}>
            Loading…
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Gender</th>
                    <th>Trust Score</th>
                    <th>KYC Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px 24px", color: "#9a8a82" }}>
                        No members found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u._id}>
                        <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#9a8a82" }}>
                          {u.memberId || "—"}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: "#1a0a0a" }}>{u.name}</span>
                        </td>
                        <td style={{ fontSize: "0.78rem", color: "#6b7280" }}>{u.email}</td>
                        <td>
                          <span className={`chip ${u.gender === "Female" ? "chip--blue" : "chip--gray"}`}>
                            {u.gender}
                          </span>
                        </td>
                        <td>
                          <span className={`chip ${trustColor(u.trustScore)}`}>
                            {u.trustScore}
                          </span>
                        </td>
                        <td>
                          {u.isProfileVerified
                            ? <span className="chip chip--green">Verified</span>
                            : <span className="chip chip--amber">Pending</span>
                          }
                        </td>
                        <td style={{ fontSize: "0.75rem", color: "#9a8a82" }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination">
              <span>Showing {users.length} of {total} members</span>
              <div className="admin-pagination__btns">
                <button
                  className="admin-pagination__btn"
                  disabled={page <= 1}
                  onClick={() => { const p = page - 1; setPage(p); fetchMembers(p); }}
                >
                  ← Prev
                </button>
                <span style={{ padding: "5px 12px", fontWeight: 600 }}>
                  {page} / {pages}
                </span>
                <button
                  className="admin-pagination__btn"
                  disabled={page >= pages}
                  onClick={() => { const p = page + 1; setPage(p); fetchMembers(p); }}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

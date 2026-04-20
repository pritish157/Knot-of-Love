import { useEffect, useState } from "react";
import { apiRequest } from "../../services/http";

const ACTION_LABELS = {
  APPROVE_DOCUMENT: { label: "Approved KYC",  chip: "chip--green" },
  REJECT_DOCUMENT:  { label: "Rejected KYC",  chip: "chip--red"   },
};

export default function AdminActivityLog() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => { fetchLogs(1); }, []);

  function fetchLogs(targetPage) {
    setLoading(true);
    setError("");
    apiRequest(`/api/admin/activity?page=${targetPage}&limit=30`)
      .then(d => {
        setLogs(d.logs   || []);
        setTotal(d.total || 0);
        setPage(d.page   || 1);
        setPages(d.pages || 1);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1a0a0a", margin: 0 }}>
          Activity Log
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#9a8a82", marginTop: 4 }}>
          Full audit trail of all admin actions on the platform.
        </p>
      </div>

      {error && <div className="status-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-section">
        <div className="admin-section__header">
          <div>
            <p className="admin-section__title">All Actions</p>
            <p className="admin-section__sub">{total} total log entries</p>
          </div>
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
                    <th>Timestamp</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Target User</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "40px 24px", color: "#9a8a82" }}>
                        No activity recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => {
                      const meta  = ACTION_LABELS[log.action] || { label: log.action, chip: "chip--gray" };
                      const reason = log.metadata?.reason;
                      return (
                        <tr key={log._id}>
                          <td style={{ fontSize: "0.73rem", color: "#9a8a82", whiteSpace: "nowrap" }}>
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleString("en-IN", {
                                  day: "2-digit", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit"
                                })
                              : "—"}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1a0a0a" }}>
                              {log.admin?.name || "—"}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#9a8a82" }}>
                              {log.admin?.email || ""}
                            </div>
                          </td>
                          <td>
                            <span className={`chip ${meta.chip}`}>{meta.label}</span>
                          </td>
                          <td>
                            {log.targetUser ? (
                              <>
                                <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#1a0a0a" }}>
                                  {log.targetUser.name}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "#9a8a82", fontFamily: "monospace" }}>
                                  {log.targetUser.memberId || log.targetUser.email}
                                </div>
                              </>
                            ) : "—"}
                          </td>
                          <td style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            {reason ? `Reason: ${reason}` : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination">
              <span>Showing {logs.length} of {total} entries</span>
              <div className="admin-pagination__btns">
                <button
                  className="admin-pagination__btn"
                  disabled={page <= 1}
                  onClick={() => { const p = page - 1; setPage(p); fetchLogs(p); }}
                >
                  ← Prev
                </button>
                <span style={{ padding: "5px 12px", fontWeight: 600 }}>
                  {page} / {pages}
                </span>
                <button
                  className="admin-pagination__btn"
                  disabled={page >= pages}
                  onClick={() => { const p = page + 1; setPage(p); fetchLogs(p); }}
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

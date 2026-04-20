import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../../services/http";
import Spinner from "../../components/Spinner";

/**
 * AdminReports — displays every USER_REPORTED entry from the audit log.
 * Admins can flag/unflag the reported user directly from this page.
 */
export default function AdminReports() {
  const [reports, setReports]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(true);
  const [flagging, setFlagging]   = useState(null); // userId being toggled
  const [flagReason, setFlagReason] = useState("");
  const [activeFlagId, setActiveFlagId] = useState(null); // userId whose flag modal is open
  const [toast, setToast]         = useState(null);

  const LIMIT = 20;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/admin/reports?page=${page}&limit=${LIMIT}`);
      setReports(res.reports || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      showToast(err.message || "Failed to load reports", "error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function handleFlag(userId, currentlyFlagged) {
    if (!currentlyFlagged && !flagReason.trim()) {
      showToast("Please enter a reason for flagging.", "error");
      return;
    }
    setFlagging(userId);
    try {
      const res = await apiRequest(`/api/admin/flag/${userId}`, {
        method: "POST",
        body: JSON.stringify({ flagReason: flagReason.trim() })
      });
      showToast(res.message);
      setActiveFlagId(null);
      setFlagReason("");
      fetchReports();
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setFlagging(null);
    }
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg text-white ${
          toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Reports</h1>
          <p className="admin-page-subtitle">
            {total} report{total !== 1 ? "s" : ""} submitted by members
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : reports.length === 0 ? (
        <div className="admin-empty-state">
          <span className="text-4xl">🛡️</span>
          <p className="mt-3 text-muted font-medium">No reports yet. Community is clean!</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reported At</th>
                  <th>Reported User</th>
                  <th>Reported By</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => {
                  const reported   = r.reported;
                  const reporter   = r.reporter;
                  const isFlagged  = reported?.isFlagged;

                  return (
                    <tr key={r._id}>
                      {/* Date */}
                      <td className="whitespace-nowrap text-xs text-muted">
                        {new Date(r.reportedAt).toLocaleString([], {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </td>

                      {/* Reported user */}
                      <td>
                        {reported ? (
                          <div>
                            <p className="font-bold text-sm text-ink">{reported.name}</p>
                            <p className="text-xs text-muted">{reported.email}</p>
                            <p className="text-xs text-muted">{reported.memberId}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">Deleted user</span>
                        )}
                      </td>

                      {/* Reporter */}
                      <td>
                        {reporter ? (
                          <div>
                            <p className="text-sm text-ink">{reporter.name}</p>
                            <p className="text-xs text-muted">{reporter.memberId}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">Unknown</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="max-w-xs">
                        <p className="text-sm text-ink break-words line-clamp-2">
                          {r.reason || <span className="italic text-muted">No reason given</span>}
                        </p>
                      </td>

                      {/* Flag status */}
                      <td>
                        {!reported ? (
                          <span className="admin-badge admin-badge--neutral">N/A</span>
                        ) : isFlagged ? (
                          <span className="admin-badge admin-badge--danger">🚩 Flagged</span>
                        ) : (
                          <span className="admin-badge admin-badge--neutral">Active</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        {reported && (
                          isFlagged ? (
                            <button
                              onClick={() => handleFlag(reported._id, true)}
                              disabled={flagging === reported._id}
                              className="admin-btn admin-btn--secondary text-xs"
                            >
                              {flagging === reported._id ? <Spinner className="w-3 h-3" /> : "Unflag"}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveFlagId(reported._id);
                                setFlagReason("");
                              }}
                              className="admin-btn admin-btn--danger text-xs"
                            >
                              🚩 Flag User
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-btn admin-btn--secondary"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-muted">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="admin-btn admin-btn--secondary"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Flag-reason modal */}
      {activeFlagId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-ink mb-1">🚩 Flag User as Suspicious</h3>
            <p className="text-xs text-muted mb-4">
              This will reduce their trust score by 40 pts and block all their active matches.
            </p>
            <textarea
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
              placeholder="Reason for flagging (e.g. fake photos, scam behaviour)..."
              className="w-full border border-ink/10 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:border-brand-600 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActiveFlagId(null); setFlagReason(""); }}
                className="admin-btn admin-btn--secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFlag(activeFlagId, false)}
                disabled={flagging === activeFlagId || !flagReason.trim()}
                className="admin-btn admin-btn--danger flex items-center gap-2"
              >
                {flagging === activeFlagId && <Spinner className="w-4 h-4 border-white" />}
                Confirm Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { apiRequest } from "../../services/http";

export default function AdminKYC() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [rejectingId, setRejectingId]   = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast]               = useState(null);

  useEffect(() => { fetchData(); }, []);

  function showToast(msg, type = "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/admin/pending-users");
      setPendingUsers(data.pendingUsers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(docId) {
    try {
      await apiRequest("/api/admin/approve", {
        method: "POST",
        body: JSON.stringify({ docId })
      });
      showToast("User approved successfully ✅", "success");
      setRejectingId(null);
      fetchData();
    } catch (e) {
      showToast(e.message);
    }
  }

  async function handleReject(docId) {
    if (!rejectReason.trim()) { showToast("Enter a rejection reason."); return; }
    try {
      await apiRequest("/api/admin/reject", {
        method: "POST",
        body: JSON.stringify({ docId, reason: rejectReason.trim() })
      });
      showToast("User rejected", "success");
      setRejectingId(null);
      setRejectReason("");
      fetchData();
    } catch (e) {
      showToast(e.message);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1a0a0a", margin: 0 }}>
          KYC Approvals
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#9a8a82", marginTop: 4 }}>
          Review identity documents to grant the ✅ Verified badge.
        </p>
      </div>

      {toast && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: "0.82rem",
            fontWeight: 600,
            background: toast.type === "success" ? "#d1fae5" : "#fee2e2",
            color: toast.type === "success" ? "#065f46" : "#991b1b",
          }}
        >
          {toast.msg}
        </div>
      )}

      {error && <div className="status-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-section">
        <div className="admin-section__header">
          <div>
            <p className="admin-section__title">Pending Submissions</p>
            <p className="admin-section__sub">{pendingUsers.length} document{pendingUsers.length !== 1 ? "s" : ""} awaiting review</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "#9a8a82", fontSize: "0.83rem" }}>
            Loading…
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>ID Type</th>
                  <th>ID Number</th>
                  <th>Submitted</th>
                  <th>Document</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px 24px", color: "#9a8a82" }}>
                      🎉 All caught up! No pending KYC submissions.
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map(item => (
                    <>
                      <tr key={item.docId}>
                        <td>
                          <div style={{ fontWeight: 700, color: "#1a0a0a" }}>{item.user?.name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#9a8a82" }}>{item.user?.email}</div>
                        </td>
                        <td>
                          <span className="chip chip--blue">{item.idProof?.type || "—"}</span>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {item.idProof?.idNumber || "—"}
                        </td>
                        <td style={{ fontSize: "0.75rem", color: "#9a8a82" }}>
                          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td>
                          {item.idProof?.fileUrl ? (
                            <a
                              href={item.idProof.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-btn admin-btn--view"
                            >
                              View ↗
                            </a>
                          ) : (
                            <span style={{ color: "#9a8a82", fontSize: "0.75rem" }}>No file</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="admin-btn admin-btn--approve"
                              onClick={() => handleApprove(item.docId)}
                            >
                              Approve
                            </button>
                            <button
                              className="admin-btn admin-btn--reject"
                              onClick={() => setRejectingId(item.docId === rejectingId ? null : item.docId)}
                            >
                              {rejectingId === item.docId ? "Cancel" : "Reject"}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {rejectingId === item.docId && (
                        <tr key={`${item.docId}-reject`} className="admin-reject-row">
                          <td colSpan={6}>
                            <div className="admin-reject-form">
                              <input
                                className="admin-reject-input"
                                type="text"
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason…"
                              />
                              <button
                                className="admin-btn admin-btn--reject"
                                onClick={() => handleReject(item.docId)}
                              >
                                Confirm Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

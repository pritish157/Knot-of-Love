import { memo, useEffect, useState } from "react";
import { apiRequest } from "../services/http";
import { getProfileImageSrc, handleImageError } from "../utils/image";

const STATUS_STYLE = {
  Pending:  { chip: "bg-amber-100 text-amber-700",     label: "Pending",  icon: "⏳" },
  Accepted: { chip: "bg-emerald-100 text-emerald-700", label: "Accepted", icon: "✅" },
  Rejected: { chip: "bg-red-100 text-red-700",         label: "Declined", icon: "❌" },
  Blocked:  { chip: "bg-gray-100 text-gray-500",       label: "Blocked",  icon: "🚫" }
};

const SentInterests = memo(function SentInterests() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);

  useEffect(() => {
    fetchSent();
  }, []);

  async function fetchSent() {
    try {
      const d = await apiRequest("/api/matches/sent");
      setList(d.sent || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(matchId) {
    
    setWithdrawing(matchId);
    try {
      await apiRequest(`/api/matches/withdraw/${matchId}`, { method: "DELETE" });
      await fetchSent();
    } catch (e) {
      alert(e.message || "Failed to withdraw interest.");
    } finally {
      setWithdrawing(null);
    }
  }

  return (
    <section className="surface-card p-6">
      <h2 className="mb-4 border-b border-ink/10 pb-4 font-serif text-2xl text-ink">
        Interests I Sent
      </h2>

      {loading ? (
        <div className="flex h-16 items-center justify-center">
          <span className="text-sm text-muted">Loading…</span>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-slate-50/50 p-6 text-center">
          <p className="text-3xl">💌</p>
          <p className="mt-2 font-bold text-ink text-sm">No interests sent yet</p>
          <p className="mt-1 text-xs text-muted">Browse profiles and express interest to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.slice(0, 8).map(item => {
            const s = STATUS_STYLE[item.status] || STATUS_STYLE.Pending;
            return (
              <li key={item.matchId} className="flex items-center gap-3 rounded-xl border border-ink/5 bg-slate-50 p-3">
                <img
                  src={getProfileImageSrc(item.image, item.name, 40)}
                  alt={item.name}
                  loading="lazy"
                  onError={e => handleImageError(e, item.name)}
                  className="h-10 w-10 rounded-full object-cover shadow flex-shrink-0"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-bold text-ink text-sm">{item.name || "—"}</p>
                  <p className="text-xs text-muted">{item.memberId || ""}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.chip}`}>
                    {s.icon} {s.label}
                  </span>
                  {item.status === "Pending" && (
                    <button
                      onClick={() => handleWithdraw(item.matchId)}
                      disabled={withdrawing === item.matchId}
                      className="text-[0.65rem] font-bold text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {withdrawing === item.matchId ? "Withdrawing..." : "Withdraw"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
});

export default SentInterests;

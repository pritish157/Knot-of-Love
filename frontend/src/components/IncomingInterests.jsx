import { memo, useEffect, useState } from "react";
import { apiRequest } from "../services/http";
import { getProfileImageSrc, handleImageError } from "../utils/image";


const IncomingInterests = memo(function IncomingInterests({ onCountChange }) {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(null);   // matchId being actioned
  const [toast, setToast]       = useState(null);
  const [expanded, setExpanded] = useState(null);   // matchId with profile open

  useEffect(() => { fetchIncoming(); }, []);

  function showToast(msg, type = "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function fetchIncoming() {
    setLoading(true);
    try {
      const d = await apiRequest("/api/matches/incoming");
      setList(d.incoming || []);
      onCountChange?.(d.incoming?.length || 0);
    } catch { setList([]); }
    finally  { setLoading(false); }
  }

  async function respond(matchId, status) {
    setBusy(matchId);
    try {
      await apiRequest("/api/matches/respond", {
        method: "POST",
        body: JSON.stringify({ matchId, status })
      });
      showToast(
        status === "Accepted" ? "✅ Interest accepted! You can now message them." : "Interest declined.",
        status === "Accepted" ? "success" : "info"
      );
      setExpanded(null);
      fetchIncoming();
    } catch (e) { showToast(e.message); }
    finally   { setBusy(null); }
  }

  if (loading) return (
    <section className="surface-card p-6">
      <h2 className="font-serif text-2xl text-ink mb-4">Interests Received</h2>
      <div className="flex h-24 items-center justify-center"><span className="text-muted text-sm">Loading…</span></div>
    </section>
  );

  return (
    <section className="surface-card p-6">
      <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-4">
        <h2 className="font-serif text-2xl text-ink">
          Interests Received
          {list.length > 0 && (
            <span className="ml-2 rounded-full bg-brand-500 px-2.5 py-0.5 text-sm font-extrabold text-white">
              {list.length}
            </span>
          )}
        </h2>
      </div>

      {toast && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700" :
          toast.type === "info"    ? "bg-blue-50 text-blue-700" :
          "bg-red-50 text-red-700"}`}>
          {toast.msg}
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-slate-50/50 p-8 text-center">
          <p className="text-4xl">💌</p>
          <h3 className="mt-3 font-bold text-ink">No pending interests</h3>
          <p className="mt-1 text-sm text-muted">When someone expresses interest, they'll appear here.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map(item => (
            <li key={item.matchId} className="rounded-xl border border-ink/5 bg-slate-50 p-4">
              {/* Sender card */}
              <div className="flex items-center gap-3">
                <img
                  src={getProfileImageSrc(item.image, item.name, 48)}
                  alt={item.name}
                  loading="lazy"
                  onError={e => handleImageError(e, item.name)}
                  className="h-12 w-12 rounded-full object-cover shadow"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-bold text-ink">{item.name}</p>
                  <p className="text-xs text-muted">
                    {[item.age && `${item.age} yrs`, item.religion, item.location]
                      .filter(Boolean).join(" • ")}
                  </p>
                </div>
                {item.isVerified && (
                  <span title="Verified" className="text-emerald-500 text-lg">✅</span>
                )}
              </div>

              {/* Expandable profile */}
              {expanded === item.matchId && (
                <div className="mt-3 rounded-lg bg-white p-3 text-xs text-muted space-y-1 border border-ink/5">
                  {item.education  && <p><strong>Education:</strong> {item.education}</p>}
                  {item.profession && <p><strong>Profession:</strong> {item.profession}</p>}
                  {item.income     && <p><strong>Income:</strong> {item.income}</p>}
                  {item.height     && <p><strong>Height:</strong> {item.height}</p>}
                  {item.bio        && <p className="mt-1 italic">"{item.bio}"</p>}
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  className="text-xs font-bold text-brand-600 hover:text-brand-800"
                  onClick={() => setExpanded(expanded === item.matchId ? null : item.matchId)}
                >
                  {expanded === item.matchId ? "Hide Profile ▲" : "View Profile ▼"}
                </button>
                <div className="ml-auto flex gap-2">
                  <button
                    disabled={busy === item.matchId}
                    onClick={() => respond(item.matchId, "Accepted")}
                    className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                  >
                    ✅ Accept
                  </button>
                  <button
                    disabled={busy === item.matchId}
                    onClick={() => respond(item.matchId, "Rejected")}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    ❌ Decline
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});

export default IncomingInterests;

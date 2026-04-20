import { useState, useEffect } from "react";
import { apiRequest } from "../services/http";
import { getProfileImageSrc, handleImageError } from "../utils/image";
import Spinner from "./Spinner";
import { useToast } from "../hooks/useToast";

export default function HiddenUsers() {
  const [blocked, setBlocked] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchHidden = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/api/matches/hidden");
      setBlocked(res.blocked || []);
      setArchived(res.archived || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHidden();
  }, []);

  const handleUnblock = async (matchId) => {
    try {
      await apiRequest(`/api/matches/unblock/${matchId}`, { method: "POST" });
      showToast("User unblocked successfully.", "success");
      setBlocked(prev => prev.filter(m => m.matchId !== matchId));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleUnarchive = async (matchId) => {
    try {
      await apiRequest(`/api/matches/unarchive/${matchId}`, { method: "POST" });
      showToast("Conversation unarchived.", "success");
      setArchived(prev => prev.filter(m => m.matchId !== matchId));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Spinner /></div>;
  }

  if (blocked.length === 0 && archived.length === 0) {
    return null; // Don't show the section if there's nothing hidden
  }

  return (
    <div className="space-y-6">
      {/* ──── BLOCKED USERS ──── */}
      {blocked.length > 0 && (
        <section className="surface-card p-4 md:p-6">
          <h2 className="border-b border-ink/10 pb-4 font-serif text-xl text-ink">Blocked Users</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {blocked.map(m => (
              <li key={m.matchId} className="flex items-center justify-between gap-4 rounded-xl border border-ink/5 bg-slate-50 p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={getProfileImageSrc(m.user.image, m.user.name, 48)}
                    alt={m.user.name}
                    loading="lazy"
                    onError={(e) => handleImageError(e, m.user.name)}
                    className="h-10 w-10 shrink-0 rounded-full object-cover shadow"
                  />
                  <div className="overflow-hidden">
                    <p className="truncate font-bold text-ink">{m.user.name}</p>
                    <p className="truncate text-xs text-muted">{m.user.memberId}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(m.matchId)}
                  className="rounded bg-ink px-3 py-1.5 text-xs font-bold text-white transition hover:bg-ink/80"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ──── ARCHIVED CONVERSATIONS ──── */}
      {archived.length > 0 && (
        <section className="surface-card p-4 md:p-6">
          <h2 className="border-b border-ink/10 pb-4 font-serif text-xl text-ink">Archived Conversations</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {archived.map(m => (
              <li key={m.matchId} className="flex items-center justify-between gap-4 rounded-xl border border-ink/5 bg-slate-50 p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={getProfileImageSrc(m.user.image, m.user.name, 48)}
                    alt={m.user.name}
                    loading="lazy"
                    onError={(e) => handleImageError(e, m.user.name)}
                    className="h-10 w-10 shrink-0 rounded-full object-cover shadow"
                  />
                  <div className="overflow-hidden">
                    <p className="truncate font-bold text-ink">{m.user.name}</p>
                    <p className="truncate text-xs text-muted">{m.user.memberId}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnarchive(m.matchId)}
                  className="rounded bg-ink px-3 py-1.5 text-xs font-bold text-white transition hover:bg-ink/80"
                >
                  Unarchive
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

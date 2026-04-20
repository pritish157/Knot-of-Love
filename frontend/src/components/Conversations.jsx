import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveMatches } from "../hooks/useActiveMatches";
import { getProfileImageSrc, handleImageError } from "../utils/image";

const Conversations = memo(function Conversations({ myId }) {
  const { matches, loadingMatches: loading } = useActiveMatches();
  const navigate = useNavigate();

  if (loading) return (
    <section className="surface-card p-4 md:p-6">
      <h2 className="mb-4 border-b border-ink/10 pb-4 font-serif text-2xl text-ink">My Conversations</h2>
      <div className="flex h-16 items-center justify-center"><span className="text-sm text-muted">Loading…</span></div>
    </section>
  );

  const content = (
    <>
      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-slate-50/50 p-6 text-center">
          <p className="text-3xl">💬</p>
          <p className="mt-2 font-bold text-ink text-sm">No conversations yet</p>
          <p className="mt-1 text-xs text-muted">Accept an interest (or get yours accepted) to start chatting.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {matches.map(m => (
            <li
              key={m.matchId}
              onClick={() => navigate("/chat", { state: { matchId: m.matchId } })}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/5 bg-slate-50 p-3 hover:bg-slate-100 transition-colors"
            >
              <img
                src={getProfileImageSrc(m.user.image, m.user.name, 44)}
                alt={m.user.name}
                loading="lazy"
                onError={e => handleImageError(e, m.user.name)}
                className="h-11 w-11 rounded-full object-cover shadow flex-shrink-0"
              />
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-bold text-ink text-sm">{m.user.name}</p>
                <p className="text-xs text-muted">{m.user.gender} • Matched ✅</p>
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#c22d45" }}>
                Open Chat →
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <>
      {/* DESKTOP */}
      <section className="hidden md:block surface-card p-6">
        <h2 className="mb-4 border-b border-ink/10 pb-4 font-serif text-2xl text-ink">
          My Conversations
          {matches.length > 0 && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-extrabold text-emerald-700">
              {matches.length}
            </span>
          )}
        </h2>
        {content}
      </section>

      {/* MOBILE */}
      <details className="md:hidden surface-card group p-4 cursor-pointer">
        <summary className="font-bold text-sm text-ink outline-none list-none flex justify-between items-center">
          <span className="flex items-center gap-2">
            My Conversations
            {matches.length > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-700">
                {matches.length}
              </span>
            )}
          </span>
          <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-4 pt-4 border-t border-ink/5 cursor-auto">
          {content}
        </div>
      </details>
    </>
  );
});

export default Conversations;

import { memo, useEffect, useRef, useState } from "react";
import { apiRequest } from "../services/http";
import { useActiveMatches } from "../hooks/useActiveMatches";
import { getProfileImageSrc, handleImageError } from "../utils/image";

const QUICK = [
  "I'm interested! Please share your contact details.",
  "Can you share your employment details?",
  "Please share your family background.",
  "I'd love to know more about you."
];

const ChatBox = memo(function ChatBox({ match, myId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const bottomRef               = useRef(null);

  useEffect(() => { load(); }, [match.matchId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function load() {
    setLoading(true);
    try {
      const d = await apiRequest(`/api/messages/${match.matchId}`);
      setMessages(d.messages || []);
    } catch { setMessages([]); }
    finally { setLoading(false); }
  }

  async function send(msg) {
    const payload = msg || text.trim();
    if (!payload) return;
    setSending(true);
    try {
      const d = await apiRequest("/api/messages/send", {
        method: "POST",
        body: JSON.stringify({ matchId: match.matchId, text: payload })
      });
      setMessages(prev => [...prev, d.message]);
      setText("");
    } catch (e) { alert(e.message); }
    finally { setSending(false); }
  }

  return (
    <div style={{ border: "1px solid rgba(24,29,39,0.08)", borderRadius: 16, background: "white", overflow: "hidden", marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(24,29,39,0.06)", background: "#fdfaf8" }}>
        <img
          src={getProfileImageSrc(match.image, match.name, 36)}
          alt={match.name}
          loading="lazy"
          onError={e => handleImageError(e, match.name)}
          style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
        />
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: "0.88rem", color: "#1a0a0a" }}>{match.name}</strong>
          <p style={{ fontSize: "0.7rem", color: "#9a8a82", margin: 0 }}>Accepted match</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#9a8a82" }}>✕</button>
      </div>

      {/* Quick replies */}
      <div style={{ padding: "8px 12px", display: "flex", gap: 6, flexWrap: "wrap", borderBottom: "1px solid rgba(24,29,39,0.05)", background: "#faf3ec" }}>
        {QUICK.map((q, i) => (
          <button key={i} onClick={() => send(q)} disabled={sending}
            style={{ fontSize: "0.68rem", padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(194,45,69,0.25)", background: "white", color: "#c22d45", cursor: "pointer", fontWeight: 700 }}>
            {q.slice(0, 28)}…
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ maxHeight: 240, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? <p style={{ textAlign: "center", color: "#9a8a82", fontSize: "0.8rem" }}>Loading…</p> :
          messages.length === 0 ? <p style={{ textAlign: "center", color: "#9a8a82", fontSize: "0.8rem" }}>No messages yet. Say hello! 👋</p> :
          messages.map(m => {
            const isMe = m.senderId === myId || m.senderId?._id === myId;
            return (
              <div key={m._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "75%", padding: "8px 12px", borderRadius: 12,
                  background: isMe ? "#c22d45" : "#f3f4f6",
                  color: isMe ? "white" : "#1a0a0a",
                  fontSize: "0.82rem", lineHeight: 1.5
                }}>
                  {m.text}
                  <div style={{ fontSize: "0.6rem", marginTop: 4, opacity: 0.6, textAlign: isMe ? "right" : "left" }}>
                    {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        }
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid rgba(24,29,39,0.06)" }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message… (max 500 chars)"
          maxLength={500}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(24,29,39,0.12)", fontSize: "0.83rem", outline: "none" }}
        />
        <button
          onClick={() => send()}
          disabled={sending || !text.trim()}
          style={{ padding: "8px 16px", borderRadius: 10, background: "#c22d45", color: "white", border: "none", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", opacity: sending || !text.trim() ? 0.5 : 1 }}>
          Send
        </button>
      </div>
    </div>
  );
});

const Conversations = memo(function Conversations({ myId }) {
  const { matches, loadingMatches: loading } = useActiveMatches();
  const [openChat, setOpenChat] = useState(null); // matchId

  if (loading) return (
    <section className="surface-card p-6">
      <h2 className="mb-4 border-b border-ink/10 pb-4 font-serif text-2xl text-ink">My Conversations</h2>
      <div className="flex h-16 items-center justify-center"><span className="text-sm text-muted">Loading…</span></div>
    </section>
  );

  return (
    <section className="surface-card p-6">
      <h2 className="mb-4 border-b border-ink/10 pb-4 font-serif text-2xl text-ink">
        My Conversations
        {matches.length > 0 && (
          <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-extrabold text-emerald-700">
            {matches.length}
          </span>
        )}
      </h2>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-slate-50/50 p-6 text-center">
          <p className="text-3xl">💬</p>
          <p className="mt-2 font-bold text-ink text-sm">No conversations yet</p>
          <p className="mt-1 text-xs text-muted">Accept an interest (or get yours accepted) to start chatting.</p>
        </div>
      ) : (
        <>
          {openChat ? (
            <ChatBox
              match={matches.find(m => m.matchId === openChat) || matches[0]}
              myId={myId}
              onClose={() => setOpenChat(null)}
            />
          ) : null}
          <ul className="grid gap-3 sm:grid-cols-2">
            {matches.map(m => (
              <li
                key={m.matchId}
                onClick={() => setOpenChat(m.matchId === openChat ? null : m.matchId)}
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
                  {openChat === m.matchId ? "Close ▲" : "Chat ▼"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
});

export default Conversations;

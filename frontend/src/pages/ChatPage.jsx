import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CryptoJS from "crypto-js";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { useActiveMatches } from "../hooks/useActiveMatches";
import { apiRequest } from "../services/http";
import { getProfileImageSrc, handleImageError } from "../utils/image";
import Spinner from "../components/Spinner";

const QUICK = [
  "I'm interested! Please share your contact details.",
  "Can you share your employment details?",
  "Please share your family background.",
  "I'd love to know more about you."
];

export default function ChatPage() {
  const { user, token } = useAuth();
  const { matches, loadingMatches, refreshMatches } = useActiveMatches();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const [messages, setMessages] = useState({}); // { matchId: [messages] }
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [typingUsers, setTypingUsers] = useState({}); // { matchId: boolean }
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const socket = useSocket();

  // Initialize socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      let decryptedText = msg.text;
      if (msg.text && msg.text.startsWith("U2Fsd")) {
        try {
          const bytes = CryptoJS.AES.decrypt(msg.text, msg.matchId);
          decryptedText = bytes.toString(CryptoJS.enc.Utf8) || msg.text;
        } catch { /* ignore */ }
      }

      const decryptedMsg = { ...msg, text: decryptedText };

      setMessages((prev) => {
        const currentMsgs = prev[msg.matchId] || [];
        if (currentMsgs.some(m => m._id === msg._id)) return prev; // De-duplicate

        return {
          ...prev,
          [msg.matchId]: [...currentMsgs, decryptedMsg]
        };
      });

      // If we received a message for the active chat, mark it as seen
      if (activeMatchId === msg.matchId && msg.senderId !== user?._id) {
        socket.emit("mark_seen", { matchId: msg.matchId, senderId: msg.senderId });
      }
    };

    const handleNewMessageAlert = (msg) => {
      let decryptedText = msg.text;
      if (msg.text && msg.text.startsWith("U2Fsd")) {
        try {
          const bytes = CryptoJS.AES.decrypt(msg.text, msg.matchId);
          decryptedText = bytes.toString(CryptoJS.enc.Utf8) || msg.text;
        } catch { /* ignore */ }
      }

      const decryptedMsg = { ...msg, text: decryptedText };

      // Receiver is not in the room, still update messages list
      setMessages((prev) => {
        const currentMsgs = prev[msg.matchId] || [];
        if (currentMsgs.some(m => m._id === msg._id)) return prev; // De-duplicate

        return {
          ...prev,
          [msg.matchId]: [...currentMsgs, decryptedMsg]
        };
      });
    };

    const handleTyping = ({ matchId }) => setTypingUsers(prev => ({ ...prev, [matchId]: true }));
    const handleStopTyping = ({ matchId }) => setTypingUsers(prev => ({ ...prev, [matchId]: false }));

    const handleMessagesSeen = ({ matchId }) => {
      setMessages((prev) => {
        if (!prev[matchId]) return prev;
        return {
          ...prev,
          [matchId]: prev[matchId].map(m => ({ ...m, isRead: true }))
        };
      });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("new_message_alert", handleNewMessageAlert);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("messages_seen", handleMessagesSeen);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("new_message_alert", handleNewMessageAlert);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("messages_seen", handleMessagesSeen);
    };
  }, [socket, activeMatchId, user?._id]);

  // Handle active match selection
  useEffect(() => {
    // Check if matchId is passed via state (e.g. from Dashboard)
    if (location.state?.matchId) {
      setActiveMatchId(location.state.matchId);
      // Clear state to avoid infinite loop
      window.history.replaceState({}, document.title);
    } else if (matches.length > 0 && !activeMatchId) {
      setActiveMatchId(matches[0].matchId);
    }
  }, [matches, location.state]);

  const activeMatch = useMemo(() => 
    matches.find(m => m.matchId === activeMatchId),
  [matches, activeMatchId]);

  // Encryption Helpers
  const encrypt = (text, key) => CryptoJS.AES.encrypt(text, key).toString();
  const [confirmAction, setConfirmAction] = useState(null);
  const [reportReason, setReportReason] = useState("");

  const decrypt = (cipher, key) => {
    try {
      if (!cipher.startsWith("U2Fsd")) return cipher; // Only decrypt AES strings
      const bytes = CryptoJS.AES.decrypt(cipher, key);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      return original || cipher;
    } catch { return cipher; }
  };

  // Match Management actions
  const triggerManageAction = (action) => {
    setShowMenu(false);
    setConfirmAction(action);
    setReportReason("");
  };

  const executeManageAction = async () => {
    if (!activeMatchId || !confirmAction) return;
    
    try {
      let body = undefined;
      if (confirmAction === "report") {
        if (!reportReason.trim()) {
          alert("Please enter a reason for reporting.");
          return;
        }
        body = JSON.stringify({ reason: reportReason });
      }
      
      await apiRequest(`/api/matches/${confirmAction}/${activeMatchId}`, {
        method: "POST",
        body
      });
      
      setConfirmAction(null);
      setActiveMatchId(null);
      refreshMatches();
    } catch (e) {
      alert(e.message);
    }
  };

  // Load chat history & join room
  useEffect(() => {
    if (!activeMatchId) return;

    async function loadHistory() {
      if (!messages[activeMatchId]) {
        setLoadingHistory(true);
        try {
          const d = await apiRequest(`/api/messages/${activeMatchId}`);
          const decryptedMessages = (d.messages || []).map(m => ({
            ...m,
            text: decrypt(m.text, activeMatchId)
          }));
          setMessages(prev => ({ ...prev, [activeMatchId]: decryptedMessages }));
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    if (socket) {
      socket.emit("join_match", activeMatchId);
      if (activeMatch) {
         // Mark all existing as seen when opening
         socket.emit("mark_seen", { matchId: activeMatchId, senderId: activeMatch.user._id });
      }
    }

    return () => {
      if (socket) socket.emit("leave_match", activeMatchId);
    };
  }, [activeMatchId, socket, activeMatch]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeMatchId, typingUsers]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !activeMatch) return;

    socket.emit("typing", { matchId: activeMatchId, receiverId: activeMatch.user._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { matchId: activeMatchId, receiverId: activeMatch.user._id });
    }, 2000);
  };

  const send = async (msgText) => {
    const payload = msgText || text.trim();
    if (!payload || !activeMatchId) return;
    setSending(true);
    
    if (socket && activeMatch) {
      socket.emit("stop_typing", { matchId: activeMatchId, receiverId: activeMatch.user._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      const encryptedText = encrypt(payload, activeMatchId);
      await apiRequest("/api/messages/send", {
        method: "POST",
        body: JSON.stringify({ matchId: activeMatchId, text: encryptedText })
      });
      // The socket event will trigger and decrypt it because it goes through new_message
      setText("");
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loadingMatches) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-slate-50">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-7xl overflow-hidden bg-white shadow-xl sm:rounded-xl sm:border sm:border-ink/10">
      
      {/* Sidebar: Chat List */}
      <div className={`w-full flex-col border-r border-ink/10 bg-slate-50 md:flex md:w-80 lg:w-96 ${activeMatchId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-ink/10 bg-white">
          <h2 className="text-xl font-serif text-ink font-bold">Conversations</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm font-bold text-ink">No active matches yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/5">
              {matches.map(m => {
                const isActive = m.matchId === activeMatchId;
                const matchMsgs = messages[m.matchId] || [];
                const lastMsg = matchMsgs[matchMsgs.length - 1];
                
                return (
                  <li
                    key={m.matchId}
                    onClick={() => setActiveMatchId(m.matchId)}
                    className={`flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-slate-100 ${isActive ? "bg-slate-100 border-l-4 border-l-brand-600" : "border-l-4 border-l-transparent"}`}
                  >
                    <img
                      src={getProfileImageSrc(m.user.image, m.user.name, 48)}
                      alt={m.user.name}
                      loading="lazy"
                      onError={e => handleImageError(e, m.user.name)}
                      className="h-12 w-12 rounded-full object-cover shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-baseline">
                        <p className="truncate font-bold text-ink text-sm">{m.user.name}</p>
                        {lastMsg && (
                          <span className="text-[0.65rem] text-muted flex-shrink-0">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted truncate">
                        {typingUsers[m.matchId] ? (
                          <span className="text-brand-600 italic">Typing...</span>
                        ) : lastMsg ? (
                          <span>{lastMsg.senderId === user?._id ? "You: " : ""}{lastMsg.text}</span>
                        ) : (
                          "Start the conversation 👋"
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex-col bg-white ${!activeMatchId ? "hidden md:flex" : "flex"}`}>
        {!activeMatch ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted">
            <span className="text-4xl mb-4">💌</span>
            <p className="text-lg">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-ink/10 bg-slate-50 p-3 sm:p-4 shadow-sm z-30 relative">
              <button 
                onClick={() => setActiveMatchId(null)}
                className="md:hidden p-2 text-muted hover:text-ink rounded-full hover:bg-black/5"
              >
                ←
              </button>
              <img
                src={getProfileImageSrc(activeMatch.user.image, activeMatch.user.name, 40)}
                alt={activeMatch.user.name}
                loading="lazy"
                onError={e => handleImageError(e, activeMatch.user.name)}
                className="h-10 w-10 rounded-full object-cover shadow-sm"
              />
              <div className="flex-1">
                <strong className="text-sm text-ink">{activeMatch.user.name}</strong>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <p className="text-[0.65rem] text-emerald-600 font-medium">End-to-End Encrypted</p>
                </div>
              </div>

              {/* Match Management Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-muted hover:text-ink rounded-full hover:bg-black/5"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-ink/10 py-1 z-20">
                      <button onClick={() => triggerManageAction("archive")} className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-slate-50 transition-colors">Archive Chat</button>
                      <button onClick={() => triggerManageAction("unmatch")} className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors">Unmatch</button>
                      <button onClick={() => triggerManageAction("block")} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Block User</button>
                      <button onClick={() => triggerManageAction("report")} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-bold">Report User</button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 relative">
              {/* Add a subtle background pattern for the chat area */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23181d27\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
              
              {loadingHistory ? (
                <div className="flex justify-center p-4"><Spinner /></div>
              ) : (
                <div className="flex flex-col gap-4 relative z-10">
                  <div className="text-center my-4">
                    <span className="bg-amber-100 text-amber-800 text-[0.65rem] px-3 py-1 rounded-full font-medium shadow-sm">
                      🔒 Messages are end-to-end encrypted. Nobody outside of this chat, not even Knot of Love, can read them.
                    </span>
                  </div>
                  {(messages[activeMatchId] || []).map((m, idx, arr) => {
                    const isMe = m.senderId === user?._id;
                    const isLast = idx === arr.length - 1;
                    return (
                      <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] md:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${isMe ? "bg-brand-600 text-white rounded-br-sm" : "bg-white border border-ink/5 text-ink rounded-bl-sm"}`}>
                          <p className="leading-relaxed">{m.text}</p>
                          <div className={`flex items-center gap-1 mt-1 text-[0.65rem] ${isMe ? "text-white/80 justify-end" : "text-muted justify-start"}`}>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            {isMe && (
                              <span className={m.isRead ? "text-emerald-300" : ""}>{m.isRead ? "✓✓" : "✓"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingUsers[activeMatchId] && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-ink/5 text-muted px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm shadow-sm italic flex items-center gap-1">
                        Typing<span className="animate-bounce">.</span><span className="animate-bounce" style={{animationDelay: '100ms'}}>.</span><span className="animate-bounce" style={{animationDelay: '200ms'}}>.</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Quick Replies */}
            {!(messages[activeMatchId] && messages[activeMatchId].length > 0) && (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border-t border-ink/5">
                {QUICK.map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => send(q)} 
                    disabled={sending}
                    className="text-xs px-3 py-1.5 rounded-full border border-brand-600/30 text-brand-600 bg-white hover:bg-brand-50 transition-colors font-medium shadow-sm"
                  >
                    {q.slice(0, 30)}...
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <div className="border-t border-ink/10 bg-white p-3 sm:p-4 flex gap-3 items-end">
              <div className="flex-1 bg-slate-50 border border-ink/10 rounded-2xl flex items-center pr-2 focus-within:border-brand-600/50 focus-within:bg-white transition-colors shadow-inner">
                <textarea
                  value={text}
                  onChange={handleTyping}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type an encrypted message..."
                  maxLength={500}
                  className="flex-1 max-h-32 min-h-[48px] resize-none bg-transparent p-3 text-sm outline-none"
                  rows={1}
                />
              </div>
              <button
                onClick={() => send()}
                disabled={sending || !text.trim()}
                className="h-[48px] px-6 rounded-2xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
              >
                {sending ? <Spinner className="w-4 h-4 border-white border-t-brand-600" /> : null}
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-ink mb-2">
              {confirmAction === "archive" ? "Archive Conversation?" :
               confirmAction === "unmatch" ? "Unmatch User?" :
               confirmAction === "block" ? "Block User?" :
               "Report User"}
            </h3>
            <p className="text-sm text-muted mb-4">
              {confirmAction === "archive" ? "This will hide the conversation from your active list." :
               confirmAction === "unmatch" ? "You will no longer be matched with this person." :
               confirmAction === "block" ? "You will not see them, and they will not see you." :
               "Please describe the inappropriate behavior."}
            </p>
            
            {confirmAction === "report" && (
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for reporting..."
                className="w-full p-3 border border-ink/10 rounded-xl mb-4 text-sm focus:outline-none focus:border-brand-600 resize-none h-24"
              />
            )}
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-bold text-muted hover:bg-black/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeManageAction}
                className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors ${
                  confirmAction === "archive" ? "bg-ink hover:bg-ink/80" : 
                  "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmAction === "report" ? "Submit Report" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

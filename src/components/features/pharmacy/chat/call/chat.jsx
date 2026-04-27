// Chat.jsx — Clinic Assistant · Fullscreen Black & White Theme (Fixed for navbar)
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import Vapi from "@vapi-ai/web";

const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// CALL MODAL - Black & White Theme
// ─────────────────────────────────────────────────────────────────────────────
function CallModal({ userId, onClose }) {
  const [callActive, setCallActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [callId, setCallId] = useState(null);
  const [volume, setVolume] = useState(0);
  const hasSavedRef = useRef(false);
  const transcriptRef = useRef(null);

  const userEmail = localStorage.getItem("emailAdress") || "Unknown Email";
  const userName = localStorage.getItem("user_name") || userEmail.split("@")[0] || "Unknown";

  useEffect(() => {
    if (transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcripts]);

  useEffect(() => {
    const onStart = () => {
      setCallActive(true);
      setLoading(false);
      setTranscripts([]);
      hasSavedRef.current = false;
    };

    const onEnd = async () => {
      setCallActive(false);
      setLoading(false);
      setVolume(0);

      if (!hasSavedRef.current && userId && transcripts.length > 0) {
        const payload = {
          call_id: callId,
          user_id: userId,
          email: userEmail,
          name: userName,
          messages: [...transcripts, { role: "system", content: "Call ended" }],
          timestamp: new Date().toISOString(),
          title: `Call ${new Date().toLocaleString()}`,
        };
        try {
          await fetch(`${import.meta.env.VITE_AUTH_API}/call-history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (err) {
          console.error("Save call error:", err);
        }
        hasSavedRef.current = true;
      }
      setTranscripts(prev => [...prev, { role: "system", content: "Call ended" }]);
    };

    const onMessage = (msg) => {
      if (msg.type === "transcript")
        setTranscripts(prev => [...prev, { role: msg.role, content: msg.transcript }]);
    };

    const onVolumeLevel = (v) => setVolume(v);

    vapi.on("call-start", onStart);
    vapi.on("call-end", onEnd);
    vapi.on("message", onMessage);
    vapi.on("volume-level", onVolumeLevel);

    return () => {
      vapi.off("call-start", onStart);
      vapi.off("call-end", onEnd);
      vapi.off("message", onMessage);
      vapi.off("volume-level", onVolumeLevel);
    };
  }, [userId, transcripts, callId, userEmail, userName]);

  const startCall = async () => {
    setLoading(true);
    try {
      const call = await vapi.start(import.meta.env.VITE_ASSISTANT_ID, {
        metadata: { user_email: userEmail, user_name: userName, user_id: userId },
      });
      if (!call?.id) {
        setLoading(false);
        return;
      }
      setCallId(call.id);
      try {
        await fetch(`${import.meta.env.VITE_AUTH_API}/webhook/call-start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ call_id: call.id, email: userEmail, user_name: userName, user_id: userId }),
        });
      } catch (_) { }
    } catch (err) {
      console.error("Start call error:", err);
      setLoading(false);
    }
  };

  const endCall = () => {
    vapi.stop();
    setVolume(0);
  };
  
  const handleClose = () => {
    if (callActive) endCall();
    onClose();
  };
  
  const ringScale = 1 + volume * 1.5;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.92, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 24, stiffness: 350 }}
        style={{
          position: "relative",
          background: "#ffffff",
          borderRadius: "32px",
          width: "500px",
          maxWidth: "90vw",
          padding: "32px 28px 36px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <button
          onClick={handleClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: "20px",
            right: "22px",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#6b7280",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          ×
        </button>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", letterSpacing: "3px", fontWeight: 700, textTransform: "uppercase" }}>
            Voice Assistant
          </span>
          <h3 style={{ color: "#1f2937", fontSize: "26px", fontWeight: 700, marginTop: "8px", fontFamily: "'Sora', sans-serif" }}>
            {callActive ? "🎙️ Live Session" : loading ? "🔮 Connecting..." : "Clinic Voice AI"}
          </h3>
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "20px 0 24px" }}>
          <div style={{ position: "relative", width: "140px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {callActive && (
              <>
                <motion.div
                  animate={{ scale: ringScale, opacity: Math.max(0, 0.2 - volume * 0.1) }}
                  transition={{ duration: 0.08 }}
                  style={{
                    position: "absolute",
                    width: "140px",
                    height: "140px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.02))",
                  }}
                />
                <motion.div
                  animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.05, 0.15] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    width: "110px",
                    height: "110px",
                    borderRadius: "50%",
                    background: "rgba(0, 0, 0, 0.05)",
                  }}
                />
              </>
            )}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: callActive ? "#000000" : "#f3f4f6",
                border: callActive ? "2px solid #000000" : "2px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "38px",
                color: callActive ? "#ffffff" : "#6b7280",
              }}
            >
              {callActive ? "🎤" : loading ? "⏳" : "📞"}
            </div>
          </div>
        </div>

        <div
          ref={transcriptRef}
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "16px",
            height: "170px",
            overflowY: "auto",
            marginBottom: "28px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            lineHeight: 1.6,
            color: "#374151",
          }}
        >
          {transcripts.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", paddingTop: "50px" }}>
              ✨ Conversation will appear here...
            </div>
          ) : (
            transcripts.map((t, i) => (
              <p key={i} style={{ marginBottom: "10px", color: t.role === "user" ? "#000000" : t.role === "assistant" ? "#4b5563" : "#9ca3af" }}>
                <strong>{t.role === "user" ? "You" : t.role === "assistant" ? "AI" : "system"}:</strong> {t.content}
              </p>
            ))
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          {!callActive ? (
            <button
              onClick={startCall}
              disabled={loading}
              style={{
                padding: "14px 44px",
                borderRadius: "60px",
                border: "none",
                background: loading ? "#f3f4f6" : "#000000",
                color: loading ? "#9ca3af" : "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "⏳ Starting..." : "▶ Start Call"}
            </button>
          ) : (
            <button
              onClick={endCall}
              style={{
                padding: "14px 44px",
                borderRadius: "60px",
                border: "none",
                background: "#dc2626",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ⏹ End Call
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CHAT - FULLSCREEN BLACK & WHITE WITH NAVBAR OFFSET
// ─────────────────────────────────────────────────────────────────────────────
export default function Chat({ userId: userIdProp }) {
  const userId = userIdProp || localStorage.getItem("userId") || localStorage.getItem("user_id");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([]);
  const [showCall, setShowCall] = useState(false);
  const [error, setError] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);

  const historyId = useRef(uuidv4());
  const chatBoxRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (document.getElementById("clinic-fonts")) return;
    const link = document.createElement("link");
    link.id = "clinic-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const token = localStorage.getItem("token");
    const email = localStorage.getItem("emailAddress") || "";
    const uName = localStorage.getItem("user_name") || null;
    const apiBase = import.meta.env.VITE_AUTH_API;

    if (!userId) {
      setError("No userId provided — make sure you are logged in.");
      return;
    }

    const userMsg = {
      id: `${Date.now()}-${Math.random()}`,
      role: "user",
      content: message.trim(),
    };
    setChat((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);
    setError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const typingId = `typing-${Date.now()}`;
    setChat((prev) => [...prev, { id: typingId, role: "assistant", content: "__typing__" }]);

    try {
      const headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        message: userMsg.content,
        email,
        userName: uName,
        assistantId: "0b7a0fdb-2b48-46bf-b743-04104c2233a7",
        chatId: currentChatId ? String(currentChatId) : null,
        historyId: historyId.current,
      };

      const res = await fetch(`${apiBase}/chat?user_id=${userId}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text.slice(0, 120)}`);
      }

      const data = await res.json();

      setChat((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { id: `${Date.now()}-${Math.random()}`, role: "assistant", content: data.reply }
            : m
        )
      );

      if (data.chatId) setCurrentChatId(data.chatId);
    } catch (err) {
      console.error("sendMessage error:", err);
      setError(err.message);
      setChat((prev) => prev.filter((m) => m.id !== typingId));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading && message.trim()) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setChat([]);
    setCurrentChatId(null);
    historyId.current = uuidv4();
    setError(null);
  };

  const chips = ["Book an appointment", "Medication query", "Lab results", "General advice"];

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        background: "#ffffff",
        fontFamily: "'DM Sans', sans-serif",
        // IMPORTANT: Push content down if you have a navbar at top
        // Change this value to match your navbar height (e.g., "60px", "70px")
        paddingTop: "70px", // <-- ADJUST THIS TO YOUR NAVBAR HEIGHT
        boxSizing: "border-box",
      }}
    >
      {/* HEADER with CALL BUTTON - Now visible below navbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 28px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
          // Fix header at top below navbar
          position: "absolute",
          top: "70px", // Match paddingTop above
          left: 0,
          right: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "18px",
              background: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            🏥
          </div>
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#1f2937",
                fontFamily: "'Sora', sans-serif",
                lineHeight: 1.2,
              }}
            >
              Clinic Assistant
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "3px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                }}
              />
              Online · Ready to help
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {chat.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                padding: "10px 18px",
                borderRadius: "100px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#6b7280",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              🗑 Clear
            </button>
          )}
          {/* CALL BUTTON - VISIBLE NOW */}
          <button
            onClick={() => setShowCall(true)}
            style={{
              padding: "10px 24px",
              borderRadius: "100px",
              border: "none",
              background: "#000000",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📞 Voice Call
          </button>
        </div>
      </div>

      {/* MESSAGES AREA - With top margin to account for fixed header */}
      <div
        ref={chatBoxRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px",
          background: "#ffffff",
          minHeight: 0,
          marginTop: "80px", // Space for fixed header
        }}
      >
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "14px",
              padding: "12px 18px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#dc2626",
            }}
          >
            ⚠️ {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#dc2626",
                fontSize: "18px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {chat.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              textAlign: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "28px",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
              }}
            >
              💬
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#1f2937",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              How can I help?
            </div>
            <div
              style={{
                fontSize: "15px",
                color: "#6b7280",
                maxWidth: "280px",
                lineHeight: 1.6,
              }}
            >
              Ask me anything or start a voice call with your clinic assistant.
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: "12px",
              }}
            >
              {chips.map((s) => (
                <button
                  key={s}
                  onClick={() => setMessage(s)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "100px",
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    color: "#000000",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {chat.map((msg, i) => (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.26 }}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "18px",
                  alignItems: "flex-end",
                  gap: "10px",
                }}
              >
                {msg.role === "assistant" && msg.content !== "__typing__" && (
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "12px",
                      flexShrink: 0,
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    🏥
                  </div>
                )}

                {msg.content === "__typing__" ? (
                  <div
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "24px 24px 24px 8px",
                      padding: "14px 22px",
                    }}
                  >
                    <span style={{ display: "flex", gap: "5px", alignItems: "center", height: "20px" }}>
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#9ca3af",
                            display: "inline-block",
                            animation: "typingBounce 1.2s infinite",
                            animationDelay: `${d}ms`,
                          }}
                        />
                      ))}
                    </span>
                  </div>
                ) : (
                  <div
                    style={
                      msg.role === "user"
                        ? {
                            maxWidth: "72%",
                            background: "#000000",
                            color: "#ffffff",
                            borderRadius: "24px 24px 8px 24px",
                            padding: "12px 20px",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                          }
                        : {
                            maxWidth: "72%",
                            background: "#f3f4f6",
                            color: "#1f2937",
                            borderRadius: "24px 24px 24px 8px",
                            padding: "12px 20px",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            border: "1px solid #e5e7eb",
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                          }
                    }
                  >
                    {msg.content}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* INPUT AREA - Fixed at bottom */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "12px",
          padding: "18px 28px 24px",
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type your message… (Enter to send)"
          value={message}
          disabled={loading}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKey}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          style={{
            flex: 1,
            border: "1.5px solid #e5e7eb",
            borderRadius: "24px",
            padding: "13px 20px",
            fontSize: "14px",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.5,
            resize: "none",
            outline: "none",
            background: "#ffffff",
            color: "#1f2937",
            maxHeight: "120px",
            overflowY: "auto",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#000000";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e5e7eb";
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !message.trim()}
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "18px",
            border: "none",
            background: loading || !message.trim() ? "#f3f4f6" : "#000000",
            color: loading || !message.trim() ? "#d1d5db" : "#ffffff",
            fontSize: "22px",
            cursor: loading || !message.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {loading ? "⏳" : "➤"}
        </button>
      </div>

      <style>
        {`
          @keyframes typingBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-6px); opacity: 1; }
          }
        `}
      </style>

      {/* Call Modal Popup */}
      <AnimatePresence>
        {showCall && <CallModal userId={userId} onClose={() => setShowCall(false)} />}
      </AnimatePresence>
    </div>
  );
}
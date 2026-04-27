import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { motion } from "framer-motion";

// Initialize Vapi with public key from .env
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export default function Calls({ userId, userEmail, userName, darkMode, onClose }) {
  const [callActive, setCallActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [callId, setCallId] = useState(null);
  const transcriptBoxRef = useRef(null);
  const hasSavedRef = useRef(false);

  // Scroll transcripts automatically
  useEffect(() => {
    if (transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight;
    }
  }, [transcripts]);

  // VAPI event handlers
  useEffect(() => {
    const handleCallStart = () => {
      setCallActive(true);
      setLoading(false);
      setTranscripts([{ role: "system", content: "✅ Call started" }]);
      hasSavedRef.current = false;
    };

    const handleCallEnd = async () => {
      setCallActive(false);
      setLoading(false);

      const email = userEmail || localStorage.getItem("user_email") || "Unknown Email";
      const name = userName || localStorage.getItem("user_name") || email.split("@")[0] || "Unknown User";

      if (!hasSavedRef.current && userId && transcripts.length > 0) {
        const newCall = {
          call_id: callId,
          user_id: userId,
          email,
          name,
          messages: [...transcripts, { role: "system", content: "❌ Call ended" }],
          timestamp: new Date().toISOString(),
          title: `Call ${new Date().toLocaleString()}`,
        };

        // Save to backend MongoDB
        try {
          const res = await fetch(`${import.meta.env.VITE_AUTH_API}/call-history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newCall),
          });

          if (!res.ok) console.error("Failed to save call history");
          else console.log("✅ Call history saved to backend");
        } catch (err) {
          console.error("Error saving call history:", err);
        }

        hasSavedRef.current = true;
      }

      setTranscripts(prev => [...prev, { role: "system", content: "❌ Call ended" }]);
    };

    const handleMessage = (message) => {
      if (message.type === "transcript") {
        setTranscripts(prev => [...prev, { role: message.role, content: message.transcript }]);
      }
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("message", handleMessage);
    };
  }, [userId, userEmail, userName, transcripts, callId]);

  // Start call
  const startCall = async () => {
    setLoading(true);
    const email = userEmail || localStorage.getItem("user_email") || "Unknown Email";
    const name = userName || localStorage.getItem("user_name") || email.split("@")[0] || "Unknown User";

    try {
      const call = await vapi.start(import.meta.env.VITE_ASSISTANT_ID, {
        metadata: { user_email: email, user_name: name, user_id: userId },
      });

      if (!call || !call.id) {
        console.error("Failed to get call ID from VAPI");
        setLoading(false);
        return;
      }

      setCallId(call.id);

      // Save call start to backend
      try {
        const res = await fetch(`${import.meta.env.VITE_AUTH_API}/webhook/call-start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ call_id: call.id, email, user_name: name, user_id: userId }),
        });

        if (!res.ok) console.error("Failed to save call start data");
      } catch (err) {
        console.error("Error saving call start:", err);
      }

    } catch (err) {
      console.error("Error starting call:", err);
    } finally {
      setLoading(false);
    }
  };

  const endCall = () => {
    vapi.stop();
    setLoading(false);
  };

  const handleClose = () => {
    if (callActive) endCall();
    onClose();
  };

  return (
    <motion.div
      className="call-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="call-box">
        <div className="call-header">
          <h2>🎤 Voice Assistant</h2>
          <button className="close-btn" onClick={handleClose} disabled={loading}>✕</button>
        </div>
        <div id="transcripts" ref={transcriptBoxRef} className="transcript-box">
          {transcripts.length === 0 ? (
            <em>Transcripts will appear here...</em>
          ) : (
            transcripts.map((t, i) => (
              <p
                key={i}
                className={t.role === "user" ? "user" : t.role === "assistant" ? "assistant" : "system"}
              >
                {t.role === "user" ? "You" : t.role === "assistant" ? "Assistant" : ""}: {t.content}
              </p>
            ))
          )}
        </div>
        <div className="call-buttons">
          {!callActive ? (
            <button className="start-btn" onClick={startCall} disabled={loading}>
              {loading ? "⏳ Starting..." : "▶️ Start Call"}
            </button>
          ) : (
            <button className="end-btn" onClick={endCall} disabled={loading}>⏹ End Call</button>
          )}
        </div>
      </div>

      <style>{`
        .call-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .call-box { background: white; border-radius: 16px; padding: 20px; width: 400px; max-width: 90%; box-shadow: 0 8px 30px rgba(0,0,0,0.2); text-align: center; position: relative; }
        .call-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .close-btn { background: #e53935; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; }
        .close-btn:disabled { background: #cccccc; cursor: not-allowed; }
        .transcript-box { margin: 20px 0; padding: 10px; border: 1px solid #ccc; height: 200px; overflow-y: auto; background: #f9f9f9; text-align: left; }
        .user { color: blue; }
        .assistant { color: green; }
        .system { color: gray; font-style: italic; }
        .call-buttons { display: flex; justify-content: space-around; margin-top: 15px; }
        .start-btn { background: #4caf50; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; }
        .start-btn:disabled { background: #cccccc; cursor: not-allowed; }
        .end-btn { background: #e53935; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; }
        .end-btn:disabled { background: #cccccc; cursor: not-allowed; }
      `}</style>
    </motion.div>
  );
}
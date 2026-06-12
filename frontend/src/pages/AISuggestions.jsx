import { useState } from "react";
import { Link } from "react-router-dom";

export default function AISuggestions() {
  const [eventType, setEventType] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Enter event details to get AI-powered suggestions for free!");

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatStatus, setChatStatus] = useState("Ask our AI assistant anything about planning your event! (Powered by free Groq AI)");

  const eventTypes = [
    "Club meetup",
    "Study session",
    "Campus social",
    "Workshop",
    "Hackathon",
    "Sports event",
    "Concert",
    "Conference",
    "Networking event",
    "Game night",
    "Career fair",
    "Other"
  ];

  async function generateSuggestions() {
    if (!eventType || !eventDetails.trim()) {
      setMessage("Please select an event type and enter details.");
      return;
    }

    setLoading(true);
    setMessage("Generating AI suggestions...");
    setSuggestions(null);

    try {
      const res = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I'm planning a ${eventType} with these details: ${eventDetails}. Please suggest: 1) An engaging event title 2) A compelling description 3) Key talking points 4) A catchy tagline. Format with clear sections.`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || data.message || "Failed to generate suggestions";
        const helpMsg = data.help ? `\n\n💡 ${data.help}` : "";
        throw new Error(errorMsg + helpMsg);
      }

      setSuggestions(data.response);
      setMessage("Here are your AI-powered event suggestions!");
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message || "Unable to generate suggestions."}`);
    } finally {
      setLoading(false);
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim()) {
      return;
    }

    const userMsg = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoadingChat(true);
    setChatStatus("Thinking...");

    try {
      const res = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || data.message || "Failed to get response";
        const helpMsg = data.help ? `\n\n💡 ${data.help}` : "";
        throw new Error(errorMsg + helpMsg);
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      setChatStatus("");
    } catch (err) {
      console.error(err);
      const errorMsg = `❌ ${err.message || "Unable to process your message."}`;
      setChatStatus(errorMsg);
      setChatMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setLoadingChat(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>✨ Free AI Event Planner</h1>
        <p style={styles.subtitle}>Get AI-powered suggestions for your campus events completely free!</p>
      </div>

      <div style={styles.container}>
        {/* Event Suggestions Generator */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🎯 Event Planning Ideas</h2>
          <p style={styles.cardDesc}>Tell us about your event and get AI suggestions for titles, descriptions, and themes.</p>

          <div style={styles.section}>
            <label style={styles.label}>Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              style={styles.select}
            >
              <option value="">Select event type</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Event Details (what makes it special?)</label>
            <textarea
              value={eventDetails}
              onChange={(e) => setEventDetails(e.target.value)}
              placeholder="e.g., Beginner-friendly coding workshop for first-years, 50 people expected, outdoors in the quad..."
              style={styles.textarea}
            />
          </div>

          <button
            style={styles.button}
            onClick={generateSuggestions}
            disabled={loading || !eventType || !eventDetails.trim()}
          >
            {loading ? "Generating..." : "Get Suggestions"}
          </button>

          <p style={styles.message}>{message}</p>

          {suggestions && (
            <div style={styles.suggestionBox}>
              <h4 style={styles.boxTitle}>AI Suggestions:</h4>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "#374151", fontSize: "0.95rem" }}>
                {suggestions}
              </div>
            </div>
          )}
        </div>

        {/* AI Chatbot */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>💬 Event Planning Expert</h2>
          <p style={styles.cardDesc}>Ask anything about planning your event. Our AI is here to help!</p>

          <div style={styles.chatContainer}>
            <div style={styles.chatBox}>
              {chatMessages.length === 0 ? (
                <div style={styles.chatPlaceholder}>
                  <p>💡 Try asking:</p>
                  <ul style={{ textAlign: "left", color: "#6b7280" }}>
                    <li>"How many people should I invite?"</li>
                    <li>"What time is best for a study session?"</li>
                    <li>"How do I promote my event?"</li>
                    <li>"What should I serve at my event?"</li>
                  </ul>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} style={msg.role === "user" ? styles.userMessage : styles.assistantMessage}>
                    <div
                      style={{
                        ...styles.messageBubble,
                        background: msg.role === "user" ? "#dc2626" : "#e5e7eb",
                        color: msg.role === "user" ? "white" : "#111827"
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {loadingChat && (
                <div style={styles.assistantMessage}>
                  <div style={{ ...styles.messageBubble, background: "#e5e7eb", color: "#111827" }}>
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div style={styles.chatInput}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about event planning..."
                style={styles.chatInputField}
                onKeyPress={(e) => e.key === "Enter" && !loadingChat && sendChatMessage()}
                disabled={loadingChat}
              />
              <button
                style={styles.sendButton}
                onClick={sendChatMessage}
                disabled={loadingChat || !chatInput.trim()}
              >
                Send
              </button>
            </div>
          </div>

          <p style={styles.message}>{chatStatus}</p>
        </div>
      </div>

      <div style={styles.footer}>
        <Link to="/events" style={styles.linkButton}>Browse Events</Link>
        <Link to="/ai-assistant" style={styles.linkButton}>Advanced AI Tools</Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "40px 24px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  header: {
    marginBottom: "40px",
    textAlign: "center"
  },
  title: {
    margin: 0,
    fontSize: "2.4rem",
    marginBottom: "10px"
  },
  subtitle: {
    color: "#475569",
    fontSize: "1.05rem",
    margin: 0
  },
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "40px"
  },
  card: {
    background: "white",
    padding: "28px",
    borderRadius: "18px",
    boxShadow: "0 18px 50px rgba(15,23,42,0.08)"
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: "1.4rem"
  },
  cardDesc: {
    color: "#475569",
    marginBottom: "20px",
    fontSize: "0.95rem"
  },
  section: {
    marginBottom: "18px"
  },
  label: {
    display: "block",
    marginBottom: "10px",
    fontWeight: 700,
    color: "#334155"
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontSize: "1rem",
    boxSizing: "border-box"
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontSize: "1rem",
    minHeight: "100px",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box"
  },
  button: {
    border: "none",
    background: "#dc2626",
    color: "white",
    padding: "12px 22px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 700,
    marginBottom: "16px"
  },
  message: {
    marginTop: "10px",
    color: "#334155",
    fontWeight: 500,
    fontSize: "0.95rem"
  },
  suggestionBox: {
    marginTop: "20px",
    padding: "18px",
    background: "#f8fafc",
    borderRadius: "14px",
    border: "1px solid #e5e7eb"
  },
  boxTitle: {
    margin: "0 0 12px",
    fontSize: "1rem"
  },
  chatContainer: {
    display: "flex",
    flexDirection: "column",
    height: "500px"
  },
  chatBox: {
    flex: 1,
    overflow: "auto",
    marginBottom: "16px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  chatPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#94a3b8",
    textAlign: "center"
  },
  userMessage: {
    display: "flex",
    justifyContent: "flex-end"
  },
  assistantMessage: {
    display: "flex",
    justifyContent: "flex-start"
  },
  messageBubble: {
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: "14px",
    wordWrap: "break-word"
  },
  chatInput: {
    display: "flex",
    gap: "10px"
  },
  chatInputField: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontSize: "1rem"
  },
  sendButton: {
    border: "none",
    background: "#dc2626",
    color: "white",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 700
  },
  footer: {
    display: "flex",
    gap: "12px",
    justifyContent: "center"
  },
  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 22px",
    borderRadius: "12px",
    background: "#fde8ea",
    color: "#991b1b",
    textDecoration: "none",
    fontWeight: 700
  }
};

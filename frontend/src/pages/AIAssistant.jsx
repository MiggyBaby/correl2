import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AIAssistant() {
  const [eventName, setEventName] = useState("");
  const [descriptions, setDescriptions] = useState(null);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [descMessage, setDescMessage] = useState("Enter an event name and let AI generate creative descriptions.");

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("Ask me anything about planning campus events! (Powered by free Groq AI)");

  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  async function generateDescriptions() {
    if (!eventName.trim()) {
      setDescMessage("Please enter an event name.");
      return;
    }

    setLoadingDesc(true);
    setDescMessage("Generating descriptions...");
    setDescriptions(null);

    try {
      const res = await fetch("http://localhost:5000/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_name: eventName })
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || data.message || "Failed to generate descriptions";
        const helpMsg = data.help ? `\n\n💡 ${data.help}` : "";
        throw new Error(errorMsg + helpMsg);
      }

      setDescriptions(data.descriptions);
      setDescMessage("Here are your AI-generated event descriptions!");
    } catch (err) {
      console.error(err);
      setDescMessage(`❌ ${err.message || "Unable to generate descriptions. Check that OpenAI API is configured."}`);
    } finally {
      setLoadingDesc(false);
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
    setChatMessage("Thinking...");

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
      setChatMessage("");
    } catch (err) {
      console.error(err);
      const errorMsg = `❌ ${err.message || "Unable to process your message. Check that OpenAI API is configured."}`;
      setChatMessage(errorMsg);
      setChatMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setLoadingChat(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Schedula AI Helper</h1>
        <p style={styles.subtitle}>Generate event descriptions and chat with our AI assistant.</p>
      </div>

      <div style={styles.container}>
        {/* Event Description Generator */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🎯 Event Description Generator</h2>
          <p style={styles.cardSubtitle}>Enter an event name and AI will generate creative descriptions for you.</p>

          <div style={styles.section}>
            <label style={styles.label}>Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Campus Hackathon 2024"
              style={styles.input}
              onKeyPress={(e) => e.key === "Enter" && generateDescriptions()}
            />
          </div>

          <button
            style={styles.button}
            onClick={generateDescriptions}
            disabled={loadingDesc || !eventName.trim()}
          >
            {loadingDesc ? "Generating..." : "Generate Descriptions"}
          </button>

          <p style={styles.message}>{descMessage}</p>

          {descriptions && (
            <div style={styles.descriptionBox}>
              <h4 style={styles.boxTitle}>Generated Descriptions:</h4>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "#374151", fontSize: "0.95rem" }}>
                {descriptions}
              </div>
            </div>
          )}
        </div>

        {/* AI Chatbot */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>💬 Event Planning Assistant</h2>
          <p style={styles.cardSubtitle}>Ask me anything about planning events and campus activities!</p>

          <div style={styles.chatContainer}>
            <div style={styles.chatBox}>
              {chatMessages.length === 0 ? (
                <div style={styles.chatPlaceholder}>
                  <p>No messages yet. Start by asking a question!</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} style={msg.role === "user" ? styles.userMessage : styles.assistantMessage}>
                    <div style={{
                      ...styles.messageBubble,
                      background: msg.role === "user" ? "#dc2626" : "#e5e7eb",
                      color: msg.role === "user" ? "white" : "#111827"
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {loadingChat && (
                <div style={styles.assistantMessage}>
                  <div style={{ ...styles.messageBubble, background: "#e5e7eb", color: "#111827" }}>Thinking...</div>
                </div>
              )}
            </div>

            <div style={styles.chatInput}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me about event planning..."
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

          <p style={styles.message}>{chatMessage}</p>
        </div>
      </div>

      <div style={styles.footer}>
        <Link to="/events" style={styles.linkButton}>Browse Events</Link>
        {user && <Link to="/admin" style={styles.linkButton}>Dashboard</Link>}
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
  cardSubtitle: {
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
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontSize: "1rem",
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
  descriptionBox: {
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

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function signup() {
    try {
      const res = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Unable to register. Please try again.");
        return;
      }

      navigate("/login");
    } catch {
      setError("Unable to connect. Please try again.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={styles.pill}>Create your account</span>
        <h1 style={styles.title}>Join Schedula</h1>
        <p style={styles.subtitle}>Start managing events, attendees, and reminders in one platform.</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>Name</label>
        <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />

        <label style={styles.label}>Email</label>
        <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />

        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />

        <button style={styles.button} onClick={signup}>Register</button>

        <p style={styles.footerText}>
          Already have an account? <Link to="/login" style={styles.link}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px"
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    background: "white",
    borderRadius: "28px",
    padding: "40px",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.08)"
  },
  pill: {
    display: "inline-block",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "999px",
    padding: "8px 16px",
    fontWeight: 700,
    marginBottom: "22px"
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    lineHeight: 1.1,
    marginBottom: "12px"
  },
  subtitle: {
    margin: 0,
    marginBottom: "28px",
    color: "#475569"
  },
  label: {
    display: "block",
    fontWeight: 700,
    marginBottom: "10px",
    marginTop: "16px",
    color: "#334155"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    marginBottom: "8px",
    fontSize: "1rem"
  },
  button: {
    marginTop: "20px",
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "none",
    background: "#dc2626",
    color: "white",
    fontWeight: 700,
    cursor: "pointer"
  },
  footerText: {
    marginTop: "24px",
    color: "#6b7280"
  },
  link: {
    color: "#dc2626",
    fontWeight: 700
  },
  error: {
    marginBottom: "18px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#fee2e2",
    color: "#991b1b"
  }
};



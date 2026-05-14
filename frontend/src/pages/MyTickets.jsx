import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("admin@eventsys.com");
  const [password, setPassword] = useState("admin123");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("eventsys_user", JSON.stringify(data.user));
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/my-tickets");
      }
    } else {
      setMessage(data.message || "Login failed.");
    }
  }

  return (
    <div style={{ padding: "40px", maxWidth: "500px", margin: "0 auto" }}>
      <div style={styles.card}>
        <h1>Login</h1>
        <p>Default admin: admin@eventsys.com / admin123</p>
        <p>Default user: user@eventsys.com / user123</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>Login</button>
        </form>

        {message && <p style={{ marginTop: "15px", color: "red", fontWeight: "bold" }}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    borderRadius: "6px",
    border: "1px solid #ccc"
  },
  button: {
    padding: "10px 20px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  }
};
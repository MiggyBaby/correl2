import { Link } from "react-router-dom";

export default function Home() {

  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <div style={{
      padding: "60px",
      textAlign: "center"
    }}>

      <h1>Manage Your Events Smarter</h1>

      <p style={{ marginTop: "10px", color: "#555" }}>
        Create events, manage registrations, verify payments,
        and track participants in one platform.
      </p>

      {/* BUTTONS */}
      <div style={{ marginTop: "30px" }}>

        <Link to="/events">
          <button style={btn}>Browse Events</button>
        </Link>

        {!user && (
          <>
            <Link to="/login">
              <button style={btn}>Login</button>
            </Link>

            <Link to="/signup">
              <button style={btn}>Register</button>
            </Link>
          </>
        )}

        {user && (
          <Link to="/admin">
            <button style={btn}>Go to Dashboard</button>
          </Link>
        )}

      </div>

    </div>
  );
}

const btn = {
  margin: "10px",
  padding: "12px 20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};


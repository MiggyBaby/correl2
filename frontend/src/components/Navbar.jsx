import { NavLink, useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";

export default function Navbar() {
  const navigate = useNavigate();
  useLocation();
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  function logout() {
    sessionStorage.removeItem("user");
    navigate("/");
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <Logo />
        <span style={styles.tagline}>Organize campus events, clubs, and study sessions</span>
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <NavLink to="/" style={styles.link}>Home</NavLink>
        <NavLink to="/events" style={styles.link}>Events</NavLink>
        <NavLink to="/ai-assistant" style={styles.link}>AI Assistant</NavLink>

        {/* SHOW ONLY IF LOGGED IN */}
        {user && (
          <>
            <NavLink to="/my-tickets" style={styles.link}>Tickets</NavLink>
            <NavLink to="/notifications" style={styles.link}>Notifications</NavLink>
            <NavLink to="/admin" style={styles.link}>Admin</NavLink>
          </>
        )}

        {/* AUTH BUTTONS */}
        {!user ? (
          <>
            <NavLink to="/login" style={styles.link}>Login</NavLink>
            <NavLink to="/signup" style={styles.link}>Register</NavLink>
          </>
        ) : (
          <>
            <span style={styles.user}>Hi, {user.name}</span>
            <button onClick={logout} style={styles.logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: "white",
    color: "#111827",
    padding: "18px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
    position: "sticky",
    top: 0,
    zIndex: 20
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "2px"
  },
  tagline: {
    fontSize: "0.85rem",
    color: "#6b7280"
  },
  link: {
    color: "#111827",
    marginLeft: "20px",
    textDecoration: "none",
    fontWeight: "600"
  },
  user: {
    marginLeft: "20px",
    fontWeight: "500"
  },
  logout: {
    marginLeft: "10px",
    padding: "8px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: 700
  }
};



import { NavLink, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  function logout() {
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <nav style={styles.nav}>
      <h2 style={{ margin: 0 }}>EventSys</h2>

      <div style={{ display: "flex", alignItems: "center" }}>
        <NavLink to="/" style={styles.link}>Home</NavLink>
        <NavLink to="/events" style={styles.link}>Events</NavLink>

        {/* SHOW ONLY IF LOGGED IN */}
        {user && (
          <>
            <NavLink to="/my-tickets" style={styles.link}>Tickets</NavLink>
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
    background: "#111827",
    color: "white",
    padding: "18px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)"
  },
  link: {
    color: "#f8fafc",
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
    borderRadius: "8px",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: 600
  }
};



import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(storedUser);
  }, []);

  function logout() {
    localStorage.removeItem("user");
    setUser(null);
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
          <NavLink to="/admin" style={styles.link}>Admin</NavLink>
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
    background: "#1f2937",
    color: "white",
    padding: "15px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  link: {
    color: "white",
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
    padding: "6px 12px",
    border: "none",
    borderRadius: "5px",
    background: "#ef4444",
    color: "white",
    cursor: "pointer"
  }
};



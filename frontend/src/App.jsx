import { NavLink } from "react-router-dom";


export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <h2 style={{ margin: 0 }}>EventSys</h2>
      <div>
        <NavLink to="/" style={styles.link}>Home</NavLink>
        <NavLink to="/events" style={styles.link}>Events</NavLink>
        <NavLink to="/admin" style={styles.link}>Admin</NavLink>
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
  }
};










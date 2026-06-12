import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.brand}>
        <div style={styles.logoBadge}>🗓️</div>
        <div>
          <h2 style={styles.brandTitle}>Schedula</h2>
          <p style={styles.brandText}>A student-friendly tool for planning campus events, group meetups, and reminders.</p>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.block}>
          <h3 style={styles.blockTitle}>Product</h3>
          <Link to="/events" style={styles.link}>Browse events</Link>
          <Link to="/my-tickets" style={styles.link}>My tickets</Link>
          <Link to="/admin" style={styles.link}>Admin dashboard</Link>
        </div>

        <div style={styles.block}>
          <h3 style={styles.blockTitle}>Company</h3>
          <a href="#" style={styles.link}>About Schedula</a>
          <a href="#" style={styles.link}>Careers</a>
          <a href="#" style={styles.link}>Contact</a>
        </div>

        <div style={styles.block}>
          <h3 style={styles.blockTitle}>Support</h3>
          <a href="#" style={styles.link}>Help center</a>
          <a href="#" style={styles.link}>Privacy</a>
          <a href="#" style={styles.link}>Terms</a>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    marginTop: "40px",
    padding: "14px 20px",
    background: "white",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  logoBadge: {
    width: "28px",
    height: "28px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #ef4444, #f97316)",
    display: "grid",
    placeItems: "center",
    color: "white",
    fontWeight: 800,
    fontSize: "0.85rem"
  },
  brandTitle: {
    margin: 0,
    fontSize: "1.1rem"
  },
  brandText: {
    margin: "4px 0 0",
    maxWidth: "380px",
    color: "#475569",
    fontSize: "0.8rem",
    lineHeight: 1.4
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px"
  },
  block: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  blockTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "0.95rem"
  },
  link: {
    color: "#6b7280",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "0.8rem"
  }
};

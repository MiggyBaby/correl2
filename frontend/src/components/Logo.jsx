export default function Logo() {
  return (
    <div style={styles.root}>
      <div style={styles.icon} aria-label="schedule planner">🗓️</div>
      <div style={styles.label}>Schedula</div>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  icon: {
    width: "44px",
    height: "44px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #ef4444, #fb7185)",
    color: "white",
    display: "grid",
    placeItems: "center",
    fontSize: "1.4rem",
    boxShadow: "0 10px 24px rgba(239, 68, 68, 0.18)"
  },
  label: {
    fontSize: "1.2rem",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "#111827"
  }
};

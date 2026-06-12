import { Link } from "react-router-dom";

export default function Home() {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <span style={styles.pill}>Schedula</span>
          <h1 style={styles.heading}>Plan campus events, club meetups, and study sessions in one place.</h1>
          <p style={styles.subheading}>
            Schedula helps students organize parties, group projects, club signups, and reminders with a friendly planner dashboard.
          </p>

          <div style={styles.heroActions}>
            <Link to="/events" style={styles.primaryButton}>Browse events</Link>
            {!user ? (
              <Link to="/signup" style={styles.secondaryButton}>Join Schedula</Link>
            ) : (
              <Link to="/admin" style={styles.secondaryButton}>Go to dashboard</Link>
            )}
          </div>

          <div style={styles.quickCards}>
            <div style={styles.quickCard}>
              <strong>Schedule</strong>
              <p>Plan club meetings, study sessions, and campus hangouts quickly.</p>

              <div style={styles.quickSubItems}>
                <div style={styles.quickSubCard}>
                  <h4 style={styles.quickSubTitle}>Organize</h4>
                  <p style={styles.quickSubText}>Keep attendees, times, and rooms in one place.</p>
                </div>
                <div style={styles.quickSubCard}>
                  <h4 style={styles.quickSubTitle}>Share</h4>
                  <p style={styles.quickSubText}>Send event updates and reminders to your group.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.heroVisual}>
          <div style={styles.heroPanel}>
            <div style={styles.heroPanelBadge}>Schedula Spotlight</div>
            <h2 style={styles.panelTitle}>The student planner for clubs and campus events.</h2>
            <p style={styles.panelSubtitle}>Organize group meetups, reminders, and event signups so everyone stays on the same page.</p>

            <div style={styles.panelGrid}>
              <div style={styles.panelStat}>
                <p style={styles.panelStatLabel}>Club meetups</p>
                <p style={styles.panelStatValue}>Host student club gatherings and hangouts.</p>
              </div>
              <div style={styles.panelStat}>
                <p style={styles.panelStatLabel}>Study sessions</p>
                <p style={styles.panelStatValue}>Organize study groups, revision slots, and project work.</p>
              </div>
              <div style={styles.panelStat}>
                <p style={styles.panelStatLabel}>Campus socials</p>
                <p style={styles.panelStatValue}>Plan socials, game nights, and campus events.</p>
              </div>
              <div style={styles.panelStat}>
                <p style={styles.panelStatLabel}>Project workshops</p>
                <p style={styles.panelStatValue}>Set up team sessions for assignments, hackathons, and rehearsals.</p>
              </div>
              <div style={styles.panelStat}>
                <p style={styles.panelStatLabel}>Tutoring circles</p>
                <p style={styles.panelStatValue}>Create study groups, peer tutoring, and exam prep meetups.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.showcaseSection}>
        <div style={styles.showcaseHeader}>
          <div>
            <p style={styles.smallHeading}>Student friendly</p>
            <h2 style={styles.showcaseTitle}>Perfect for campus clubs, project groups, and social plans.</h2>
          </div>
          <Link to="/events" style={styles.secondaryButton}>Browse all events</Link>
        </div>

        <div style={styles.showcaseGrid}>
          <div style={styles.newsCard}>
            <h3>Automated reminders</h3>
            <p>Send timely follow-ups and payment prompts without manual work.</p>
          </div>
          <div style={styles.newsCard}>
            <h3>Real-time attendance</h3>
            <p>Track check-ins and generate reports while attendees arrive.</p>
          </div>
          <div style={styles.newsCard}>
            <h3>Secure admin controls</h3>
            <p>Keep event publishing and approvals under your team’s control.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 24px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "24px",
    alignItems: "stretch",
    marginBottom: "32px"
  },
  heroContent: {
    padding: "48px",
    borderRadius: "28px",
    background: "white",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.08)",
    display: "flex",
    flexDirection: "column"
  },
  pill: {
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontWeight: 700,
    marginBottom: "20px"
  },
  heading: {
    fontSize: "3rem",
    lineHeight: 1.05,
    margin: "0 0 20px",
    color: "#111827"
  },
  subheading: {
    color: "#475569",
    fontSize: "1.05rem",
    lineHeight: 1.8,
    marginBottom: "28px"
  },
  heroActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "24px"
  },
  primaryButton: {
    background: "#dc2626",
    color: "white",
    padding: "14px 24px",
    borderRadius: "14px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButton: {
    background: "#f8fafc",
    color: "#111827",
    border: "1px solid #e5e7eb",
    padding: "14px 24px",
    borderRadius: "14px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  },
  heroVisual: {
    display: "grid",
    gap: "20px"
  },
  heroPanel: {
    padding: "32px",
    borderRadius: "28px",
    background: "linear-gradient(180deg, #fff1f2 0%, #fee2e2 100%)",
    border: "1px solid #f8c0c4",
    boxShadow: "0 20px 60px rgba(220, 38, 38, 0.09)"
  },
  heroPanelBadge: {
    display: "inline-block",
    marginBottom: "16px",
    padding: "10px 16px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 700,
    fontSize: "0.9rem"
  },
  panelTitle: {
    margin: "0 0 12px",
    fontSize: "1.8rem",
    color: "#111827",
    lineHeight: 1.2
  },
  panelSubtitle: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.75,
    marginBottom: "24px"
  },
  panelGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px"
  },
  panelStat: {
    padding: "24px",
    borderRadius: "24px",
    background: "white",
    border: "1px solid #f3e0e2",
    minHeight: "140px"
  },
  panelStatLabel: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 700,
    color: "#111827"
  },
  panelStatValue: {
    margin: "12px 0 0",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: "#475569"
  },
  quickCards: {
    display: "grid",
    gap: "16px"
  },
  quickCard: {
    padding: "24px",
    borderRadius: "24px",
    background: "white",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
    border: "1px solid #f2f4f7",
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    textAlign: "left"
  },
  quickSubItems: {
    display: "grid",
    gap: "14px",
    marginTop: "18px"
  },
  quickSubCard: {
    padding: "18px 20px",
    borderRadius: "20px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb"
  },
  quickSubTitle: {
    margin: 0,
    fontSize: "1rem",
    color: "#111827"
  },
  quickSubText: {
    margin: "8px 0 0",
    color: "#475569",
    fontSize: "0.95rem",
    lineHeight: 1.6
  },
  showcaseSection: {
    marginTop: "40px"
  },
  showcaseHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px"
  },
  smallHeading: {
    margin: 0,
    color: "#dc2626",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "0.85rem"
  },
  showcaseTitle: {
    margin: "8px 0 0",
    fontSize: "2rem",
    lineHeight: 1.2,
    color: "#111827"
  },
  showcaseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px"
  },
  newsCard: {
    background: "white",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
    border: "1px solid #eceef0"
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px"
  },
  featureCard: {
    background: "white",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 50px rgba(15,23,42,0.06)"
  }
};


import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [showRead, setShowRead] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem("user") || "null"));

  useEffect(() => {
    async function fetchNotifications(currentUser) {
      try {
        const res = await fetch(`http://localhost:5000/api/notifications?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setNotifications(data);
        } else {
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      }
    }

    if (!user) {
      setMessage("Please login to view your notifications.");
      navigate("/login");
      return;
    }

    setMessage("");
    fetchNotifications(user);

    const onStorage = (event) => {
      if (event.key === "user") {
        setUser(JSON.parse(event.newValue || "null"));
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user, navigate]);

  async function markNotificationRead(notificationId) {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read?email=${encodeURIComponent(user.email)}`, {
        method: "POST"
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setNotifications((prev) => prev.map((note) => note.id === data.id ? { ...note, is_read: data.is_read } : note));
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  }

  async function deleteNotification(notificationId) {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${notificationId}?email=${encodeURIComponent(user.email)}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        return;
      }
      setNotifications((prev) => prev.filter((note) => note.id !== notificationId));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }

  const unreadNotifications = notifications.filter((note) => !note.is_read);
  const readNotifications = notifications.filter((note) => note.is_read);

  if (!user) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>Notifications</h1>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ margin: 0 }}>Notifications</h1>
          <p style={{ color: "#6b7280", margin: "8px 0 0" }}>Unread notifications appear first. Read items are hidden by default under a dropdown.</p>
        </div>
        <Link to="/my-tickets" style={styles.linkButton}>
          Back to Tickets
        </Link>
      </div>

      {message && <p style={{ color: "red" }}>{message}</p>}

      {unreadNotifications.length === 0 ? (
        <p style={styles.noNotifications}>No new notifications.</p>
      ) : (
        unreadNotifications.map((note) => (
          <div key={note.id} style={{ ...styles.notificationCard, borderColor: "#2563eb" }}>
            <div style={styles.notificationHeader}>
              <div>
                <strong>{note.title}</strong>
                <p style={styles.notificationTime}>{new Date(note.created_at).toLocaleString()}</p>
              </div>
            </div>
            <p style={styles.notificationMessage}>{note.message}</p>
            <div style={styles.buttonGroup}>
              <button style={{ ...styles.secondaryButton, marginTop: 10 }} onClick={() => markNotificationRead(note.id)}>
                Mark as read
              </button>
              <button style={{ ...styles.deleteButton, marginTop: 10 }} onClick={() => deleteNotification(note.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {readNotifications.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button style={styles.ghostButton} onClick={() => setShowRead((prev) => !prev)}>
            {showRead ? `Hide read notifications (${readNotifications.length})` : `Show read notifications (${readNotifications.length})`}
          </button>

          {showRead && (
            <div style={{ marginTop: 16 }}>
              {readNotifications.map((note) => (
                <div key={note.id} style={{ ...styles.notificationCard, background: "#f9fafb", borderColor: "#d1d5db" }}>
                  <div style={styles.notificationHeader}>
                    <div>
                      <strong>{note.title}</strong>
                      <p style={styles.notificationTime}>{new Date(note.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <p style={styles.notificationMessage}>{note.message}</p>
                  <button style={{ ...styles.deleteButton, marginTop: 10 }} onClick={() => deleteNotification(note.id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  notificationCard: {
    borderRadius: "14px",
    background: "white",
    border: "1px solid #d1d5db",
    padding: "18px",
    marginBottom: "14px"
  },
  notificationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px"
  },
  notificationMessage: {
    margin: 0,
    color: "#374151"
  },
  notificationTime: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280"
  },
  noNotifications: {
    color: "#6b7280"
  },
  page: {
    padding: "40px",
    maxWidth: "980px",
    margin: "0 auto"
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "24px"
  },
  pageTitle: {
    margin: 0,
    fontSize: "2.6rem"
  },
  subtitle: {
    color: "#475569",
    margin: "8px 0 0"
  },
  ghostButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#374151",
    cursor: "pointer",
    fontWeight: 600
  },
  secondaryButton: {
    padding: "10px 18px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 600
  },
  deleteButton: {
    padding: "10px 18px",
    borderRadius: "12px",
    border: "1px solid #ef5350",
    background: "#ffebee",
    color: "#c62828",
    cursor: "pointer",
    fontWeight: 600
  },
  buttonGroup: {
    display: "flex",
    gap: "10px"
  },
  linkButton: {
    display: "inline-block",
    padding: "12px 20px",
    background: "#dc2626",
    color: "white",
    borderRadius: "14px",
    textDecoration: "none",
    fontWeight: 600,
    cursor: "pointer"
  }
};

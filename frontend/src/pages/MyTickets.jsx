import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { jsPDF } from "jspdf";

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem("user") || "null"));

  useEffect(() => {
    async function fetchTickets(currentUser) {
      try {
        const res = await fetch(`http://localhost:5000/api/my-registrations?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();

        if (!res.ok) {
          setMessage(data.message || "Unable to load your tickets.");
          setTickets([]);
          return;
        }

        setTickets(data);
      } catch {
        setMessage("Failed to connect to the server.");
        setTickets([]);
      }
    }

    if (!user) {
      setMessage("Please login to view your tickets.");
      navigate("/login");
      return;
    }

    setMessage("");
    fetchTickets(user);

    const onStorage = (event) => {
      if (event.key === "user") {
        setUser(JSON.parse(event.newValue || "null"));
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user, navigate]);

  if (!user) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>My Tickets</h1>
        <p>{message}</p>
      </div>
    );
  }

  function downloadTicket(ticket) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Event Ticket", 20, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${ticket.full_name}`, 20, 40);
    doc.text(`Email: ${ticket.email}`, 20, 50);
    doc.text(`Event: ${ticket.event?.title || "N/A"}`, 20, 60);
    doc.text(`Date: ${ticket.event?.date || "N/A"}`, 20, 70);
    doc.text(`Location: ${ticket.event?.location || "N/A"}`, 20, 80);
    doc.text(`Ticket Code: ${ticket.ticket_code || "Not issued"}`, 20, 90);
    doc.text(`Status: ${ticket.approval_status}`, 20, 100);
    doc.text(`Payment: ${ticket.payment_status}`, 20, 110);
    doc.save(`${ticket.event?.title || "ticket"}-${ticket.id}.pdf`);
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>My Tickets</h1>
          <p style={styles.subtitle}>Review your bookings and access your notifications in one place.</p>
        </div>
        <Link to="/notifications" style={styles.linkButton}>
          View Notifications
        </Link>
      </div>

      {message && <p style={{ color: "#b91c1c" }}>{message}</p>}

      {tickets.length === 0 && !message && (
        <p>No registrations found for {user.email}.</p>
      )}

      {tickets.map((ticket) => (
        <div key={ticket.id} style={styles.card}>
          <h2>{ticket.event?.title || "Event details unavailable"}</h2>
          <p><strong>Date:</strong> {ticket.event?.date || "N/A"}</p>
          <p><strong>Location:</strong> {ticket.event?.location || "N/A"}</p>
          <p><strong>Registration Status:</strong> {ticket.approval_status}</p>
          <p><strong>Payment Status:</strong> {ticket.payment_status}</p>
          <p><strong>Payment Method:</strong> {ticket.payment_method || "N/A"}</p>
          <p><strong>Receipt:</strong> {ticket.receipt_number || "Not issued yet"}</p>
          <p><strong>Ticket Code:</strong> {ticket.ticket_code || "Pending approval"}</p>
          <p><strong>Checked In:</strong> {ticket.attended ? "Yes" : "No"}</p>

          <button onClick={() => downloadTicket(ticket)} style={styles.pdfButton}>
            Download Ticket PDF
          </button>

          {ticket.ticket_qr_data && (
            <div style={{ marginTop: "15px" }}>
              <img
                src={`data:image/png;base64,${ticket.ticket_qr_data}`}
                alt="Ticket QR"
                style={{ width: "180px", height: "180px", border: "1px solid #ddd" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  notificationsSection: {
    marginBottom: "22px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "14px",
    border: "1px solid #e2e8f0"
  },
  sectionHeader: {
    margin: 0,
    fontSize: "20px",
    marginBottom: "12px",
    color: "#111827"
  },
  noNotifications: {
    margin: 0,
    color: "#6b7280"
  },
  notificationCard: {
    padding: "14px",
    borderRadius: "12px",
    background: "white",
    border: "1px solid #d1d5db",
    marginBottom: "12px"
  },
  notificationHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px"
  },
  notificationTime: {
    fontSize: "13px",
    color: "#6b7280"
  },
  notificationMessage: {
    margin: 0,
    color: "#374151"
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
    color: "#475569"
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "18px",
    boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
    marginBottom: "20px"
  },
  pdfButton: {
    marginTop: "15px",
    padding: "10px 18px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer"
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

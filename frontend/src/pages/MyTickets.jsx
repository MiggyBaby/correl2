import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    async function fetchTickets() {
      if (!user) {
        setMessage("Please login to view your tickets.");
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/my-registrations?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();

        if (!res.ok) {
          setMessage(data.message || "Unable to load your tickets.");
          return;
        }

        setTickets(data);
      } catch (error) {
        setMessage("Failed to connect to the server.");
      }
    }

    fetchTickets();
  }, [user]);

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
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>My Tickets</h1>

      {message && <p style={{ color: "red" }}>{message}</p>}

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
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
    marginBottom: "20px"
  },
  pdfButton: {
    marginTop: "15px",
    padding: "10px 18px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  }
};
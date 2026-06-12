import { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminDashboard() {

  const user = useMemo(() => JSON.parse(sessionStorage.getItem("user") || "null"), []);

  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const [participantQuery, setParticipantQuery] = useState("");
  const [emailLogs, setEmailLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedParticipants, setExpandedParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date: null,
    price: "",
    payment_phone: "",
    payment_qr_filename: "",
    visibility: "public"
  });
  const [editingEventId, setEditingEventId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [proofPreview, setProofPreview] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [eventMetrics, setEventMetrics] = useState(null);

  const qrStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    },
    modal: {
      background: "white",
      padding: "20px",
      borderRadius: "16px",
      boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
      maxWidth: "100%",
      maxHeight: "100%",
      textAlign: "center"
    },
    image: {
      width: "min(90vw, 520px)",
      height: "min(90vw, 520px)",
      objectFit: "contain",
      borderRadius: "12px",
      border: "1px solid #d1d5db"
    },
    closeButton: {
      marginTop: "16px",
      padding: "10px 18px",
      border: "none",
      borderRadius: "8px",
      background: "#dc2626",
      color: "white",
      cursor: "pointer"
    }
  };

  const styles = {
    page: {
      padding: "30px",
      maxWidth: 1200,
      margin: "0 auto",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#111827"
    },
    pageTitle: {
      fontSize: 32,
      marginBottom: 18,
      letterSpacing: "-0.03em"
    },
    sectionTitle: {
      marginTop: 30,
      marginBottom: 12,
      fontSize: 22,
      color: "#111827"
    },
    card: {
      borderRadius: 18,
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      padding: 24,
      boxShadow: "0 18px 40px rgba(15, 23, 42, 0.05)",
      marginBottom: 24
    },
    profileCard: {
      borderRadius: 18,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      padding: 20,
      marginBottom: 24
    },
    eventCard: {
      borderRadius: 18,
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      padding: 20,
      marginBottom: 16,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 16
    },
    participantCard: {
      borderRadius: 18,
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      padding: 20,
      marginBottom: 16
    },
    participantHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12
    },
    participantDetails: {
      marginTop: 14,
      padding: 18,
      background: "#f8fafc",
      borderRadius: 14,
      border: "1px solid #e2e8f0"
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 12,
      border: "1px solid #d1d5db",
      background: "#fff",
      fontSize: 15,
      color: "#111827"
    },
    label: {
      display: "block",
      marginBottom: 6,
      fontWeight: 600,
      color: "#374151"
    },
    field: {
      marginBottom: 18
    },
    row: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "flex-end",
      marginBottom: 18
    },
    primaryButton: {
      padding: "10px 18px",
      borderRadius: 12,
      border: "none",
      background: "#dc2626",
      color: "white",
      cursor: "pointer",
      fontWeight: 600,
      transition: "background 0.2s ease"
    },
    secondaryButton: {
      padding: "10px 18px",
      borderRadius: 12,
      border: "1px solid #d1d5db",
      background: "#ffffff",
      color: "#111827",
      cursor: "pointer",
      fontWeight: 600
    },
    dangerButton: {
      padding: "10px 18px",
      borderRadius: 12,
      border: "1px solid #f87171",
      background: "#fee2e2",
      color: "#b91c1c",
      cursor: "pointer",
      fontWeight: 600
    },
    ghostButton: {
      padding: "8px 14px",
      borderRadius: 10,
      border: "1px solid #cbd5e1",
      background: "#f8fafc",
      color: "#374151",
      cursor: "pointer"
    },
    muted: {
      color: "#6b7280"
    },
    mutedSmall: {
      color: "#6b7280",
      fontSize: 13,
      marginTop: 6
    },
    info: {
      color: "#dc2626",
      marginBottom: 12
    },
    error: {
      color: "#b91c1c",
      marginBottom: 12
    },
    actionMessage: {
      borderRadius: 14,
      background: "#eef2ff",
      padding: "14px 18px",
      marginBottom: 20,
      color: "#3730a3",
      border: "1px solid #c7d2fe"
    },
    smallImage: {
      height: 80,
      width: 80,
      objectFit: "cover",
      borderRadius: 12,
      cursor: "pointer",
      border: "1px solid #d1d5db"
    }
  };

  // ======================
  // LOAD EVENTS
  // ======================

  const loadEvents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://localhost:5000/api/admin/events/${user.id}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404 && data?.message === "User not found") {
          sessionStorage.removeItem("user");
          setError("User not found. Your login session is invalid after the reset. Please login again.");
          window.location.href = "/login";
          return;
        } else {
          throw new Error(`API error: ${res.status}`);
        }
      }

      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setEvents([]);
        console.error("Events data is not an array:", data);
      }
    } catch (err) {
      console.error("Error loading events:", err);
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEvents();
    loadEmailLogs();
  }, [loadEvents]);

  // ======================
  // PROTECT PAGE (NO WHITE SCREEN)
  // ======================

  if (!user) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>You are not logged in</h2>
        <p>Please login first.</p>
      </div>
    );
  }

  // ======================
  // CREATE EVENT
  // ======================

  async function createEvent() {
    if (!form.title) {
      alert("Please enter a title");
      return;
    }

    try {
      const eventData = {
        ...form,
        owner_id: user.id,
        date: form.date ? form.date.toISOString().split('T')[0] : ""
      };

      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)
      });

      if (res.ok) {
        alert("Event created successfully");
        setForm({
          title: "",
          description: "",
          location: "",
          date: null,
          price: "",
          visibility: "public"
        });
        loadEvents();
        window.dispatchEvent(new Event('events-updated'));
      } else {
        const error = await res.json();
        alert("Error: " + (error.message || "Failed to create event"));
      }
    } catch (err) {
      console.error("Create event error:", err);
      alert("Error creating event");
    }
  }

  // ======================
  // DELETE EVENT
  // ======================

  async function deleteEvent(eventId) {
    if (!confirm("Are you sure you want to delete this event? Participants for this event will also be removed.")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ owner_id: user.id })
      });

      if (res.ok) {
        if (selectedEventId === eventId) {
          setParticipants([]);
          setSelectedEventId(null);
          setSelectedEventTitle("");
        }
        alert("Event and its participants were deleted successfully.");
        loadEvents();
        window.dispatchEvent(new Event('events-updated'));
      } else {
        const error = await res.json();
        alert(error.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  }

  async function sendTestEmail(eventId) {
    try {
      const res = await fetch(`http://localhost:5000/api/send-test-email/${user.id}/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Test email ${data.status} to ${data.recipient}`);
      } else {
        alert(`Send failed: ${data.message || res.status}`);
      }
    } catch (err) {
      console.error("Test email error:", err);
      alert("Failed to send test email");
    }
  }

  // ======================
  // EDIT EVENTS
  // ======================

  function startEdit(e) {
    setEditingEventId(e.id);
    setEditForm({
      title: e.title || "",
      description: e.description || "",
      location: e.location || "",
      date: e.date || "",
      price: e.price || 0,
      visibility: e.visibility || "public",
      payment_phone: e.payment_phone || "",
      payment_qr_filename: e.payment_qr_filename || ""
    });
  }

  function cancelEdit() {
    setEditingEventId(null);
    setEditForm({});
  }

  async function saveEdit(id) {
    try {
      const body = { ...editForm, owner_id: user.id };
      const res = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Event updated");
        setEditingEventId(null);
        setEditForm({});
        loadEvents();
        window.dispatchEvent(new Event('events-updated'));
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Update failed");
    }
  }

  // ======================
  // LOAD PARTICIPANTS
  // ======================

  async function loadParticipants(eventId, eventTitle) {
    try {
      const res = await fetch(`http://localhost:5000/api/participants/${eventId}/${user.id}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404 && data?.message === "Event not found") {
          setParticipants([]);
          setSelectedEventId(null);
          setSelectedEventTitle("");
          alert("This event no longer exists.");
          return;
        }
        throw new Error(`API error: ${res.status}`);
      }
      if (Array.isArray(data)) {
        setParticipants(data);
      } else {
        setParticipants([]);
      }
      setSelectedEventId(eventId);
      setSelectedEventTitle(eventTitle || "");
      setStatusFilter("all");
      await loadEventAnalytics(eventId);
    } catch (err) {
      console.error("Error loading participants:", err);
      setParticipants([]);
      setSelectedEventId(null);
      setSelectedEventTitle("");
      alert("Error loading participants");
    }
  }

  async function loadEventAnalytics(eventId) {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/analytics?user_id=${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setEventMetrics(data);
      } else {
        setEventMetrics(null);
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
      setEventMetrics(null);
    }
  }

  async function downloadParticipantsCsv() {
    if (!selectedEventId) {
      setActionMessage("Please select an event before exporting participants.");
      setTimeout(() => setActionMessage(""), 5000);
      return;
    }
    window.open(`http://localhost:5000/api/events/${selectedEventId}/export?user_id=${user.id}`, "_blank");
  }

  async function sendReminders() {
    if (!selectedEventId) return;

    try {
      const res = await fetch(`http://localhost:5000/api/events/${selectedEventId}/send-reminders/${user.id}`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to send reminders");
        return;
      }
      const msg = `Reminder emails sent: ${data.sent}. Skipped: ${data.skipped}.`;
      setActionMessage(msg);
      setTimeout(() => setActionMessage(""), 6000);
    } catch (err) {
      console.error("Reminder error:", err);
      alert("Failed to send reminder emails");
    }
  }

  function toggleParticipantDetails(id) {
    setExpandedParticipants(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }

  // ======================
  // APPROVE / REJECT
  // ======================

  async function approve(id) {
    try {
      const res = await fetch(`http://localhost:5000/api/approve/${id}/${user.id}`, {
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Approval failed");
        return;
      }

      if (selectedEventId) {
        await loadParticipants(selectedEventId, selectedEventTitle);
      }

      const msg = formatEmailResult("Approved", data);
      setActionMessage(msg);
      setTimeout(() => setActionMessage(""), 6000);
    } catch (err) {
      console.error("Approval error:", err);
      alert("Approval failed. Please check that the backend is running.");
    }
  }

  async function confirmPayment(id) {
    try {
      const res = await fetch(`http://localhost:5000/api/confirm-payment/${id}/${user.id}`, {
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Payment confirmation failed");
        return;
      }

      if (selectedEventId) {
        await loadParticipants(selectedEventId, selectedEventTitle);
      }

      const msg = formatEmailResult("Payment confirmed", data);
      setActionMessage(msg);
      setTimeout(() => setActionMessage(""), 6000);
    } catch (err) {
      console.error("Confirmation error:", err);
      alert("Payment confirmation failed. Please check that the backend is running.");
    }
  }

  async function reject(id) {
    try {
      const res = await fetch(`http://localhost:5000/api/reject/${id}/${user.id}`, {
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Rejection failed");
        return;
      }

      if (selectedEventId) {
        await loadParticipants(selectedEventId, selectedEventTitle);
      }

      const msg = formatEmailResult("Rejected", data);
      setActionMessage(msg);
      setTimeout(() => setActionMessage(""), 6000);
    } catch (err) {
      console.error("Rejection error:", err);
      alert("Rejection failed. Please check that the backend is running.");
    }
  }

  async function loadEmailLogs() {
    try {
      const res = await fetch(`http://localhost:5000/api/email-logs/${user.id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `API error: ${res.status}`);
      }
      if (Array.isArray(data)) {
        setEmailLogs(data);
      } else {
        setEmailLogs([]);
      }
    } catch (err) {
      console.error("Error loading email logs:", err);
      setEmailLogs([]);
      alert("Error loading email logs");
    }
  }

  async function resendEmailLog(logId) {
    try {
      const res = await fetch(`http://localhost:5000/api/email-logs/${logId}/resend/${user.id}`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to resend email");
        return;
      }
      await loadEmailLogs();
      const message = data.email_status === "sent"
        ? "Email resent successfully."
        : `Resend completed with status: ${data.email_status}`;
      setActionMessage(message);
      setTimeout(() => setActionMessage(""), 6000);
    } catch (err) {
      console.error("Error resending email:", err);
      alert("Failed to resend email. Please check the backend.");
    }
  }

  return (
      <div style={styles.page}>
      <h1 style={styles.pageTitle}>Admin Dashboard</h1>

      {/* LOADING/ERROR DISPLAY */}
      {loading && <p style={styles.info}>Loading dashboard...</p>}
      {error && <p style={styles.error}>Error: {error}</p>}
      {actionMessage && <div style={styles.actionMessage}>{actionMessage}</div>}

      {/* PROFILE */}
      <div style={styles.profileCard}>
        <h3 style={{ margin: 0 }}>Profile</h3>
        <p style={styles.muted}>Name: {user.name}</p>
        <p style={styles.muted}>Email: {user.email}</p>
      </div>

      {/* CREATE EVENT */}
      <h2 style={styles.sectionTitle}>Create Event</h2>

      <div style={styles.card}>
        <div style={styles.field}>
          <label style={styles.label}>Title</label>
          <input style={styles.input} placeholder="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Description</label>
          <input style={styles.input} placeholder="Short description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <label style={styles.label}>Location</label>
            <input style={styles.input} placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div style={{ width: 220 }}>
            <label style={styles.label}>Date</label>
            <DatePicker
              selected={form.date}
              onChange={date => setForm({ ...form, date })}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select date"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <label style={styles.label}>Price (₱)</label>
            <input style={styles.input} placeholder="0 for free" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Payment Phone / Number</label>
            <input style={styles.input} placeholder="e.g. 09171234567" value={form.payment_phone} onChange={e => setForm({ ...form, payment_phone: e.target.value })} />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Upload Payment QR</label>
          <input type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files[0];
            const filename = await uploadFile(file);
            if (filename) setForm({ ...form, payment_qr_filename: filename });
          }} />
          {form.payment_qr_filename && (
            <div style={{ marginTop: 8 }}>
              <img src={`http://localhost:5000/uploads/${form.payment_qr_filename}`} width="140" alt="qr" />
            </div>
          )}
        </div>

        <div style={styles.row}> 
          <div style={{ width: 220 }}>
            <label style={styles.label}>Visibility</label>
            <select style={styles.input} onChange={e => setForm({ ...form, visibility: e.target.value })} value={form.visibility}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', alignSelf: 'end' }}>
            <button style={styles.primaryButton} onClick={createEvent}>Create Event</button>
          </div>
        </div>
      </div>

      {/* EVENTS LIST */}
      <h2 style={{ marginTop: "30px" }}>My Events</h2>

      {events.length === 0 && <p style={styles.muted}>No events yet.</p>}

      {events.map(e => (
        <div key={e.id} style={styles.eventCard}>
          {editingEventId === e.id ? (
            <div>
              <input value={editForm.title} onChange={ev => setEditForm({ ...editForm, title: ev.target.value })} placeholder="Title" />
              <input value={editForm.location} onChange={ev => setEditForm({ ...editForm, location: ev.target.value })} placeholder="Location" />
              <div style={{ marginTop: 6 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Date:</label>
                <DatePicker
                  selected={editForm.date ? new Date(editForm.date) : null}
                  onChange={date => setEditForm({ ...editForm, date: date ? date.toISOString().split('T')[0] : '' })}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date"
                />
              </div>
              <input type="number" value={editForm.price} onChange={ev => setEditForm({ ...editForm, price: ev.target.value })} placeholder="Price" />
              <div style={{ marginTop: 8 }}>
                <label>Payment Phone / Number</label>
                <input placeholder="e.g. 09171234567" value={editForm.payment_phone || ''} onChange={ev => setEditForm({ ...editForm, payment_phone: ev.target.value })} />
              </div>
              <div style={{ marginTop: 8 }}>
                <label>Upload Payment QR</label>
                <input type="file" accept="image/*" onChange={async (ev) => {
                  const file = ev.target.files[0];
                  const filename = await uploadFile(file);
                  if (filename) setEditForm({ ...editForm, payment_qr_filename: filename });
                }} />
                {editForm.payment_qr_filename && (
                  <div style={{ marginTop: 8 }}>
                    <img src={`http://localhost:5000/uploads/${editForm.payment_qr_filename}`} width="140" alt="qr" />
                  </div>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => saveEdit(e.id)}>Save</button>
                <button onClick={cancelEdit} style={{ marginLeft: 8 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ margin: 0 }}>{e.title}</h3>
              <p style={styles.muted}>{e.location} • {e.date}</p>

              <div style={{ marginTop: 12 }}>
                <button style={styles.secondaryButton} onClick={() => loadParticipants(e.id, e.title)}>View Participants</button>
                <button style={{ ...styles.secondaryButton, marginLeft: 8 }} onClick={() => startEdit(e)}>Edit</button>
                <button style={{ ...styles.primaryButton, marginLeft: 8 }} onClick={() => sendTestEmail(e.id)}>Send Test Email</button>
                <button style={{ ...styles.dangerButton, marginLeft: 8 }} onClick={() => deleteEvent(e.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* PARTICIPANTS */}
      <h2 style={{ marginTop: "30px" }}>Participants</h2>

      {selectedEventTitle && (
        <>
          <p style={{ fontStyle: "italic", color: "#555" }}>Showing participants for event: <strong>{selectedEventTitle}</strong></p>
          {eventMetrics && (
            <div style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 16,
              background: "#fafafa",
              marginBottom: 18
            }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 12 }}>
                <div><strong>Registrations:</strong> {eventMetrics.total_registrations}</div>
                <div><strong>Approved:</strong> {eventMetrics.approved}</div>
                <div><strong>Waiting:</strong> {eventMetrics.waiting}</div>
                <div><strong>Rejected:</strong> {eventMetrics.rejected}</div>
                <div><strong>Paid:</strong> {eventMetrics.paid}</div>
                <div><strong>Revenue:</strong> PHP {eventMetrics.revenue}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={styles.secondaryButton} onClick={downloadParticipantsCsv}>Export Participants</button>
                <button style={{ ...styles.primaryButton, marginLeft: 8 }} onClick={sendReminders}>Send Reminders</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Participant search */}
      {selectedEventId && (
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <input
            placeholder="Search participants by name or email"
            value={participantQuery}
            onChange={e => setParticipantQuery(e.target.value)}
            style={{ padding: 8, width: "100%", maxWidth: 420 }}
          />
        </div>
      )}

      {participants.length > 0 && (
        <div style={{ marginBottom: "15px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            Filter status:
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="waiting">Waiting</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
        </div>
      )}

      {participants
        .filter(p => statusFilter === "all" || p.approval_status === statusFilter)
        .filter(p => {
          if (!participantQuery) return true;
          const q = participantQuery.toLowerCase();
          return (p.full_name && p.full_name.toLowerCase().includes(q)) || (p.email && p.email.toLowerCase().includes(q));
        })
        .map(p => (
        <div key={p.id} style={styles.participantCard}>
          <div style={styles.participantHeader}>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>{p.full_name}</p>
              <p style={styles.muted}>{p.email}</p>
              <p style={styles.mutedSmall}>Status: {p.approval_status} • Event: {p.event_title || selectedEventTitle || "Unknown"}</p>
            </div>
            <div>
              <button style={styles.ghostButton} onClick={() => toggleParticipantDetails(p.id)}>
                {expandedParticipants.includes(p.id) ? "Hide" : "Details"}
              </button>
            </div>
          </div>

          {expandedParticipants.includes(p.id) && (
            <div style={styles.participantDetails}>
              <p><strong>Payment Method:</strong> {p.payment_method || "N/A"}</p>
              <p><strong>Reference Number:</strong> {p.reference_number || "N/A"}</p>
              <p><strong>Payment Date:</strong> {p.payment_date || "N/A"}</p>
              <p><strong>Receipt Number:</strong> {p.receipt_number || "N/A"}</p>
              <p><strong>Ticket Code:</strong> {p.ticket_code || "N/A"}</p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                {p.ticket_qr_data && (
                  <div>
                    <strong>Ticket QR</strong>
                    <br />
                    <img
                      src={`data:image/png;base64,${p.ticket_qr_data}`}
                      alt="Ticket QR"
                      style={styles.smallImage}
                      onClick={() => setProofPreview(`data:image/png;base64,${p.ticket_qr_data}`)}
                    />
                  </div>
                )}

                {p.screenshot_filename && (
                  <div>
                    <strong>Payment Proof</strong>
                    <br />
                    <img
                      src={`http://localhost:5000/uploads/${p.screenshot_filename}`}
                      alt="proof"
                      style={styles.smallImage}
                      onClick={() => setProofPreview(`http://localhost:5000/uploads/${p.screenshot_filename}`)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {proofPreview && (
            <div style={qrStyles.overlay} onClick={() => setProofPreview(null)}>
              <div style={qrStyles.modal} onClick={e => e.stopPropagation()}>
                <img
                  src={proofPreview}
                  alt="Expanded payment proof"
                  style={qrStyles.image}
                />
                <button style={qrStyles.closeButton} onClick={() => setProofPreview(null)}>
                  Close
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {p.payment_status === "pending" && p.payment_method !== "Cash" && (
              <button style={styles.primaryButton} onClick={() => confirmPayment(p.id)}>Confirm Payment</button>
            )}
            <button style={styles.primaryButton} onClick={() => approve(p.id)}>Approve</button>
            <button style={{ ...styles.secondaryButton, marginLeft: 8 }} onClick={() => reject(p.id)}>Reject</button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "40px" }}>
        <h2>Email Notifications Log</h2>
        <button onClick={loadEmailLogs} style={{ marginBottom: "15px" }}>
          Refresh Email Logs
        </button>

        {emailLogs.length === 0 ? (
          <p>No email logs loaded yet.</p>
        ) : (
          emailLogs.map(log => (
            <div key={log.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
              <p><strong>{log.subject}</strong></p>
              <p>Recipient: {log.recipient}</p>
              <p>Event: {log.event_title || "General"}</p>
              <p>Status: {log.status}</p>
              <p>Sent at: {log.created_at}</p>
              {log.status !== "sent" && (
                <button
                  style={{ ...styles.secondaryButton, marginTop: 8 }}
                  onClick={() => resendEmailLog(log.id)}
                >
                  Resend Email
                </button>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

function formatEmailResult(action, data) {
  if (data.email_status === "sent") {
    return `${action}. Email sent to ${data.recipient}.`;
  }

  if (data.email_status === "skipped") {
    return `${action}, but email was skipped. Configure backend Gmail credentials in .env.`;
  }

  if (data.email_status?.startsWith("failed:")) {
    return `${action}, but email failed: ${data.email_status.replace("failed:", "").trim()}`;
  }

  return action;
}

  async function uploadFile(file) {
    if (!file) return null;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: fd
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Upload failed');
        return null;
      }
      const data = await res.json();
      return data.filename;
    } catch (err) {
      console.error('Upload error', err);
      alert('Upload failed');
      return null;
    }
  }



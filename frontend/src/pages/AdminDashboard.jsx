import { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminDashboard() {

  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);

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
      background: "#2563eb",
      color: "white",
      cursor: "pointer"
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
          window.localStorage.removeItem("user");
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
    } catch (err) {
      console.error("Error loading participants:", err);
      setParticipants([]);
      setSelectedEventId(null);
      setSelectedEventTitle("");
      alert("Error loading participants");
    }
  }

  async function loadEmailLogs() {
    try {
      const res = await fetch(`http://localhost:5000/api/email-logs/${user.id}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
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

      alert(formatEmailResult("Approved", data));
    } catch (err) {
      console.error("Approval error:", err);
      alert("Approval failed. Please check that the backend is running.");
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

      alert(formatEmailResult("Rejected", data));
    } catch (err) {
      console.error("Rejection error:", err);
      alert("Rejection failed. Please check that the backend is running.");
    }
  }

  // ======================
  // UI
  // ======================

  return (
    <div style={{ padding: "40px" }}>

      <h1>Admin Dashboard</h1>

      {/* LOADING/ERROR DISPLAY */}
      {loading && <p style={{ color: "blue" }}>Loading dashboard...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* PROFILE */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Profile</h3>
        <p>Name: {user.name}</p>
        <p>Email: {user.email}</p>
      </div>

      {/* CREATE EVENT */}
      <h2>Create Event</h2>

      <input placeholder="Title" onChange={e => setForm({ ...form, title: e.target.value })} />
      <input placeholder="Description" onChange={e => setForm({ ...form, description: e.target.value })} />
      <input placeholder="Location" onChange={e => setForm({ ...form, location: e.target.value })} />
      <div>
        <label>Date:</label>
        <DatePicker
          selected={form.date}
          onChange={date => setForm({ ...form, date })}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select date"
        />
      </div>
      <input placeholder="Price" onChange={e => setForm({ ...form, price: e.target.value })} />
      <div style={{ marginTop: 8 }}>
        <label>Payment Phone / Number</label>
        <input placeholder="e.g. 09171234567" value={form.payment_phone} onChange={e => setForm({ ...form, payment_phone: e.target.value })} />
      </div>
      <div style={{ marginTop: 8 }}>
        <label>Upload Payment QR</label>
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

      <select onChange={e => setForm({ ...form, visibility: e.target.value })}>
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>

      <br /><br />
      <button onClick={createEvent}>Create Event</button>

      {/* EVENTS LIST */}
      <h2 style={{ marginTop: "30px" }}>My Events</h2>

      {events.length === 0 && <p>No events yet.</p>}

      {events.map(e => (
        <div key={e.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
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
              <h3>{e.title}</h3>
              <p>{e.location}</p>
              <p>{e.date}</p>

              <button onClick={() => loadParticipants(e.id, e.title)}>View Participants</button>
              <button onClick={() => startEdit(e)} style={{ marginLeft: 8 }}>Edit</button>
              <button onClick={() => deleteEvent(e.id)} style={{ marginLeft: "10px", backgroundColor: "red", color: "white" }}>Delete</button>
            </div>
          )}
        </div>
      ))}

      {/* PARTICIPANTS */}
      <h2 style={{ marginTop: "30px" }}>Participants</h2>

      {selectedEventTitle && (
        <p style={{ fontStyle: "italic", color: "#555" }}>Showing participants for event: <strong>{selectedEventTitle}</strong></p>
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
        <div key={p.id} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p><strong>{p.full_name}</strong></p>
              <p>{p.email}</p>
              <p>Status: {p.approval_status}</p>
              <p style={{ fontSize: "0.94rem", color: "#555" }}>Event: {p.event_title || selectedEventTitle || "Unknown"}</p>
            </div>
            <button
              onClick={() => toggleParticipantDetails(p.id)}
              style={{ backgroundColor: "#007bff", color: "white", border: "none", padding: "8px 12px", cursor: "pointer" }}
            >
              {expandedParticipants.includes(p.id) ? "Hide details" : "Show details"}
            </button>
          </div>

          {expandedParticipants.includes(p.id) && (
            <div style={{ marginTop: "10px", backgroundColor: "#f9f9f9", padding: "12px", borderRadius: "6px" }}>
              <p><strong>Payment Method:</strong> {p.payment_method || "N/A"}</p>
              <p><strong>Reference Number:</strong> {p.reference_number || "N/A"}</p>
              <p><strong>Payment Date:</strong> {p.payment_date || "N/A"}</p>
              <p><strong>Receipt Number:</strong> {p.receipt_number || "N/A"}</p>
              <p><strong>Ticket Code:</strong> {p.ticket_code || "N/A"}</p>

              {p.ticket_qr_data && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Ticket QR:</strong>
                  <br />
                  <img
                    src={`data:image/png;base64,${p.ticket_qr_data}`}
                    alt="Ticket QR"
                    style={{
                      display: "block",
                      marginTop: "8px",
                      width: "140px",
                      maxWidth: "100%",
                      cursor: "pointer",
                      border: "1px solid #ccc",
                      borderRadius: "10px"
                    }}
                    onClick={() => setProofPreview(`data:image/png;base64,${p.ticket_qr_data}`)}
                  />
                  <p style={{ fontSize: "0.9rem", color: "#475569", marginTop: "6px" }}>
                    Click the ticket QR to enlarge.
                  </p>
                </div>
              )}

              {p.screenshot_filename && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Payment Proof:</strong>
                  <br />
                  <img
                    src={`http://localhost:5000/uploads/${p.screenshot_filename}`}
                    alt="proof"
                    style={{
                      marginTop: "8px",
                      border: "1px solid #ccc",
                      width: "180px",
                      maxWidth: "100%",
                      cursor: "pointer",
                      borderRadius: "10px"
                    }}
                    onClick={() => setProofPreview(`http://localhost:5000/uploads/${p.screenshot_filename}`)}
                  />
                  <p style={{ fontSize: "0.9rem", color: "#475569", marginTop: "6px" }}>
                    Click the image to enlarge.
                  </p>
                </div>
              )}
            </div>
          )}

          <br />
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

          <button onClick={() => approve(p.id)}>Approve</button>
          <button onClick={() => reject(p.id)} style={{ marginLeft: "8px" }}>Reject</button>
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



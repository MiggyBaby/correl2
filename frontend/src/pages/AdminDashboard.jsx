import { useEffect, useState } from "react";

export default function AdminDashboard() {

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    price: "",
    visibility: "public"
  });

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
  // LOAD EVENTS
  // ======================

  async function loadEvents() {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/events/${user.id}`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // ======================
  // CREATE EVENT
  // ======================

  async function createEvent() {
    await fetch("http://localhost:5000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...form,
        owner_id: user.id
      })
    });

    loadEvents();
  }

  // ======================
  // LOAD PARTICIPANTS
  // ======================

  async function loadParticipants(eventId) {
    const res = await fetch(`http://localhost:5000/api/participants/${eventId}/${user.id}`);
    const data = await res.json();
    setParticipants(data);
    setStatusFilter("all");
  }

  async function loadEmailLogs() {
    const res = await fetch(`http://localhost:5000/api/email-logs/${user.id}`);
    const data = await res.json();
    setEmailLogs(data);
  }

  // ======================
  // APPROVE / REJECT
  // ======================

  async function approve(id) {
    await fetch(`http://localhost:5000/api/approve/${id}/${user.id}`, {
      method: "POST"
    });
    alert("Approved");
  }

  async function reject(id) {
    await fetch(`http://localhost:5000/api/reject/${id}/${user.id}`, {
      method: "POST"
    });
    alert("Rejected");
  }

  // ======================
  // UI
  // ======================

  return (
    <div style={{ padding: "40px" }}>

      <h1>Admin Dashboard</h1>

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
      <input placeholder="Date" onChange={e => setForm({ ...form, date: e.target.value })} />
      <input placeholder="Price" onChange={e => setForm({ ...form, price: e.target.value })} />

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
          <h3>{e.title}</h3>
          <p>{e.location}</p>
          <p>{e.date}</p>

          <button onClick={() => loadParticipants(e.id)}>View Participants</button>
        </div>
      ))}

      {/* PARTICIPANTS */}
      <h2 style={{ marginTop: "30px" }}>Participants</h2>

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

      {participants.filter(p => statusFilter === "all" || p.approval_status === statusFilter).map(p => (
        <div key={p.id} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px" }}>
          <p><strong>{p.full_name}</strong></p>
          <p>{p.email}</p>
          <p>Status: {p.approval_status}</p>

          {p.screenshot_filename && (
            <img
              src={`http://localhost:5000/uploads/${p.screenshot_filename}`}
              width="120"
              alt="proof"
            />
          )}

          <br />

          <button onClick={() => approve(p.id)}>Approve</button>
          <button onClick={() => reject(p.id)}>Reject</button>
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



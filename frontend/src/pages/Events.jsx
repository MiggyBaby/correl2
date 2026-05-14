import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Events() {
  const [events, setEvents] = useState([]);

  async function loadEvents() {
    try {
      const res = await fetch("http://localhost:5000/api/events");
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Upcoming Events</h1>

      {events.length === 0 && <p>No events yet.</p>}

      <div style={{ display: "grid", gap: "20px" }}>
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
            }}
          >
            <h2>{event.title}</h2>
            <p>{event.description}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Date:</strong> {event.date}</p>
            <p><strong>Price:</strong> {event.price === 0 ? "Free" : `₱${event.price}`}</p>

            <Link to={`/register/${event.id}`}>
              <button
                style={{
                  marginTop: "10px",
                  padding: "10px 20px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Register
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}



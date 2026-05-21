import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function parseDate(dateStr) {
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const parts = dateStr.split(/[-/.\s]+/).map(Number);
  if (parts.length >= 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  return null;
}

function formatMonthLabel(date) {
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

function buildMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay.getDay();
  const days = [];

  for (let i = 0; i < startDay; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(day);
  }

  return days;
}

async function fetchEvents() {
  const res = await fetch("http://localhost:5000/api/events");
  return res.json();
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState("calendar");
  const [calendarDate, setCalendarDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadEvents = useCallback(async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchEvents()
      .then((data) => {
        if (!ignore) {
          setEvents(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load events:", error);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    function handler() {
      loadEvents();
    }
    window.addEventListener('events-updated', handler);
    return () => window.removeEventListener('events-updated', handler);
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) => {
      return [event.title, event.description, event.location, event.owner_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [events, searchQuery]);

  const eventsByDay = useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
      const date = parseDate(event.date);
      if (!date) return acc;

      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
  }, [filteredEvents]);

  const stats = useMemo(() => {
    const today = new Date();
    let total = events.length;
    let thisMonth = 0;
    let free = 0;
    let paid = 0;
    let todayCount = 0;

    events.forEach((event) => {
      const date = parseDate(event.date);
      if (!date) return;

      if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()) {
        thisMonth += 1;
      }
      if (date.toDateString() === today.toDateString()) {
        todayCount += 1;
      }
      if (event.price === 0) {
        free += 1;
      } else {
        paid += 1;
      }
    });

    return { total, thisMonth, free, paid, todayCount };
  }, [events]);

  const calendarDays = useMemo(
    () => buildMonthDays(calendarDate.getFullYear(), calendarDate.getMonth()),
    [calendarDate]
  );

  function openDay(day, dayEvents) {
    const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    setSelectedDate(date);
    setSelectedDayEvents(dayEvents);
  }

  function closeModal() {
    setSelectedDate(null);
    setSelectedDayEvents([]);
  }

  function moveMonth(offset) {
    setCalendarDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Upcoming Events</h1>
          <p style={styles.pageSubtitle}>
            Browse events in a calendar view, then expand the event list to register.
          </p>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search events by title, location, or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.viewToggle}>
            <button
              style={{ ...styles.toggleButton, ...(viewMode === "calendar" ? styles.activeToggle : {}) }}
              onClick={() => setViewMode("calendar")}
            >
              Calendar
            </button>
            <button
              style={{ ...styles.toggleButton, ...(viewMode === "list" ? styles.activeToggle : {}) }}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
          </div>
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Total Events</p>
          <p style={styles.summaryValue}>{stats.total}</p>
        </div>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>This Month</p>
          <p style={styles.summaryValue}>{stats.thisMonth}</p>
        </div>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Free Events</p>
          <p style={styles.summaryValue}>{stats.free}</p>
        </div>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Paid Events</p>
          <p style={styles.summaryValue}>{stats.paid}</p>
        </div>
      </div>

      {user && (
        <p style={styles.userNote}>
          Logged in as <strong>{user.name}</strong> ({user.email})
        </p>
      )}
      {viewMode === "calendar" ? (
        <>
          <div style={styles.calendarHeader}>
            <button style={styles.navButton} onClick={() => moveMonth(-1)}>
              Previous
            </button>
            <div style={{ fontWeight: 700 }}>{formatMonthLabel(calendarDate)}</div>
            <button style={styles.navButton} onClick={() => moveMonth(1)}>
              Next
            </button>
          </div>

          <div style={styles.calendarGrid}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
              <div key={weekday} style={styles.weekdayCell}>
                {weekday}
              </div>
            ))}

            {calendarDays.map((day, index) => {
              const dateKey = `${calendarDate.getFullYear()}-${calendarDate.getMonth()}-${day}`;
              const dayEvents = day ? eventsByDay[dateKey] || [] : [];
              const isClickable = day && dayEvents.length > 0;

              return (
                <div
                  key={`${calendarDate.getMonth()}-${index}`}
                  style={{
                    ...styles.dayCell,
                    ...(isClickable ? styles.dayCellClickable : {}),
                    ...(selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === calendarDate.getMonth() && selectedDate.getFullYear() === calendarDate.getFullYear() ? styles.dayCellSelected : {})
                  }}
                  onClick={() => isClickable && openDay(day, dayEvents)}
                >
                  {day && (
                    <>
                      <div style={styles.dayLabel}>{day}</div>
                      <div style={styles.eventBadges}>
                        {dayEvents.slice(0, 2).map((event) => (
                          <Link key={event.id} to={user ? `/register/${event.id}` : "/login"} style={styles.eventBadgeLink}>
                            <div style={styles.eventBadge}>{event.title}</div>
                          </Link>
                        ))}
                        {dayEvents.length > 2 && (
                          <div style={styles.moreBadge}>+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDate && (
            <div style={styles.modalOverlay} onClick={closeModal}>
              <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h3>Events for {selectedDate.toDateString()}</h3>
                  <button onClick={closeModal} style={styles.modalClose}>Close</button>
                </div>
                <div style={styles.eventList}>
                  {selectedDayEvents.map((event) => (
                    <div key={event.id} style={styles.eventListItem}>
                      <div>
                        <h4 style={{ margin: 0 }}>{event.title}</h4>
                        <p style={{ margin: "8px 0 0" }}>{event.location} - {event.date}</p>
                      </div>
                      <Link to={user ? `/register/${event.id}` : "/login"}>
                        <button style={styles.registerButton}>{user ? "Register" : "Login to Register"}</button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {filteredEvents.length === 0 && <div style={styles.emptyState}>No matching events found.</div>}
          {filteredEvents.map((event) => (
            <div key={event.id} style={styles.eventCard}>
              <h2>{event.title}</h2>
              <p style={styles.ownerLine}>
                Created by {event.owner_id === (user?.id ?? null) ? "you" : event.owner_name}
              </p>
              <p>{event.description}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Date:</strong> {event.date}</p>
              <p><strong>Price:</strong> {event.price === 0 ? "Free" : `PHP ${event.price}`}</p>
              <Link to={user ? `/register/${event.id}` : "/login"}>
                <button style={styles.registerButton}>{user ? "Register" : "Login to Register"}</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px"
  },
  viewToggle: {
    display: "flex",
    gap: "10px"
  },
  toggleButton: {
    padding: "10px 18px",
    background: "white",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#1f2937"
  },
  activeToggle: {
    background: "#2563eb",
    color: "white",
    borderColor: "#2563eb"
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "24px"
  },
  navButton: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer"
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "16px"
  },
  weekdayCell: {
    minHeight: "40px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#6b7280",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  dayCell: {
    minHeight: "120px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    background: "white",
    display: "flex",
    flexDirection: "column"
  },
  dayLabel: {
    fontWeight: "700",
    marginBottom: "8px"
  },
  eventBadges: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1
  },
  eventBadge: {
    padding: "6px 8px",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "8px",
    fontSize: "0.9rem"
  },
  eventBadgeLink: {
    display: "block",
    textDecoration: "none"
  },
  moreBadge: {
    marginTop: "auto",
    color: "#475569",
    fontSize: "0.85rem"
  },
  eventCard: {
    background: "white",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)"
  },
  page: {
    padding: "40px",
    maxWidth: "1220px",
    margin: "0 auto"
  },
  pageTitle: {
    margin: 0,
    fontSize: "2.4rem",
    letterSpacing: "-0.03em"
  },
  pageSubtitle: {
    margin: "10px 0 0",
    color: "#475569",
    maxWidth: "680px",
    lineHeight: 1.7
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  searchWrapper: {
    minWidth: "320px",
    flex: "1 1 320px"
  },
  searchInput: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    outline: "none",
    boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.06)"
  },
  userNote: {
    marginTop: "16px",
    color: "#374151",
    background: "#f8fafc",
    padding: "14px 18px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0"
  },
  emptyState: {
    padding: "26px",
    borderRadius: "16px",
    background: "#f8fafc",
    color: "#475569",
    textAlign: "center",
    boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.2)"
  },
  badgeRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px"
  },
  statusChipFree: {
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#d1fae5",
    color: "#065f46",
    fontWeight: "600",
    fontSize: "0.85rem"
  },
  dayCellClickable: {
    cursor: "pointer",
    transition: "transform 0.15s ease, border-color 0.15s ease",
  },
  dayCellSelected: {
    borderColor: "#2563eb",
    background: "#eff6ff"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  },
  modalContent: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    width: "min(92%, 700px)",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 30px 60px rgba(15, 23, 42, 0.18)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px"
  },
  modalClose: {
    padding: "8px 14px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  eventList: {
    display: "grid",
    gap: "16px"
  },
  eventListItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#f8fafc"
  },
  statusChipPaid: {
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: "600",
    fontSize: "0.85rem"
  },
  statusChipToday: {
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#e0f2fe",
    color: "#0c4a6e",
    fontWeight: "600",
    fontSize: "0.85rem"
  },
  statusChipUpcoming: {
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#dde7ff",
    color: "#3730a3",
    fontWeight: "600",
    fontSize: "0.85rem"
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginTop: "24px",
    marginBottom: "24px"
  },
  summaryCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    padding: "18px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)"
  },
  summaryLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "0.95rem"
  },
  summaryValue: {
    margin: "10px 0 0",
    fontSize: "2rem",
    fontWeight: "700",
    color: "#111827"
  },
  registerButton: {
    marginTop: "16px",
    padding: "10px 22px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer"
  }
};


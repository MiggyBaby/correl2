import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Register() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrExpanded, setQrExpanded] = useState(false);

  useEffect(() => {
    async function loadPageData() {
      try {
        const eventRes = await fetch(`http://localhost:5000/api/events/${id}`);
        const eventData = await eventRes.json();
        setEvent(eventData);

        // Prefer event-specific payment info
        if (eventData.payment_phone || eventData.payment_qr_filename) {
          setPaymentInfo({
            payment_number: eventData.payment_phone,
            payment_qr_filename: eventData.payment_qr_filename
          });
        } else {
          const paymentRes = await fetch("http://localhost:5000/api/payment-info");
          const paymentData = await paymentRes.json();
          setPaymentInfo(paymentData);
        }
      } catch {
        setMessage("Failed to load event or payment information.");
      }
    }

    loadPageData();
  }, [id]);

  function handleProceedToPayment(e) {
    e.preventDefault();

    if (!fullName || !email) {
      setMessage("Please fill in full name and email first.");
      setSuccess(false);
      return;
    }

    setMessage("");
    setShowPaymentStep(true);
  }

  async function handleSubmitPayment(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("email", email);
    formData.append("event_id", id);
    formData.append("payment_method", paymentMethod);

    if (paymentMethod !== "Cash") {
      formData.append("reference_number", referenceNumber);
      if (screenshot) {
        formData.append("screenshot", screenshot);
      }
    }

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Registration submitted. Check your email and wait for admin approval.");
        setSuccess(true);

        setFullName("");
        setEmail("");
        setPaymentMethod("GCash");
        setReferenceNumber("");
        setScreenshot(null);
        setShowPaymentStep(false);
      } else {
        setMessage(data.message || "Registration failed.");
        setSuccess(false);
      }
    } catch {
      setMessage("Could not connect to server.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  if (!event || !paymentInfo) {
    return <div style={styles.page}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <h1 style={styles.pageTitle}>Login Required</h1>
        <p style={styles.subtitle}>You must be logged in to register for this event.</p>
        <p>
          <a href="/login" style={styles.link}>Click here to login.</a>
        </p>
        <div style={styles.card}>
          <h2>{event.title}</h2>
          <p>{event.description}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Date:</strong> {event.date}</p>
          <p><strong>Price:</strong> {event.price === 0 ? "Free" : `PHP ${event.price}`}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Register for Event</h1>

      <div style={styles.card}>
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <p><strong>Location:</strong> {event.location}</p>
        <p><strong>Date:</strong> {event.date}</p>
        <p><strong>Price:</strong> {event.price === 0 ? "Free" : `PHP ${event.price}`}</p>
      </div>

      {!showPaymentStep ? (
        <form onSubmit={handleProceedToPayment} style={styles.card}>
          <h2 style={styles.sectionTitle}>Participant Information</h2>

          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={fullName}
              readOnly
              style={{ ...styles.input, ...styles.disabledInput }}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              readOnly
              style={{ ...styles.input, ...styles.disabledInput }}
            />
          </div>

          <p style={styles.helpText}>
            You are registered using this account. If you need a different account, please log out and sign in with the correct email.
          </p>

          <button type="submit" style={{ ...styles.button, background: "#2563eb" }}>
            Pay & Register
          </button>

          {message && (
            <p style={{ ...styles.message, color: "red" }}>
              {message}
            </p>
          )}
        </form>
      ) : (
        <form onSubmit={handleSubmitPayment} style={styles.card}>
          <h2>Payment Method</h2>
          <p><strong>Send payment to:</strong> {paymentInfo.payment_number || paymentInfo.number}</p>

              <div style={styles.qrWrapper}>
            <img
              src={paymentInfo.payment_qr_filename ? `http://localhost:5000/uploads/${paymentInfo.payment_qr_filename}` : `data:image/png;base64,${paymentInfo.payment_qr_data}`}
              alt="Payment QR"
              style={styles.qrImage}
              onClick={() => setQrExpanded(true)}
            />
            <p style={styles.helpText}>
              Tap the QR image to enlarge for easier scanning.
            </p>
          </div>
          {qrExpanded && (
            <div style={styles.qrOverlay} onClick={() => setQrExpanded(false)}>
              <div style={styles.qrModal} onClick={(e) => e.stopPropagation()}>
                <img
                  src={paymentInfo.payment_qr_filename ? `http://localhost:5000/uploads/${paymentInfo.payment_qr_filename}` : `data:image/png;base64,${paymentInfo.payment_qr_data}`}
                  alt="Payment QR"
                  style={styles.qrLargeImage}
                />
                <button style={styles.closeButton} onClick={() => setQrExpanded(false)}>
                  Close
                </button>
              </div>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Choose Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={styles.input}
            >
              <option value="GCash">GCash</option>
              <option value="PayMaya">PayMaya</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {paymentMethod !== "Cash" && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Reference Code</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Upload Screenshot Proof of Payment</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  required
                  style={styles.fileInput}
                />
              </div>
            </>
          )}

          {paymentMethod === "Cash" && (
            <p style={{ color: "orange", marginBottom: "15px" }}>
              Pay onsite. No reference code or screenshot proof is required.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              background: loading ? "#94a3b8" : "#059669"
            }}
          >
            {loading ? "Submitting..." : "Submit Payment"}
          </button>

          {message && (
            <p style={{ ...styles.message, color: success ? "#047857" : "#b91c1c" }}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "40px",
    maxWidth: "860px",
    margin: "0 auto"
  },
  pageTitle: {
    margin: 0,
    fontSize: "2.2rem",
    marginBottom: "12px"
  },
  subtitle: {
    color: "#475569",
    marginBottom: "24px"
  },
  card: {
    background: "white",
    padding: "26px",
    borderRadius: "18px",
    boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
    marginBottom: "30px"
  },
  sectionTitle: {
    margin: "0 0 22px",
    fontSize: "1.35rem"
  },
  field: {
    marginBottom: "20px"
  },
  label: {
    display: "block",
    marginBottom: "10px",
    fontWeight: 600,
    color: "#334155"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    outline: "none",
    background: "#f8fafc",
    color: "#111827"
  },
  disabledInput: {
    background: "#f3f4f6",
    cursor: "not-allowed"
  },
  fileInput: {
    width: "100%",
    marginTop: "8px"
  },
  button: {
    padding: "12px 24px",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 700
  },
  qrWrapper: {
    marginTop: "15px",
    marginBottom: "20px",
    textAlign: "center"
  },
  qrImage: {
    width: "100%",
    maxWidth: "320px",
    height: "auto",
    objectFit: "contain",
    border: "1px solid #e2e8f0",
    padding: "12px",
    cursor: "pointer",
    borderRadius: "18px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)"
  },
  helpText: {
    marginTop: "10px",
    color: "#475569",
    fontSize: "0.95rem"
  },
  message: {
    marginTop: "18px",
    fontWeight: 700
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 600
  },
  qrOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  },
  qrModal: {
    background: "white",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    maxWidth: "100%",
    maxHeight: "100%",
    textAlign: "center"
  },
  qrLargeImage: {
    width: "min(90vw, 520px)",
    height: "min(90vw, 520px)",
    objectFit: "contain",
    borderRadius: "14px",
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



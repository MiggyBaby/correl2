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

  useEffect(() => {
    async function loadPageData() {
      try {
        const [eventRes, paymentRes] = await Promise.all([
          fetch(`http://localhost:5000/api/events/${id}`),
          fetch("http://localhost:5000/api/payment-info")
        ]);

        const eventData = await eventRes.json();
        const paymentData = await paymentRes.json();

        setEvent(eventData);
        setPaymentInfo(paymentData);
      } catch (error) {
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
    } catch (error) {
      setMessage("Could not connect to server.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  if (!event || !paymentInfo) {
    return <div style={{ padding: "40px" }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
        <h1>Login Required</h1>
        <p>You must be logged in to register for this event.</p>
        <p>
          <a href="/login" style={{ color: "#2563eb" }}>Click here to login.</a>
        </p>
        <div style={styles.card}>
          <h2>{event.title}</h2>
          <p>{event.description}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Date:</strong> {event.date}</p>
          <p><strong>Price:</strong> {event.price === 0 ? "Free" : `₱${event.price}`}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Register for Event</h1>

      <div style={styles.card}>
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <p><strong>Location:</strong> {event.location}</p>
        <p><strong>Date:</strong> {event.date}</p>
        <p><strong>Price:</strong> {event.price === 0 ? "Free" : `₱${event.price}`}</p>
      </div>

      {!showPaymentStep ? (
        <form onSubmit={handleProceedToPayment} style={styles.card}>
          <h2>Participant Information</h2>

          <div style={{ marginBottom: "15px" }}>
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              readOnly
              style={{ ...styles.input, background: "#f3f4f6", cursor: "not-allowed" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              readOnly
              style={{ ...styles.input, background: "#f3f4f6", cursor: "not-allowed" }}
            />
          </div>

          <p style={{ color: "#1f2937", marginBottom: "20px" }}>
            You are registered using this account. If you need a different account, please log out and sign in with the correct email.
          </p>

          <button type="submit" style={{ ...styles.button, background: "#2563eb" }}>
            Pay & Register
          </button>

          {message && (
            <p style={{ marginTop: "15px", fontWeight: "bold", color: "red" }}>
              {message}
            </p>
          )}
        </form>
      ) : (
        <form onSubmit={handleSubmitPayment} style={styles.card}>
          <h2>Payment Method</h2>
          <p><strong>Send payment to:</strong> {paymentInfo.payment_number}</p>

          <div style={{ marginTop: "15px", marginBottom: "20px" }}>
            <img
              src={`data:image/png;base64,${paymentInfo.payment_qr_data}`}
              alt="Payment QR"
              style={{ width: "220px", height: "220px", border: "1px solid #ccc", padding: "10px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Choose Payment Method</label>
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
              <div style={{ marginBottom: "15px" }}>
                <label>Reference Code</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label>Upload Screenshot Proof of Payment</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  required
                  style={{ marginTop: "8px" }}
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
            <p style={{ marginTop: "15px", fontWeight: "bold", color: success ? "green" : "red" }}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    marginBottom: "30px"
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    borderRadius: "6px",
    border: "1px solid #ccc"
  },
  button: {
    padding: "10px 20px",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  }
};



import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Processing payment confirmation...");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function confirmPayment() {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        setMessage("Missing Stripe session ID. Please return to the event registration page.");
        setSuccess(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/complete-stripe-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ session_id: sessionId })
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage(data.message || "Failed to confirm payment.");
          setSuccess(false);
        } else {
          setMessage(data.message || "Payment completed successfully. Your ticket has been issued.");
          setSuccess(true);
        }
      } catch {
        setMessage("Unable to reach the server. Please try again.");
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    }

    confirmPayment();
  }, [searchParams]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Stripe Payment</h1>
        {loading ? (
          <p style={styles.subtitle}>Please wait while we confirm your payment.</p>
        ) : (
          <>
            <p style={{ ...styles.message, color: success ? "#047857" : "#b91c1c" }}>
              {message}
            </p>
            <div style={styles.buttonRow}>
              <Link to="/my-tickets" style={styles.primaryButton}>
                View My Tickets
              </Link>
              <Link to="/events" style={styles.secondaryButton}>
                Browse Events
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "40px",
    maxWidth: "720px",
    margin: "0 auto"
  },
  card: {
    background: "white",
    padding: "32px",
    borderRadius: "18px",
    boxShadow: "0 18px 50px rgba(15,23,42,0.08)"
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    marginBottom: "16px"
  },
  subtitle: {
    color: "#475569"
  },
  message: {
    marginTop: "20px",
    fontWeight: 700
  },
  buttonRow: {
    marginTop: "30px",
    display: "flex",
    gap: "14px",
    flexWrap: "wrap"
  },
  primaryButton: {
    background: "#dc2626",
    color: "white",
    padding: "12px 20px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 700
  },
  secondaryButton: {
    background: "#fde8ea",
    color: "#991b1b",
    padding: "12px 20px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 700
  }
};

import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Register from "./pages/Register";
import PaymentSuccess from "./pages/PaymentSuccess";
import AIAssistant from "./pages/AIAssistant";
import AdminDashboard from "./pages/AdminDashboard";
import MyTickets from "./pages/MyTickets";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#fdf2f8", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/register/:id" element={<Register />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}










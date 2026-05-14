import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import MyTickets from "./pages/MyTickets";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/register/:id" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}










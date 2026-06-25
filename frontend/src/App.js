// src/App.js
import React from "react";
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider
import Home from "./pages/Home";
import About from "./components/About";
import Login from "./components/Login";
import UserAccount from "./pages/Useraccount";
import AddCar from "./components/Addcar";
import Register from "./components/Register";
import Navbar from "./components/Navbar"; 
import Footer from "./components/Footer";
import Help from "./components/Help";
import Contact from "./components/Contact";
import RenterDashboard from "./pages/RenterDashboard"; // Import the new Renter Dashboard component
import CarDetail from "./components/CarDetail"; // Import CarDetail component
import UserDashboard from "./pages/UserDashboard"; // Import UserDashboard component
import PaymentPage from "./components/PaymentPage"; // Import PaymentPage component
import AdminDashboard from "./pages/AdminDashboard"; // Import AdminDashboard component
import ProviderDashboard from "./pages/ProviderDashboard"; // Import ProviderDashboard component
import Wallet from "./pages/Wallet"; // Import Wallet component
import CartPage from "./pages/CartPage"; // Import CartPage component

function App() {
  return (
    <div className="app-container-full">
      <Router>
        <AuthProvider> {/* Wrap the entire app with AuthProvider */}
          <div className="app-main-layout">
            <Navbar />
            <main className="app-main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/help" element={<Help />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/addcar" element={<AddCar />} />
                <Route path="/account" element={<UserAccount />} />
                <Route path="/renter-dashboard" element={<RenterDashboard />} />
                <Route path="/provider-dashboard" element={<ProviderDashboard />} />
                <Route path="/car/:id" element={<CarDetail />} />
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/payment/:bookingId" element={<PaymentPage />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/cart" element={<CartPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
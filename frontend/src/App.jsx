import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 p-4 bg-white shadow">
        <Link to="/" className="text-blue-600">
          Home
        </Link>
        <Link to="/dashboard" className="text-blue-600">
          Dashboard
        </Link>
        <Link to="/settings" className="text-blue-600">
          Settings
        </Link>
      </nav>

      <div className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

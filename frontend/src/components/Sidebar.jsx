// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../App.css';

export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = () => {
    if (onMobileClose) onMobileClose();
  };

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${!mobileOpen && collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && <div className="brand">Main menu</div>}
        <button
          className="toggle-btn"
          onClick={() => setCollapsed(prev => !prev)}
          aria-label="Toggle sidebar"
          aria-expanded={collapsed}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-hidden={collapsed}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          tabIndex={collapsed ? -1 : 0}
          aria-disabled={collapsed}
          onClick={(e) => {
            if (collapsed) e.preventDefault();
            handleNavClick();
          }}
        >
          <span className="nav-text">Trang chính</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          tabIndex={collapsed ? -1 : 0}
          aria-disabled={collapsed}
          onClick={(e) => {
            if (collapsed) e.preventDefault();
            handleNavClick();
          }}
        >
          <span className="nav-text">Lịch sử</span>
        </NavLink>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <small>© Vigilant IoT</small>
        </div>
      )}

      {/* visual guard when collapsed: covers the thin bar area so colors blend */}
      {collapsed && <div className="collapse-guard" aria-hidden="true" />}
    </aside>
  );
}

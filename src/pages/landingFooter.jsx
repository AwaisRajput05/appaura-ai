import React from 'react';
import { Link } from 'react-router-dom';
import AppauraLogo from '../assets/appauralogos.png';

export default function Footer() {
  return (
    <footer style={{ background: "#111827", color: "white", padding: "48px 0 32px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 3-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.8fr 1fr", gap: "48px", alignItems: "start" }}>
          
          {/* COLUMN 1 - Logo + description + bullet list */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <div style={{ background: "white", padding: "6px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={AppauraLogo} alt="App Aura Logo" style={{ height: "28px", width: "auto" }} />
              </div>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>App Aura</span>
            </div>
            
            <p style={{ color: "#D1D5DB", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
              Empowering businesses with intelligent analytics and vendor management solutions.
            </p>
            
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              <li style={{ fontSize: "13px", color: "#9CA3AF", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#10B981" }}>✓</span> Track daily payments and expenses in one view
              </li>
              <li style={{ fontSize: "13px", color: "#9CA3AF", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#10B981" }}>✓</span> View detailed cash inflows and outflows
              </li>
              <li style={{ fontSize: "13px", color: "#9CA3AF", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#10B981" }}>✓</span> Monitor overdue invoices and pending payments
              </li>
              <li style={{ fontSize: "13px", color: "#9CA3AF", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#10B981" }}>✓</span> Forecast revenue and upcoming expenses
              </li>
              <li style={{ fontSize: "13px", color: "#9CA3AF", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#10B981" }}>✓</span> Gain insights with clear financial charts
              </li>
            </ul>
          </div>

          {/* COLUMN 2 - Features with emojis */}
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "24px", color: "white" }}>Features</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#D1D5DB" }}>
                <span style={{ fontSize: "18px" }}>🏦</span> Analytics Dashboard
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#D1D5DB" }}>
                <span style={{ fontSize: "18px" }}>📈</span> Branch Management
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#D1D5DB" }}>
                <span style={{ fontSize: "18px" }}>📊</span> Order Management
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#D1D5DB" }}>
                <span style={{ fontSize: "18px" }}>🔧</span> Supplier Management
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#D1D5DB" }}>
                <span style={{ fontSize: "18px" }}>📉</span> Inventory Tracking
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#D1D5DB" }}>
                <span style={{ fontSize: "18px" }}>👩‍💼</span> AI Assistant
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#D1D5DB" }}>
                <span style={{ fontSize: "18px" }}>💰</span> Revenue Insights
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#D1D5DB" }}>
                <span style={{ fontSize: "18px" }}>💳</span> Cashflow Monitoring
              </div>
            </div>
          </div>

          {/* COLUMN 3 - Support (plain text) */}
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "24px", color: "white" }}>Support</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ fontSize: "14px", color: "#D1D5DB", cursor: "pointer" }}>Documentation</div>
              <div style={{ fontSize: "14px", color: "#D1D5DB", cursor: "pointer" }}>Contact Support</div>
              <div style={{ fontSize: "14px", color: "#D1D5DB", cursor: "pointer" }}>Training</div>
              <div style={{ fontSize: "14px", color: "#D1D5DB", cursor: "pointer" }}>Community</div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div style={{ borderTop: "1px solid #374151", marginTop: "48px", paddingTop: "24px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>
            © 2026 App Aura. | Privacy Policy | Terms of Service | Sitemap
          </p>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 768px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </footer>
  );
}
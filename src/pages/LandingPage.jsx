// src/pages/LandingPage.jsx - WHITE THEME VERSION (matching your images)
import React, { useState } from "react";
import {
  FiTrendingUp,
  FiShield,
  FiArrowRight,
  FiCheckCircle,
  FiEye,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AuthModal from "../components/common/modal/AuthModal";
import Footer from "./landingFooter";
import AppauraLogo from "../assets/appauralogos.png";

// ─── Illustration Card Components (WHITE BACKGROUND) ────────────────────────

function AnalyticsCard() {
  const bars = [45, 55, 35, 62, 48, 72, 38, 52];
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 w-full max-w-sm shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#30426B] to-[#5A75C7] flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div>
          <div className="text-gray-800 font-semibold text-sm">Live Analytics</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-green-600 text-xs">All systems online</span>
          </div>
        </div>
        <div className="ml-auto text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0">Today</div>
      </div>

      {/* Bar Chart - BRANCH REVENUE (K) */}
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">BRANCH REVENUE (K)</div>
      <div className="flex items-end gap-2 h-24 mb-1">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm transition-all duration-300"
              style={{
                height: `${h}px`,
                background: i === 2 ? '#f59e0b' : i === 6 ? '#ef4444' : '#3b82f6',
              }}
            />
            <span className="text-[8px] text-gray-400">{i === 7 ? 'B8' : `B${i+1}`}</span>
          </div>
        ))}
      </div>

      {/* Suspicious Activity Alert */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-red-500 text-sm">⚠️</span>
          <span className="text-red-600 text-xs font-semibold">Suspicious Activity Detected</span>
        </div>
        <div className="text-gray-600 text-[11px] mb-0.5">Spike in sales detected at Branch B3</div>
        <div className="text-gray-400 text-[10px] mb-2">2 min ago • Branch B3</div>
        <button className="bg-amber-400 text-white text-[10px] font-bold px-3 py-1 rounded-full hover:bg-amber-500 transition">
          Investigate
        </button>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="text-gray-500 text-[9px] uppercase tracking-wide">TOTAL REVENUE</div>
          <div className="text-gray-900 font-bold text-lg mt-0.5">48.2K</div>
          <div className="text-green-600 text-[10px] flex items-center gap-1">
            <span>↑</span> 12% this month
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="text-gray-500 text-[9px] uppercase tracking-wide">ACTIVE BRANCHES</div>
          <div className="text-gray-900 font-bold text-lg mt-0.5">6 / 6</div>
          <div className="text-green-600 text-[10px]">All performing</div>
        </div>
      </div>
    </div>
  );
}

function BranchNetworkCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 w-full max-w-sm shadow-xl">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">BRANCHES NETWORK</div>
      <div className="text-gray-800 font-semibold text-sm mb-3">6 locations, one platform</div>

      <div className="relative bg-gray-50 rounded-xl p-4">
        {/* Simple branch network visualization */}
        <div className="flex flex-col items-center">
          {/* HQ - Center */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#30426B] to-[#5A75C7] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">HQ</span>
            </div>
          </div>
          
          {/* Branches around */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {['Br 1', 'Br 2', 'Br 3', 'Br 4', 'Br 5', 'Br 6'].map((branch, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#5A75C7] flex items-center justify-center mx-auto mb-1 shadow-sm">
                  <span className="text-[#30426B] text-xs font-medium">{branch}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Callout: 6 Branch Locations */}
        <div className="absolute top-2 right-2 bg-white rounded-xl shadow-lg px-3 py-2 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-blue-600 text-sm">🏢</span>
            <span className="text-gray-800 font-bold text-xs">6 Branch Locations</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-gray-500 text-[10px]">All active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportingCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 w-full max-w-sm shadow-xl">
      {/* Header with window dots */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-2 text-gray-600 text-sm font-medium">Sales Report</span>
      </div>

      {/* Revenue */}
      <div className="mb-4">
        <div className="text-gray-500 text-xs mb-1">REVENUE</div>
        <div className="text-gray-900 text-3xl font-bold">48.2K</div>
      </div>

      {/* Growth */}
      <div className="mb-4">
        <div className="text-gray-500 text-xs mb-1">GROWTH</div>
        <div className="text-green-600 text-2xl font-bold">↑ 20%</div>
      </div>

      {/* Branches */}
      <div className="mb-6">
        <div className="text-gray-500 text-xs mb-1">BRANCHES</div>
        <div className="text-gray-900 text-2xl font-bold">6</div>
      </div>

      {/* Export Button */}
      <button className="w-full bg-gradient-to-r from-[#30426B] to-[#5A75C7] text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Export PDF
      </button>
    </div>
  );
}

function OrderManagementCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 w-full max-w-sm shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#30426B] to-[#5A75C7] flex items-center justify-center flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
        </div>
        <div>
          <div className="text-gray-800 font-semibold text-sm">Order Management</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-green-600 text-xs">All systems online</span>
          </div>
        </div>
        <div className="ml-auto text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0">Today</div>
      </div>

      {/* Order Status Overview */}
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">ORDER STATUS OVERVIEW</div>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          ["128", "Placed", "#3b82f6"],
          ["86", "Processing", "#f59e0b"],
          ["64", "Shipped", "#10b981"],
          ["102", "Delivered", "#22c55e"],
        ].map(([num, label, color]) => (
          <div key={label} className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
            <div className="font-bold text-lg" style={{ color }}>{num}</div>
            <div className="text-gray-500 text-[9px] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Order Trend Chart - Simple bar chart */}
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">ORDER TREND (LAST 6 MONTHS)</div>
      <div className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-end justify-between h-24 gap-2">
          {[
            { month: "Jan", value: 45 },
            { month: "Feb", value: 52 },
            { month: "Mar", value: 48 },
            { month: "Apr", value: 62 },
            { month: "May", value: 58 },
            { month: "Jun", value: 72 },
          ].map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm bg-gradient-to-t from-[#30426B] to-[#5A75C7]"
                style={{ height: `${item.value}px` }}
              />
              <span className="text-[8px] text-gray-400">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CashflowCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 w-full max-w-sm shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#30426B] to-[#5A75C7] flex items-center justify-center flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <div>
          <div className="text-gray-800 font-semibold text-sm">Cashflow</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-green-600 text-xs">Automated tracking enabled</span>
          </div>
        </div>
        <div className="ml-auto text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0">Today</div>
      </div>

      {/* Cashflow Overview */}
      <div className="mb-4">
        <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">CASHFLOW OVERVIEW</div>
        <div className="text-gray-900 text-2xl font-bold">Rs 87.2K</div>
        <div className="text-green-600 text-xs flex items-center gap-1 mt-0.5">
          <span>↑</span> 12% this month
        </div>
      </div>

      {/* Inflows/Outflows labels */}
      <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wide mb-2">
        <span>Inflows</span>
        <span>Outflows</span>
        <span>Net Cashflow</span>
      </div>

      {/* Simple chart representation */}
      <div className="bg-gray-50 rounded-xl p-3 mb-3">
        <div className="flex items-end justify-between h-20 gap-1">
          {[65, 45, 70, 50, 55, 40, 60, 35, 45, 30].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full bg-green-500 rounded-sm" style={{ height: `${val * 0.6}px` }} />
              <div className="w-full bg-amber-500 rounded-sm" style={{ height: `${(val - 15) * 0.6}px` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Today and Orders */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <div className="text-gray-500 text-xs">Today</div>
        <div className="text-right">
          <div className="text-gray-600 text-xs">Apr 125 Orders</div>
          <div className="text-green-600 text-sm font-bold">+15%</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = () => navigate("/auth/login");
  const handleFreeTrial = () => navigate("/start-trial");
  const openAuthModal = (mode) => {
    if (mode === "login") navigate("/auth/login");
    if (mode === "signup") navigate("/auth/signup");
  };

  const stats = [
    { number: "99.9%", label: "Uptime", icon: <FiTrendingUp />, desc: "Always online" },
    { number: "24/7", label: "Support", icon: <FiShield />, desc: "Round the clock" },
    { number: "100%", label: "Data Safety", icon: <FiCheckCircle />, desc: "Encrypted & secure" },
    { number: "24/7", label: "Monitoring", icon: <FiEye />, desc: "Live oversight" },
  ];

  const gradient = "bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7]";

  const features = [
    {
      tag: "Analytics",
      staticLine: "Your entire operation,",
      typedLine: "visible at a glance.",
      body: "Real-time dashboards that surface what matters — revenue, branch performance, and inventory — without the noise.",
      points: [
        "Track live sales data across all branches",
        "Get instant alerts on anomalies and spikes",
        "Investigate suspicious activity in real time",
        "Visualize revenue trends with clear charts",
        "Monitor branch performance on one screen",
      ],
      illustration: <AnalyticsCard />,
    },
    {
      tag: "Branch Management",
      staticLine: "All your branches.",
      typedLine: "One command center.",
      body: "Monitor every location in real time. Spot underperformance early and act with data you can trust.",
      points: [
        "Real-time branch network overview",
        "Identify top-performing branches",
        "Pinpoint underperforming locations",
        "Visualize sales distribution across branches",
        "Compare branch performance metrics",
      ],
      illustration: <BranchNetworkCard />,
    },
    {
      tag: "Reporting",
      staticLine: "Professional reports.",
      typedLine: "In one click.",
      body: "From daily snapshots to quarterly summaries — PDF-ready reports in seconds, built to share with your team.",
      points: [
        "One-click PDF export",
        "Automated quarterly & monthly summaries",
        "Custom date range filtering",
        "Shareable, professional PDF reports",
        "Save time and boost productivity",
      ],
      illustration: <ReportingCard />,
    },
    {
      tag: "Order Management",
      staticLine: "Take control of every order,",
      typedLine: "from supplier to shelf.",
      body: "Streamline purchase orders, track deliveries in real time, and manage suppliers — all in one intelligent dashboard.",
      points: [
        "Centralized purchase order management",
        "Real-time order tracking from start to finish",
        "Supplier performance and history insights",
        "Smart, stock-linked reordering to prevent shortages",
        "Complete visibility across all supplier orders",
      ],
      illustration: <OrderManagementCard />,
    },
    {
      tag: "Cashflow",
      staticLine: "Monitor your",
      typedLine: "cash flow.",
      body: "Optimize working capital with smart, real-time financial tracking.",
      points: [
        "Track daily payments and expenses in one view",
        "View detailed cash inflows and outflows",
        "Monitor overdue invoices and pending payments",
        "Forecast revenue and upcoming expenses",
        "Gain insights with clear financial charts",
      ],
      illustration: <CashflowCard />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">

      {/* ── Navbar ── */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl">
        <div className="bg-white/70 backdrop-blur-md rounded-full px-4 py-2.5 shadow-md border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src={AppauraLogo} alt="AppauraLogo" className="h-8 w-auto object-contain" />
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={handleSignIn}
                className="px-4 py-1.5 text-sm text-gray-700 font-medium rounded-full hover:bg-white/40 transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => openAuthModal("signup")}
                className={`${gradient} text-white px-4 py-1.5 text-sm font-medium rounded-full shadow-md hover:opacity-90 transition-opacity`}
              >
                Get Started
              </button>
            </div>
            <button className="md:hidden p-1.5 rounded-full bg-white/50" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
          {isMenuOpen && (
            <div className="md:hidden mt-2 bg-white/80 rounded-2xl p-3 shadow-md border border-white/10">
              <div className="flex flex-col space-y-2">
                <div className="border-t border-gray-200 pt-2 flex flex-col space-y-2">
                  <button
                    onClick={handleFreeTrial}
                    className="px-3 py-2 text-center text-sm text-[#30426B] font-semibold rounded-lg border border-[#30426B]/30"
                  >
                    Free Trial
                  </button>
                  <button
                    onClick={handleSignIn}
                    className="px-3 py-2 text-center text-sm text-gray-700 font-medium rounded-lg bg-white/50"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => openAuthModal("signup")}
                    className={`${gradient} text-white px-3 py-2 text-center text-sm font-medium rounded-lg shadow-md`}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative min-h-screen flex items-center overflow-hidden bg-white pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-[#30426B] mb-6">
            <span className="w-2 h-2 bg-[#30426B] rounded-full mr-2" />
            AI-Powered Pharmacy Platform
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-[#30426B] mb-6 leading-tight">
            Manage Your Pharmacy
            <br />
            <span className="text-[#5A75C7]">Intelligently</span>
          </h1>

          {/* Sub-heading */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Analytics, branch tracking, medicine recommendations, and instant reports — all in one platform built for pharmacy vendors.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button
              onClick={() => openAuthModal("signup")}
              className="bg-gradient-to-r from-[#30426B] to-[#5A75C7] text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:opacity-90 transition-opacity"
            >
              Get Started <FiArrowRight className="inline ml-2" />
            </button>
            <button
              onClick={handleSignIn}
              className="px-8 py-3 bg-white text-gray-600 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow"
            >
              Sign In
            </button>
          </div>

          {/* Stats */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="bg-gray-50 rounded-xl shadow-sm p-5 text-center hover:shadow-md transition-shadow">
                  <div className="flex justify-center mb-3">
                    <div className="bg-gradient-to-r from-[#30426B] to-[#5A75C7] p-3 rounded-full">
                      <div className="text-white text-xl">{stat.icon}</div>
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-[#30426B] mb-1">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Features Section ── */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center py-16 border-b border-gray-100 last:border-0`}
            >
              {/* Text side */}
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-4">
                  {feature.tag}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#30426B] mb-4 leading-tight">
                  {feature.staticLine}<br />
                  <span className="text-[#5A75C7]">{feature.typedLine}</span>
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">{feature.body}</p>
                <ul className="space-y-2.5 mb-8">
                  {feature.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-gray-700">
                      <span className="w-1.5 h-1.5 bg-[#5A75C7] rounded-full mt-2 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
                {/* Free Trial CTA inside each feature */}
                <button
                  onClick={handleFreeTrial}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#5A75C7] border border-[#5A75C7]/30 px-5 py-2 rounded-full hover:bg-[#5A75C7]/5 transition-colors"
                >
                  Start Free Trial <FiArrowRight />
                </button>
              </div>

              {/* Illustration side */}
              <div className="flex-1 flex justify-center">
                {feature.illustration}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Free Trial CTA Banner ── */}
      <div className="py-20 bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your pharmacy?
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
            14-day free trial. No credit card required. No setup fee. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleFreeTrial}
              className="bg-white text-[#30426B] px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-shadow"
            >
              Start Free Trial — It's Free
            </button>
            <button
              onClick={handleSignIn}
              className="border border-white/40 text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      <Footer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </div>
  );
}
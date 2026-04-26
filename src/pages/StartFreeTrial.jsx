import React, { useState, useRef, useEffect } from "react";
import {
  Check, Star, Rocket, Lock, Zap, Building2,
  User, Users, Network, Crown, UserCheck,
  Settings, Tag, ChevronDown, ChevronUp,
  Mail, BarChart2, Package, ShoppingCart,
  Search, TrendingUp, Truck, Shield, GitBranch,
  DollarSign, Gift, Database, FileText, Minus, ChevronRight, X, Menu,
  Calendar, BookOpen, Layers
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "./landingFooter";
import AppauraLogo from "../assets/appauralogos.png";

const G = "linear-gradient(135deg,#2d3f6b 0%,#3a5290 55%,#5470c0 100%)";
const BLUE = "#2563eb";
const DARK_BLUE = "#1e3a8a";

/* ── Plan card features (as shown in design image) ── */
const PLAN_FEATURES = {
  "Free Trial": [
    { text: "Up to 1 Branch", bold: false },
    { text: "100 Transactions", bold: false },
    { text: "Point of Sale", bold: false },
    { text: "Order Status", bold: false },
    { text: "Expiry Management Basic Search", bold: false },
    { text: "Inventory", bold: false },
    { text: "Sales Report", bold: false },
    { text: "Basic Reports", bold: false },
  ],
  "Individual": [
    { text: "Up to 1 Branch", bold: false },
    { text: "2500 Transactions (Each Branch)", bold: false },
    { text: "Individual Branch View", bold: false },
    { text: "Sales Report", bold: false },
    { text: "Basic & Advanced Search", bold: false },
    { text: "Inventory Management", bold: false },
    { text: "Medicine Price Comparison", bold: false, dim: true },
    { text: "User Management", bold: false },
    { text: "Progress Reports", bold: false },
  ],
  "Basic": [
    { text: "Up to 5 Branches", bold: false },
    { text: "3000 Transactions (Each Branch)", bold: false },
    { text: "Order Status", bold: false },
    { text: "Order Acknowledgement / Discrepancy", bold: false },
    { text: "Main Branch View", bold: false },
    { text: "Sub-Branches View", bold: false },
    { text: "Sales Report", bold: false },
    { text: "Expiry Management", bold: false },
    { text: "Search", bold: false },
    { text: "Inventory Management & Multiple branches", bold: false, dim: true },
    { text: "Progress Reports", bold: false },
  ],
  "Pro": [
    { text: "Up to 10 Branches", bold: true },
    { text: "5000 Transactions (Each Branch)", bold: true },
    { text: "Order Status", bold: false },
    { text: "Order Acknowledgement / Discrepancy", bold: false },
    { text: "Main Branch View", bold: false },
    { text: "Sub-Branches View", bold: false },
    { text: "Sales Report", bold: false },
    { text: "Expiry Management", bold: false },
    { text: "Search", bold: false },
    { text: "Inventory Management & Multiple branches", bold: false },
    { text: "Permissions Management", bold: false },
    { text: "Progress Reports", bold: false },
    { text: "Role-based Access", bold: false },
  ],
  "Enterprise": [
    { text: "Unlimited Branches", bold: false },
    { text: "Unlimited Transactions", bold: false },
    { text: "Order Status", bold: false },
    { text: "Order Acknowledgement / Discrepancy", bold: false },
    { text: "Main Branch View / All Sub-Branches View", bold: false },
    { text: "Sales Report (Daily/Weekly/Monthly/Yearly & Custom)", bold: false },
    { text: "Inventory Management & Advanced Search Across All Branches Search", bold: false },
    { text: "Sub Branches Management", bold: false },
    { text: "Medicine Price Comparison", bold: false },
    { text: "User Management & Autoposting", bold: false },
    { text: "Progress Reports", bold: false },
    { text: "Role-based Access", bold: false },
  ],
};

/* ── Complete Features table data ── */
const COMPLETE_FEATURES = [
  {
    Icon: ShoppingCart,
    name: "Point of Sales (POS)",
    desc: "Sell & return medicine, invoices, payments, customers, discounts, tax, advance & credit.",
    availability: { "Free Trial": true, "Individual": true, "Basic": true, "Pro": true, "Enterprise": true },
  },
  {
    Icon: Search,
    name: "Search",
    desc: "Find by name, ingredient, manufacturer, type, side effects, age restriction & more.",
    availability: { "Free Trial": true, "Individual": true, "Basic": true, "Pro": true, "Enterprise": true },
  },
  {
    Icon: Package,
    name: "Inventory",
    desc: "Medicine & stock management, transfers, supply, expiry & low stock alerts.",
    availability: { "Free Trial": true, "Individual": true, "Basic": true, "Pro": true, "Enterprise": true },
  },
  {
    Icon: BarChart2,
    name: "Sales Report",
    desc: "Sales forecast, trends, top-selling medicines, profit margin & comparisons.",
    availability: { "Free Trial": true, "Individual": true, "Basic": true, "Pro": true, "Enterprise": true },
  },
  {
    Icon: FileText,
    name: "Orders",
    desc: "Place orders, track status, supplier orders & order management.",
    availability: { "Free Trial": true, "Individual": true, "Basic": true, "Pro": true, "Enterprise": true },
  },
  {
    Icon: GitBranch,
    name: "Manage Branches",
    desc: "Add, view & manage multiple branches, branch-wise access & control.",
    availability: { "Free Trial": false, "Individual": false, "Basic": true, "Pro": true, "Enterprise": true },
  },
  {
    Icon: Truck,
    name: "Manage Suppliers",
    desc: "Supplier management, track payments, performance & balances.",
    availability: { "Free Trial": false, "Individual": false, "Basic": false, "Pro": true, "Enterprise": true },
  },
  {
    Icon: Database,
    name: "Quick File Upload (CSV)",
    desc: "Upload any CSV data record in one click (Products, Stock, Orders, Customers & More).",
    availability: { "Free Trial": false, "Individual": false, "Basic": false, "Pro": true, "Enterprise": true },
  },
  {
    Icon: Calendar,
    name: "Schedule",
    desc: "Schedule reminders, medicine alerts, follow-ups & operational tasks.",
    availability: { "Free Trial": true, "Individual": false, "Basic": false, "Pro": true, "Enterprise": true },
  },
  {
    Icon: DollarSign,
    name: "Cashbook Flow",
    desc: "Track all cash inflows & outflows, view balance, daily/monthly summary.",
    availability: { "Free Trial": true, "Individual": false, "Basic": false, "Pro": true, "Enterprise": true },
  },
];

const PLANS_DATA = [
  {
    name: "Free Trial",
    price: 0,
    duration: "14 days",
    tagline: "Test the features for startup pharmacy",
    cta: "START FREE TRIAL",
    ctaStyle: "outline",
    badge: null,
    accentColor: "#2563eb",
    highlight: false,
  },
  {
    name: "Individual",
    price: 2500,
    tagline: "For single branch pharmacies",
    cta: "GET INDIVIDUAL",
    ctaStyle: "outline",
    badge: null,
    accentColor: "#2563eb",
    highlight: false,
  },
  {
    name: "Basic",
    price: 3000,
    tagline: "Essential tools for startup pharmacies",
    cta: "GET BASIC",
    ctaStyle: "outline",
    badge: null,
    accentColor: "#2563eb",
    highlight: false,
  },
  {
    name: "Pro",
    price: 3500,
    tagline: "Advanced tools for growing pharmacies",
    cta: "GET PRO",
    ctaStyle: "solid-blue",
    badge: "MOST POPULAR",
    badgeColor: "#2563eb",
    accentColor: "#2563eb",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: 4000,
    tagline: "Full scalability for pharmacy chains",
    cta: "GET ENTERPRISE",
    ctaStyle: "solid-green",
    badge: "BEST VALUE",
    badgeColor: "#16a34a",
    accentColor: "#16a34a",
    highlight: false,
    isEnterprise: true,
  },
];

const INCLUDED = [
  { Icon: Lock, title: "Auth & Security", items: ["Email/password login", "Role-based access control", "MFA support", "Session history"] },
  { Icon: Zap, title: "Core Platform", items: ["Responsive design", "Dark / light mode", "Mobile-friendly", "Command palette (Ctrl+K)"] },
  { Icon: Package, title: "Data Tools", items: ["Excel / PDF / CSV export", "CSV bulk import", "Webhook & API integration", "Advanced filters"] },
  { Icon: BarChart2, title: "Utilities", items: ["Invoice & receipt printing", "Toast notifications", "Drag & drop upload", "Keyboard shortcuts"] },
];

const FAQS = [
  { q: "Can I switch plans anytime?", a: "Yes — upgrade or downgrade anytime. Changes take effect on your next billing cycle." },
  { q: "Is there a setup fee?", a: "None. Every plan includes free onboarding, guided tutorials, and 24/7 support." },
  { q: "What payment methods do you accept?", a: "Cash, Bank Card, Bank Transfer, Mobile Wallet, and Credit are all supported." },
  { q: "Can I add more branches later?", a: "Absolutely. Upgrade as you grow — Enterprise gives you unlimited branches." },
  { q: "Is my data secure?", a: "Yes. Token-based auth, MFA, full encryption, and a 100% data-safety guarantee." },
];

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ── New PlanCard matching design image ── */
function PlanCard({ plan, billing }) {
  const navigate = useNavigate();
  const features = PLAN_FEATURES[plan.name] || [];

  const getBorderStyle = () => {
    if (plan.highlight) return "2px solid #2563eb";
    if (plan.isEnterprise) return "2px solid #16a34a";
    return "1px solid #e2e8f0";
  };

  const getBg = () => {
    if (plan.highlight) return "linear-gradient(180deg,#eff6ff 0%,#ffffff 100%)";
    return "white";
  };

  const getCtaStyle = () => {
    if (plan.ctaStyle === "solid-blue") return { background: "#2563eb", color: "white", border: "none" };
    if (plan.ctaStyle === "solid-green") return { background: "#16a34a", color: "white", border: "none" };
    return { background: "transparent", color: "#2563eb", border: "1.5px solid #bfdbfe" };
  };

  const displayPrice = billing === "yearly" && plan.price > 0
    ? (plan.price * 10).toLocaleString()
    : plan.price === 0 ? "0" : plan.price.toLocaleString();

  return (
    <div style={{
      borderRadius: "16px",
      border: getBorderStyle(),
      background: getBg(),
      boxShadow: plan.highlight
        ? "0 4px 24px rgba(37,99,235,.15)"
        : "0 2px 8px rgba(0,0,0,.05)",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "visible",
      height: "100%",
    }}>
      {/* Badge */}
      {plan.badge && (
        <div style={{
          position: "absolute",
          top: "-14px",
          left: "50%",
          transform: "translateX(-50%)",
          background: plan.badgeColor,
          color: "white",
          fontSize: "10px",
          fontWeight: 700,
          padding: "4px 14px",
          borderRadius: "50px",
          letterSpacing: "0.6px",
          whiteSpace: "nowrap",
          zIndex: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,.15)",
        }}>
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "22px 18px 14px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{
          fontSize: "12px",
          fontWeight: 800,
          color: plan.isEnterprise ? "#16a34a" : "#2563eb",
          letterSpacing: "0.5px",
          marginBottom: "8px",
          fontFamily: "'Sora',sans-serif",
        }}>
          {plan.name.toUpperCase()}
        </div>

        <div style={{ marginBottom: "4px" }}>
          <span style={{ fontSize: "11px", color: "#64748b", marginRight: "2px" }}>Rs</span>
          <span style={{
            fontFamily: "'Sora',sans-serif",
            fontSize: "30px",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1,
          }}>
            {displayPrice}
          </span>
          {plan.price === 0
            ? <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "4px" }}>/{plan.duration}</span>
            : <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "2px" }}>/{billing === "yearly" ? "yr" : "month"}</span>
          }
        </div>

        <p style={{ fontSize: "11.5px", color: "#64748b", lineHeight: 1.5, marginTop: "6px" }}>
          {plan.tagline}
        </p>
      </div>

      {/* Feature list */}
      <div style={{ padding: "14px 18px", flex: 1 }}>
        {features.map((f, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginBottom: "9px",
            opacity: f.dim ? 0.45 : 1,
          }}>
            <Check
              size={13}
              color={plan.isEnterprise ? "#16a34a" : "#2563eb"}
              style={{ flexShrink: 0, marginTop: "1px" }}
            />
            <span style={{
              fontSize: "11.5px",
              color: "#374151",
              lineHeight: 1.5,
              fontWeight: f.bold ? 700 : 400,
            }}>
              {f.text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "14px 18px 18px" }}>
        <button
          onClick={() => navigate('/auth/signup')}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: "8px",
            fontSize: "12.5px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.3px",
            ...getCtaStyle(),
          }}
        >
          {plan.cta}
        </button>
      </div>
    </div>
  );
}

/* ── Complete Features Table ── */
function CompleteFeaturesTable() {
  const cols = ["Free Trial", "Individual", "Basic", "Pro", "Enterprise"];

  return (
    <section style={{ padding: "clamp(40px,7vw,64px) clamp(12px,4vw,20px)", background: "#f8fafc" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Sora',sans-serif",
          fontSize: "clamp(20px,3.5vw,32px)",
          fontWeight: 800,
          color: "#0f172a",
          textAlign: "center",
          letterSpacing: "0.5px",
          marginBottom: "32px",
        }}>
          COMPLETE FEATURES
        </h2>

        <div style={{ overflowX: "auto", borderRadius: "16px", boxShadow: "0 2px 16px rgba(0,0,0,.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: "700px", tableLayout: "fixed" }}>
            {/* Header */}
            <thead>
              <tr>
                <th style={{
                  padding: "14px 20px",
                  textAlign: "left",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#374151",
                  background: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                  width: "30%",
                }}>
                  FEATURE
                </th>
                {cols.map((col) => {
                  const isPro = col === "Pro";
                  const isEnt = col === "Enterprise";
                  return (
                    <th key={col} style={{
                      padding: "14px 8px",
                      textAlign: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: isPro ? "#2563eb" : isEnt ? "#16a34a" : "#f8fafc",
                      color: (isPro || isEnt) ? "white" : "#374151",
                      borderBottom: "2px solid #e2e8f0",
                      letterSpacing: "0.4px",
                      width: "14%",
                    }}>
                      {col.toUpperCase()}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {COMPLETE_FEATURES.map((feat, rowIdx) => (
                <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? "white" : "#f8fafc" }}>
                  {/* Feature cell */}
                  <td style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg,#2563eb,#3b82f6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <feat.Icon size={16} color="white" />
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
                          {feat.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.5 }}>
                          {feat.desc}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Availability cells */}
                  {cols.map((col) => {
                    const isPro = col === "Pro";
                    const isEnt = col === "Enterprise";
                    const available = feat.availability[col];
                    return (
                      <td key={col} style={{
                        padding: "16px 8px",
                        textAlign: "center",
                        borderBottom: "1px solid #f1f5f9",
                        background: isPro
                          ? "rgba(37,99,235,.03)"
                          : isEnt
                          ? "rgba(22,163,74,.03)"
                          : "transparent",
                        width: "14%",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "22px" }}>
                          {available ? (
                            <Check
                              size={18}
                              color={isEnt ? "#16a34a" : "#2563eb"}
                              strokeWidth={2.5}
                            />
                          ) : (
                            <span style={{ color: "#cbd5e1", fontSize: "20px", fontWeight: 300, lineHeight: 1 }}>—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ── Main Page ── */
export default function StartFreeTrialPage() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const w = useWindowWidth();
  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1200;

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleStartTrial = () => {
    if (!email) { setEmailError("Email is required"); return; }
    if (!validateEmail(email)) { setEmailError("Please enter a valid email address"); return; }
    setEmailError("");
    navigate('/auth/signup', { state: { prefillEmail: email, fromTrial: true } });
  };

  const isEmailValid = email && validateEmail(email);

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#f7faff", color: "#1a2545", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .inc-card{background:white;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(30,50,100,.05);border:1px solid #e4ecf6;transition:box-shadow .22s,transform .22s;}
        .inc-card:hover{box-shadow:0 8px 28px rgba(30,50,100,.11);transform:translateY(-2px);}
        .faq-row{border-bottom:1px solid #eef2f8;}
        input::placeholder{color:#bcc5d8;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ani{animation:fadeIn .45s ease both;}
        .ani1{animation-delay:.06s;} .ani2{animation-delay:.12s;} .ani3{animation-delay:.18s;} .ani4{animation-delay:.24s;}
        .pcard{transition:transform .22s,box-shadow .22s;}
        .pcard:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(30,50,100,.13)!important;}
        a{text-decoration:none;}
        .plan-grid::-webkit-scrollbar{height:4px;}
        .plan-grid::-webkit-scrollbar-track{background:#f1f5f9;}
        .plan-grid::-webkit-scrollbar-thumb{background:#bfdbfe;border-radius:4px;}
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{ position: "fixed", top: isMobile ? "8px" : "14px", left: "50%", transform: "translateX(-50%)", zIndex: 100, width: `calc(100% - ${isMobile ? "16px" : "32px"})`, maxWidth: "1280px" }}>
        <div style={{ background: "rgba(255,255,255,.88)", backdropFilter: "blur(18px)", borderRadius: "50px", padding: isMobile ? "8px 12px" : "8px 20px", boxShadow: "0 4px 20px rgba(30,50,100,.1)", border: "1px solid rgba(255,255,255,.35)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0 }}>
              <img src={AppauraLogo} alt="Appaura" style={{ height: "32px", width: "auto", objectFit: "contain" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              {!isMobile && (
                <button onClick={() => navigate("/auth/login")} style={{ padding: "6px 16px", fontSize: "13px", color: "#4a5568", fontWeight: 500, background: "transparent", border: "none", cursor: "pointer", borderRadius: "50px" }}>
                  Sign in
                </button>
              )}
              <button onClick={() => navigate("/auth/signup")} style={{ background: G, color: "white", padding: "7px 16px", fontSize: "12.5px", fontWeight: 700, borderRadius: "50px", boxShadow: "0 2px 10px rgba(0,0,0,.13)", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                {isMobile ? "Start" : "Get Started"}
              </button>
              {isMobile && (
                <button onClick={() => setMenuOpen(o => !o)} style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(58,82,144,.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {menuOpen ? <X size={15} color="#3a5290" /> : <Menu size={15} color="#3a5290" />}
                </button>
              )}
            </div>
          </div>
          {isMobile && menuOpen && (
            <div style={{ borderTop: "1px solid #eef2f8", marginTop: "10px", paddingTop: "8px", display: "flex", flexDirection: "column", animation: "fadeIn .18s ease" }}>
              {["Features", "Pricing", "Docs", "Blog", "Sign in"].map(l => (
                <a key={l} href="#" style={{ color: "#374151", fontSize: "13.5px", fontWeight: 500, padding: "10px 6px", borderRadius: "8px", display: "block" }}>{l}</a>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ padding: `${isMobile ? "96px" : "118px"} clamp(16px,5vw,32px) clamp(44px,7vw,64px)`, textAlign: "center", background: "linear-gradient(168deg,#edf1ff 0%,#f7faff 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "8%", left: "4%", width: "480px", height: "480px", background: "radial-gradient(circle,rgba(84,112,192,.07) 0%,transparent 65%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-12%", right: "2%", width: "360px", height: "360px", background: "radial-gradient(circle,rgba(40,60,110,.05) 0%,transparent 65%)", borderRadius: "50%", pointerEvents: "none" }} />

        <div className="ani" style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(58,82,144,.09)", color: "#3a5290", padding: "4px 13px", borderRadius: "50px", fontSize: "11.5px", fontWeight: 700, marginBottom: "20px" }}>
          <Star size={11} strokeWidth={0} fill="#3a5290" /> Transparent Pricing — No surprises
        </div>

        <h1 className="ani ani1" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, color: "#1e2f5a", lineHeight: 1.15, margin: "0 auto 16px", maxWidth: "720px", fontSize: "clamp(24px,5.5vw,54px)" }}>
          Pharmacy software,<br />scaled for you.
        </h1>

        <p className="ani ani2" style={{ fontSize: "clamp(13px,2vw,16px)", color: "#5a6a8a", maxWidth: "480px", margin: "0 auto 28px", lineHeight: 1.85 }}>
          14-day free trial. No credit card. No setup fee. Cancel anytime.
        </p>

        {/* Email CTA */}
        <div className="ani ani3" style={{ display: "flex", maxWidth: "420px", margin: "0 auto 36px", borderRadius: "12px", overflow: "hidden", border: emailError ? "1.5px solid #ef4444" : "1.5px solid #d4ddef", background: "white", boxShadow: emailError ? "0 4px 20px rgba(239,68,68,.15)" : "0 4px 20px rgba(30,50,100,.09)", transition: "border-color .2s,box-shadow .2s" }}>
          <div style={{ display: "flex", alignItems: "center", paddingLeft: "13px", color: emailError ? "#ef4444" : "#b0bdd4", flexShrink: 0, transition: "color .2s" }}><Mail size={14} /></div>
          <input
            type="email" placeholder="your@email.com" value={email}
            onChange={handleEmailChange}
            onKeyPress={(e) => e.key === 'Enter' && handleStartTrial()}
            style={{ flex: 1, padding: "12px 10px", border: "none", outline: "none", fontSize: "13.5px", color: "#1e2f5a", background: "transparent", minWidth: 0 }}
          />
          <button
            onClick={handleStartTrial}
            disabled={!isEmailValid}
            style={{ padding: `12px clamp(10px,3vw,16px)`, fontSize: "12.5px", background: isEmailValid ? G : "#cbd5e1", color: isEmailValid ? "white" : "#94a3b8", border: "none", cursor: isEmailValid ? "pointer" : "not-allowed", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, transition: "opacity .2s,background .2s" }}
          >
            Start Free →
          </button>
        </div>

        {emailError && (
          <div style={{ maxWidth: "420px", margin: "0 auto -28px", textAlign: "left", paddingLeft: "4px", fontSize: "12px", color: "#ef4444", display: "flex", alignItems: "center", gap: "5px", animation: "fadeIn .2s ease" }}>
            <span>×</span> {emailError}
          </div>
        )}

        {/* Stats */}
        <div className="ani ani4" style={{ display: "inline-grid", gridTemplateColumns: `repeat(${isMobile ? "2" : "4"},1fr)`, background: "white", border: "1px solid #e4ecf6", borderRadius: "14px", boxShadow: "0 2px 12px rgba(30,50,100,.06)", overflow: "hidden", maxWidth: isMobile ? "340px" : "560px", width: "100%" }}>
          {[{ val: "10K+", label: "Active Users" }, { val: "99.9%", label: "Uptime SLA" }, { val: "24/7", label: "Support" }, { val: "100%", label: "Data Safe" }].map(({ val, label }, i, arr) => (
            <div key={i} style={{ padding: `${isMobile ? "12px 10px" : "14px 20px"}`, textAlign: "center", borderRight: (isMobile ? i % 2 !== 1 : i < arr.length - 1) ? "1px solid #eef2f8" : "none", borderBottom: isMobile && i < 2 ? "1px solid #eef2f8" : "none" }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: "clamp(14px,2vw,16px)", color: "#1e2f5a" }}>{val}</div>
              <div style={{ fontSize: "clamp(9px,1.4vw,11px)", color: "#8a9bbf", marginTop: "1px" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PLAN OVERVIEW ─── */}
      <section style={{ padding: "clamp(44px,7vw,68px) clamp(12px,4vw,20px)", background: "white" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          {/* Section heading */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(22px,4vw,38px)", fontWeight: 800, color: "#0f172a", letterSpacing: "0.5px", marginBottom: "10px" }}>
              PLAN OVERVIEW
            </h2>
            <p style={{ fontSize: "clamp(13px,1.8vw,15px)", color: "#64748b" }}>
              Choose the perfect plan to grow your pharmacy — from startup to enterprise.
            </p>

            {/* Billing toggle */}
            <div style={{ display: "inline-flex", background: "#eef2f9", borderRadius: "50px", padding: "3px", gap: "2px", marginTop: "20px" }}>
              {["monthly", "yearly"].map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  style={{ padding: "7px clamp(14px,3vw,22px)", borderRadius: "50px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, background: billing === b ? "white" : "transparent", color: billing === b ? "#1e2f5a" : "#6b7a99", boxShadow: billing === b ? "0 1px 6px rgba(30,50,100,.1)" : "none", transition: "all .16s" }}>
                  {b === "monthly" ? "Monthly" : <> Yearly <span style={{ color: "#16a34a", marginLeft: "4px", fontSize: "11px", fontWeight: 700 }}>−17%</span></>}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid — scrollable on mobile/tablet */}
          <div
            className="plan-grid"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(5, minmax(220px, 1fr))"
                : isTablet
                ? "repeat(5, minmax(180px, 1fr))"
                : "repeat(5, 1fr)",
              gap: "14px",
              alignItems: "stretch",
              overflowX: isMobile || isTablet ? "auto" : "visible",
              paddingBottom: isMobile || isTablet ? "8px" : 0,
            }}
          >
            {PLANS_DATA.map((plan, i) => (
              <div key={i} className="pcard" style={{ paddingTop: plan.badge ? "16px" : 0 }}>
                <PlanCard plan={plan} billing={billing} />
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", color: "#b0bcd0", fontSize: "11.5px", marginTop: "20px" }}>
            All plans include unlimited updates and mobile access. Prices billed monthly unless yearly is selected.
          </p>
        </div>
      </section>

      {/* ─── COMPLETE FEATURES TABLE ─── */}
      <CompleteFeaturesTable />

      {/* ─── BOTTOM BANNER ─── */}
      <section style={{ padding: "0 clamp(12px,4vw,20px)", background: "#f8fafc", paddingBottom: "clamp(40px,6vw,56px)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{
            background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)",
            borderRadius: "16px",
            padding: "clamp(20px,4vw,32px) clamp(20px,5vw,44px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Shield size={22} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: "clamp(14px,2.5vw,20px)", color: "white", letterSpacing: "0.3px" }}>
                  ONE SYSTEM. EVERY FEATURE. LIMITLESS GROWTH.
                </div>
                <div style={{ fontSize: "clamp(11px,1.5vw,13px)", color: "rgba(255,255,255,.7)", marginTop: "4px" }}>
                  Power your pharmacy with the most complete & smart management solution.
                </div>
              </div>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TrendingUp size={22} color="white" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── ENTERPRISE CTA ─── */}
      <section style={{ padding: "clamp(40px,7vw,64px) clamp(16px,5vw,24px)", background: "#f7faff" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(140deg,#141e38 0%,#1f2f5c 100%)", borderRadius: "22px", padding: "clamp(28px,5vw,48px) clamp(20px,5vw,44px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", background: "rgba(84,112,192,.1)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", bottom: "-50px", left: "-30px", width: "240px", height: "240px", background: "rgba(84,112,192,.07)", borderRadius: "50%" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "13px", background: "rgba(84,112,192,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Building2 size={20} color="#93c5fd" />
              </div>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(18px,3.5vw,34px)", fontWeight: 800, color: "white", marginBottom: "10px" }}>Need a custom solution?</h2>
              <p style={{ color: "rgba(255,255,255,.6)", fontSize: "clamp(13px,1.8vw,14.5px)", maxWidth: "460px", margin: "0 auto 24px", lineHeight: 1.75 }}>
                On-premise hosting, white labeling, custom integrations, or a dedicated account manager — let's build the right fit.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? "1" : "3"},1fr)`, gap: "10px", marginBottom: "24px", textAlign: "left" }}>
                {[
                  { Icon: UserCheck, title: "Account Manager", desc: "Dedicated support from day one" },
                  { Icon: Tag, title: "Custom Pricing", desc: "Tailored to your scale & needs" },
                  { Icon: Settings, title: "Advanced Add-ons", desc: "On-premise, white label, API ext." },
                ].map(({ Icon: IC, title, desc }, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,.05)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(255,255,255,.07)" }}>
                    <IC size={15} color="#93c5fd" style={{ marginBottom: "8px" }} />
                    <div style={{ fontWeight: 700, color: "white", fontSize: "12px", marginBottom: "4px" }}>{title}</div>
                    <div style={{ color: "rgba(255,255,255,.5)", fontSize: "11px", lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/auth/signup')} style={{ padding: "11px 32px", borderRadius: "50px", fontSize: "14px", fontWeight: 700, cursor: "pointer", background: "white", color: "#1e2f5a", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,.16)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Schedule a free consultation <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{ padding: "clamp(40px,7vw,64px) clamp(16px,5vw,24px)", background: "white" }}>
        <div style={{ maxWidth: "620px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(19px,3.5vw,34px)", fontWeight: 800, color: "#1e2f5a", textAlign: "center", marginBottom: "32px" }}>Frequently asked questions</h2>
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-row">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", textAlign: "left", padding: "16px 0", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: "clamp(13px,1.8vw,14px)", color: "#1e2f5a" }}>{faq.q}</span>
                <span style={{ flexShrink: 0, width: "26px", height: "26px", borderRadius: "50%", background: openFaq === i ? "rgba(58,82,144,.1)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .15s" }}>
                  {openFaq === i ? <ChevronUp size={14} color="#5470c0" /> : <ChevronDown size={14} color="#5470c0" />}
                </span>
              </button>
              {openFaq === i && (
                <div style={{ paddingBottom: "16px", color: "#6b7a99", fontSize: "clamp(13px,1.6vw,13.5px)", lineHeight: 1.8, animation: "fadeIn .2s ease" }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}
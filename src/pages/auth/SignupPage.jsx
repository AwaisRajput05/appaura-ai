// src/pages/auth/SignupPage.jsx
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import Signup from "../../components/auth/Signup";
import AppauraLogo from "../../assets/appauralogos.png";

// ── Styles ────────────────────────────────────────────────────────────────────
const pharmaStyles = `
  /* ── Layout (unchanged) ── */
  .login-container {
    min-height: 100vh;
    background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .login-card {
    width: 100%;
    max-width: 1280px;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,.10), 0 10px 10px -5px rgba(0,0,0,.02);
    overflow: hidden;
  }
  .login-card-inner {
    display: flex;
    flex-direction: column;
    background: white;
  }
  @media (min-width: 1024px) {
    .login-card-inner { flex-direction: row; }
  }
  .col-form {
    flex: 1;
    padding: 2rem;
  }
  @media (min-width: 1024px) {
    .col-form { padding: 3rem; }
  }

  /* ── Right brand column ── */
  .col-brand {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: linear-gradient(148deg, #ddeafb 0%, #c5d7f4 30%, #b4c8f2 60%, #bfd1f8 100%);
    padding: 2.5rem 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  @media (min-width: 1024px) {
    .col-brand { padding: 2.5rem 3rem 2rem; }
  }

  /* Ambient glow orbs */
  .brand-orb-a {
    position: absolute;
    width: 280px; height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%);
    top: 15%; right: -70px;
    pointer-events: none;
    z-index: 0;
  }
  .brand-orb-b {
    position: absolute;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%);
    bottom: 5%; left: -40px;
    pointer-events: none;
    z-index: 0;
  }

  .divider-line {
    width: 1px;
    background: linear-gradient(to bottom, transparent, #cbd5e1, #cbd5e1, transparent);
    margin: 40px 0;
  }
  @media (max-width: 1024px) {
    .divider-line { display: none; }
  }
  .login-header {
    position: absolute;
    top: 24px; left: 32px;
    z-index: 10;
  }
  .login-header img { height: 40px; width: auto; }

  /* ── Brand text + features ── */
  .brand-heading {
    font-size: 27px;
    font-weight: 800;
    color: #1a2744;
    line-height: 1.24;
    margin: 0 0 9px;
    position: relative;
    z-index: 2;
  }
  .brand-subtext {
    font-size: 13px;
    color: #2d3f6a;
    line-height: 1.7;
    margin: 0 0 18px;
    max-width: 370px;
    opacity: 0.82;
    position: relative;
    z-index: 2;
  }
  .illustration-wrap {
    position: relative;
    z-index: 2;
    width: 100%;
    margin-bottom: 16px;
  }
  .feature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 12px;
    position: relative;
    z-index: 2;
    margin-bottom: 18px;
  }
  .feature-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.52);
    border: 1px solid rgba(255,255,255,0.78);
    border-radius: 999px;
    padding: 6px 13px;
    backdrop-filter: blur(6px);
  }
  .feature-chip-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #2f54c4;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(47,84,196,0.18);
  }
  .feature-chip span {
    font-size: 12px;
    font-weight: 650;
    color: #1a2744;
    white-space: nowrap;
  }
  .signup-area {
    font-size: 13px;
    color: rgba(26,39,68,0.60);
    position: relative;
    z-index: 2;
  }
  .signup-link {
    color: #2f54c4;
    text-decoration: underline;
    text-underline-offset: 3px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .signup-link:hover { opacity: 0.70; }

  .footer-text {
    text-align: center;
    margin-top: 2rem;
    color: #6b7280;
    font-size: 14px;
  }
  .footer-text a {
    color: #3C5690;
    text-decoration: none;
  }
  .footer-text a:hover {
    text-decoration: underline;
  }
`;

// ── Capsule helper ────────────────────────────────────────────────────────────
const Capsule = ({ cx, cy, w, h, angle = 0, colorL, colorR }) => {
  const r = h / 2;
  const x1 = cx - w / 2 + r;
  const x2 = cx + w / 2 - r;
  const L = `M ${cx},${cy - r} L ${x1},${cy - r} A ${r},${r} 0 0,1 ${x1},${cy + r} L ${cx},${cy + r} Z`;
  const R = `M ${cx},${cy - r} L ${x2},${cy - r} A ${r},${r} 0 0,1 ${x2},${cy + r} L ${cx},${cy + r} Z`;
  const O = `M ${x1},${cy - r} L ${x2},${cy - r} A ${r},${r} 0 0,1 ${x2},${cy + r} L ${x1},${cy + r} A ${r},${r} 0 0,1 ${x1},${cy - r} Z`;
  return (
    <g transform={`rotate(${angle},${cx},${cy})`}>
      <path d={L} fill={colorL} />
      <path d={R} fill={colorR} />
      <path d={O} fill="none" stroke={colorL} strokeWidth="1.1" opacity="0.55" />
      <ellipse cx={cx - w / 6} cy={cy - r * 0.38} rx={w / 8} ry={r * 0.4} fill="rgba(255,255,255,0.38)" />
    </g>
  );
};

// ── Pharmacy Illustration ─────────────────────────────────────────────────────
const PharmacyScene = () => (
  <svg
    viewBox="0 0 450 295"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "auto", maxHeight: "255px", display: "block" }}
  >
    <defs>
      <linearGradient id="clipBodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f2f7ff" />
        <stop offset="100%" stopColor="#e4eefb" />
      </linearGradient>
      <linearGradient id="bigBottleGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#d4e2f6" />
        <stop offset="40%"  stopColor="#ffffff" />
        <stop offset="100%" stopColor="#cdd9f0" />
      </linearGradient>
      <linearGradient id="smlBottleGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#dbe7f8" />
        <stop offset="45%"  stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d0dcf0" />
      </linearGradient>
      <linearGradient id="labelBlue" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#1e45c8" />
        <stop offset="100%" stopColor="#3a68f0" />
      </linearGradient>
      <linearGradient id="labelBlue2" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#2248cc" />
        <stop offset="100%" stopColor="#3b62ec" />
      </linearGradient>
      <radialGradient id="pillDome" cx="35%" cy="30%">
        <stop offset="0%"   stopColor="#f0c040" />
        <stop offset="100%" stopColor="#b87c08" />
      </radialGradient>
      <radialGradient id="orbFill" cx="30%" cy="30%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.45)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
      </radialGradient>
      <filter id="dropshadow">
        <feDropShadow dx="2" dy="4" stdDeviation="5" floodColor="rgba(20,50,130,0.18)" />
      </filter>
    </defs>

    {/* ── Ambient glow orbs ── */}
    <ellipse cx="325" cy="148" rx="168" ry="152" fill="url(#orbFill)" />
    <ellipse cx="85"  cy="258" rx="100" ry="90"  fill="url(#orbFill)" opacity="0.65" />

    {/* ── Swirling wave fills ── */}
    <path d="M 0,235 Q 115,175 225,215 Q 335,255 450,190 L 450,295 L 0,295 Z"
          fill="rgba(255,255,255,0.07)" />
    <path d="M 0,265 Q 148,228 295,252 Q 372,265 450,242 L 450,295 L 0,295 Z"
          fill="rgba(255,255,255,0.06)" />

    {/* ════════════════════════ */}
    {/*  BLISTER PACK           */}
    {/* ════════════════════════ */}
    <g filter="url(#dropshadow)">
      <rect x="14" y="208" width="122" height="80" rx="9" fill="#e0c870" stroke="#c2a230" strokeWidth="1.5" />
      <line x1="55"  y1="208" x2="55"  y2="288" stroke="#c2a230" strokeWidth="0.8" opacity="0.55" />
      <line x1="96"  y1="208" x2="96"  y2="288" stroke="#c2a230" strokeWidth="0.8" opacity="0.55" />
      <line x1="14"  y1="248" x2="136" y2="248" stroke="#c2a230" strokeWidth="0.8" opacity="0.55" />
      {[35, 75, 116].flatMap((px, i) =>
        [228, 268].map((py, j) => (
          <g key={`${i}-${j}`}>
            <ellipse cx={px} cy={py} rx="15" ry="14" fill="url(#pillDome)" />
            <ellipse cx={px - 4} cy={py - 5} rx="5.5" ry="4" fill="rgba(255,255,255,0.42)" />
          </g>
        ))
      )}
    </g>

    {/* ════════════════════════ */}
    {/*  CLIPBOARD               */}
    {/* ════════════════════════ */}
    <g filter="url(#dropshadow)">
      <rect x="148" y="20" width="164" height="235" rx="12" fill="url(#clipBodyGrad)" stroke="#3558e0" strokeWidth="2.8" />
      <rect x="198" y="6"  width="64" height="32" rx="9" fill="#3558e0" />
      <rect x="206" y="11" width="48" height="18" rx="5" fill="#2445cc" />
      <circle cx="230" cy="22" r="7.5" fill="#1e3db8" />
      <circle cx="230" cy="22" r="3.8" fill="#172ea0" />
      {[
        { y: 72,  barW: 58 },
        { y: 114, barW: 80 },
        { y: 156, barW: 48 },
        { y: 198, barW: 70 },
      ].map(({ y, barW }, i) => (
        <g key={i}>
          <circle cx="175" cy={y + 6} r="10.5" fill="#22c55e" />
          <polyline
            points={`${171},${y + 6} ${174.5},${y + 10.5} ${180.5},${y + 1}`}
            fill="none"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="193" y={y + 1} width="100" height="8" rx="4" fill="#cdddf8" />
          <rect x="193" y={y + 1} width={barW} height="8" rx="4" fill="#9ab8ee" />
        </g>
      ))}
    </g>

    {/* ════════════════════════ */}
    {/*  BIG MEDICINE BOTTLE     */}
    {/* ════════════════════════ */}
    <g filter="url(#dropshadow)">
      <rect x="338" y="68" width="76" height="188" rx="14" fill="url(#bigBottleGrad)" stroke="#c5d2ee" strokeWidth="1.5" />
      <rect x="346" y="80" width="11" height="168" rx="5.5" fill="rgba(255,255,255,0.52)" />
      <rect x="338" y="132" width="76" height="86" fill="url(#labelBlue)" />
      <rect x="338" y="132" width="76" height="3.5" fill="rgba(0,0,0,0.18)" />
      <rect x="338" y="215" width="76" height="3.5" fill="rgba(0,0,0,0.18)" />
      <rect x="360" y="159" width="32" height="10" rx="4" fill="white" />
      <rect x="371" y="148" width="10" height="32" rx="4" fill="white" />
      <rect x="347" y="50" width="58" height="24" rx="10" fill="#f5a530" />
      <rect x="352" y="55" width="48" height="12" rx="5"  fill="#e08e18" />
    </g>

    {/* ════════════════════════ */}
    {/*  SMALL MEDICINE BOTTLE   */}
    {/* ════════════════════════ */}
    <g filter="url(#dropshadow)">
      <rect x="292" y="155" width="48" height="128" rx="10" fill="url(#smlBottleGrad)" stroke="#c5d2ee" strokeWidth="1.3" />
      <rect x="299" y="165" width="8"  height="110" rx="4"  fill="rgba(255,255,255,0.50)" />
      <rect x="292" y="203" width="48" height="56" fill="url(#labelBlue2)" />
      <rect x="292" y="203" width="48" height="3"  fill="rgba(0,0,0,0.15)" />
      <rect x="292" y="256" width="48" height="3"  fill="rgba(0,0,0,0.15)" />
      <rect x="308" y="222" width="18" height="7" rx="3"   fill="white" />
      <rect x="313" y="217" width="7"  height="18" rx="3"  fill="white" />
      <rect x="297" y="141" width="38" height="18" rx="7"  fill="#f5a530" />
      <rect x="301" y="146" width="30" height="9"  rx="3.5" fill="#e08e18" />
    </g>

    {/* ════════════════════════ */}
    {/*  SCATTERED CAPSULE PILLS */}
    {/* ════════════════════════ */}
    <Capsule cx={405} cy={38}  w={34} h={14} angle={-32} colorL="#2f54c4" colorR="#ddeafb" />
    <Capsule cx={430} cy={122} w={28} h={12} angle={22}  colorL="#2f54c4" colorR="#ddeafb" />
    <Capsule cx={118} cy={28}  w={30} h={12} angle={18}  colorL="#d4a020" colorR="#f5e4a8" />
    <Capsule cx={48}  cy={142} w={28} h={11} angle={-48} colorL="#d4a020" colorR="#f5e4a8" />
    <Capsule cx={145} cy={192} w={26} h={11} angle={10}  colorL="#2f54c4" colorR="#e8f0fb" />

    {/* ── Round tablets ── */}
    <circle cx="418" cy="250" r="12" fill="#2f54c4" stroke="#1e3db0" strokeWidth="1.2" />
    <ellipse cx="414" cy="246" rx="5" ry="3.5" fill="rgba(255,255,255,0.30)" />
    <circle cx="143" cy="178" r="9.5" fill="#d4a020" stroke="#b88010" strokeWidth="1.1" />
    <ellipse cx="140" cy="175" rx="4"   ry="2.8" fill="rgba(255,255,255,0.30)" />

    {/* ════════════════════════ */}
    {/*  FLOATING GLASS ORBS     */}
    {/* ════════════════════════ */}
    {[
      { cx: 362, cy: 285, r: 20 },
      { cx: 19,  cy: 80,  r: 15 },
      { cx: 138, cy: 162, r: 12 },
      { cx: 435, cy: 200, r: 11 },
      { cx: 272, cy: 265, r: 9  },
      { cx: 440, cy: 75,  r: 8  },
    ].map(({ cx, cy, r }, i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r={r}
          fill="rgba(255,255,255,0.16)"
          stroke="rgba(255,255,255,0.60)"
          strokeWidth="1.2"
        />
        <ellipse cx={cx - r * 0.28} cy={cy - r * 0.28} rx={r * 0.32} ry={r * 0.22}
          fill="rgba(255,255,255,0.40)"
        />
      </g>
    ))}

    {/* Sparkle dots */}
    {[
      { cx: 290, cy: 12, r: 3.2 },
      { cx: 60,  cy: 198, r: 2.2 },
      { cx: 428, cy: 162, r: 2.5 },
      { cx: 182, cy: 262, r: 2 },
      { cx: 325, cy: 48,  r: 2 },
    ].map(({ cx, cy, r }, i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.80)" />
    ))}
  </svg>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const SignupPage = memo(() => {
  const navigate = useNavigate();

  const handleClose = (nextMode, message) => {
    if (nextMode === "login") {
      navigate("/auth/login", { state: { success: message } });
    } else {
      navigate("/");
    }
  };

  const features = [
    "Real-time Inventory",
    "Smart Analytics",
    "Secure & Compliant",
    "Real-time Branch Sales",
  ];

  return (
    <>
      <style>{pharmaStyles}</style>
      <div className="login-container">

        {/* Header logo */}
        <div className="login-header">
          <img src={AppauraLogo} alt="AppAura" />
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-card-inner">

            {/* ── Left column: Signup form (unchanged) ── */}
            <div className="col-form">
              <Signup onClose={handleClose} isModal={false} />
            </div>

            {/* Vertical divider */}
            <div className="divider-line" />

            {/* ── Right column: Pharmacy brand panel ── */}
            <div className="col-brand">

              {/* Background ambient orbs */}
              <div className="brand-orb-a" />
              <div className="brand-orb-b" />

              {/* Heading */}
              <h2 className="brand-heading">
                Streamline Your Pharmacy<br />Management Effortlessly
              </h2>
              <p className="brand-subtext">
                Simplify inventory control, enhance sales, and manage your
                pharmacy with ease using our all-in-one platform.
              </p>

              {/* SVG Illustration */}
              <div className="illustration-wrap">
                <PharmacyScene />
              </div>

              {/* Feature chips */}
              <div className="feature-grid">
                {features.map((text, i) => (
                  <div key={i} className="feature-chip">
                    <div className="feature-chip-dot" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Sign-in link */}
              <p className="signup-area">
                Already have an account?{" "}
                <span className="signup-link" onClick={() => navigate("/auth/login")}>
                  Sign in
                </span>
              </p>

            </div>
          </div>
        </div>
      </div>

      {/* Footer (unchanged) */}
      <div className="footer-text">
        <p>
          By signing up, you agree to our{" "}
          <a href="#">Terms of Service</a> and{" "}
          <a href="#">Privacy Policy</a>
        </p>
      </div>
    </>
  );
});

SignupPage.displayName = "SignupPage";

export default SignupPage;
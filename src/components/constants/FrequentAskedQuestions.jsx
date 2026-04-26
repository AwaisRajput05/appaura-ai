import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const FAQS = [
  { 
    q: "Can I switch plans anytime?", 
    a: "Yes — upgrade or downgrade anytime. Changes take effect on your next billing cycle." 
  },
  { 
    q: "Is there a setup fee?", 
    a: "None. Every plan includes free onboarding, guided tutorials, and 24/7 support." 
  },
  { 
    q: "What payment methods do you accept?", 
    a: "Cash, Bank Card, Bank Transfer, Mobile Wallet, and Credit are all supported." 
  },
  { 
    q: "Can I add more branches later?", 
    a: "Absolutely. Upgrade as you grow — Enterprise gives you unlimited branches." 
  },
  { 
    q: "Is my data secure?", 
    a: "Yes. Token-based auth, MFA, full encryption, and a 100% data-safety guarantee." 
  },
];

export default function FrequentAskedQuestions() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <section style={{ padding: "64px 24px", background: "#f7faff" }}>
      <div style={{ maxWidth: "620px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: "clamp(20px, 3vw, 34px)",
          fontWeight: 800,
          color: "#1e2f5a",
          textAlign: "center",
          marginBottom: "36px"
        }}>
          Frequently asked questions
        </h2>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ borderBottom: "1px solid #eef2f8" }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "17px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px"
              }}
            >
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#1e2f5a"
              }}>
                {faq.q}
              </span>
              {openFaq === i ? 
                <FiChevronUp size={16} color="#5470c0" style={{ flexShrink: 0 }} /> : 
                <FiChevronDown size={16} color="#5470c0" style={{ flexShrink: 0 }} />
              }
            </button>
            {openFaq === i && (
              <div style={{
                paddingBottom: "17px",
                color: "#6b7a99",
                fontSize: "13.5px",
                lineHeight: 1.75
              }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
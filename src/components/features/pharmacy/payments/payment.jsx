// payment.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../../../auth/hooks/AuthContextDef";
import apiService from "../../../../services/apiService";
import { motion, AnimatePresence } from "framer-motion";
import { apiEndpoints } from "../../../../services/endpoint/payments/payend";
import { FiCheck } from "react-icons/fi";
import { paidPlans } from "../../../constants/payments";
import { bankDetailsOptions } from "../../../constants/appaurabank";
// Import reusable components
import Button from "../../../../components/ui/forms/Button";
import Alert from "../../../../components/ui/feedback/Alert";
import Modal from "../../../../components/ui/Modal";
import Card from "../../../../components/ui/Card";
import FileUpload from "../../../../components/ui/forms/FileUpload";
import { Check, Camera, Loader2 } from "lucide-react";

const INITIATE_PAYMENT_URL = apiEndpoints.paymentrequest();

/* ── Gradient used across cards ── */
const G = "linear-gradient(135deg,#2d3f6b 0%,#3a5290 55%,#5470c0 100%)";

/* ── Per-plan style config keyed by plan.id ── */
const PLAN_STYLE = {
  individual: {
    accent: "#2563eb",
    border: "1px solid #e2e8f0",
    bg: "white",
    shadow: "0 2px 8px rgba(0,0,0,.05)",
    ctaBg: "transparent",
    ctaColor: "#2563eb",
    ctaBorder: "1.5px solid #bfdbfe",
    badge: null,
    checkColor: "#2563eb",
  },
  basic: {
    accent: "#2563eb",
    border: "1px solid #e2e8f0",
    bg: "white",
    shadow: "0 2px 8px rgba(0,0,0,.05)",
    ctaBg: "transparent",
    ctaColor: "#2563eb",
    ctaBorder: "1.5px solid #bfdbfe",
    badge: null,
    checkColor: "#2563eb",
  },
  pro: {
    accent: "#2563eb",
    border: "2px solid #2563eb",
    bg: "linear-gradient(180deg,#eff6ff 0%,#ffffff 100%)",
    shadow: "0 4px 24px rgba(37,99,235,.15)",
    ctaBg: "#2563eb",
    ctaColor: "white",
    ctaBorder: "none",
    badge: { label: "MOST POPULAR", color: "#2563eb" },
    checkColor: "#2563eb",
  },
  enterprise: {
    accent: "#16a34a",
    border: "2px solid #16a34a",
    bg: "white",
    shadow: "0 2px 8px rgba(0,0,0,.05)",
    ctaBg: "#16a34a",
    ctaColor: "white",
    ctaBorder: "none",
    badge: { label: "BEST VALUE", color: "#16a34a" },
    checkColor: "#16a34a",
  },
};

/* ── Fallback style for any unrecognised plan id ── */
const DEFAULT_STYLE = PLAN_STYLE.basic;

export default function Payment() {
  const { user } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [successPlan, setSuccessPlan] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [transactionImage, setTransactionImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [randomBank, setRandomBank] = useState(null);

  const vendorId =
    user?.vendorId ||
    user?.userId ||
    localStorage.getItem("vendorId")?.replace("vendorId", "")?.trim();
  const emailAddress =
    user?.emailAddress ||
    localStorage.getItem("emailAddress")?.replace("emailAddress ", "")?.trim();
  const finalVendorId = vendorId;
  const finalEmail = emailAddress;

  let currentPlanId = null;
  try {
    const subscriptionStr = localStorage.getItem("vendor_subscription");
    if (subscriptionStr) {
      const subscription = JSON.parse(subscriptionStr);
      if (subscription?.status === "ACTIVE" && subscription?.plan) {
        currentPlanId = subscription.plan.toLowerCase();
      }
    }
  } catch (e) {
    console.error("Failed to parse vendor_subscription:", e);
  }

  const handlePayment = (plan) => {
    if (!finalVendorId || !finalEmail) {
      setError("User not authenticated. Please log out and log in again.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * bankDetailsOptions.length);
    setRandomBank(bankDetailsOptions[randomIndex]);
    setSelectedPlan(plan);
    setTransactionImage(null);
    setError(null);
    setModalError(null);
  };

  const handleSubmit = async () => {
    if (!transactionImage) {
      setModalError("Please upload a screenshot of the payment.");
      return;
    }
    setLoading(true);
    setModalError(null);
    const payload = {
      description: `Upgrade to ${selectedPlan.name} plan for more features`,
      plan: selectedPlan.id.toUpperCase(),
    };
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    formData.append("transactionImage", transactionImage);
    try {
      const response = await apiService.post(INITIATE_PAYMENT_URL, formData, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "X-Vendor-ID": finalVendorId,
          email: finalEmail,
        },
        timeout: 30000,
      });
      const backendMessage =
        response.data?.message ||
        "Your payment request has been received. Please wait while an admin verifies and approves it.";
      setSuccessMessage(backendMessage);
      setSuccessPlan(selectedPlan);
      setSelectedPlan(null);
      setTransactionImage(null);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Payment submission failed. Please try again.";
      setModalError(message);
    } finally {
      setLoading(false);
    }
  };

  const closePaymentModal = () => {
    setSelectedPlan(null);
    setTransactionImage(null);
    setModalError(null);
  };

  return (
    <>
      {/* ── Global styles injected once ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap');
        .pay-card { transition: transform .22s, box-shadow .22s; }
        .pay-card:hover { transform: translateY(-4px); }
      `}</style>

      {/* ── Error alert ── */}
      {error && (
        <Alert variant="error" message={error} onClose={() => setError(null)} className="mb-5" />
      )}

      {/* ── Success modal ── */}
      <Modal
        isOpen={!!successPlan}
        onClose={() => { setSuccessPlan(null); setSuccessMessage(""); }}
        hideCloseButton
        size="md"
      >
        <AnimatePresence>
          {successPlan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center relative"
            >
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 bg-green-500 rounded-full"
                    initial={{ x: Math.random() * 400 - 200, y: -300, opacity: 1 }}
                    animate={{ y: 400, opacity: 0 }}
                    transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: "easeOut" }}
                    style={{ left: `${20 + (i * 15) % 60}%` }}
                  />
                ))}
              </div>
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-14 h-14 text-green-600" />
                </motion.div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Payment Submitted!</h2>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                  <p className="text-xl text-gray-800 leading-relaxed">
                    {successMessage || "Your payment request has been received. Please wait while an admin verifies and approves it."}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-8 inline-block">
                  <p className="text-gray-600 mb-1">Plan Submitted:</p>
                  <p className="text-2xl font-bold text-green-600">{successPlan.name}</p>
                </div>
                <Button
                  onClick={() => { setSuccessPlan(null); setSuccessMessage(""); }}
                  variant="success"
                  size="lg"
                  className="py-4 px-10"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* ── Payment modal ── */}
      <Modal
        isOpen={!!selectedPlan}
        onClose={closePaymentModal}
        title={
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Complete Your Payment</h2>
          </div>
        }
        size="md"
      >
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-6">
            Please transfer the amount to the following bank details and upload the screenshot.
          </p>
          <Card className="text-left mb-6 p-5">
            {randomBank && (
              <>
                <p className="font-semibold mb-1">Bank: {randomBank.bank}</p>
                <p className="mb-1">Account Name: {randomBank.accountName}</p>
                <p className="mb-1">IBAN: {randomBank.iban}</p>
                <p className="mt-3 font-bold text-lg">Amount: ₨{selectedPlan?.price}</p>
                <p className="text-sm text-gray-600">Reference: Subscription to {selectedPlan?.name} Plan</p>
              </>
            )}
          </Card>
          {modalError && (
            <Alert variant="error" message={modalError} onClose={() => setModalError(null)} className="mb-4" />
          )}
          <div className="mb-6">
            <FileUpload
              label="Upload Payment Screenshot"
              accept="image/*"
              onChange={(file) => { setTransactionImage(file); setModalError(null); }}
              preview={transactionImage}
              icon={<Camera className="w-10 h-10" />}
              className="w-full"
              showPreviewOnIcon
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={closePaymentModal} variant="secondary" size="lg" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              loadingText="Submitting..."
              disabled={!transactionImage || loading}
              variant="primary"
              size="lg"
              className="flex-1"
            >
              Submit Proof
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MAIN PRICING PAGE ── */}
      <div style={{ minHeight: "100vh", background: "#f7faff", padding: "48px 16px", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(37,99,235,.09)", color: "#2563eb", padding: "4px 14px", borderRadius: "50px", fontSize: "12px", fontWeight: 700, marginBottom: "16px" }}>
              Simple, transparent pricing
            </div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(26px,4vw,42px)", fontWeight: 800, color: "#0f172a", marginBottom: "10px", lineHeight: 1.15 }}>
              Choose Your Plan
            </h1>
            <p style={{ fontSize: "clamp(13px,1.8vw,16px)", color: "#64748b", maxWidth: "480px", margin: "0 auto" }}>
              Simple, transparent pricing for your pharmacy business
            </p>
          </div>

          {/* Plan cards grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${paidPlans.length}, 1fr)`,
            gap: "16px",
            alignItems: "stretch",
          }}>
            {paidPlans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlanId;
              const s = PLAN_STYLE[plan.id] || DEFAULT_STYLE;

              return (
                <div
                  key={plan.id}
                  className="pay-card"
                  style={{
                    borderRadius: "16px",
                    border: isCurrentPlan ? "2px solid #16a34a" : s.border,
                    background: s.bg,
                    boxShadow: s.shadow,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "visible",
                  }}
                >
                  {/* Badge — MOST POPULAR / BEST VALUE / CURRENT PLAN */}
                  {(s.badge || isCurrentPlan) && (
                    <div style={{
                      position: "absolute",
                      top: "-14px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: isCurrentPlan ? "#16a34a" : s.badge.color,
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
                      {isCurrentPlan ? "CURRENT PLAN" : s.badge.label}
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ padding: "24px 20px 14px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: isCurrentPlan ? "#16a34a" : s.accent,
                      letterSpacing: "0.5px",
                      marginBottom: "8px",
                      fontFamily: "'Sora',sans-serif",
                    }}>
                      {plan.name.toUpperCase()}
                    </div>

                    <div style={{ marginBottom: "4px", lineHeight: 1 }}>
                      <span style={{ fontSize: "11px", color: "#64748b", marginRight: "2px" }}>₨</span>
                      <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "30px", fontWeight: 800, color: "#0f172a" }}>
                        {Number(plan.price).toLocaleString()}
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "3px" }}>
                        {plan.period || "/month"}
                      </span>
                    </div>

                    <p style={{ fontSize: "11.5px", color: "#64748b", lineHeight: 1.5, marginTop: "6px" }}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div style={{ padding: "14px 20px", flex: 1 }}>
                    {(plan.features || []).map((feature, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "9px" }}>
                        <Check
                          size={13}
                          color={isCurrentPlan ? "#16a34a" : s.checkColor}
                          style={{ flexShrink: 0, marginTop: "2px" }}
                        />
                        <span style={{ fontSize: "11.5px", color: "#374151", lineHeight: 1.5 }}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div style={{ padding: "14px 20px 20px" }}>
                    <button
                      onClick={() => !isCurrentPlan && handlePayment(plan)}
                      disabled={isCurrentPlan}
                      style={{
                        width: "100%",
                        padding: "11px 0",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: isCurrentPlan ? "default" : "pointer",
                        letterSpacing: "0.3px",
                        background: isCurrentPlan ? "#f1f5f9" : s.ctaBg,
                        color: isCurrentPlan ? "#94a3b8" : s.ctaColor,
                        border: isCurrentPlan ? "1.5px solid #e2e8f0" : s.ctaBorder,
                        transition: "opacity .18s",
                        opacity: isCurrentPlan ? 0.75 : 1,
                      }}
                    >
                      {isCurrentPlan ? `Current Plan — ${plan.name}` : (plan.buttonText || `Get ${plan.name}`)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <p style={{ textAlign: "center", color: "#b0bcd0", fontSize: "12px", marginTop: "28px" }}>
            All plans are billed monthly · No hidden fees · Cancel anytime
          </p>
        </div>
      </div>
    </>
  );
}
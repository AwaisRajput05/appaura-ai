import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../services/apiService";
import { apiEndpoints } from "../services/apiEndpoints";
import { useAuth } from "../components/auth/hooks/useAuth";
import {
  Pill,
  Package,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Sparkles,
  Lock,
  Eye,
  ArrowLeft,
  Filter,
  Users,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  Banknote,
  AlertCircle,
  Activity,
  Crown,
  Star,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  SUB_ACCOUNT_TYPES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS,
} from "../components/constants/keywords";

// ==================== IMPORT REUSABLE COMPONENTS ====================
import Card from "../components/ui/Card";
import Button from "../components/ui/forms/Button";
import Modal from "../components/ui/Modal";
import Loader from "../components/ui/Loader";
import InputSelect from "../components/ui/forms/InputSelect"; 
// ==================== DATE FORMATTING HELPER ====================
const formatExpiryDate = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch (error) {
    return dateString;
  }
};
// ==================== DASHBOARD CONSTANTS ====================
const DASHBOARD_TEXTS = {
  VENDOR: "Vendor Dashboard",
  SUB_ACCOUNT: "Sub Account Dashboard",
  ADMIN: "Admin Dashboard",
  ALL_BRANCHES: "All Branches Combined",
  CURRENTLY_VIEWING: "Currently viewing:",
  ALL_BRANCHES_TEXT: "All Branches",
  SELECTED_BRANCH: "Selected Branch",
  NO_DATA: "No data available",
  NO_LOW_STOCK: "All good! No low stock.",
  NO_EXPIRED: "No expired items.",
  FREE_TRIAL_ACTIVE: "Free Trial Active",
  ENJOY_ACCESS: "Enjoy full access — upgrade anytime",
  TRIAL_EXPIRED: "Free Trial Expired",
  TRIAL_ENDED: "Your free trial has ended or has already been used.",
  SUBSCRIBE_NOW: "Subscribe Now",
  LATER: "Later",
  ACCESS_ERROR: "Access Error",
  INVALID_ROLE: "Invalid user role",
  GO_BACK: "Go back",
  LOADING: "Loading...",
  TOP_5_DRUGS: "Top 5 Drugs Sold (Last 24h)",
  TOTAL_MEDICINE: "Total Medicine",
  LOW_STOCK_ALERTS: "Low Stock Medicines",
  EXPIRED_MEDICINES: "Expired Medicines",
  TOP_BRANCHES_SALES: "Top Branches by Sales",
  TOP_BRANCHES_STOCK: "Top Branches by Stock",
  TOP_BRANCHES_MEDICINES: "Top Branches by Medicines Count",
  TOP_BRANCHES_SOLD: "Top Branches by Sold Items",
  STOCK_HEALTH: "Stock Health",
  SUBSCRIPTION_COVERAGE: "Subscription Coverage",
  ORDER_REQUEST_PROGRESS: "Order Request Progress",
  GROWTH_RATE: "Growth Rate (30d)",
  TOP_PERFORMING_PHARMACIES: "Top Performing Pharmacies",
  REVENUE_TREND: "Revenue Trend (Last 30 Days)",
  PHARMACY_GROUPS: "Pharmacy Groups",
  TOTAL_VENDORS: "Total Vendors",
  REVENUE_LAST_30D: "Revenue (Last 30d)",
  MONTHLY_RECURRING: "Monthly Recurring",
  ACTIVE_SUBSCRIPTIONS: "Active Subscriptions",
  EXPIRING_SOON: "Expiring Soon",
  PENDING_REQUESTS: "Pending Requests",
  NEW_VENDORS_30D: "New Vendors (30d)",
  INDEPENDENT_PHARMACIES: "Independent Pharmacies",
  TOTAL_BRANCHES: "Total Branches",
};

const COLORS = {
  PRIMARY: "#30426B",
  SECONDARY: "#5A75C7",
  SUCCESS: "#10b981",
  WARNING: "#f59e0b",
  DANGER: "#ef4444",
  INFO: "#3b82f6",
  PURPLE: "#a855f7",
};

const INITIAL_VENDOR_DASHBOARD = {
  total_medicines: 0,
  total_sold_items: 0,
  supplier_summary: [],
  last_day_sales: 0,
  low_stock_items: [],
  expired_items: [],
  total_sales_amount: 0,
  total_stock: 0,
  top_selling_drugs: [],
  top_branches_by_sales: [],
  top_branches_by_stock: [],
  top_branches_by_medicines_count: [],
  top_branches_by_sold_items: [],
  transaction_count: 0,
};

// ==================== HELPER COMPONENTS ====================
function CountUp({ end, prefix = "", suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const increment = end / (duration / 20);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.round(start));
      }
    }, 20);
    return () => clearInterval(timer);
  }, [end]);
  
  // If prefix is "Rs", render it as small text after the number
  if (prefix === "Rs") {
    return (
      <>
        <span>{count.toLocaleString()}</span>
        <span className="text-xs ml-0.5">Rs</span>
        {suffix}
      </>
    );
  }
  
  return <>{prefix}{count.toLocaleString()}{suffix}</>;
}

function TrialCountdownBar({ endDate }) {
  const calculateTimeLeft = () => {
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };
  
  const [time, setTime] = useState(calculateTimeLeft());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [endDate]);
  
  return (
    <div className="w-full max-w-5xl mx-auto mb-8 sm:mb-12 px-4 sm:px-0">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up">
        <div className="flex items-center gap-3 sm:gap-4">
          <Sparkles className="w-6 h-6 sm:w-9 sm:h-9 animate-pulse" />
          <div>
            <p className="text-base sm:text-xl font-bold">{DASHBOARD_TEXTS.FREE_TRIAL_ACTIVE}</p>
            <p className="text-xs sm:text-sm opacity-90">
              {DASHBOARD_TEXTS.ENJOY_ACCESS}
            </p>
          </div>
        </div>
        <div className="font-mono text-lg sm:text-2xl lg:text-3xl font-black tracking-wider">
          {time.days}d : {String(time.hours).padStart(2, "0")}h :{" "}
          {String(time.minutes).padStart(2, "0")}m :{" "}
          {String(time.seconds).padStart(2, "0")}s
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function HomePage() {
  const navigate = useNavigate();
  
  const [vendorDashboardData, setVendorDashboardData] = useState(INITIAL_VENDOR_DASHBOARD);
  const [vendorLoading, setVendorLoading] = useState(true);
  const [adminDashboardData, setAdminDashboardData] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const [isSubAccountView, setIsSubAccountView] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [branchOptions, setBranchOptions] = useState([]);
  const [currentBusinessName, setCurrentBusinessName] = useState("");
  const [errorTooltip, setErrorTooltip] = useState("");
  
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || "";
  const subAccountType = user?.subAccountType || "";
  const userEmail = user?.emailAddress || "";
  const emailHeader = userEmail ? { "X-User-Email": userEmail } : {};
  const isFinanceAccount = subAccountType === SUB_ACCOUNT_TYPES.FINANCE;
  
  if (isFinanceAccount) {
    navigate("/admin-vendors/manage-sales/viewsales", { replace: true });
    return null;
  }

  // Load from localStorage on mount (page refresh)
  useEffect(() => {
    setCurrentBusinessName(localStorage.getItem("businessName") || "Current Branch");
    if (user?.isMaster) {
      const stored = localStorage.getItem("vendor_child_ids");
      if (stored) {
        try {
          const branches = JSON.parse(stored);
          if (Array.isArray(branches)) {
            const options = branches.map((b) => ({
              value: b.vendor_id,
              label: b.business_name || b.branch_id || `Branch ${b.vendor_id.substring(0, 8)}`,
              branch_id: b.branch_id || `Branch ${b.vendor_id.substring(0, 8)}`,
            }));
            setBranchOptions(options);
          }
        } catch (e) {
          console.error("Failed to parse vendor_child_ids on mount");
        }
      }
    }
  }, [user?.isMaster]);

  const branchNameMap = useMemo(() => {
    const map = {};
    branchOptions.forEach((opt) => {
      map[opt.branch_id] = opt.label;
    });
    map["main"] = currentBusinessName;
    return map;
  }, [branchOptions, currentBusinessName]);

  const fetchVendorData = async (branchId = null) => {
    try {
      setVendorLoading(true);
      let headers = { ...emailHeader };
      if (branchId && branchId !== "all") {
        const branch = branchOptions.find((opt) => opt.value === branchId);
        if (branch) {
          headers["X-User-Branch-Id"] = branch.branch_id;
          headers["X-Child-Id"] = branchId;
        }
      } else {
        const currentBranchId = localStorage.getItem("branchId") || user?.branchId || "MAIN";
        headers["X-User-Branch-Id"] = currentBranchId;
      }
      
      const response = await apiService.get(apiEndpoints.vendorDashboard(), { headers });
      const resData = response.data || {};
      const vendor_child_ids = resData.vendor_child_ids || [];
      const sub = resData.subscription || null;
      const dashData = resData.data || {};
      
      if (Array.isArray(vendor_child_ids) && user?.isMaster && vendor_child_ids.length > 0 && vendor_child_ids[0].vendor_id) {
        localStorage.setItem("vendor_child_ids", JSON.stringify(vendor_child_ids));
        const options = vendor_child_ids.map((b) => ({
          value: b.vendor_id || "",
          label: b.business_name || b.branch_id || `Branch ${(b.vendor_id || "").substring(0, 8)}`,
          branch_id: b.branch_id || `Branch ${(b.vendor_id || "").substring(0, 8)}`,
        }));
        setBranchOptions(options);
      }
      
      if (sub) {
        localStorage.setItem("vendor_subscription", JSON.stringify(sub));
        setSubscription(sub);
      }
      
      setVendorDashboardData({
        ...INITIAL_VENDOR_DASHBOARD,
        total_medicines: dashData.total_medicines || 0,
        total_sold_items: dashData.total_sold_items || 0,
        supplier_summary: dashData.supplier_summary || [],
        last_day_sales: dashData.last_day_sales || 0,
        low_stock_items: (dashData.low_stock_items || []).map((i) => ({
          drug_name: i.name || "",
          stock: i.stock || 0,
        })),
        expired_items: (dashData.expired_items || []).map((i) => ({
          drug_name: i.name || "",
          expiry_date: i.expiry_date || "",
        })),
        total_sales_amount: dashData.total_sales_amount || 0,
        total_stock: dashData.total_stock || 0,
        top_selling_drugs: (dashData.top_selling_drugs || []).map((d) => ({
          drug_name: d.name || "",
          sold_items: d.quantity || 0,
          line_total: d.line_total || 0,
        })),
        transaction_count: dashData.transaction_count || 0,
      });
    } catch (err) {
      console.error("Vendor dashboard error:", err);
      if (err.response) {
        const resData = err.response.data || {};
        const vendor_child_ids = resData.vendor_child_ids || [];
        const sub = resData.subscription || null;
        const dashData = resData.data || {};
        
        if (Array.isArray(vendor_child_ids) && user?.isMaster && vendor_child_ids.length > 0 && vendor_child_ids[0].vendor_id) {
          localStorage.setItem("vendor_child_ids", JSON.stringify(vendor_child_ids));
          const options = vendor_child_ids.map((b) => ({
            value: b.vendor_id || "",
            label: b.business_name || b.branch_id || `Branch ${(b.vendor_id || "").substring(0, 8)}`,
            branch_id: b.branch_id || `Branch ${(b.vendor_id || "").substring(0, 8)}`,
          }));
          setBranchOptions(options);
        }
        
        if (sub) {
          localStorage.setItem("vendor_subscription", JSON.stringify(sub));
          setSubscription(sub);
        }
        
        setVendorDashboardData({
          ...INITIAL_VENDOR_DASHBOARD,
          total_medicines: dashData.total_medicines || 0,
          total_sold_items: dashData.total_sold_items || 0,
          supplier_summary: dashData.supplier_summary || [],
          last_day_sales: dashData.last_day_sales || 0,
          low_stock_items: (dashData.low_stock_items || []).map((i) => ({
            drug_name: i.name || "",
            stock: i.stock || 0,
          })),
          expired_items: (dashData.expired_items || []).map((i) => ({
            drug_name: i.name || "",
            expiry_date: i.expiry_date || "",
          })),
          total_sales_amount: dashData.total_sales_amount || 0,
          total_stock: dashData.total_stock || 0,
          top_selling_drugs: (dashData.top_selling_drugs || []).map((d) => ({
            drug_name: d.name || "",
            sold_items: d.quantity || 0,
            line_total: d.line_total || 0,
          })),
          transaction_count: dashData.transaction_count || 0,
        });
        
        if (err.response.status === 403) {
          setShowTrialExpired(true);
        }
      } else {
        setVendorDashboardData(INITIAL_VENDOR_DASHBOARD);
      }
    } finally {
      setVendorLoading(false);
    }
  };

  const fetchSubAccountData = async () => {
    try {
      setVendorLoading(true);
      const storedData = localStorage.getItem("vendor_child_ids");
      if (!storedData) {
        setErrorTooltip("No sub-accounts found!");
        setVendorLoading(false);
        return;
      }
      
      let payload;
      try {
        payload = JSON.parse(storedData);
      } catch (e) {
        setErrorTooltip("Invalid sub-account data");
        setVendorLoading(false);
        return;
      }
      
      const currentBranchId = localStorage.getItem("branchId") || user?.branchId || "MAIN";
      const masterEntry = {
        vendor_id: user.userId,
        branch_id: currentBranchId,
      };
      payload = [...payload, masterEntry];
      
      const response = await apiService.post(apiEndpoints.subaccounthold, payload, { headers: emailHeader });
      const resData = response.data || {};
      const dashData = resData.data || {};
      
      setVendorDashboardData({
        ...INITIAL_VENDOR_DASHBOARD,
        total_medicines: dashData.total_medicines || 0,
        total_sold_items: dashData.total_sold_items || 0,
        supplier_summary: dashData.supplier_summary || [],
        last_day_sales: dashData.last_day_sales || 0,
        low_stock_items: (dashData.low_stock_items || []).map((i) => ({
          drug_name: i.name || "",
          stock: i.stock || 0,
        })),
        expired_items: (dashData.expired_items || []).map((i) => ({
          drug_name: i.name || "",
          expiry_date: i.expiry_date || "",
        })),
        total_sales_amount: dashData.total_sales_amount || 0,
        total_stock: dashData.total_stock || 0,
        top_selling_drugs: (dashData.top_selling_drugs || []).map((d) => ({
          drug_name: d.name || "",
          sold_items: d.quantity || 0,
          line_total: d.line_total || 0,
        })),
        top_branches_by_sales: dashData.top_branches_by_sales || [],
        top_branches_by_stock: dashData.top_branches_by_stock || [],
        top_branches_by_medicines_count: dashData.top_branches_by_medicines_count || [],
        top_branches_by_sold_items: dashData.top_branches_by_sold_items || [],
        transaction_count: dashData.total_transaction_count || dashData.transaction_count || 0,
      });
      
      setIsSubAccountView(true);
      setSelectedBranch("all");
    } catch (err) {
      console.error("Sub-branch analytics error:", err);
      setErrorTooltip(err.response?.data?.message || "Failed to load combined branches data");
      setVendorDashboardData(INITIAL_VENDOR_DASHBOARD);
    } finally {
      setVendorLoading(false);
    }
  };

  useEffect(() => {
    if (errorTooltip) {
      const timer = setTimeout(() => setErrorTooltip(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorTooltip]);

  const handleBranchChange = async (branchId) => {
    // Prevent API call if selecting the same branch
    if (branchId === selectedBranch) {
      return;
    }
    
    setSelectedBranch(branchId);
    if (branchId === "all") {
      await fetchVendorData();
    } else {
      await fetchVendorData(branchId);
    }
  };

  const handleBackToVendor = async () => {
    setIsSubAccountView(false);
    setSelectedBranch("all");
    await fetchVendorData();
  };

  useEffect(() => {
    if (userRole === "vendor" && user?.userId && !isFinanceAccount) {
      fetchVendorData();
    }
  }, [user?.userId, userRole, userEmail, isFinanceAccount]);

  useEffect(() => {
    const saved = localStorage.getItem("vendor_subscription");
    if (saved) {
      try {
        const sub = JSON.parse(saved);
        const isExpired =
          sub.plan === SUBSCRIPTION_PLANS.FREE_TRIAL &&
          (sub.status === SUBSCRIPTION_STATUS.EXPIRED ||
            new Date(sub.end_date) < new Date());
        if (isExpired) {
          setSubscription(sub);
          setShowTrialExpired(true);
        } else {
          setSubscription(sub);
        }
      } catch (e) {
        localStorage.removeItem("vendor_subscription");
        setSubscription(null);
      }
    }
  }, []);

  useEffect(() => {
    if (userRole === "admin" && user?.userId) {
      const fetchData = async () => {
        try {
          setAdminLoading(true);
          const response = await apiService.get(apiEndpoints.adminDashboard(), {
            headers: {
              ...emailHeader,
              Authorization: `Bearer ${user?.accessToken || ""}`,
            },
          });
          setAdminDashboardData(response.data?.data || null);
        } catch (err) {
          console.error("Admin dashboard error:", err);
          setAdminDashboardData(null);
        } finally {
          setAdminLoading(false);
        }
      };
      fetchData();
    }
  }, [user?.userId, userRole, userEmail]);

  if (!["vendor", "admin"].includes(userRole))
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card title={DASHBOARD_TEXTS.ACCESS_ERROR} className="max-w-md w-full">
          <p className="text-red-500 text-center p-6">{DASHBOARD_TEXTS.INVALID_ROLE}</p>
        </Card>
      </div>
    );

  const isPageLoading = (userRole === "vendor" && vendorLoading) || (userRole === "admin" && adminLoading);

  const isFreeTrialActive =
    subscription?.plan === SUBSCRIPTION_PLANS.FREE_TRIAL &&
    subscription?.status === SUBSCRIPTION_STATUS.ACTIVE &&
    new Date(subscription.end_date) > new Date();
  
  const isTrialExpiredOrUsed =
    subscription?.plan === SUBSCRIPTION_PLANS.FREE_TRIAL &&
    (subscription?.status === SUBSCRIPTION_STATUS.EXPIRED ||
      subscription?.trial_used === true ||
      new Date(subscription?.end_date) <= new Date());

  // Function to render subscription plan badge
const renderSubscriptionBadge = () => {
  if (!subscription?.plan) return null;
  
  const planColors = {
    [SUBSCRIPTION_PLANS.FREE_TRIAL]: "bg-gradient-to-r from-indigo-500 to-purple-500",
    [SUBSCRIPTION_PLANS.BASIC]: "bg-gradient-to-r from-emerald-500 to-teal-500",
    [SUBSCRIPTION_PLANS.PREMIUM]: "bg-gradient-to-r from-amber-500 to-orange-500",
    [SUBSCRIPTION_PLANS.ENTERPRISE]: "bg-gradient-to-r from-purple-600 to-pink-600",
  };
  
  const planIcons = {
    [SUBSCRIPTION_PLANS.FREE_TRIAL]: <Sparkles className="w-4 h-4" />,
    [SUBSCRIPTION_PLANS.BASIC]: <Star className="w-4 h-4" />,
    [SUBSCRIPTION_PLANS.PREMIUM]: <Crown className="w-4 h-4" />,
    [SUBSCRIPTION_PLANS.ENTERPRISE]: <Building2 className="w-4 h-4" />,
  };
  
  const colorClass = planColors[subscription.plan] || "bg-gradient-to-r from-gray-500 to-gray-700";
  
  return (
    <div
      className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm font-bold shadow-lg ${colorClass}`}
      style={{ textDecoration: 'none' }} // Add this inline style
    >
      {planIcons[subscription.plan] || <Star className="w-4 h-4" />}
      <span style={{ textDecoration: 'none' }}> {/* Add this wrapper span */}
    {subscription.plan.split('_').map(word => 
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
).join(' ')} Plan
      </span>
      {subscription.remaining_days > 0 && (
        <span className="text-[10px] sm:text-xs opacity-90 ml-1" style={{ textDecoration: 'none' }}>
          • {subscription.remaining_days} days left
        </span>
      )}
    </div>
  );
};

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .hover-lift:hover {
          transform: translateY(-6px);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        @keyframes pulse-alert {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .pulse-alert {
          animation: pulse-alert 1.5s infinite;
        }
      `}</style>

      {/* Trial Expired Modal using reusable Modal component */}
      <Modal
        isOpen={showTrialExpired && isTrialExpiredOrUsed}
        onClose={() => setShowTrialExpired(false)}
        title={
          <div className="text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 sm:w-14 sm:h-14 text-red-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-800 mb-4">
              {DASHBOARD_TEXTS.TRIAL_EXPIRED}
            </h2>
          </div>
        }
        className="max-w-lg w-full"
      >
        <div className="p-4 sm:p-6">
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed text-center">
            {DASHBOARD_TEXTS.TRIAL_ENDED}
            <br />
            Subscribe now to continue using all premium features.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/admin-vendors/payments/payment")}
              className="font-bold px-6 sm:px-8 w-full sm:w-auto"
            >
              {DASHBOARD_TEXTS.SUBSCRIBE_NOW}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowTrialExpired(false)}
              className="font-bold px-6 sm:px-8 w-full sm:w-auto"
            >
              {DASHBOARD_TEXTS.LATER}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
        {userRole === "vendor" && !isFinanceAccount && (
          <div className="w-full max-w-none">
            {/* Card without overflow restrictions */}
            <Card
              className="mb-6 sm:mb-8 border-0 shadow-lg"
              bodyClassName="p-4 sm:p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {user?.isMaster && isSubAccountView && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBackToVendor}
                      disabled={vendorLoading}
                      className="flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">
                        {vendorLoading ? DASHBOARD_TEXTS.LOADING : DASHBOARD_TEXTS.GO_BACK}
                      </span>
                    </Button>
                  )}
                  <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                      {isSubAccountView ? DASHBOARD_TEXTS.SUB_ACCOUNT : DASHBOARD_TEXTS.VENDOR}
                    </h1>
                    {!isSubAccountView && subscription && renderSubscriptionBadge()}
                  </div>
                </div>
                
                <div className="flex flex-col items-start gap-2">
                  {isSubAccountView && (
                    <div className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                      <span className="text-xs sm:text-sm text-gray-600 font-medium">{DASHBOARD_TEXTS.CURRENTLY_VIEWING}</span>
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-sm w-fit ${
                        selectedBranch === "all" 
                          ? "bg-green-100 text-green-800 border border-green-300" 
                          : "bg-blue-100 text-blue-800 border border-blue-300"
                      }`}>
                        {selectedBranch === "all"
                          ? DASHBOARD_TEXTS.ALL_BRANCHES_TEXT
                          : branchOptions.find(branch => branch.value === selectedBranch)?.label || DASHBOARD_TEXTS.SELECTED_BRANCH}
                      </span>
                    </div>
                  )}
                </div>
                
                {user?.isMaster && !isSubAccountView ? (
                  /* Dropdown container - no extra z-index needed because InputSelect uses portal */
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0 animate-fade-up">
                    {/* Branch Selector using InputSelect component - Made wider */}
                    <div className="w-full sm:w-80 md:w-96">
                      <InputSelect
                        label=""
                        name="branch"
                        value={selectedBranch}
                        onChange={(e) => handleBranchChange(e.target.value)}
                        disabled={vendorLoading}
                        className="w-full"
                        inputClassName="py-3 text-sm"
                      >
                        <option value="all">{currentBusinessName}</option>
                        {branchOptions.map((branch) => (
                          <option key={branch.value} value={branch.value}>
                            {branch.label}
                          </option>
                        ))}
                      </InputSelect>
                    </div>
                    
                    <div className="relative w-full sm:w-auto">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={fetchSubAccountData}
                        disabled={vendorLoading}
                        className="flex items-center justify-center gap-2 w-full text-xs sm:text-sm px-6 py-3"
                        loading={vendorLoading}
                        loadingText={DASHBOARD_TEXTS.LOADING}
                      >
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="sm:inline">
                          {vendorLoading ? DASHBOARD_TEXTS.LOADING : DASHBOARD_TEXTS.ALL_BRANCHES}
                        </span>
                      </Button>
                      {errorTooltip && (
                        <div className="absolute top-full left-0 mt-2 bg-red-500 text-white p-2 rounded shadow-lg text-xs sm:text-sm w-full z-50">
                          {errorTooltip}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
            
            {isFreeTrialActive && subscription?.end_date && (
              <TrialCountdownBar endDate={subscription.end_date} />
            )}
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-8 sm:mb-10">
              <KPICard
                icon={<Pill />}
                title="Total Transaction"
                value={<CountUp end={vendorDashboardData.transaction_count} />}
                delay="0.1s"
              />
              <KPICard
                icon={<ShoppingCart />}
                title="Items Sold"
                value={<CountUp end={vendorDashboardData.total_sold_items} />}
                delay="0.2s"
              />
              <KPICard
                icon={<Package />}
                title="Total Sales"
                value={<CountUp end={vendorDashboardData.total_sales_amount} prefix="Rs" />}
                delay="0.3s"
              />
              <KPICard
                icon={<Package />}
                title="Current Stock"
                value={<CountUp end={vendorDashboardData.total_stock} />}
                delay="0.4s"
              />
              <KPICard
                icon={<TrendingUp />}
                title="Yesterday Sales"
                value={<CountUp end={vendorDashboardData.last_day_sales} prefix="Rs" />}
                delay="0.5s"
              />
            </div>
            
            {/* Modern Status Cards - Replacement for Circular Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {/* Low Stock Card */}
              <Card 
                className={`border-0 shadow-lg hover-lift animate-fade-up overflow-hidden ${
                  vendorDashboardData.low_stock_items.length > vendorDashboardData.total_medicines * 0.2 
                    ? "bg-gradient-to-br from-red-50 to-pink-50" 
                    : "bg-gradient-to-br from-blue-50 to-indigo-50"
                }`}
                style={{ animationDelay: "0.6s" }}
                bodyClassName="p-5 sm:p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    vendorDashboardData.low_stock_items.length > vendorDashboardData.total_medicines * 0.2 
                      ? "bg-red-100" 
                      : "bg-blue-100"
                  }`}>
                    <AlertTriangle className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      vendorDashboardData.low_stock_items.length > vendorDashboardData.total_medicines * 0.2 
                        ? "text-red-600" 
                        : "text-blue-600"
                    }`} />
                  </div>
                  {vendorDashboardData.low_stock_items.length > vendorDashboardData.total_medicines * 0.2 && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full pulse-alert">
                      ALERT
                    </span>
                  )}
                </div>
                
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Low Stock Items</h3>
                <p className="text-xs text-gray-500 mb-4">Medicines below threshold</p>
                
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-gray-800">
                      {vendorDashboardData.low_stock_items.length}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {vendorDashboardData.total_medicines} total
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Low Stock %</span>
                      <span className="font-medium text-gray-700">
                        {vendorDashboardData.total_medicines > 0 
                          ? Math.round((vendorDashboardData.low_stock_items.length / vendorDashboardData.total_medicines) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          vendorDashboardData.low_stock_items.length > vendorDashboardData.total_medicines * 0.2 
                            ? "bg-red-500" 
                            : "bg-blue-500"
                        }`}
                        style={{ 
                          width: vendorDashboardData.total_medicines > 0 
                            ? `${(vendorDashboardData.low_stock_items.length / vendorDashboardData.total_medicines) * 100}%` 
                            : '0%' 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-white/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Critical</p>
                      <p className="text-sm font-bold text-red-600">
                        {vendorDashboardData.low_stock_items.filter(item => item.stock < 20).length}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Warning</p>
                      <p className="text-sm font-bold text-yellow-600">
                        {vendorDashboardData.low_stock_items.filter(item => item.stock >= 20 && item.stock < 50).length}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Expired Items Card */}
              <Card 
                className={`border-0 shadow-lg hover-lift animate-fade-up overflow-hidden ${
                  vendorDashboardData.expired_items.length > 0 
                    ? "bg-gradient-to-br from-rose-50 to-red-50" 
                    : "bg-gradient-to-br from-orange-50 to-amber-50"
                }`}
                style={{ animationDelay: "0.7s" }}
                bodyClassName="p-5 sm:p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    vendorDashboardData.expired_items.length > 0 ? "bg-red-100" : "bg-orange-100"
                  }`}>
                    <Calendar className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      vendorDashboardData.expired_items.length > 0 ? "text-red-600" : "text-orange-600"
                    }`} />
                  </div>
                  {vendorDashboardData.expired_items.length > 0 && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full pulse-alert">
                      EXPIRED
                    </span>
                  )}
                </div>
                
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Expired Medicines</h3>
                <p className="text-xs text-gray-500 mb-4">Past expiry date</p>
                
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-gray-800">
                      {vendorDashboardData.expired_items.length}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {vendorDashboardData.total_medicines} total
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Expired %</span>
                      <span className="font-medium text-gray-700">
                        {vendorDashboardData.total_medicines > 0 
                          ? Math.round((vendorDashboardData.expired_items.length / vendorDashboardData.total_medicines) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          vendorDashboardData.expired_items.length > 0 ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{ 
                          width: vendorDashboardData.total_medicines > 0 
                            ? `${(vendorDashboardData.expired_items.length / vendorDashboardData.total_medicines) * 100}%` 
                            : '0%' 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="bg-white/50 rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-600">
                        {vendorDashboardData.expired_items.length > 0 
                          ? `Needs immediate attention` 
                          : `All medicines are within expiry`}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Stock Health Card */}
              <Card 
                className="border-0 shadow-lg hover-lift animate-fade-up bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden"
                style={{ animationDelay: "0.8s" }}
                bodyClassName="p-5 sm:p-6"
              >
                <div className="flex items-start mb-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
                
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Stock Health</h3>
                <p className="text-xs text-gray-500 mb-4">Overall inventory status</p>
                
                {(() => {
                  const healthy = vendorDashboardData.total_medicines - vendorDashboardData.low_stock_items.length;
                  const pct = vendorDashboardData.total_medicines > 0 
                    ? Math.round((healthy / vendorDashboardData.total_medicines) * 100) 
                    : 0;
                  const isGood = pct >= 70;
                  const isWarning = pct >= 40 && pct < 70;
                  const isCritical = pct < 40;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-black text-gray-800">{healthy}</span>
                        <span className="text-sm text-gray-500">/ {vendorDashboardData.total_medicines} healthy</span>
                      </div>
                      
                      {/* Health Status Badge */}
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white shadow-sm">
                        <span className={
                          isGood ? "text-green-600" : isWarning ? "text-yellow-600" : "text-red-600"
                        }>
                          {isGood ? "● Healthy" : isWarning ? "● Moderate" : "● Critical"}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Health Score</span>
                          <span className={`font-medium ${
                            isGood ? "text-green-600" : isWarning ? "text-yellow-600" : "text-red-600"
                          }`}>{pct}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isGood ? "bg-green-500" : isWarning ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Distribution Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="bg-white/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500">Healthy Stock</p>
                          <p className="text-sm font-bold text-green-600">{healthy}</p>
                        </div>
                        <div className="bg-white/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500">Low Stock</p>
                          <p className="text-sm font-bold text-red-600">{vendorDashboardData.low_stock_items.length}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            </div>
            
            {/* Chart Cards - Only show when NOT in sub-account view */}
            {!isSubAccountView && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                  <Card 
                    title={DASHBOARD_TEXTS.TOP_5_DRUGS} 
                    className="animate-fade-up border-0 shadow-lg"
                    bodyClassName="p-4 sm:p-6"
                    style={{ animationDelay: "0.9s" }}
                  >
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={generateTopDrugsTrend(vendorDashboardData.top_selling_drugs)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="drug"
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            background: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Line
                          type="monotone"
                          dataKey="units"
                          stroke={COLORS.INFO}
                          strokeWidth={2}
                          dot={{ fill: COLORS.INFO, r: 4 }}
                          name="Units Sold"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                  
                  <Card 
                    title={DASHBOARD_TEXTS.TOTAL_MEDICINE} 
                    className="animate-fade-up border-0 shadow-lg"
                    bodyClassName="p-4 sm:p-6"
                    style={{ animationDelay: "1.0s" }}
                  >
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={[
                        { name: "Total", count: vendorDashboardData.total_medicines },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Bar dataKey="count" fill={COLORS.SUCCESS} name="Medicine" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
                
                {/* List Cards - Displayed in a 2-column grid */}
             {/* List Cards - Displayed in a 2-column grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
  <Card 
    title={
      <div className="flex items-center gap-2 sm:gap-3 text-primary">
        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-sm sm:text-base">{DASHBOARD_TEXTS.LOW_STOCK_ALERTS}</span>
      </div>
    }
    className="animate-fade-up border-0 shadow-lg"
    bodyClassName="p-4 sm:p-5"
    style={{ animationDelay: "1.1s" }}
  >
    <div className="max-h-48 sm:max-h-64 overflow-y-auto">
      {vendorDashboardData.low_stock_items.length === 0 ? (
        <p className="text-center text-gray-500 py-4 sm:py-6 text-xs sm:text-sm">{DASHBOARD_TEXTS.NO_LOW_STOCK}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {vendorDashboardData.low_stock_items.map((item, i) => (
            <ListItem
              key={i}
              name={item.drug_name}
              value={item.stock}
              critical={item.stock < 50}
            />
          ))}
        </div>
      )}
    </div>
  </Card>
  
  <Card 
    title={
      <div className="flex items-center gap-2 sm:gap-3 text-primary">
        <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-sm sm:text-base">{DASHBOARD_TEXTS.EXPIRED_MEDICINES}</span>
      </div>
    }
    className="animate-fade-up border-0 shadow-lg"
    bodyClassName="p-4 sm:p-5"
    style={{ animationDelay: "1.2s" }}
  >
    <div className="max-h-48 sm:max-h-64 overflow-y-auto">
      {vendorDashboardData.expired_items.length === 0 ? (
        <p className="text-center text-gray-500 py-4 sm:py-6 text-xs sm:text-sm">{DASHBOARD_TEXTS.NO_EXPIRED}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {vendorDashboardData.expired_items.map((item, i) => (
  <ListItem
    key={i}
    name={item.drug_name}
    value={formatExpiryDate(item.expiry_date)}
    expired
  />
))}
        </div>
      )}
    </div>
  </Card>
</div>
              </>
            )}
            
            {/* Sub Account Views - Show only when in sub-account view */}
            {isSubAccountView && selectedBranch === "all" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12">
                <Card 
                  title={
                    <div className="flex items-center gap-2 sm:gap-3 text-primary">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-sm sm:text-base">{DASHBOARD_TEXTS.TOP_BRANCHES_SALES}</span>
                    </div>
                  }
                  className="animate-fade-up border-0 shadow-lg"
                  bodyClassName="p-4 sm:p-5"
                  style={{ animationDelay: "1.3s" }}
                >
                  <div className="max-h-48 sm:max-h-64 overflow-y-auto">
                    {vendorDashboardData.top_branches_by_sales.length === 0 ? (
                      <p className="text-center text-gray-500 py-4 sm:py-6 text-xs sm:text-sm">{DASHBOARD_TEXTS.NO_DATA}</p>
                    ) : (
                      vendorDashboardData.top_branches_by_sales.map((branch, i) => (
                        <ListItem
                          key={i}
                          name={branchNameMap[branch.branch_id] || branch.branch_id || `Branch ${i + 1}`}
                          value={`Rs ${Number(branch.total_sales_amount || 0).toLocaleString()}`}
                        />
                      ))
                    )}
                  </div>
                </Card>
                
                <Card 
                  title={
                    <div className="flex items-center gap-2 sm:gap-3 text-primary">
                      <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-sm sm:text-base">{DASHBOARD_TEXTS.TOP_BRANCHES_STOCK}</span>
                    </div>
                  }
                  className="animate-fade-up border-0 shadow-lg"
                  bodyClassName="p-4 sm:p-5"
                  style={{ animationDelay: "1.4s" }}
                >
                  <div className="max-h-48 sm:max-h-64 overflow-y-auto">
                    {vendorDashboardData.top_branches_by_stock.length === 0 ? (
                      <p className="text-center text-gray-500 py-4 sm:py-6 text-xs sm:text-sm">{DASHBOARD_TEXTS.NO_DATA}</p>
                    ) : (
                      vendorDashboardData.top_branches_by_stock.map((branch, i) => (
                        <ListItem
                          key={i}
                          name={branchNameMap[branch.branch_id] || branch.branch_id || `Branch ${i + 1}`}
                          value={Number(branch.total_stock || 0).toLocaleString()}
                        />
                      ))
                    )}
                  </div>
                </Card>
                
                <Card 
                  title={
                    <div className="flex items-center gap-2 sm:gap-3 text-primary">
                      <Pill className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-sm sm:text-base">{DASHBOARD_TEXTS.TOP_BRANCHES_MEDICINES}</span>
                    </div>
                  }
                  className="animate-fade-up border-0 shadow-lg"
                  bodyClassName="p-4 sm:p-5"
                  style={{ animationDelay: "1.5s" }}
                >
                  <div className="max-h-48 sm:max-h-64 overflow-y-auto">
                    {vendorDashboardData.top_branches_by_medicines_count.length === 0 ? (
                      <p className="text-center text-gray-500 py-4 sm:py-6 text-xs sm:text-sm">{DASHBOARD_TEXTS.NO_DATA}</p>
                    ) : (
                      vendorDashboardData.top_branches_by_medicines_count.map((branch, i) => (
                        <ListItem
                          key={i}
                          name={branchNameMap[branch.branch_id] || branch.branch_id || `Branch ${i + 1}`}
                          value={Number(branch.total_medicines || 0).toLocaleString()}
                        />
                      ))
                    )}
                  </div>
                </Card>
                
                <Card 
                  title={
                    <div className="flex items-center gap-2 sm:gap-3 text-primary">
                      <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-sm sm:text-base">{DASHBOARD_TEXTS.TOP_BRANCHES_SOLD}</span>
                    </div>
                  }
                  className="animate-fade-up border-0 shadow-lg"
                  bodyClassName="p-4 sm:p-5"
                  style={{ animationDelay: "1.6s" }}
                >
                  <div className="max-h-48 sm:max-h-64 overflow-y-auto">
                    {vendorDashboardData.top_branches_by_sold_items.length === 0 ? (
                      <p className="text-center text-gray-500 py-4 sm:py-6 text-xs sm:text-sm">{DASHBOARD_TEXTS.NO_DATA}</p>
                    ) : (
                      vendorDashboardData.top_branches_by_sold_items.map((branch, i) => (
                        <ListItem
                          key={i}
                          name={branchNameMap[branch.branch_id] || branch.branch_id || `Branch ${i + 1}`}
                          value={Number(branch.total_sold_items || 0).toLocaleString()}
                        />
                      ))
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
        
        {/* ==================== ADMIN DASHBOARD ==================== */}
        {userRole === "admin" && adminDashboardData && (
          <div className="w-full max-w-none">
            <div className="text-center mb-6 sm:mb-8 lg:mb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#30426B] to-[#5A75C7] animate-fade-up">
                {DASHBOARD_TEXTS.ADMIN}
              </h1>
            </div>
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 sm:mb-10">
              <KPICard
                icon={<Building2 />}
                title={DASHBOARD_TEXTS.PHARMACY_GROUPS}
                value={<CountUp end={adminDashboardData.total_pharmacy_groups || 0} />}
                delay="0.1s"
              />
              <KPICard
                icon={<Users />}
                title={DASHBOARD_TEXTS.TOTAL_VENDORS}
                value={<CountUp end={adminDashboardData.total_vendors || 0} />}
                delay="0.2s"
              />
              <KPICard
                icon={<Banknote />}
                title={DASHBOARD_TEXTS.REVENUE_LAST_30D}
                value={<CountUp end={adminDashboardData.revenue_last_30d || 0} prefix="Rs" />}
                delay="0.3s"
              />
              <KPICard
                icon={<Banknote />}
                title={DASHBOARD_TEXTS.MONTHLY_RECURRING}
                value={<CountUp end={adminDashboardData.monthly_recurring_revenue || 0} prefix="Rs" />}
                delay="0.4s"
              />
              <KPICard
                icon={<Activity />}
                title={DASHBOARD_TEXTS.ACTIVE_SUBSCRIPTIONS}
                value={<CountUp end={adminDashboardData.total_active_subscriptions || 0} />}
                delay="0.5s"
              />
            </div>
            
            {/* Second Row KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <KPICard
                icon={<AlertCircle />}
                title={DASHBOARD_TEXTS.EXPIRING_SOON}
                value={<CountUp end={adminDashboardData.subscriptions_expiring_soon || 0} />}
                delay="0.6s"
                colorClass="from-orange-400 to-red-500"
              />
              <KPICard
                icon={<Clock />}
                title={DASHBOARD_TEXTS.PENDING_REQUESTS}
                value={<CountUp end={adminDashboardData.pending_order_requests || 0} />}
                delay="0.7s"
                colorClass="from-yellow-400 to-amber-500"
              />
              <KPICard
                icon={<Users />}
                title={DASHBOARD_TEXTS.NEW_VENDORS_30D}
                value={<CountUp end={adminDashboardData.new_vendors_last_30d || 0} />}
                delay="0.8s"
              />
              <KPICard
                icon={<Building2 />}
                title={DASHBOARD_TEXTS.INDEPENDENT_PHARMACIES}
                value={<CountUp end={adminDashboardData.total_independent_pharmacies || 0} />}
                delay="0.9s"
              />
              <KPICard
                icon={<Package />}
                title={DASHBOARD_TEXTS.TOTAL_BRANCHES}
                value={<CountUp end={adminDashboardData.total_branches || 0} />}
                delay="1.0s"
              />
            </div>
            
            {/* Admin Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <Card className="border-0 shadow-lg hover-lift animate-fade-up bg-gradient-to-br from-emerald-50 to-teal-50" style={{ animationDelay: "1.1s" }} bodyClassName="p-5 sm:p-6">
                <div className="flex items-start mb-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Subscription Coverage</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-gray-800">
                      {adminDashboardData.total_active_subscriptions || 0}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {adminDashboardData.total_vendors || 1} vendors
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Coverage</span>
                      <span className="font-medium text-emerald-600">
                        {adminDashboardData.total_vendors > 0 
                          ? Math.round((adminDashboardData.total_active_subscriptions / adminDashboardData.total_vendors) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ 
                          width: adminDashboardData.total_vendors > 0 
                            ? `${(adminDashboardData.total_active_subscriptions / adminDashboardData.total_vendors) * 100}%` 
                            : '0%' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="border-0 shadow-lg hover-lift animate-fade-up bg-gradient-to-br from-blue-50 to-indigo-50" style={{ animationDelay: "1.2s" }} bodyClassName="p-5 sm:p-6">
                <div className="flex items-start mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Order Request Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-gray-800">
                      {adminDashboardData.pending_order_requests || 0}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {adminDashboardData.total_order_requests || 1} total
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Pending</span>
                      <span className="font-medium text-blue-600">
                        {adminDashboardData.total_order_requests > 0 
                          ? Math.round((adminDashboardData.pending_order_requests / adminDashboardData.total_order_requests) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{ 
                          width: adminDashboardData.total_order_requests > 0 
                            ? `${(adminDashboardData.pending_order_requests / adminDashboardData.total_order_requests) * 100}%` 
                            : '0%' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="border-0 shadow-lg hover-lift animate-fade-up bg-gradient-to-br from-purple-50 to-pink-50" style={{ animationDelay: "1.3s" }} bodyClassName="p-5 sm:p-6">
                <div className="flex items-start mb-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Growth Rate (30d)</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-gray-800">
                      {adminDashboardData.new_vendors_last_30d || 0}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {adminDashboardData.total_vendors || 1} total
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Growth</span>
                      <span className="font-medium text-purple-600">
                        {adminDashboardData.total_vendors > 0 
                          ? Math.round((adminDashboardData.new_vendors_last_30d / adminDashboardData.total_vendors) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                        style={{ 
                          width: adminDashboardData.total_vendors > 0 
                            ? `${(adminDashboardData.new_vendors_last_30d / adminDashboardData.total_vendors) * 100}%` 
                            : '0%' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* List Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <Card 
                title={
                  <div className="flex items-center gap-2 sm:gap-3 text-primary">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-sm sm:text-base">{DASHBOARD_TEXTS.TOP_PERFORMING_PHARMACIES}</span>
                  </div>
                }
                className="animate-fade-up border-0 shadow-lg"
                bodyClassName="p-4 sm:p-5"
                style={{ animationDelay: "1.4s" }}
              >
                <div className="max-h-48 sm:max-h-64 overflow-y-auto">
                  {adminDashboardData.top_performing_pharmacies?.length === 0 ? (
                    <p className="text-center text-gray-500 py-4 sm:py-6 text-xs sm:text-sm">{DASHBOARD_TEXTS.NO_DATA}</p>
                  ) : (
                    adminDashboardData.top_performing_pharmacies?.map((pharmacy, i) => (
                      <ListItem
                        key={i}
                        name={pharmacy.businessName || `Pharmacy ${i + 1}`}
                        value={`${pharmacy.orders_last_30d || 0} orders`}
                      />
                    ))
                  )}
                </div>
              </Card>
              
              <Card 
                title={
                  <div className="flex items-center gap-2 sm:gap-3 text-primary">
                    <Banknote className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-sm sm:text-base">{DASHBOARD_TEXTS.REVENUE_TREND}</span>
                  </div>
                }
                className="animate-fade-up border-0 shadow-lg"
                bodyClassName="p-4 sm:p-5"
                style={{ animationDelay: "1.5s" }}
              >
                <div className="p-2 sm:p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { name: "Revenue", amount: adminDashboardData.revenue_last_30d || 0 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#5A75C7" name="Revenue (Rs)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ==================== HELPER UI COMPONENTS ====================
function KPICard({ icon, title, value, delay, colorClass }) {
  const gradient = colorClass || "from-[#30426B] via-[#3C5690] to-[#5A75C7]";

  return (
    <div
      className={`bg-gradient-to-r ${gradient} text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow hover-lift animate-fade-up transition-all duration-300 border border-white/20 relative overflow-hidden`}
      style={{ animationDelay: delay }}
    >
      {/* Icon at top right corner - made smaller */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-20">
        {React.cloneElement(icon, { 
          className: "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" 
        })}
      </div>
      
      <div className="flex flex-col h-full relative z-10">
        <div className="mb-1 sm:mb-2">
          <p className="text-xs sm:text-sm opacity-90 font-medium truncate pr-6">{title}</p>
        </div>
        <div className="mt-auto">
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold break-words">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ListItem({ name, value, critical, expired }) {
  return (
    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl mb-2 transition-all hover:bg-gray-50 border ${
      critical || expired 
        ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-300" 
        : "bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200"
    }`}>
      <div className="flex justify-between items-center gap-2">
        <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">{name}</span>
        <span className={`text-xs sm:text-sm font-bold ${expired || critical ? "text-red-700" : "text-gray-700"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function generateTopDrugsTrend(topSellingDrugs) {
  if (!topSellingDrugs || topSellingDrugs.length === 0) {
    return Array(5).fill().map((_, i) => ({ drug: `Drug ${i + 1}`, units: 0 }));
  }
  return topSellingDrugs.slice(0, 5).map((d) => ({ drug: d.drug_name, units: d.sold_items }));
}
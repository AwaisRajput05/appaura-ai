import React, { useState, useEffect, useContext, useRef } from "react";
import { FiMenu, FiChevronDown, FiLogOut, FiClock, FiAlertCircle, FiUser } from "react-icons/fi";
import { useAuth } from "../../auth/hooks/useAuth";
import { AuthContext } from "../../auth/hooks/AuthContextDef";
import { AnimatePresence, motion } from "framer-motion";
import apiService from "../../../services/apiService";
import { apiEndpoints } from "../../../services/apiEndpoints";
import { getToken } from "../../../services/tokenUtils";

const menuVariants = {
  closed: { opacity: 0, y: -12, scale: 0.95 },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: "easeOut",
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  closed: { opacity: 0, x: -12 },
  open: { opacity: 1, x: 0 },
};

export default function Navbar({ 
  onToggleSidebar = () => {}, 
  isSidebarOpen = true,
  toggleButtonRef 
}) {
  const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);
  const [openRightSubMenu, setOpenRightSubMenu] = useState(null);
  const { logout } = useAuth();
  const { user } = useContext(AuthContext);
  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [loadingLogo, setLoadingLogo] = useState(true);
  const [logoError, setLogoError] = useState(false);
  
  // Session timer states
  const [sessionTimeLeft, setSessionTimeLeft] = useState(null);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const countdownRef = useRef(null);
  const modalShownRef = useRef(false);

  // Subscription expiry states
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [showSubscriptionWarning, setShowSubscriptionWarning] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const subscriptionModalShownRef = useRef(false);

  // Mobile menu states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const accountMenuRef = useRef(null);

  // Check if employee is logged in
  const isEmployee = !!user?.employeeId || !!localStorage.getItem("employeeId");
  const employeeName = localStorage.getItem("employeeName");
  const employeeEmail = localStorage.getItem("employeeEmail");

  useEffect(() => {
    const name = localStorage.getItem("businessName");
    if (name) setBusinessName(name);
  }, []);

  // Check subscription status from localStorage
  useEffect(() => {
    const checkSubscription = () => {
      const status = localStorage.getItem("subscriptionStatus");
      setSubscriptionStatus(status);
      
      if (status === "EXPIRED") {
        setShowSubscriptionWarning(true);
        
        if (!subscriptionModalShownRef.current) {
          setTimeout(() => {
            setShowSubscriptionModal(true);
            subscriptionModalShownRef.current = true;
          }, 1000);
        }
      } else {
        setShowSubscriptionWarning(false);
      }
    };

    checkSubscription();
    
    const handleStorageChange = (e) => {
      if (e.key === "subscriptionStatus") {
        checkSubscription();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      subscriptionModalShownRef.current = false;
    }
  }, [user]);

  // Logo fetching
  useEffect(() => {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) {
      setLoadingLogo(false);
      setLogoError(true);
      return;
    }
    
    const cacheKey = `vendorLogo_${vendorId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached && (cached.startsWith("data:image") || cached.startsWith("http"))) {
      setLogoUrl(cached);
      setLoadingLogo(false);
      setLogoError(false);
      return;
    }

    const fetchAndCacheLogo = async () => {
      try {
        setLoadingLogo(true);
        setLogoError(false);
        const token = getToken();
        if (!token) throw new Error("No token");
        const endpoint = apiEndpoints.getVendorLogo(vendorId);
        const response = await apiService.get(endpoint, {
          headers: { Authorization: `Bearer ${token}`, Accept: "image/*" },
          responseType: "blob",
          timeout: 15000,
        });
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          setLogoUrl(base64data);
          setLogoError(false);
          try {
            localStorage.setItem(cacheKey, base64data);
          } catch (e) {}
        };
        reader.readAsDataURL(response.data);
      } catch (err) {
        setLogoUrl(null);
        setLogoError(true);
      } finally {
        setLoadingLogo(false);
      }
    };
    fetchAndCacheLogo();
  }, []);

  // REAL-TIME Session expiry timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiresAt = localStorage.getItem('expiresAt');
      if (!expiresAt) return null;

      const expiryTime = parseInt(expiresAt, 10);
      const now = Date.now();
      const timeLeft = expiryTime - now;
      
      if (timeLeft <= 0) return { minutes: 0, seconds: 0, expired: true };

      const minutesLeft = Math.floor(timeLeft / 60000);
      const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
      
      return { minutes: minutesLeft, seconds: secondsLeft, timeLeft };
    };

    const updateTimer = () => {
      const timeData = calculateTimeLeft();
      
      if (!timeData) {
        setSessionTimeLeft(null);
        setShowExpiryWarning(false);
        return;
      }

      if (timeData.expired) {
        setSessionTimeLeft({ minutes: 0, seconds: 0 });
        setShowExpiryWarning(false);
        setShowExpiryModal(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('expiresAt');
        logout();
        return;
      }

      setSessionTimeLeft({ minutes: timeData.minutes, seconds: timeData.seconds });
      
      if (timeData.timeLeft <= 5 * 60 * 1000) {
        setShowExpiryWarning(true);
        
        if (timeData.timeLeft <= 2 * 60 * 1000 && !modalShownRef.current) {
          setShowExpiryModal(true);
          modalShownRef.current = true;
        }
      } else {
        setShowExpiryWarning(false);
        modalShownRef.current = false;
      }
    };

    updateTimer();
    countdownRef.current = setInterval(updateTimer, 1000);
    
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [logout]);

  const formatTime = (minutes, seconds) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const extendSession = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        alert('No refresh token available. Please login again.');
        return;
      }

      const response = await apiEndpoints.refreshtoken
        ? await apiService.post(
            apiEndpoints.refreshtoken, 
            {},
            { headers: { 'Refresh-Token': refreshToken } }
          )
        : null;

      if (!response || response.status !== 200) {
        alert('Failed to extend session. Please save your work and login again.');
        return;
      }

      const { accessToken, expiresIn } = response.data;
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        if (expiresIn) {
          localStorage.setItem('expiresAt', (Date.now() + expiresIn * 1000).toString());
        }
        modalShownRef.current = false;
        setShowExpiryWarning(false);
        setShowExpiryModal(false);
        alert('Session extended successfully!');
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      alert('Failed to extend session. Please save your work and login again.');
    }
  };

  const toggleLeftMenu = () => {
    setIsLeftMenuOpen((prev) => !prev);
    onToggleSidebar();
  };

  const toggleRightSubMenu = (key) => {
    setOpenRightSubMenu((prev) => (prev === key ? null : key));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setOpenRightSubMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    const vendorId = localStorage.getItem("vendorId");
    if (vendorId) localStorage.removeItem(`vendorLogo_${vendorId}`);
    subscriptionModalShownRef.current = false;
    logout();
  };

  // Determine what to display based on employee or master/vendor
  const displayName = isEmployee 
    ? (employeeName || user?.firstName || user?.employeeName || "Employee")
    : (businessName || "Account");

  const userEmail = isEmployee 
    ? (employeeEmail || user?.emailAddress || user?.employeeEmail || localStorage.getItem("emailAddress") || "employee@example.com")
    : (user?.email || localStorage.getItem("emailAddress") || "user@example.com");

  const rightMenuItems = [
    {
      id: 5,
      name: displayName,
      key: "account",
      icon: null,
      subItems: [
        {
          name: "Logout",
          icon: <FiLogOut className="text-lg" />,
          onClick: handleLogout,
        },
      ],
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between relative">

            {/* LEFT - Hamburger button - WITH REF ADDED */}
            <div className="flex items-center gap-2 sm:gap-5">
              <motion.button
                ref={toggleButtonRef}
                whileTap={{ scale: 0.9 }}
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: "#30426B",
                  color: "white"
                }}
                onClick={toggleLeftMenu}
                className="rounded-xl p-2 sm:p-2.5 text-gray-600 hover:text-white transition-all duration-200 shadow-sm hover:bg-gradient-to-r hover:from-[#30426B] hover:to-[#5A75C7] flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                <FiMenu className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.button>

              <div className={`hidden md:block w-px h-10 bg-gray-300/50 ${!isSidebarOpen ? 'ml-2' : ''}`} />
            </div>

            {/* RIGHT - All right side items */}
            <div className="flex items-center gap-4">

              {/* SUBSCRIPTION WARNING BADGE */}
              {showSubscriptionWarning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSubscriptionModal(true)}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg shadow-lg hover:from-red-600 hover:to-pink-700 transition-all cursor-pointer"
                  >
                    <FiAlertCircle className="text-lg" />
                    <span className="text-sm font-bold whitespace-nowrap">
                      Subscription Expired
                    </span>
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSubscriptionModal(true)}
                    className="sm:hidden p-2 rounded-full bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg"
                  >
                    <FiAlertCircle className="text-xl" />
                  </motion.button>
                </motion.div>
              )}

              {/* SESSION TIMER */}
              {sessionTimeLeft !== null && (
                <div className="flex items-center gap-2">
                  {showExpiryWarning ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-lg"
                    >
                      <FiClock className="text-lg animate-pulse" />
                      <span className="text-sm font-medium whitespace-nowrap">
                        Expires in {formatTime(sessionTimeLeft.minutes, sessionTimeLeft.seconds)}
                      </span>
                      <button
                        onClick={extendSession}
                        className="ml-2 px-3 py-1 bg-white text-orange-600 rounded-md text-xs font-bold hover:bg-orange-50 transition"
                      >
                        EXTEND
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 60, repeat: Infinity }}
                    >
                      <FiClock className="text-lg" />
                      <span className="text-sm font-medium font-mono">
                        {formatTime(sessionTimeLeft.minutes, sessionTimeLeft.seconds)}
                      </span>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    className={`sm:hidden px-2 py-1 rounded-full text-xs font-bold font-mono ${
                      showExpiryWarning 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse' 
                        : 'bg-blue-100 text-blue-700'
                    }`}
                    animate={showExpiryWarning ? { 
                      scale: [1, 1.05, 1],
                      transition: { duration: 1, repeat: Infinity }
                    } : {}}
                  >
                    <FiClock className="inline mr-1 text-xs" />
                    {formatTime(sessionTimeLeft.minutes, sessionTimeLeft.seconds)}
                  </motion.div>
                </div>
              )}

              {/* ACCOUNT MENU */}
              {rightMenuItems.map((item) => (
                <div key={item.key} className="hidden sm:block relative" ref={accountMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleRightSubMenu(item.key)}
                    className="flex items-center gap-2 rounded-2xl px-2 py-2 font-bold transition-all duration-300"
                  >
                    {loadingLogo ? (
                      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                    ) : logoUrl && !logoError ? (
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={logoUrl}
                        alt={businessName}
                        className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#30426B] to-[#5A75C7] flex items-center justify-center text-white font-bold text-sm">
                        {displayName?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="hidden lg:block">{item.name}</span>
                    <motion.div
                      animate={{
                        rotate: openRightSubMenu === item.key ? 180 : 0,
                      }}
                    >
                      <FiChevronDown className="text-lg" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {openRightSubMenu === item.key && (
                      <motion.div
                        variants={menuVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="absolute right-0 top-full mt-3 w-64 sm:w-72 origin-top-right z-50"
                      >
                        <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl">
                          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#30426B]/5 to-[#5A75C7]/10">
                            <div className="flex items-center gap-3">
                              {loadingLogo ? (
                                <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse" />
                              ) : logoUrl && !logoError ? (
                                <img
                                  src={logoUrl}
                                  alt={businessName}
                                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#30426B] to-[#5A75C7] flex items-center justify-center text-white font-bold text-xl shadow-inner">
                                  {displayName?.[0]?.toUpperCase() || "U"}
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-gray-600">Signed in as</p>
                                <p className="font-bold text-[#30426B] text-sm truncate max-w-[160px] sm:max-w-[200px]">
                                  {userEmail}
                                </p>
                             
                              </div>
                            </div>
                          </div>

                          {item.subItems.map((sub, idx) => (
                            <motion.button
                              key={idx}
                              variants={itemVariants}
                              whileHover={{
                                background: "linear-gradient(to right, #30426B, #5A75C7)",
                                color: "white",
                              }}
                              onClick={sub.onClick}
                              className="flex w-full items-center gap-4 px-5 py-4 text-left text-gray-700 hover:text-white font-medium transition-all"
                            >
                              <span className="text-red-600 text-xl">{sub.icon}</span>
                              <span>{sub.name}</span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Mobile Menu Button */}
              <div className="sm:hidden relative" ref={mobileMenuRef}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMobileMenu}
                  className="p-2.5 rounded-full bg-gradient-to-r from-[#30426B] to-[#5A75C7] text-white shadow-lg"
                >
                  <FiUser className="text-xl" />
                </motion.button>

                <AnimatePresence>
                  {isMobileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-64 origin-top-right z-50"
                    >
                      <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl">
                        {/* User Info */}
                        <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-[#30426B]/5 to-[#5A75C7]/10">
                          <div className="flex items-center gap-3">
                            {loadingLogo ? (
                              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                            ) : logoUrl && !logoError ? (
                              <img
                                src={logoUrl}
                                alt={businessName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#30426B] to-[#5A75C7] flex items-center justify-center text-white font-bold text-base shadow-inner">
                                {displayName?.[0]?.toUpperCase() || "U"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-600">Signed in as</p>
                              <p className="font-bold text-[#30426B] text-sm truncate">{userEmail}</p>
                              {isEmployee && employeeName && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Employee: {employeeName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Session Info */}
                        {sessionTimeLeft && (
                          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Session:</span>
                              <span className={`text-sm font-bold font-mono ${
                                showExpiryWarning ? 'text-red-600' : 'text-blue-700'
                              }`}>
                                <FiClock className="inline mr-1 text-xs" />
                                {formatTime(sessionTimeLeft.minutes, sessionTimeLeft.seconds)}
                              </span>
                            </div>
                            {showExpiryWarning && (
                              <button
                                onClick={extendSession}
                                className="mt-2 w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-bold hover:from-amber-600 hover:to-orange-600 transition"
                              >
                                EXTEND SESSION
                              </button>
                            )}
                          </div>
                        )}

                        {/* Logout Button */}
                        <motion.button
                          whileHover={{
                            background: "linear-gradient(to right, #30426B, #5A75C7)",
                            color: "white",
                          }}
                          onClick={handleLogout}
                          className="flex w-full items-center gap-4 px-4 py-4 text-left text-gray-700 hover:text-white font-medium transition-all"
                        >
                          <span className="text-red-600 text-xl"><FiLogOut /></span>
                          <span>Logout</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* SUBSCRIPTION EXPIRY MODAL */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowSubscriptionModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <FiAlertCircle className="text-xl sm:text-2xl text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">⚠️ Subscription Expired</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Your subscription has expired</p>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-700 font-medium">
                      Your subscription is no longer active. Some features may be limited or unavailable.
                    </p>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-xs sm:text-sm text-gray-600">Business Name:</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 truncate ml-2">{businessName}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-xs sm:text-sm text-gray-600">Plan Type:</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-900">{localStorage.getItem("businessType") || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-xs sm:text-sm text-gray-600">Account Type:</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-900">
                        {localStorage.getItem("isMaster") === "true" ? "Master Account" : "Branch Account"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    className="w-full py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Continue Anyway
                  </button>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-50 to-pink-50 border-t border-red-100 text-center">
                <p className="text-xs sm:text-sm text-red-800 font-medium">
                  ⚠️ Please renew your subscription to access all features!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SESSION EXPIRY WARNING MODAL */}
      <AnimatePresence>
        {showExpiryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowExpiryModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <FiClock className="text-xl sm:text-2xl text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-gray-900">⚠️ Session About to Expire!</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Your session will expire in {sessionTimeLeft?.minutes || 0} minutes</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4 sm:mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">Time remaining:</span>
                    <span className="text-xl sm:text-3xl font-bold text-red-600 font-mono">
                      {formatTime(sessionTimeLeft?.minutes || 0, sessionTimeLeft?.seconds || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                      initial={{ width: "100%" }}
                      animate={{ 
                        width: `${Math.max(5, ((sessionTimeLeft?.minutes || 0) * 60 + (sessionTimeLeft?.seconds || 0)) / (2*60) * 100)}%` 
                      }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">2 minutes until auto-logout</p>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={extendSession}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs sm:text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <FiClock /> Extend Session
                  </button>
                  <button
                    onClick={() => {
                      setShowExpiryModal(false);
                      handleLogout();
                    }}
                    className="w-full py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Logout Now
                  </button>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 text-center">
                <p className="text-xs sm:text-sm text-amber-800 font-medium">
                  ⚠️ Please save all your work before session expires!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
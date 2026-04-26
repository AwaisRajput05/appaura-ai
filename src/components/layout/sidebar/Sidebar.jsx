import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import {
    FiHome, FiGrid, FiUsers, FiBarChart2, FiActivity, FiTrendingUp,
    FiChevronLeft, FiThumbsUp, FiPackage, FiMapPin, FiPercent, FiSend,
    FiList, FiBox, FiClipboard, FiAlertCircle, FiUploadCloud, FiLayers,
    FiPlusCircle, FiUser, FiUpload, FiDatabase, FiCalendar, FiFile,
    FiFileMinus, FiFileText, FiShoppingBag, FiLogOut, FiSettings,
    FiHelpCircle, FiShoppingCart, FiTruck, FiCreditCard, FiRepeat,
    FiSearch, FiRotateCcw, FiDollarSign, FiAlertTriangle, FiClock,
    FiStar, FiTag, FiLock, FiUserPlus, FiUserCheck, FiRefreshCw,
    FiInfo, FiMap, FiShield, FiPlusSquare, FiBookOpen, FiBriefcase,
    FiTrendingDown, FiPieChart,
} from "react-icons/fi";
import {
    MdOutlineInventory2, MdSchedule, MdLocalPharmacy, MdMedication,
    MdElderly, MdOutlinePayments, MdOutlineAccountBalanceWallet,
    MdOutlineReceipt, MdOutlineTimeline,
} from "react-icons/md";
import {
    FaChartPie, FaChartLine, FaFileInvoice, FaUndoAlt, FaUserCircle,
    FaUserMd, FaMoneyBillWave, FaCoins, FaWallet, FaExchangeAlt,
    FaSyncAlt, FaHistory, FaCalendarAlt, FaPrescription, FaPills,
    FaFlask, FaBook, FaCashRegister, FaHandHoldingUsd, FaMoneyCheckAlt,
    FaChartBar, FaBalanceScale,
} from "react-icons/fa";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { PROFILE } from "../../../services/varible";
import { AuthContext } from "../../auth/hooks/AuthContextDef";

export default function Sidebar({ isMobileOpen = false, onClose = () => {} }) {
    const [openMenu, setOpenMenu] = useState(null);
    const [openSubMenu, setOpenSubMenu] = useState(null);
    const [openSubSubMenu, setOpenSubSubMenu] = useState(null);
    const [clickedMenu, setClickedMenu] = useState(null);
    const location = useLocation();

    const { user, hasModulePermission } = useAuth();
    useContext(AuthContext);

    const isProd = PROFILE === "prod";
    const isPharmacy = user?.businessType === "PHARMACY";

    // Module-level permission check
    const hasPermission = useCallback((key) => hasModulePermission(key), [hasModulePermission]);
const organizationType = user?.organizationType || localStorage.getItem("organizationType");
    // ─── FILE-BASED PERMISSIONS FOR EMPLOYEES ───
    const getEmployeePermissions = useCallback(() => {
        try {
            const perms = localStorage.getItem("employeePermissions");
            if (!perms) return null;
            const parsed = JSON.parse(perms);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }, []);

    const hasFilePermission = useCallback((fileName) => {
        const permissions = getEmployeePermissions();
        if (!permissions) return true;
        return permissions.includes(fileName);
    }, [getEmployeePermissions]);

    const isEmployee = useCallback(() => {
        return getEmployeePermissions() !== null;
    }, [getEmployeePermissions]);

    const TARGET_PERMISSION_ITEMS = new Set([
        "Dashboard",
        "Medicine Info",
        "Advance Search",
        "Customer Details",
        "All Inventory Stock",
        "Category",
        "Manage Employee",
        "CSV Upload",
        "Branch Sales",
        "Compare Sales",
        "Sell Medicine",
        "Return Medicine",
        "All Invoices",
        "Return Invoices",
        "Medicine List",
        "By Formula",
        "By Indication",
        "By Form",
        "By Manufacturer",
        "By Side Effects",
        "By Prescription",
        "By Age",
        "By Date Range",
        "Expired Medicines",
        "Add Medicine Stock",
        "Add Local Medicine",
        "Add General Items",
        "Medicine Stock",
        "Local Stock",
        "General Stock",
        "Low Stock Alert",
        "Inventory Turnover",
        "Inventory Valuation",
        "Create Transfer",
        "Transfer History",
        "Place Order",
        "Check Order",
        "Safety Check",
        "Medicine Recommendation",
        "Daily Ledger",
        "Transaction Flow",
        "Shift History",
        "Cash Flow Report",
        "Low Stock Reminder",
        "Near Expiry Reminder",
        "Payment History",
        "Payment Request",
        "Suppliers",
        "Supplier Orders",
        "All Orders",
        "Sales Trend",
        "Sales Forecast",
        "Top Selling",
        "Profit Margin",
        "Products Revenue",
        "Medicine Analytics",
        "Branch Permissions",
        "Add Branch",
    ]);

    const [isSmallScreen, setIsSmallScreen] = useState(false);
    useEffect(() => {
        const check = () => setIsSmallScreen(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const handleNavClick = () => onClose();

    // Filter function
    const filterItemsByFilePermission = useCallback((items) => {
        return items
            .filter((item) => {
                if (item.children) return true;
                if (TARGET_PERMISSION_ITEMS.has(item.name)) {
                    return hasFilePermission(item.name);
                }
                return true;
            })
            .map((item) => {
                if (item.children) {
                    return {
                        ...item,
                        children: filterItemsByFilePermission(item.children),
                    };
                }
                return item;
            })
            .filter((item) => {
                if (item.children) return item.children.length > 0;
                return true;
            });
    }, [hasFilePermission]);

    const sections = useMemo(() => {
        if (!user?.role) return [];

        if (user.role === "VENDOR" && user?.subscriptionStatus === "EXPIRED") {
            return [
                {
                    title: "MASTER",
                    items: [
                        {
                            name: "Payments",
                            icon: <FiCreditCard className="mr-3 h-5 w-5" />,
                            tooltip: "Manage your payment options and history",
                            children: [
                                {
                                    name: "Pay Now",
                                    icon: <FaMoneyBillWave className="mr-2 h-5 w-5" />,
                                    path: "/admin-vendors/payments/payment",
                                    tooltip: "Process immediate payments securely",
                                },
                                {
                                    name: "Check Payments",
                                    icon: <FaHistory className="mr-2 h-5 w-5" />,
                                    path: "/admin-vendors/payments/payhistory",
                                    tooltip: "View past payment records and statuses",
                                },
                            ],
                        },
                    ],
                },
                {
                    title: "SUPPORT",
                    items: [
                        ...(!isEmployee() ? [{
                            name: "Profile",
                            icon: <FiUser className="mr-3 h-5 w-5" />,
                            path: "/profile",
                            tooltip: "View and edit your personal information"
                        }] : []),
                        {
                            name: "Logout",
                            icon: <FiLogOut className="mr-3 h-5 w-5" />,
                            path: "/company/logout",
                            tooltip: "Sign out of your account"
                        },
                    ],
                },
            ];
        }

        if (user?.subAccountType === "FINANCE") {
            return [
                {
                    title: "GENERAL",
                    items: [
                        {
                            name: "Finance",
                            icon: <FaWallet className="mr-3 h-5 w-5" />,
                            tooltip: "Financial management tools",
                            children: [
                                {
                                    name: "Manage Invoices",
                                    icon: <FaFileInvoice className="mr-2 h-5 w-5" />,
                                    path: "/admin-vendors/manage-sales/viewsales",
                                    tooltip: "View and handle sales invoices"
                                },
                            ],
                        },
                    ],
                },
                {
                    title: "SUPPORT",
                    items: [
                        ...(!isEmployee() ? [{
                            name: "Profile",
                            icon: <FiUser className="mr-3 h-5 w-5" />,
                            path: "/profile",
                            tooltip: "View and edit your personal information"
                        }] : []),
                        ...(!isEmployee() ? [{
                            name: "Keyboard Shortcuts",
                            icon: <FiHelpCircle className="mr-3 h-5 w-5" />,
                            tooltip: "List of available keyboard commands",
                            onClick: () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", altKey: true, bubbles: true }))
                        }] : []),
                        {
                            name: "Logout",
                            icon: <FiLogOut className="mr-3 h-5 w-5" />,
                            path: "/company/logout",
                            tooltip: "Sign out of your account"
                        },
                    ],
                },
            ];
        }

     return [
    // Dashboard - no title, no permission check
    {
        title: null,
        items: [
            {
                name: "Dashboard",
                icon: <FiHome className="mr-3 h-5 w-5" />,
                path: "/dashboard",
                tooltip: "Overview of key metrics and quick access to features",
            }
        ]
    },
    
    // GENERAL section
    {
        title: "GENERAL",
        items: [
            ...(user?.role === "ADMIN"
                ? [
                    {
                        name: "Vendor Accounts",
                        icon: <FiUsers className="mr-3 h-5 w-5" />,
                        path: "/admin/vendor-accounts",
                        tooltip: "Manage vendor user accounts"
                    },
                    {
                        name: "Payment Requests",
                        icon: <FiDollarSign className="mr-3 h-5 w-5" />,
                        path: "/admin/payment-requests",
                        tooltip: "Manage vendor payment requests"
                    },
                    {
                        name: "Manage Permission",
                        icon: <FiBookOpen className="mr-3 h-5 w-5" />,
                        path: "/admin/permission-management",
                        tooltip: "Manage user permissions and access controls"
                    },
                
                            {
                                name: "Manage Partner",
                                icon: <FiUserPlus className="mr-2 h-5 w-5" />,
                                path: "/admin/partner-management",
                                tooltip: "Add and manage partner companies"
                            },
                           
                        
                
                ]
                : []),
        ],
    },

            ...(user?.role === "VENDOR"
                ? [
                    {
                       title: isEmployee() ? "Employee" : "Vendor",
                        items: [
                            ...(isPharmacy
                                ? [
                                    // POS module
                                    ...(hasPermission("POS")
                                        ? [
                                            {
                                                name: "Point of Sales",
                                                icon: <FiShoppingCart className="mr-2 h-5 w-5" />,
                                                tooltip: "Handle sales transactions at the counter",
                                                children: [
                                                    ...(hasFilePermission("Sell Medicine") || hasFilePermission("Return Medicine")
                                                        ? [{
                                                            name: "POS",
                                                            icon: <FaPills className="mr-2 h-5 w-5" />,
                                                            path: "/admin-vendors/pharmacy-management/salespoint/poswrapper",
                                                            tooltip: "Process medicine sales",
                                                            hideOnSmall: true
                                                        }]
                                                        : []),
                                                    ...(hasFilePermission("All Invoices") || hasFilePermission("Return Invoices")
                                                        ? [{
                                                            name: "Invoices",
                                                            icon: <FiFileText className="mr-2 h-5 w-5" />,
                                                            path: "/admin-vendors/pharmacy-management/salespoint/invoicewrapper",
                                                            tooltip: "View completed payment invoices"
                                                        }]
                                                        : []),
                                                    {
                                                        name: "Customer Details",
                                                        icon: <FaUserCircle className="mr-2 h-5 w-5" />,
                                                        path: "/admin-vendors/pharmacy-management/salespoint/customer-details",
                                                        tooltip: "Manage customer information"
                                                    },
                                                ],
                                            },
                                        ]
                                        : []),

                                    // SEARCH module
                                    ...(hasPermission("SEARCH")
                                        ? [
                                            {
                                                name: "Search",
                                                icon: <FiSearch className="mr-2 h-5 w-5" />,
                                                tooltip: "Advanced search functionalities for medicines",
                                                children: [
                                                    ...(["Medicine List", "By Formula", "By Indication", "By Form", "By Manufacturer", "By Side Effects", "By Prescription", "By Age", "By Date Range", "Expired Medicines"].some(p => hasFilePermission(p))
                                                        ? [{
                                                            name: "Search Medicine",
                                                            icon: <FiSearch className="mr-2 h-5 w-5" />,
                                                            path: "/admin-vendors/pharmacy-management/search/search-wrapper",
                                                            tooltip: "Locate specific medicines quickly"
                                                        }]
                                                        : []),
                                                    {
                                                        name: "Medicine Info",
                                                        icon: <FiInfo className="mr-2 h-5 w-5" />,
                                                        path: "/admin-vendors/pharmacy-management/search/medicine-info",
                                                        tooltip: "Detailed information on medicines"
                                                    },
                                                    {
                                                        name: "Advance Search",
                                                        icon: <FiGrid className="mr-2 h-5 w-5" />,
                                                        path: "/admin-vendors/pharmacy-management/search/advance-search",
                                                        tooltip: "Complex search queries for advanced users"
                                                    },
                                                ],
                                            },
                                        ]
                                        : []),

                                    // INVENTORY module
                                    ...(hasPermission("INVENTORY")
                                        ? [
                                            {
                                                name: "Inventory",
                                                icon: <MdOutlineInventory2 className="mr-2 h-5 w-5" />,
                                                tooltip: "Manage stock levels and items",
                                                children: [
                                                    ...(user?.isMaster ? [{
                                                        name: "All Inventory Stock",
                                                        icon: <FiDatabase className="mr-2 h-5 w-5" />,
                                                        path: "/admin-vendors/pharmacy-management/inventory/branch-stock",
                                                        tooltip: "View stock across branches"
                                                    }] : []),
                                                    ...(hasFilePermission("Add Medicine Stock") || hasFilePermission("Add Local Medicine") || hasFilePermission("Add General Items")
                                                        ? [{
                                                            name: "Add Stock",
                                                            icon: <FiTag className="mr-2 h-5 w-5" />,
                                                            path: "/admin-vendors/pharmacy-management/inventory/add-stock",
                                                            tooltip: "Add new stock items"
                                                        }]
                                                        : []),
                                                    ...(hasFilePermission("Medicine Stock") || hasFilePermission("Local Stock") || hasFilePermission("General Stock")
                                                        ? [{
                                                            name: "Stock Point",
                                                            icon: <FaSyncAlt className="mr-2 h-5 w-5" />,
                                                            path: "/admin-vendors/pharmacy-management/inventory/restock",
                                                            tooltip: "Manage restocking needs"
                                                        }]
                                                        : []),
                                                    {
                                                        name: "Category",
                                                        icon: <FiTag className="mr-2 h-5 w-5" />,
                                                        path: "/admin-vendors/pharmacy-management/inventory/add-category",
                                                        tooltip: "Manage item categories"
                                                    },
                                                  ...(organizationType !== "INDIVIDUAL" && (hasFilePermission("Create Transfer") || hasFilePermission("Transfer History"))
    ? [{
        name: "Transfer Inventory",
        icon: <FaExchangeAlt className="mr-2 h-5 w-5" />,
        path: "/admin-vendors/pharmacy-management/inventory/transfer-wrapper",
        tooltip: "Send transfer request to branches"
    }]
    : []),
                                                    ...(hasFilePermission("Low Stock Alert") || hasFilePermission("Inventory Turnover") || hasFilePermission("Inventory Valuation")
                                                        ? [{
                                                            name: "Inventory Reports",
                                                            icon: <FiAlertTriangle className="mr-2 h-5 w-5" />,
                                                            path: "/admin-vendors/pharmacy-management/inventory/reportwrapper",
                                                            tooltip: "Items running low on stock"
                                                        }]
                                                        : []),
                                                ],
                                            },
                                        ]
                                        : []),

                                    // SALES module
                                    ...(hasPermission("SALES")
                                        ? [
                                            {
                                                name: "Sales Report",
                                                icon: <FiBarChart2 className="mr-2 h-5 w-5" />,
                                                tooltip: "Generate and view sales reports",
                                                children: [
                                                   {
                                                        name: "Branch Sales",
                                                        icon: <FiMapPin className="mr-2 h-5 w-5" />,
                                                        path: "/admin-vendors/pharmacy-management/sales/viewsales",
                                                        tooltip: "Sales data per branch"
                                                    }, 
                                                    {
                                                        name: "Compare Sales",
                                                        icon: <FiRepeat className="mr-2 h-5 w-5" />,
                                                        path: "/admin-vendors/pharmacy-management/sales/transaction-compare",
                                                        tooltip: "Compare sales across periods"
                                                    },
                                                    ...(["Sales Trend", "Sales Forecast", "Top Selling", "Profit Margin", "Products Revenue", "Medicine Analytics"].some(p => hasFilePermission(p))
                                                        ? [{
                                                            name: "Sale Details",
                                                            icon: <FiTrendingUp className="mr-2 h-5 w-5" />,
                                                            path: "/admin-vendors/pharmacy-management/sales/sales-wrapper",
                                                            tooltip: "Detailed sales reports"
                                                        }]
                                                        : []),
                                                ],
                                            },
                                        ]
                                        : []),

                                    // ORDER_MANAGEMENT module
                                    ...(hasPermission("ORDER_MANAGEMENT")
                                        ? [
                                            ...(hasFilePermission("Place Order") || hasFilePermission("Check Order")
                                                ? [{
                                                    name: "Orders",
                                                    icon: <FiList className="mr-2 h-5 w-5" />,
                                                    path: "/admin-vendors/pharmacy-management/order/orderwrapper",
                                                    tooltip: "Review existing orders"
                                                }]
                                                : []),
                                        ]
                                        : []),

                                    // RECOMMENDATION module
                                    ...(hasPermission("RECOMMENDATION")
                                        ? [
                                            ...(hasFilePermission("Safety Check") || hasFilePermission("Medicine Recommendation")
                                                ? [{
                                                    name: "Recommendation",
                                                    icon: <FiShield className="mr-2 h-5 w-5" />,
                                                    path: "/admin-vendors/pharmacy-management/recommendation/recommendwrapper",
                                                    tooltip: "Verify medicine safety profiles"
                                                }]
                                                : []),
                                        ]
                                        : []),

                                    // MANAGE_BRANCH permission
                                    ...(hasPermission("MANAGE_BRANCH") && user?.isMaster && (hasFilePermission("Branch Permissions") || hasFilePermission("Add Branch"))
                                        ? [{
                                            name: "Manage Branches",
                                            icon: <FiMapPin className="mr-2 h-5 w-5" />,
                                            path: "/admin-vendors/manage-branches/branchwrapper",
                                            tooltip: "Create new branch locations"
                                        }]
                                        : []),

                                    // MANAGE_EMPLOYEE permission
                                    ...(hasPermission("MANAGE_EMPLOYEE")
                                        ? [{
                                            name: "Manage Employee",
                                            icon: <FiUsers className="mr-2 h-5 w-5" />,
                                            path: "/admin-vendors/payments/pharmaroles",
                                            tooltip: "Manage employee roles and permissions"
                                        }]
                                        : []),
                                        

                                    // MANAGE_SUPPLIER permission
                                    ...(hasPermission("MANAGE_SUPPLIER") && (hasFilePermission("Suppliers") || hasFilePermission("Supplier Orders") || hasFilePermission("All Orders"))
                                        ? [{
                                            name: "Manage Suppliers",
                                            icon: <FiTruck className="mr-2 h-5 w-5" />,
                                            path: "/admin-vendors/pharmacy-management/order/supplierwrapper",
                                            tooltip: "Create new supplier"
                                        }]
                                        : []),
                                ]
                                : []),

                            // CSV_UPLOAD permission
                            ...(hasPermission("CSV_UPLOAD")
                                ? [{
                                    name: "CSV Upload",
                                    icon: <FiUpload className="mr-2 h-5 w-5" />,
                                    path: "/admin-vendors/data-ingestion/csv-upload",
                                    tooltip: "Upload data via CSV files"
                                }]
                                : []),

                            // Payments
                            ...(hasFilePermission("Payment History") || hasFilePermission("Payment Request")
                                ? [{
                                    name: "Payments",
                                    icon: <FiSend className="mr-2 h-5 w-5" />,
                                    path: "/admin-vendors/payments/payment",
                                    tooltip: "Make immediate payments"
                                }]
                                : []),

                            // SCHEDULE permission
                            ...(hasPermission("SCHEDULE") && (hasFilePermission("Low Stock Reminder") || hasFilePermission("Near Expiry Reminder"))
                                ? [{
                                    name: "Schedule",
                                    icon: <MdSchedule className="mr-3 h-5 w-5" />,
                                    path: "/admin-vendors/settings/settingwrapper",
                                    tooltip: "Schedule reminders for expirations"
                                }]
                                : []),

                            // CASH_BOOK permission
                            ...(hasPermission("CASH_BOOK") && (hasFilePermission("Daily Ledger") || hasFilePermission("Transaction Flow") || hasFilePermission("Shift History") || hasFilePermission("Cash Flow Report"))
                                ? [{
                                    name: "Cash Book",
                                    icon: <FiBriefcase className="mr-3 h-5 w-5" />,
                                    path: "/admin-vendors/cashflow/cashwrapper",
                                    tooltip: "Manage daily cash operations and shifts"
                                }]
                                : []),
                        ],
                    },
                ]
                : []),

            {
                title: "SUPPORT",
                items: [
                    ...(!isEmployee() ? [{
                        name: "Profile",
                        icon: <FiUser className="mr-3 h-5 w-5" />,
                        path: "/profile",
                        tooltip: "View and edit your personal information"
                    }] : []),
                    ...(!isEmployee() ? [{
                        name: "Keyboard Shortcuts",
                        icon: <FiHelpCircle className="mr-3 h-5 w-5" />,
                        tooltip: "List of available keyboard commands",
                        onClick: () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", altKey: true, bubbles: true }))
                    }] : []),
                    {
                        name: "Logout",
                        icon: <FiLogOut className="mr-3 h-5 w-5" />,
                        path: "/company/logout",
                        tooltip: "Sign out of your account"
                    },
                ],
            },
        ];
    }, [user, hasPermission, hasFilePermission, isEmployee, isPharmacy]);

    const filteredSections = useMemo(() => {
        return sections.map((section) => ({
            ...section,
            items: filterItemsByFilePermission(section.items),
        }));
    }, [sections, filterItemsByFilePermission]);

    const isMenuActive = (item) => {
        if (item.path && location.pathname === item.path) return true;
        if (item.children) {
            return item.children.some((child) => {
                if (child.path && location.pathname === child.path) return true;
                if (child.children) return child.children.some((sub) => location.pathname === sub.path);
                return false;
            });
        }
        return false;
    };

    useEffect(() => {
        const itemHasName = (item, name) => {
            if (!name) return false;
            if (item.name === name) return true;
            if (item.children) return item.children.some((c) => itemHasName(c, name));
            return false;
        };
        const stillRelevant = filteredSections.some((s) => s.items.some((item) => itemHasName(item, clickedMenu)));
        if (!stillRelevant) setClickedMenu(null);
    }, [clickedMenu, location.pathname, filteredSections]);

    useEffect(() => {
        if (!isMobileOpen) {
            setOpenMenu(null);
            setOpenSubMenu(null);
            setOpenSubSubMenu(null);
        }
    }, [isMobileOpen]);

    useEffect(() => {
        let newOpen = null, newSub = null, newSubSub = null;
        for (const section of filteredSections) {
            for (const item of section.items) {
                if (item.path === location.pathname) {
                    newOpen = null;
                    break;
                }
                if (item.children) {
                    for (const child of item.children) {
                        if (child.path === location.pathname) {
                            newOpen = item.name;
                            break;
                        }
                        if (child.children) {
                            for (const sub of child.children) {
                                if (sub.path === location.pathname) {
                                    newOpen = item.name;
                                    newSub = child.name;
                                    break;
                                }
                                if (sub.children) {
                                    for (const subSub of sub.children) {
                                        if (subSub.path === location.pathname) {
                                            newOpen = item.name;
                                            newSub = child.name;
                                            newSubSub = sub.name;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        setOpenMenu(newOpen);
        setOpenSubMenu(newSub);
        setOpenSubSubMenu(newSubSub);
        setClickedMenu(newOpen);
    }, [location.pathname, filteredSections]);

    const filterItemsForScreen = (items) =>
        items
            .filter((item) => !(item.hideOnSmall && isSmallScreen))
            .map((item) => item.children ? { ...item, children: filterItemsForScreen(item.children) } : item)
            .filter((item) => !item.children || item.children.length > 0);

    const renderBody = () => (
        <div className="px-3 py-4 flex flex-col h-full">
            {filteredSections.map((section) => {
                const filteredItems = filterItemsForScreen(section.items);
                if (filteredItems.length === 0) return null;
                return (
                    <div key={section.title} className={`mb-5 ${section.title === "SUPPORT" ? "mt-auto" : ""}`}>
                        <div className="px-2 text-xs tracking-wider text-gray-400 font-semibold mb-2 uppercase">{section.title}</div>
                        <ul className="space-y-1">
                            {filteredItems.map((item) => {
                                const active = isMenuActive(item) || clickedMenu === item.name;
                                return (
                                    <li key={item.name}>
                                        {item.children || item.onClick ? (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        if (item.onClick) {
                                                            e.stopPropagation();
                                                            item.onClick();
                                                            handleNavClick();
                                                            return;
                                                        }
                                                        setOpenMenu(openMenu === item.name ? null : item.name);
                                                        setClickedMenu(item.name);
                                                    }}
                                                    title={item.tooltip}
                                                    className={`w-full flex justify-between items-center py-2.5 px-3 rounded-lg duration-300 text-sm font-medium cursor-pointer transition ${active ? "text-white bg-gradient-to-r from-[#566a96] to-[#3069FE] ring-1 ring-[#3069FE]/20" : "text-[#566a96] hover:text-[#3069FE] hover:bg-[#566a96]/10"
                                                        }`}
                                                >
                                                    <div className={`flex items-center ${active ? "text-white" : "text-[#566a96]"}`}>
                                                        <span className="mr-3">{item.icon}</span>
                                                        <span className="text-sm">{item.name}</span>
                                                    </div>
                                                    {item.children && (
                                                        <Motion.span
                                                            animate={{ rotate: openMenu === item.name ? -90 : 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className={`text-base ${active ? "text-white" : "text-gray-400"}`}
                                                        >
                                                            <FiChevronLeft />
                                                        </Motion.span>
                                                    )}
                                                </button>

                                                <AnimatePresence initial={false}>
                                                    {openMenu === item.name && (
                                                        <Motion.ul
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                                            className="ml-5 mt-1 overflow-hidden relative"
                                                            style={{ borderLeft: "1px solid #e6ebf5" }}
                                                        >
                                                            {item.children.map((child) => {
                                                                const hasSub = Array.isArray(child.children);
                                                                const childActive = isMenuActive(child);
                                                                return (
                                                                    <li key={child.name} className="relative">
                                                                        <div
                                                                            className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#566a96]/30 to-transparent"
                                                                            style={{ marginLeft: "-1px" }}
                                                                        />
                                                                        {(childActive || openSubMenu === child.name) && (
                                                                            <div
                                                                                className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#3069FE] rounded-full shadow-[0_0_0_2px_rgba(48,105,254,0.2)]"
                                                                                style={{ zIndex: 10 }}
                                                                            />
                                                                        )}

                                                                        {hasSub ? (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => setOpenSubMenu(openSubMenu === child.name ? null : child.name)}
                                                                                    title={child.tooltip}
                                                                                    className={`w-full flex items-center justify-between py-2 px-3 rounded-md text-xs cursor-pointer transition relative pl-5 ${childActive ? "!text-white bg-gradient-to-r from-[#566a96] to-[#3069FE] ring-1 ring-[#3069FE]/20" : "!text-[#566a96] hover:text-[#3069FE] hover:bg-[#566a96]/10"
                                                                                        }`}
                                                                                >
                                                                                    <div className="flex items-center">
                                                                                        <span className="mr-2">{child.icon}</span>
                                                                                        <span className="text-sm">{child.name}</span>
                                                                                    </div>
                                                                                    <Motion.span
                                                                                        animate={{ rotate: openSubMenu === child.name ? -90 : 0 }}
                                                                                        transition={{ duration: 0.2 }}
                                                                                        className="text-gray-400 text-base"
                                                                                    >
                                                                                        <FiChevronLeft />
                                                                                    </Motion.span>
                                                                                </button>
                                                                                <AnimatePresence initial={false}>
                                                                                    {openSubMenu === child.name && (
                                                                                        <Motion.ul
                                                                                            initial={{ height: 0, opacity: 0 }}
                                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                                            exit={{ height: 0, opacity: 0 }}
                                                                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                                                                            className="ml-5 mt-1 overflow-hidden relative"
                                                                                            style={{ borderLeft: "1px solid #e6ebf5" }}
                                                                                        >
                                                                                            {child.children.map((sub) => (
                                                                                                <li key={sub.name} className="relative">
                                                                                                    <div
                                                                                                        className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#566a96]/30 to-transparent"
                                                                                                        style={{ marginLeft: "-1px" }}
                                                                                                    />
                                                                                                    {(location.pathname === sub.path || openSubSubMenu === sub.name) && (
                                                                                                        <div
                                                                                                            className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#3069FE] rounded-full shadow-[0_0_0_2px_rgba(48,105,254,0.2)]"
                                                                                                            style={{ zIndex: 10 }}
                                                                                                        />
                                                                                                    )}
                                                                                                    {sub.children ? (
                                                                                                        <>
                                                                                                            <button
                                                                                                                onClick={() => setOpenSubSubMenu(openSubSubMenu === sub.name ? null : sub.name)}
                                                                                                                title={sub.tooltip}
                                                                                                                className={`w-full flex items-center justify-between py-1.5 px-3 rounded-md text-sm transition relative pl-5 ${openSubSubMenu === sub.name ? "!text-white bg-gradient-to-r from-[#566a96] to-[#3069FE] ring-1 ring-[#3069FE]/20" : "!text-[#566a96] hover:bg-[#566a96]/10 hover:text-[#3069FE]"
                                                                                                                    }`}
                                                                                                            >
                                                                                                                <div className="flex items-center">
                                                                                                                    <span className="mr-2">{sub.icon}</span>
                                                                                                                    <span className="text-sm">{sub.name}</span>
                                                                                                                </div>
                                                                                                                <Motion.span
                                                                                                                    animate={{ rotate: openSubSubMenu === sub.name ? -90 : 0 }}
                                                                                                                    transition={{ duration: 0.2 }}
                                                                                                                    className="text-gray-400 text-base"
                                                                                                                >
                                                                                                                    <FiChevronLeft />
                                                                                                                </Motion.span>
                                                                                                            </button>
                                                                                                            <AnimatePresence initial={false}>
                                                                                                                {openSubSubMenu === sub.name && (
                                                                                                                    <Motion.ul
                                                                                                                        initial={{ height: 0, opacity: 0 }}
                                                                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                                                                        exit={{ height: 0, opacity: 0 }}
                                                                                                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                                                                                                        className="ml-4 mt-1 overflow-hidden relative"
                                                                                                                        style={{ borderLeft: "1px solid #e6ebf5" }}
                                                                                                                    >
                                                                                                                        {sub.children.map((subSub, index) => (
                                                                                                                            <li key={subSub.name} className="relative">
                                                                                                                                {index < sub.children.length - 1 && (
                                                                                                                                    <div
                                                                                                                                        className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#566a96]/30 to-transparent"
                                                                                                                                        style={{ marginLeft: "-1px" }}
                                                                                                                                    />
                                                                                                                                )}
                                                                                                                                {location.pathname === subSub.path && (
                                                                                                                                    <div
                                                                                                                                        className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#3069FE] rounded-full shadow-[0_0_0_2px_rgba(48,105,254,0.2)]"
                                                                                                                                        style={{ zIndex: 10 }}
                                                                                                                                    />
                                                                                                                                )}
                                                                                                                                <NavLink
                                                                                                                                    to={subSub.path}
                                                                                                                                    title={subSub.tooltip}
                                                                                                                                    onClick={handleNavClick}
                                                                                                                                    className={({ isActive }) => `flex items-center py-1.5 px-3 rounded-md text-sm transition relative pl-5 ${isActive ? "!text-white bg-gradient-to-r from-[#566a96] to-[#3069FE] ring-1 ring-[#3069FE]/20" : "text-[#566a96] hover:text-[#3069FE] hover:bg-[#566a96]/10"
                                                                                                                                        }`}
                                                                                                                                >
                                                                                                                                    <span className="mr-2">{subSub.icon}</span>
                                                                                                                                    <span className="text-sm">{subSub.name}</span>
                                                                                                                                </NavLink>
                                                                                                                            </li>
                                                                                                                        ))}
                                                                                                                    </Motion.ul>
                                                                                                                )}
                                                                                                            </AnimatePresence>
                                                                                                        </>
                                                                                                    ) : (
                                                                                                        <NavLink
                                                                                                            to={sub.path}
                                                                                                            title={sub.tooltip}
                                                                                                            onClick={handleNavClick}
                                                                                                            className={({ isActive }) => `flex items-center py-2 px-3 rounded-md text-sm transition relative pl-5 ${isActive ? "!text-white bg-gradient-to-r from-[#566a96] to-[#3069FE] ring-1 ring-[#3069FE]/20" : "text-[#566a96] hover:text-[#3069FE] hover:bg-[#566a96]/10"
                                                                                                                }`}
                                                                                                        >
                                                                                                            <span className="mr-2">{sub.icon}</span>
                                                                                                            <span className="text-sm">{sub.name}</span>
                                                                                                        </NavLink>
                                                                                                    )}
                                                                                                </li>
                                                                                            ))}
                                                                                        </Motion.ul>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </>
                                                                        ) : (
                                                                            <NavLink
                                                                                to={child.path}
                                                                                title={child.tooltip}
                                                                                onClick={handleNavClick}
                                                                                className={({ isActive }) => `flex items-center py-2 px-3 rounded-md text-sm transition relative pl-5 ${isActive ? "!text-white bg-gradient-to-r from-[#566a96] to-[#3069FE] ring-1 ring-[#3069FE]/20" : "text-[#566a96] hover:text-[#3069FE] hover:bg-[#566a96]/10"
                                                                                    }`}
                                                                            >
                                                                                <span className="mr-2">{child.icon}</span>
                                                                                <span className="text-sm">{child.name}</span>
                                                                            </NavLink>
                                                                        )}
                                                                    </li>
                                                                );
                                                            })}
                                                        </Motion.ul>
                                                    )}
                                                </AnimatePresence>
                                            </>
                                        ) : (
                                            <NavLink
                                                to={item.path}
                                                title={item.tooltip}
                                                onClick={handleNavClick}
                                                className={({ isActive }) => `flex justify-between items-center py-2.5 px-3 rounded-lg duration-300 text-sm font-medium transition ${isActive ? "!text-white bg-gradient-to-r from-[#566a96] to-[#3069FE] ring-1 ring-[#3069FE]/20" : "text-[#566a96] hover:text-white hover:bg-gradient-to-l from-[#566a96] to-[#3069FE]"
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <span className="mr-3">{item.icon}</span>
                                                    <span className={`text-sm ${item.name === "Logout" ? "text-red-500" : ""}`}>{item.name}</span>
                                                </div>
                                            </NavLink>
                                        )}
                                        <div className="border-b border-[#e6ebf5] mx-2 my-1" />
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </div>
    );

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/30 transition-opacity z-40 ${isMobileOpen && isSmallScreen ? "opacity-100 pointer-events-auto backdrop-blur-sm" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />
            <AnimatePresence>
                {isMobileOpen && (
                    <Motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={`fixed top-16 left-0 w-75 bg-white/95 backdrop-blur border-r border-[#e6ebf5] h-[calc(100vh-4rem)] overflow-y-auto z-50 ${!isSmallScreen ? "shadow-xl" : ""
                            }`}
                    >
                        {renderBody()}
                    </Motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
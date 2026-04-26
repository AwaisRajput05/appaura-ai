import PrivacyMode from "../../features/contents/PrivacyMode";
import Sales from "../../features/contents/Sales";
import RevenueExpenseCard from "../../features/contents/RevenueExpenseCard";
import InvoicesCard from "../../features/contents/InvoicesCard";
import TopCustomersCard from "../../features/contents/TopCustomersCard";
import LowInventoryCard from "../../features/contents/LowInventoryCard";
import TopProductsCard from "../../features/contents/TopProductsCard";
import CashAndBanks from "../../features/contents/CashAndBanks";
import AccountReceivableAging from "../../features/contents/AccountReceiveableAging";
import Navbar from "../navbar/Navbar";
import Sidebar from "../sidebar/Sidebar";
import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const toggleButtonRef = useRef(null);

  // Debug log to confirm rendering
  useEffect(() => {
    console.log("MainLayout rendered");
  }, []);

  // Handle click outside sidebar - FIXED VERSION
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only run if sidebar is open
      if (!isMobileOpen) return;
      
      // Get the sidebar element
      const sidebar = document.querySelector('aside');
      
      // If sidebar doesn't exist, return
      if (!sidebar) return;
      
      // Check if click is on toggle button
      const isToggleButton = toggleButtonRef.current && toggleButtonRef.current.contains(event.target);
      
      // Check if click is inside sidebar
      const isInsideSidebar = sidebar.contains(event.target);
      
      // If click is NOT inside sidebar AND NOT on toggle button, close sidebar
      if (!isInsideSidebar && !isToggleButton) {
        console.log("Clicked outside sidebar - closing");
        setIsMobileOpen(false);
      }
    };

    // Add event listener to document
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileOpen]);

  // Toggle function for sidebar
  const toggleSidebar = () => {
    console.log("Toggling sidebar from:", isMobileOpen, "to:", !isMobileOpen);
    setIsMobileOpen(prev => !prev);
  };

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col">
      {/* Navbar - Pass toggle function and ref */}
      <Navbar 
        onToggleSidebar={toggleSidebar}
        toggleButtonRef={toggleButtonRef}
      />

      {/* Sidebar - always slide-out */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white pt-16">
        {/* Main Content */}
        <div className="flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          
          {/* Footer - appears on all pages */}
          <footer className="py-4 px-6 border-t border-gray-200 text-center text-sm text-gray-600">
            © 2026 App Aura. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
}
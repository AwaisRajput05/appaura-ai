import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar({ title, addButtonName, addButtonPath, handleExportCSV, handleExportPDF }) {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full  border-gray-50 shadow- mb-3">
      {/* Top Bar */}

      <div className="flex justify-between items-center px-1 py-4">
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
        <div className=" gap-3">

          {title === "All Offers" && (
            <Link
              to={addButtonPath || ""}
              className="table-heading text-white px-4 py-3 rounded hover:bg-green-600 text-md font-medium"
            >
              + {addButtonName}
            </Link>
          )}

          {title === "Sales Dashboard" && (
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="bg-blue-500 hover:bg-blue-700 cursor-pointer text-white text-sm font-medium py-2.5 px-3 rounded"
              >
                Export as CSV
              </button>
              <button
                onClick={handleExportPDF}
                className=" hover:bg-gradient-to-l bg-gradient-to-r from-[#566a96] cursor-pointer to-[#3069FE] text-white text-sm font-medium py-2.5 px-3 rounded"
              >
                Export as PDF
              </button>
            </div>
          )}

        </div>

        {/* Mobile Hamburger */}
        <button
          className="hidden text-gray-700"
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

    </nav>
  );
}

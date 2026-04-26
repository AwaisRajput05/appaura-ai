// src/components/ui/forms/Button.jsx
import React from "react";
import { Button as HeadlessButton } from "@headlessui/react";
import { FaSpinner } from "react-icons/fa"; 

const Button = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingText = "Loading...",
  variant = "primary", // primary, secondary, link, icon, danger
  size = "md", // sm, md, lg
  className = "",
  type = "button",
}) => {
  let baseClass = "flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-300 shadow-md";

  let variantClass = "";
  switch (variant) {
    case "primary":
      variantClass = "bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7] data-[hover]:from-[#2a3a5e] data-[hover]:via-[#334c82] data-[hover]:to-[#5068b3] text-white";
      break;
    case "secondary":
      variantClass = "bg-gray-200 text-gray-800 data-[hover]:bg-gray-300";
      break;
    case "danger":
      variantClass = "bg-red-500 text-white data-[hover]:bg-red-600";
      break;
    case "link":
      variantClass = "text-[#3C5690] data-[hover]:underline bg-transparent shadow-none";
      break;
    case "icon":
      variantClass = "p-0 bg-transparent shadow-none";
      break;
    default:
      variantClass = "bg-blue-500 text-white data-[hover]:bg-blue-600";
  }

  let sizeClass = "";
  switch (size) {
    case "sm":
      sizeClass = "px-4 py-2 text-sm";
      break;
    case "lg":
      sizeClass = "px-8 py-4 text-lg";
      break;
    default:
      sizeClass = "px-6 py-3";
  }

  const finalClass = `${baseClass} ${variantClass} ${sizeClass} ${disabled || loading ? "opacity-70 cursor-not-allowed" : ""} ${className}`;

  return (
    <HeadlessButton
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={finalClass}
    >
      {loading ? (
        <>
          <FaSpinner className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </HeadlessButton>
  );
};

export default Button;
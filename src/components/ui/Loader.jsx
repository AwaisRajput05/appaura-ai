// src/components/ui/Loader.jsx
import React from "react";
import { Transition } from "@headlessui/react";

const Loader = ({ message = "Loading...", subMessage = "" }) => {
  return (
    <Transition
      show={true} // Always show when rendered (control via parent conditional)
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 bg-white flex justify-center items-center z-50">
        <div className="text-center">
          <svg
            className="animate-spin mx-auto h-12 w-12 text-[#3C5690]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-[#30426B]">{message}</h2>
          {subMessage && <p className="mt-2 text-gray-600">{subMessage}</p>}
        </div>
      </div>
    </Transition>
  );
};

export default Loader;
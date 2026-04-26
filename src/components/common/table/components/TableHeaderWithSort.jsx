import React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function HeaderWithSort({ column, title }) {
  const isSorted = column.getIsSorted();

  const baseClasses = "flex items-center justify-center gap-1 cursor-pointer text-white transition";
  const activeClass = isSorted ? "text-indigo-600 font-semibold" : " ";
  const hoverClass = "hover:text-indigo-400";

  return (
    <button
      className={`${baseClasses} ${activeClass} ${hoverClass}`}
      onClick={column.getToggleSortingHandler()}
    >
      {title}
      {isSorted === "asc" ? (
        <ArrowUp size={14} />
      ) : isSorted === "desc" ? (
        <ArrowDown size={14} />
      ) : (
        <ArrowUpDown size={14} />
      )}
    </button>
  );
}


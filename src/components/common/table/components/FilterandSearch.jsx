import { Filter } from 'lucide-react';
import React, { useId } from 'react';

export default function FilterAndSearch({
  handleFilterToggle,
  search,
  setSearch,
  searchField,
}) {
  const searchId = useId(); // guarantees uniqueness across instances

  return (
    <div className="flex flex-wrap gap-y-4 lg:flex-nowrap justify-between items-center px-1 mb-4">
      <button
        data-filter
        onClick={handleFilterToggle}
        className="bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7] hover:from-[#2a3a5e] hover:via-[#334c82] hover:to-[#5068b3] px-6 py-2.5 rounded-lg flex items-center gap-2 text-white font-medium shadow-md transition-all duration-200"
      >
        <Filter size={16} /> Filters
      </button>

      <div className="flex flex-col gap-2">
        <label htmlFor={searchId} className="text-md font-bold">
          Search
        </label>
        <input
          id={searchId}
          data-searchbar
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search by ${searchField}`}
          className="border border-gray-300 rounded px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-[#3C5690]"
        />
      </div>
    </div>
  );
}

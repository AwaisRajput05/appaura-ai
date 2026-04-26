import React, { useId } from 'react';

export default function Pagination({ table }) {
  const uniqueId = useId(); // React 18+ hook
  
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  
  // Handle edge case when totalPages is 0 or negative
  const displayTotalPages = totalPages <= 0 ? 1 : Math.max(1, totalPages);
  
  // Can't go next if no pages or on last page
  const canNextPage = table.getCanNextPage() && totalPages > 0 && currentPage < displayTotalPages;
  
  // Can't go previous if on first page
  const canPreviousPage = table.getCanPreviousPage() && totalPages > 0 && currentPage > 1;

  return (
    <div className="flex justify-center gap-4 md:justify-between md:flex-nowrap flex-wrap items-center mt-4 px-2">
      {/* Prev / Next Buttons */}
      <div>
        <button
          data-pagination-prev
          onClick={() => table.previousPage()}
          disabled={!canPreviousPage}
          className="px-4 py-2 mr-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
        >
          Previous
        </button>
        <button
          data-pagination-next
          onClick={() => table.nextPage()}
          disabled={!canNextPage}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
        >
          Next
        </button>
      </div>

      {/* Page Info */}
      <div className="text-sm">
        Page{' '}
        <strong>
          {currentPage} of {displayTotalPages}
        </strong>
      </div>

      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <label
          htmlFor={`page-size-${uniqueId}`}
          className="text-sm font-medium text-gray-700"
        >
          Rows per page:
        </label>
        <select
          id={`page-size-${uniqueId}`}
          name={`pageSize-${uniqueId}`}
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1"
        >
          {[5, 10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
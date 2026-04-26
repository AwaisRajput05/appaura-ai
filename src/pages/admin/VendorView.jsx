import React, { useState, useEffect, useCallback } from 'react';
import { FiFilter } from 'react-icons/fi';
import VendorFilter from '../../components/common/filter/VendorFilter';
import axios from 'axios';
import { apiEndpoints } from '../../services/apiEndpoints';
import { getToken } from '../../services/tokenUtils';
import { useAuth } from '../../components/auth/hooks/useAuth';
import { MessageAlert } from '../../components/common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
  NO_RECORD_FOUND,
} from '../../components/constants/Messages';

const statusColors = {
  APPROVED: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

export default function VendorView() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [, setAppliedFilters] = useState({});
  const { user } = useAuth();

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      if (!user) {
        setError('User authentication required');
        setLoading(false);
        return;
      }

      const response = await axios.get(apiEndpoints.vendorsPaginated, {
        params: { page: 0 },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const data = response.data;

      // If API explicitly says "Vendors not found", treat it as no vendors, not an error
      if (data?.error === 'Vendors not found.') {
        setVendors([]);
        setError(null);
      }
      // Valid content array
      else if (Array.isArray(data?.content)) {
        const filteredVendors = data.content.filter(
          (vendor) =>
            vendor.status === 'APPROVED' || vendor.status === 'BLOCKED'
        );
        setVendors(filteredVendors);
        setError(null);
      }
      // Unexpected format
      else {
        throw new Error('Unexpected API response format');
      }
    } catch (err) {
      console.error(`Failed to fetch vendors: ${err.message}`);
      if (!err.response) {
        setError(
          'Unable to connect to the server. Please check your internet connection or try again later.'
        );
      } else {
        const apiError = err.response.data?.error; // Capture the actual "error" field
        switch (err.response.status) {
          case 429:
            setError(ERROR_429);
            break;
          case 503:
            setError(ERROR_503);
            break;
          case 401:
            setError(ERROR_401);
            break;
          case 403:
            setError(ERROR_403);
            break;
          case 500:
            setError(ERROR_500);
            break;
          // Handle the "Vendors not found." case as NO ERROR, just empty table
          default:
            if (apiError === 'Vendors not found.') {
              setVendors([]);
              setError(null); // Do NOT show error, just empty state
            } else {
              setError(
                apiError ||
                  'An unknown error occurred while loading vendor data.'
              );
            }
        }
      }
      setVendors([]); // Only clear on real errors
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleApplyFilter = (filters) => {
    setAppliedFilters(filters);
  };

  const handleClearFilter = () => {
    setAppliedFilters({});
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Vendor View</h1>

      {error ? (
        <MessageAlert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          action={() => {
            setError(null);
            fetchVendors();
          }}
          actionLabel="Try Again"
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setShowFilter(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <FiFilter />
              Filters
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Search:</span>
              <input
                type="text"
                placeholder="Search by vendor name/email/category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-[#3069FE] rounded shadow">
              <thead>
                <tr className="table-heading underline text-left">
                  <th className="py-2 px-4">Company Name</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Vendor Name</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4">Category</th>
                  <th className="py-2 px-4">Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-gray-500 font-medium">
                          {NO_RECORD_FOUND}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {search
                            ? 'Try adjusting your search criteria'
                            : 'There are no vendors available at the moment'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="bg-white even:bg-[#566a96]/10"
                    >
                      <td className="py-2 px-4 font-medium">
                        {vendor.companyName}
                        <div className="text-xs text-gray-500">
                          {vendor.vendorName}
                        </div>
                      </td>
                      <td className="py-2 px-4">{vendor.email}</td>
                      <td className="py-2 px-4">{vendor.VendorName}</td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[vendor.status?.toUpperCase()]
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </td>
                      <td className="py-2 px-4">{vendor.category}</td>
                      <td className="py-2 px-4">
                        {vendor.reason
                          ? vendor.reason
                              .split('?reason=')[1]
                              ?.replace(/%20/g, ' ')
                              .replace(/%0A/g, ' ') || vendor.reason
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showFilter && (
        <VendorFilter
          onApplyFilter={handleApplyFilter}
          onClearFilter={handleClearFilter}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}

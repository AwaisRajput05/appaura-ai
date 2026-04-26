// BranchPermission.jsx - FIXED with proper alignment
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from "react-dom";
import HomeTable from '../../common/table/Table';
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import { MessageAlert } from '../../common/message/MessageAlert';
import axios from 'axios';
import { getToken } from '../../../services/tokenUtils';
import { apiEndpoints } from '../../../services/apiEndpoints';
import { RefreshCw } from 'lucide-react';
import { Eye } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from "../../../components/ui/forms/Button";
import Alert from "../../../components/ui/feedback/Alert";



const formatDate = (dateString, showTime = false) => {
  if (!dateString) return "N/A";
  
  try {
    let date;
    
    if (typeof dateString === 'string') {
      // Format: "27-12-2025" (DD-MM-YYYY)
      if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateString.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      }
      // Format: "2025-12-27" (YYYY-MM-DD)
      else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      }
      // Format: "2026-04-15T05:55:53.000Z" (ISO)
      else if (dateString.includes('T')) {
        date = new Date(dateString);
      }
      // Format: "2026-04-15 05:55:53" (with space)
      else if (dateString.includes(' ') && !dateString.includes('T')) {
        const utcString = dateString.replace(' ', 'T') + 'Z';
        date = new Date(utcString);
      }
      // Format with timezone offset
      else if (dateString.includes('+') || dateString.includes('-', 10)) {
        date = new Date(dateString);
      }
      // Fallback
      else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return dateString;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    if (showTime) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekday = dayNames[date.getDay()];
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      return `${weekday}, ${month} ${day}, ${year}, ${timeStr}`;
    } else {
      return `${month} ${day}, ${year}`;
    }
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateString);
    return dateString;
  }
};
const HoverTooltip = ({ preview, full, title = "Details" }) => {
  if (!full || full === "—" || full === preview) {
    return <span className="text-gray-600 font-medium">{preview}</span>;
  }

  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  const handleEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="text-blue-600 hover:text-blue-800 hover:underline cursor-help font-medium transition-colors"
      >
        {preview}
      </span>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div
            className="
              bg-white rounded-xl shadow-2xl border border-gray-200 
              p-6 max-w-lg w-[90%] mx-4 
              max-h-[85vh] overflow-y-auto pointer-events-auto
            "
          >
            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b border-gray-200 pb-3 text-center">
              {title}
            </h3>

            <div className="text-gray-800 font-medium leading-relaxed whitespace-pre-line text-left">
              {full.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0">
                  -&gt; {line.trim()}
                </p>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default function BranchPermission() {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }

      const response = await axios.get(apiEndpoints.listBranches, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        timeout: 10000,
      });

      const apiBranches = response.data.branches || [];

      const mappedBranches = apiBranches.map((branch, index) => ({
        id: branch.branchId || `temp-${index}`,
        name: branch.branchName || 'Unknown',
        phoneNumber: branch.phone || 'N/A',
        businessAddress: branch.businessAddress || 'N/A',
        branchId: branch.branchId || 'N/A',
        branchName: branch.branchName || 'N/A',
        city: branch.city || 'N/A',
        state: branch.state || 'N/A',
        zip: branch.zipCode || 'N/A',
        country: branch.country || 'N/A',
        emailAddress: branch.email || 'N/A',
        status: branch.vendorStatus || 'unknown',
        createdDate: branch.createdAt || new Date().toISOString().split('T')[0],
        applicationRoles: branch.applicationRoles || [],
      }));

      setBranches(mappedBranches);
      setSuccessMessage();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleRefresh = () => {
    fetchBranches();
  };

  const branchesColumns = [
    {
      accessorKey: 'phoneNumber',
      header: ({ column }) => (
        <HeaderWithSort 
          column={column} 
          title="Phone Number" 
          className="text-center justify-center"
        />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "branchName",
      header: ({ column }) => (
        <HeaderWithSort 
          column={column} 
          title="Branch Name" 
          className="text-center justify-center"
        />
      ),
      cell: ({ row }) => {
        const branchId = row.original.branchId || "-";
        const businessName = row.original.branchName || "N/A";
    
        const words = businessName.trim().split(/\s+/);
        const previewName = words.length > 10 ? words.slice(0, 10).join(" ") + "..." : businessName;
    
        const fullText = `Branch Name: ${businessName}\nBranch ID: ${branchId}`;
    
        return <HoverTooltip preview={previewName} full={fullText} title="Branch Details" />;
      },
    },
    {
      accessorKey: 'businessAddress',
      header: ({ column }) => (
        <HeaderWithSort 
          column={column} 
          title="Address" 
          className="text-center justify-center"
        />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'city',
      header: ({ column }) => (
        <HeaderWithSort 
          column={column} 
          title="City" 
          className="text-center justify-center"
        />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'state',
      header: ({ column }) => (
        <HeaderWithSort 
          column={column} 
          title="State" 
          className="text-center justify-center"
        />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'zip',
      header: ({ column }) => (
        <HeaderWithSort 
          column={column} 
          title="Zip" 
          className="text-center justify-center"
        />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'applicationRoles',
      header: ({ column }) => (
        <HeaderWithSort 
          column={column} 
          title="Permissions" 
          className="text-center justify-center"
        />
      ),
      cell: (info) => {
        const roles = info.getValue() || [];
        if (roles.length === 0) {
          return <span className="text-gray-500 text-sm">No Permissions</span>;
        }
        const preview = roles.length > 2 
          ? `${roles.slice(0, 2).join(', ')} +${roles.length - 2} more` 
          : roles.join(', ');
        const full = roles.join('\n');
        return <HoverTooltip preview={preview} full={full} title="Permissions" />;
      },
    },
    {
      accessorKey: 'emailAddress',
      header: ({ column }) => (
        <HeaderWithSort 
          column={column} 
          title="Email Address" 
          className="text-center justify-center"
        />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <HeaderWithSort 
          column={column} 
          title="Status" 
          className="text-center justify-center"
        />
      ),
      cell: (info) => {
        const status = info.getValue();
        return (
          <span
            className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
              status === 'APPROVED'
                ? 'bg-green-100 text-green-800'
                : status === 'PENDING'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {status}
          </span>
        );
      },
    },
  {
  accessorKey: 'createdDate',
  header: ({ column }) => (
    <HeaderWithSort 
      column={column} 
      title="Created Date" 
      className="text-center justify-center"
    />
  ),
  cell: (info) => {
    const dateStr = info.getValue();
    if (!dateStr) return 'N/A';
    return formatDate(dateStr, false);
  },
},
    {
      accessorKey: 'actions',
      header: () => (
        <div className="text-center font-medium">
          Actions
        </div>
      ),
      cell: (info) => {
        const row = info.row.original;
        const isApproved = row.status === 'APPROVED';

        return (
          <div className="flex justify-center">
            <Link
              to={
                isApproved
                  ? `/admin-vendors/manage-branches/branch-permission/view/${row.id}`
                  : '#'
              }
              state={
                isApproved
                  ? {
                      branch: { id: row.branchId, name: row.name },
                      existingRoles: row.applicationRoles,
                      vendorStatus: row.status,
                    }
                  : undefined
              }
              onClick={(e) => {
                if (!isApproved) {
                  e.preventDefault();
                }
              }}
              title="View"
              aria-label="View branch permissions"
              className={`p-2 rounded-lg transition 
                          flex items-center justify-center 
                          shadow-sm hover:shadow-md 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isApproved
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Eye className="w-5 h-5" />
            </Link>
          </div>
        );
      },
    },
  ];

  const filterFields = [
    { type: 'text', name: 'name', label: 'Name' },
    { type: 'text', name: 'city', label: 'City' },
  ];

  // Dynamic title for the header
  const dynamicTitle = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xl sm:text-2xl font-bold text-gray-800">Branch Permissions</span>
      </div>
      <div className="flex flex-row flex-wrap gap-2 sm:gap-3 justify-end">
        <Button
          onClick={handleRefresh}
          disabled={loading}
          loading={loading}
          loadingText="Refreshing..."
          variant="primary"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base px-4 py-2"
        >
          <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing' : 'Refresh'}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Success Message Alert */}
        {successMessage && (
          <Alert
            variant="success"
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
            className="mb-4"
          />
        )}

        {/* Error Message Alert */}
        {error && (
          <Alert
            variant="error"
            message={error}
            onClose={() => setError(null)}
            action={handleRefresh}
            actionLabel="Retry"
            className="mb-4"
          />
        )}

        <div className="overflow-hidden">
          {/* Card wrapper for better structure like createsupplier */}
          <Card className="mb-6" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              {dynamicTitle}
            </div>
          </Card>

          <HomeTable
          
            data={branches}
            columns={branchesColumns}
            searchField="name"
            filterFields={filterFields}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
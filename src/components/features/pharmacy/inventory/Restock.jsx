import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../auth/hooks/AuthContextDef";
import Table from "../../../common/table/postable";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/inventory/inventoryEnd";
import { MessageAlert } from "../../../common/message/MessageAlert";
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from "../../../constants/Messages";

export default function Restock() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [restocks, setRestocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [filters, setFilters] = useState({
    drug_name: "",
    quantity: "",
    new_expiry_date: "",
    expiry_time: "12:00", // Default time
  });

  const vendorId = user?.vendorId || (user?.role === "VENDOR" ? user?.userId : null);

  const handleRestock = async () => {
    const { drug_name, quantity, new_expiry_date, expiry_time } = filters;

    if (!drug_name || !quantity || !new_expiry_date || !expiry_time) {
      setError("Please fill all fields: Drug Name, Quantity, Date, and Time");
      return;
    }

    if (!vendorId) {
      setError("Vendor ID not found. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getToken();

      // Combine date + time → YYYY-MM-DD HH:mm:ss
      const formattedExpiry = `${new_expiry_date} ${expiry_time}:00`;

      const payload = {
        vendor_id: vendorId,
        drug_name: drug_name.trim(),
        quantity: Number(quantity),
        new_expiry_date: formattedExpiry,
      };

     

      await apiService.post(apiEndpoints.drugRestock(), payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Format for display
      const displayDate = new Date(`${new_expiry_date}T${expiry_time}`).toLocaleDateString();
      const displayTime = new Date(`1970-01-01T${expiry_time}`).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newRestock = {
        id: `${drug_name}-${Date.now()}`,
        drug_name: drug_name.trim(),
        quantity: Number(quantity),
        new_expiry_date: `${displayDate} ${displayTime}`,
        restock_date: new Date().toLocaleDateString(),
      };

      setRestocks((prev) => [newRestock, ...prev]);

      setSuccessMessage(`Successfully restocked ${quantity} units of ${drug_name}`);
      setFilters({ drug_name: "", quantity: "", new_expiry_date: "", expiry_time: "12:00" });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to restock. Please check input and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const columns = [
    {
      accessorKey: "drug_name",
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Drug Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium flex items-center gap-1">
          <Package className="w-4 h-4 text-blue-600" />
          {row.original.drug_name}
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Restocked Qty" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold">{row.original.quantity}</div>
      ),
    },
    {
      accessorKey: "new_expiry_date",
      header: ({ column }) => (
        <HeaderWithSort column={column} title="New Expiry" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.new_expiry_date}</div>
      ),
    },
    {
      accessorKey: "restock_date",
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Restock Date" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.restock_date}</div>
      ),
    },
  ];

  const filterFields = [
    {
      type: "text",
      name: "drug_name",
      label: "Drug Name",
      placeholder: "e.g. Panadol",
      value: filters.drug_name,
      onChange: (e) =>
        setFilters((prev) => ({ ...prev, drug_name: e.target.value })),
    },
    {
      type: "number",
      name: "quantity",
      label: "Quantity",
      placeholder: "e.g. 10",
      min: 1,
      value: filters.quantity,
      onChange: (e) =>
        setFilters((prev) => ({ ...prev, quantity: e.target.value })),
    },
    {
      type: "date",
      name: "new_expiry_date",
      label: "Expiry Date",
      value: filters.new_expiry_date,
      onChange: (e) =>
        setFilters((prev) => ({ ...prev, new_expiry_date: e.target.value })),
      className: "date-input-black",
    },
    {
      type: "time",
      name: "expiry_time",
      label: "Expiry Time",
      value: filters.expiry_time,
      onChange: (e) =>
        setFilters((prev) => ({ ...prev, expiry_time: e.target.value })),
    },
  ];

  return (
    <>
      <style>
        {`
          .date-input-black::-webkit-calendar-picker-indicator {
            filter: invert(1);
          }
        `}
      </style>

      {error && (
        <MessageAlert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          actionLabel="OK"
        />
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div className="p-6 bg-white rounded-2xl shadow-md w-full space-y-6">
        {/* Restock Form */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Restock Drug
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {filterFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={field.placeholder}
                  min={field.min}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    field.className || ""
                  }`}
                />
              </div>
            ))}
            <div className="flex items-end">
              <button
                onClick={handleRestock}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Restocking..." : "Restock Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Local Restock History */}
        <Table
          title="Restock History (This Session)"
          data={restocks}
          columns={columns}
          filterFields={[]}
          hideDefaultActions
          loading={loading}
          pagination={false}
          serverSideFiltering={false}
        />
      </div>
    </>
  );
}
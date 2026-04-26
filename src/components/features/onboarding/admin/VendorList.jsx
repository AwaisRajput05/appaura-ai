import { useEffect, useState } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { VendorActions } from './VendorActions'; // Make sure you have this

export const VendorList = () => {
  const [vendorData, setVendorData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace API call with dummy data
    const dummyVendors = [
      {
        sn: 1,
        id: 'v1',
        companyName: 'GreenTech Solutions',
        email: 'contact@greentech.com',
        status: 'active',
      },
      {
        sn: 2,
        id: 'v2',
        companyName: 'BlueOcean Ltd',
        email: 'info@blueocean.com',
        status: 'inactive',
      },
    ];

    setVendorData(dummyVendors);
    setLoading(false);
  }, []);

  const columns = [
    {
      accessorKey: "sn",
      header: "Serial No.",
      cell: ({ row }) => row.original.sn,
    },
    {
      accessorKey: "companyName",
      header: ({ column }) => <HeaderWithSort column={column} title="Company Name" />,
    },
    {
      accessorKey: "email",
      header: ({ column }) => <HeaderWithSort column={column} title="Email" />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
      cell: ({ getValue }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            getValue() === 'active' ? 'bg-green-100 text-green-800' :
            getValue() === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}
        >
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: "Vendor Actions",
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="flex items-center gap-2">
            <VendorActions
              vendorId={vendor.id}
              status={vendor.status}
              onUpdate={() => {
                // Simulate refresh (re-setting dummy data)
                setLoading(true);
                setTimeout(() => {
                  setVendorData((prev) => [...prev]); // No actual update
                  setLoading(false);
                }, 500);
              }}
            />
          </div>
        );
      },
    },
  ];

  const statusOptions = [...new Set(vendorData.map(v => v.status))];

  const filterFields = [
    { type: "text", name: "companyName", label: "Company Name", placeholder: "Search by company..." },
    { type: "text", name: "email", label: "Email", placeholder: "Search by email..." },
    { type: "select", name: "status", label: "Status", options: ["All", ...statusOptions] },
  ];

  return (
    <HomeTable
      title="Vendors List"
      data={vendorData}
      columns={columns}
      searchField="companyName"
      filterFields={filterFields}
      loading={loading}
      hideDefaultActions
    />
  );
};

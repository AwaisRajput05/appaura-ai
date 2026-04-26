import React, { useEffect, useState } from "react";
import axios from "axios";
import HomeTable from "../../../../common/Table/Table";
import HeaderWithSort from "../../../../common/table/components/TableHeaderWithSort";
import { apiEndpoints } from "../../../../../config/apiEndpoints";

export default function Recommended() {
  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await axios.get(apiEndpoints.recommended);

        const formatted = response.data.purchases.map((p, idx) => ({
          sn: idx + 1,
          customer_id: p.customer_id,
          email: p.email,
          purchase_date: new Date(p.purchase_date).toLocaleString(),
          product_id: p.product_id,
          product_category: p.product_category,
          price: p.price,
          quantity: p.quantity,
        }));

        setPurchaseData(formatted);
      } catch (error) {
        console.error("Error fetching purchases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const columns = [
    { accessorKey: "sn", header: "Serial No.", cell: ({ row }) => row.original.sn },
    { accessorKey: "customer_id", header: ({ column }) => <HeaderWithSort column={column} title="Customer ID" /> },
    { accessorKey: "email", header: ({ column }) => <HeaderWithSort column={column} title="Email" /> },
    { accessorKey: "purchase_date", header: ({ column }) => <HeaderWithSort column={column} title="Purchase Date" /> },
    { accessorKey: "product_id", header: ({ column }) => <HeaderWithSort column={column} title="Product ID" /> },
    { accessorKey: "product_category", header: ({ column }) => <HeaderWithSort column={column} title="Category" /> },
    { accessorKey: "price", header: ({ column }) => <HeaderWithSort column={column} title="Price" /> },
    { accessorKey: "quantity", header: ({ column }) => <HeaderWithSort column={column} title="Quantity" /> },
  ];

  const filterFields = [
    { type: "text", name: "customer_id", label: "Customer ID", placeholder: "Search by ID..." },
    { type: "text", name: "email", label: "Email", placeholder: "Search by Email..." },
    { type: "text", name: "product_category", label: "Category", placeholder: "Search by Category..." },
  ];

  return (
    <HomeTable
      title="Recommended"
      data={purchaseData}
      columns={columns}
      searchField="customer_id"
      filterFields={filterFields}
      loading={loading}
    />
  );
}

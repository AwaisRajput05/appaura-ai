import React, { useEffect, useState } from "react";
import axios from "axios";
import HomeTable from "../../../../common/Table/Table";
import HeaderWithSort from "../../../../common/table/components/TableHeaderWithSort";
import { apiEndpoints } from "../../../../../config/apiEndpoints";

export default function Discount() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await axios.get(apiEndpoints.discount);

        const { user_intent, inventory } = response.data;

        const formatted = user_intent.map((intent, idx) => {
          const inventoryItem = inventory.find(i => i.product_id === intent.product_id);
          const stock_level = inventoryItem ? inventoryItem.stock_level : 0;

          const discount_recommended =
            intent.intent_score >= 0.8 && stock_level >= 50 ? "Yes" : "No";

          return {
            sn: idx + 1,
            customer_id: intent.customer_id,
            product_id: intent.product_id,
            intent_score: intent.intent_score,
            stock_level,
            discount_recommended,
          };
        });

        setDiscounts(formatted);
      } catch (err) {
        console.error("Failed to fetch discount data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  const columns = [
    { accessorKey: "sn", header: "Serial No.", cell: ({ row }) => row.original.sn },
    { accessorKey: "customer_id", header: ({ column }) => <HeaderWithSort column={column} title="Customer ID" /> },
    { accessorKey: "product_id", header: ({ column }) => <HeaderWithSort column={column} title="Product ID" /> },
    { accessorKey: "intent_score", header: ({ column }) => <HeaderWithSort column={column} title="Intent Score" /> },
    { accessorKey: "stock_level", header: ({ column }) => <HeaderWithSort column={column} title="Stock Level" /> },
    { accessorKey: "discount_recommended", header: ({ column }) => <HeaderWithSort column={column} title="Discount?" /> },
  ];

  const filterFields = [
    { type: "text", name: "customer_id", label: "Customer ID", placeholder: "Search by ID..." },
    { type: "text", name: "product_id", label: "Product ID", placeholder: "Search by Product..." },
    { type: "select", name: "discount_recommended", label: "Discount", options: ["All", "Yes", "No"] },
  ];

  return (
    <HomeTable
      title="Discounts"
      data={discounts}
      columns={columns}
      searchField="customer_id"
      filterFields={filterFields}
      loading={loading}
    />
  );
}

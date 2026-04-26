import React, { useEffect, useState } from "react";
import axios from "axios";
import HomeTable from "../../../../common/Table/Table";
import HeaderWithSort from "../../../../common/table/components/TableHeaderWithSort";
import { apiEndpoints } from "../../../../../config/apiEndpoints";

export default function DiscountResponse() {
  const [discountData, setDiscountData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscountResponse = async () => {
      try {
        const response = await axios.get(apiEndpoints.discountResponse);

        const formatted = response.data.data.map((item, index) => ({
          sn: index + 1,
          _id: item._id,
          product_id: item.product_id,
          discount_percentage: item.discount_percentage,
          reason: item.reason,
        }));

        setDiscountData(formatted);
      } catch (err) {
        console.error("Failed to fetch discount response", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscountResponse();
  }, []);

  const columns = [
    { accessorKey: "sn", header: "Serial No.", cell: ({ row }) => row.original.sn },
    { accessorKey: "_id", header: ({ column }) => <HeaderWithSort column={column} title="ID" /> },
    { accessorKey: "product_id", header: ({ column }) => <HeaderWithSort column={column} title="Product ID" /> },
    { accessorKey: "discount_percentage", header: ({ column }) => <HeaderWithSort column={column} title="Discount (%)" /> },
    { accessorKey: "reason", header: ({ column }) => <HeaderWithSort column={column} title="Reason" /> },
  ];

  const filterFields = [
    { type: "text", name: "_id", label: "ID", placeholder: "Search by ID..." },
    { type: "text", name: "product_id", label: "Product ID", placeholder: "Search by Product..." },
    { type: "range", name: "discount_percentage", label: "Discount (%)", min: 0, max: 100, step: 1 },
    { type: "text", name: "reason", label: "Reason", placeholder: "Search by Reason..." },
  ];

  return (
    <HomeTable
      title="Discount Response"
      data={discountData}
      columns={columns}
      searchField="product_id"
      filterFields={filterFields}
      loading={loading}
    />
  );
}

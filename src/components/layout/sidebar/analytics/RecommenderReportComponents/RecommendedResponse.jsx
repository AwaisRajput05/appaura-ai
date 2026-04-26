import React, { useEffect, useState } from "react";
import axios from "axios";
import HomeTable from "../../../../common/Table/Table";
import HeaderWithSort from "../../../../common/table/components/TableHeaderWithSort";
import { apiEndpoints } from "../../../../../config/apiEndpoints";

export default function RecommendedResponse() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get(apiEndpoints.recommendedResponse);

        const formatted = response.data.recommendations_count.map((r, index) => ({
          sn: index + 1,
          customer_id: r.customer_id,
          recommended_product_id: r.recommended_product_id,
          recommended_category: r.recommended_category,
          confidence: r.confidence,
          offer_type: r.offer_type,
        }));

        setRecommendations(formatted);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const columns = [
    {
      accessorKey: "sn",
      header: "Serial No.",
      cell: ({ row }) => row.original.sn,
    },
    {
      accessorKey: "customer_id",
      header: ({ column }) => <HeaderWithSort column={column} title="Customer ID" />,
    },
    {
      accessorKey: "recommended_product_id",
      header: ({ column }) => <HeaderWithSort column={column} title="Recommended Product ID" />,
    },
    {
      accessorKey: "recommended_category",
      header: ({ column }) => <HeaderWithSort column={column} title="Category" />,
    },
    {
      accessorKey: "confidence",
      header: ({ column }) => <HeaderWithSort column={column} title="Confidence" />,
    },
    {
      accessorKey: "offer_type",
      header: ({ column }) => <HeaderWithSort column={column} title="Offer Type" />,
    },
  ];

  const filterFields = [
    { type: "text", name: "customer_id", label: "Customer ID", placeholder: "Search by ID..." },
    { type: "text", name: "recommended_product_id", label: "Product ID", placeholder: "Search by Product..." },
    { type: "text", name: "recommended_category", label: "Category", placeholder: "Search by Category..." },
    { type: "text", name: "offer_type", label: "Offer", placeholder: "Search by Offer Type..." },
  ];

  return (
    <HomeTable
      title="Recommended Response"
      data={recommendations}
      columns={columns}
      searchField="customer_id"
      filterFields={filterFields}
      loading={loading}
    />
  );
}

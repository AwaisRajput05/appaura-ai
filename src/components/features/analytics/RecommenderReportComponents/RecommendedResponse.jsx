import React from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";

export default function RecommendedResponse() {
  const columns = [
    { accessorKey: "customerId", header: ({ column }) => <HeaderWithSort column={column} title="Customer ID" /> },
    { accessorKey: "product_id", header: ({ column }) => <HeaderWithSort column={column} title="Recommended Product ID" /> },
    { accessorKey: "product_name", header: ({ column }) => <HeaderWithSort column={column} title="Product Name" /> },
    { accessorKey: "user_intent_score", header: ({ column }) => <HeaderWithSort column={column} title="Intent Score" /> },
  ];
  

  const filterFields = [
    { type: "text", name: "customerId", label: "Customer ID" },
    { type: "text", name: "product_name", label: "Product Name" },
  ];

  return (
    <HomeTable
      title="Recommended Products"
      data={[]}
      columns={columns}
      filterFields={filterFields}
      searchField="customerId"
      loading={false}
    />
  );
}

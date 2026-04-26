import React from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";

export default function DiscountResponse() {
 

  const columns = [
    { accessorKey: "customerId", header: ({ column }) => <HeaderWithSort column={column} title="Customer ID" /> },
    { accessorKey: "product_name", header: ({ column }) => <HeaderWithSort column={column} title="Product" /> },
    { accessorKey: "price", header: ({ column }) => <HeaderWithSort column={column} title="Price" /> },
    { accessorKey: "discount", header: ({ column }) => <HeaderWithSort column={column} title="Offered Discount" /> },
  ];

  const filterFields = [
    { type: "text", name: "customerId", label: "Customer ID" },
    { type: "text", name: "product_name", label: "Product Name" },
  ];

  return (
    <HomeTable
      title="Discount Offers"
      data={[]}
      columns={columns}
      filterFields={filterFields}
      searchField="customerId"
      loading={false}
    />
  );
}

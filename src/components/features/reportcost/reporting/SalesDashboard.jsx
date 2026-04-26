// src/pages/Sales/SalesDashboard.jsx
import { useEffect, useState } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import jsPDF from 'jspdf';

export const SalesDashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load dummy sales data
  useEffect(() => {
    const dummySales = [
      { date: "2025-01-01", product: "A", quantity: 100, revenue: 1000 },
      { date: "2025-01-02", product: "B", quantity: 150, revenue: 1500 },
      { date: "2025-01-03", product: "A", quantity: 200, revenue: 2000 },
      { date: "2025-01-04", product: "C", quantity: 50, revenue: 500 },
      { date: "2025-01-05", product: "B", quantity: 120, revenue: 1200 }
    ];
    setSalesData(dummySales);
    setLoading(false);
  }, []);

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Date,Product,Quantity,Revenue\n" +
      salesData.map(row => `${row.date},${row.product},${row.quantity},${row.revenue}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Sales Data", 10, 10);
    salesData.forEach((row, index) => {
      doc.text(
        `${row.date} - ${row.product}: ${row.quantity} units, $${row.revenue}`,
        10,
        20 + index * 10
      );
    });
    doc.save("sales_data.pdf");
  };

  const columns = [
    {
      accessorKey: "date",
      header: ({ column }) => <HeaderWithSort column={column} title="Date" />,
    },
    {
      accessorKey: "product",
      header: ({ column }) => <HeaderWithSort column={column} title="Product" />,
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <HeaderWithSort column={column} title="Quantity" />,
    },
    {
      accessorKey: "revenue",
      header: ({ column }) => <HeaderWithSort column={column} title="Revenue" />,
      cell: ({ getValue }) => `$${getValue()}`,
    },
  ];

  const productOptions = [...new Set(salesData.map(d => d.product))];

  const filterFields = [
    { type: "text", name: "date", label: "Date", placeholder: "Search by date..." },
    { type: "text", name: "product", label: "Product", placeholder: "Search by product..." },
    { type: "select", name: "productFilter", label: "Product Filter", options: ["All", ...productOptions] },
  ];

 

  return (
    <HomeTable
      title="Sales Dashboard"
      data={salesData}
      columns={columns}
      searchField="product"
      filterFields={filterFields}
      loading={loading}
      hideDefaultActions
      handleExportCSV={handleExportCSV}
      handleExportPDF={handleExportPDF}
    />
  );
};

import React, { useState, useEffect } from "react";
import apiService from "../../../../services/apiService";
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { apiEndpoints } from "../../../../services/apiEndpoints";
import { useAuth } from "../../../auth/hooks/useAuth";

export default function FraudTransactions() {
  const { user } = useAuth(); 
  const [transactionData, setTransactionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (!user?.userId) {
          throw new Error("User ID not found. Please ensure you're properly logged in.");
        }
        const response = await apiService.get(apiEndpoints.transactionReport(user.userId));

        const transactions = response.data;

        const formattedData = transactions.map((event, idx) => ({
          id: idx + 1, 
          sn: idx + 1,
          tid: event.transactionId,
          customerId: event.customerId,
          amount: event.amount,
          timeStamp: new Date(event.date).toISOString(),
          items: event.items?.length || 0,
          email: event.email,
          points: event.points,
        }));

        setTransactionData(formattedData);
      } catch (error) {
        console.error("Error fetching transaction data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.userId]);

  const columns = [
    {
      accessorKey: "sn",
      header: "Serial No.",
      cell: ({ row }) => row.original.sn,
    },
    {
      accessorKey: "tid",
      header: ({ column }) => <HeaderWithSort column={column} title="Transaction ID" />,
    },
    {
      accessorKey: "customerId",
      header: ({ column }) => <HeaderWithSort column={column} title="Customer ID" />,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <HeaderWithSort column={column} title="Amount" />,
      cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
    },
    {
      accessorKey: "timeStamp",
      header: ({ column }) => <HeaderWithSort column={column} title="Date" />,
      cell: ({ getValue }) => {
        const date = new Date(getValue());
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      accessorKey: "items",
      header: ({ column }) => <HeaderWithSort column={column} title="Items" />,
    },
    {
      accessorKey: "email",
      header: ({ column }) => <HeaderWithSort column={column} title="Email" />,
    },
    {
      accessorKey: "points",
      header: ({ column }) => <HeaderWithSort column={column} title="Points" />,
    },
  ];

  const filterFields = [
    { type: "text", name: "tid", label: "Transaction ID", placeholder: "Filter by Transaction ID..." },
    { type: "text", name: "customerId", label: "Customer ID", placeholder: "Filter by Customer ID..." },
    { type: "range", name: "amount", label: "Amount Range", min: 0, max: 5000, step: 50 },
    { type: "date", name: "timeStamp", label: "Time Stamp" },
    { type: "range", name: "items", label: "Items Count", min: 1, max: 10 },
    { type: "text", name: "email", label: "Email", placeholder: "Filter by Email..." },
    { type: "range", name: "points", label: "Points Range", min: 0, max: 5000, step: 50 },
  ];

  return (
    <HomeTable
      title="Transactions"
      data={transactionData}
      columns={columns}
      searchField="customerId"
      filterFields={filterFields}
      loading={loading}
    />
  );
}

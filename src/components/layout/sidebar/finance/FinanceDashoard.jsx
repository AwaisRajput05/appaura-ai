import React, { useState, useOptimistic, useEffect, useTransition } from "react";
import { Link } from "react-router-dom";
import AccountsTable from "../../../features/finance/Account";
import ErrorBoundary from "../../../common/error/ErrorBoundary";
import { useAuth } from "../../../auth/hooks/useAuth";
import { getToken } from "../../../../services/tokenUtils";
import Spinner from "../../../common/spinner/Spinner";

const dummyAccounts = [
  {
    id: 1,
    type: "Receivable",
    amount: 500,
    status: "Pending"
  },
  {
    id: 2,
    type: "Payable",
    amount: 300,
    status: "Paid"
  }
];

export default function FinanceDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [optimisticAccounts, setOptimisticAccounts] = useOptimistic(accounts);
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        const response = {
          data: {
            status: "success",
            data: dummyAccounts
          }
        };

        if (
          response.data &&
          response.data.status === "success" &&
          Array.isArray(response.data.data)
        ) {
          startTransition(() => {
            setAccounts(response.data.data);
            setOptimisticAccounts(response.data.data);
          });
          setError(null);
        } else {
          setError("Invalid data format received");
          setAccounts([]);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch accounts");
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      fetchAccounts();
    }
  }, [user?.userId, startTransition, setOptimisticAccounts]);

  async function toggleStatus(id) {
    const updatedAccount = accounts.find((a) => a.id === id);
    const newStatus = updatedAccount.status === "Paid" ? "Pending" : "Paid";

    startTransition(() => {
      setOptimisticAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    startTransition(() => {
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    });
  }

  if (loading || isPending) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <div className="flex justify-between items-center bg-white p-2 rounded-md mb-6">
        <Link
          to="/admin-vendors/finance-management/account/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Account
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <ErrorBoundary fallback="An error occurred while loading the accounts table">
          <AccountsTable
            accounts={optimisticAccounts}
            onToggleStatus={toggleStatus}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
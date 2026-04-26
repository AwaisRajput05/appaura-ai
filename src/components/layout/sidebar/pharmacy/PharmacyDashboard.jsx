import React, { useState, useOptimistic, useEffect, useTransition } from "react";
import { Link, Outlet } from "react-router-dom"; // Add Outlet for child routes
import ErrorBoundary from "../../../common/error/ErrorBoundary";
import { useAuth } from "../../../auth/hooks/useAuth";
import Spinner from "../../../common/spinner/Spinner";

export default function PharmacyDashboard() {
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  if (isPending) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      {/* <div className="flex justify-between items-center bg-white p-2 rounded-md mb-6"> */}
        {/* <Link
          to="/admin-vendors/pharmacy-management/new" // Adjust path for creating new drug/entry
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Drug
        </Link> */}
      {/* </div> */}

      <div className="bg-white shadow rounded-lg">
        <ErrorBoundary fallback="An error occurred while loading the pharmacy content">
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
}
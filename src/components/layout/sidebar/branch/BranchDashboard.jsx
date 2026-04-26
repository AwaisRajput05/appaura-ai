import React from 'react';
import { Link } from 'react-router-dom';

const BranchDashboard = () => {
  // Mock data for demonstration
  const branches = [
    { id: 1, code: 'BRANCH001', name: 'Main Office', location: 'Karachi' },
    { id: 2, code: 'BRANCH002', name: 'Branch A', location: 'Lahore' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-4xl w-full space-y-6 bg-white shadow-xl rounded-xl p-8">
        <h2 className="text-2xl text-center font-bold mb-4">Branch Management Dashboard</h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Overview and management of all branches
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {branches.map((branch) => (
                <tr key={branch.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{branch.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{branch.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{branch.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center">
          <Link
            to="add-branch"
            className="w-48 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
          >
            Add New Branch
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BranchDashboard;
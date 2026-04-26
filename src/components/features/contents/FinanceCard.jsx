import React from 'react';

const FinanceCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Cash Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Cash</h2>
          <span className="text-sm text-gray-500">This Month</span>
        </div>
        
        <div className="text-center py-4">
          <div className="text-2xl font-bold mb-2">PKR 0.00</div>
          <div className="h-2 bg-gray-200 rounded-full mb-2"></div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>Total</span>
            <span>10</span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Other Payments</span>
            <span className="text-sm font-bold">0%</span>
          </div>
        </div>
      </div>

      {/* Bank Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Bank</h2>
          <span className="text-sm text-gray-500">This Month</span>
        </div>
        
        <div className="text-center py-4">
          <div className="text-2xl font-bold mb-2">PKR 0.00</div>
          <div className="h-2 bg-gray-200 rounded-full mb-2"></div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>Total</span>
            <span>10</span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Other Transactions</span>
            <span className="text-sm font-bold">0%</span>
          </div>
        </div>
      </div>

      {/* Top Customers Card (from previous implementation) */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Top Customers</h2>
          <span className="text-sm text-gray-500">This Month</span>
        </div>

        <div className="text-center py-4">
          <div className="text-sm text-gray-500 mb-2">Low Inventory</div>
          <div className="text-gray-400 text-sm mb-4">There is no data available</div>
          
          <div className="relative mb-2">
            <div className="h-2 bg-gray-200 rounded-full w-full"></div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0</span>
              <span className="text-xs text-gray-500">Total</span>
              <span className="text-xs text-gray-500">10</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Other Customers</span>
            <span className="text-sm font-bold">0%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceCards;
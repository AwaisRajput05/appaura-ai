import React from 'react';

const RevenueExpenseCard = () => {
  // Data for the graph
  const months = ['July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const revenueData = [900, 800, 700, 600, 500, 400, 300, 200, 100, 0, 0, 0];
  const expenseData = [500, 400, 300, 200, 100, 0, 0, 0, 0, 0, 0, 0];

  // Find the maximum value for scaling
  const maxValue = Math.max(...revenueData, ...expenseData);

  return (
    <div className="bg-white w-2/3">
      <h2 className="text-lg font-semibold p-6">Revenue vs Expense</h2>
      <div className='border-b border-gray-200' />
      <div className="flex p-6">
        {/* Left side - Vertical metrics */}
        <div className="w-1/3 pr-4 flex flex-col justify-between h-64">
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold">PKR 0</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Expense</p>
            <p className="text-xl font-bold">PKR 0</p>
          </div>
          <div>
            <p className="text-xl font-medium">Revenue Expense Ratio</p>
            <p className="text-sm text-gray-500">0%</p>
          </div>
        </div>

        {/* Right side - Graph */}
        <div className="w-2/3 h-64">
          <div className="flex h-full">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between mr-2 text-right text-xs text-gray-500">
              {[1000, 800, 600, 400, 200, 0].map((value) => (
                <div key={value}>PKR {value}</div>
              ))}
            </div>
            
            {/* Graph bars */}
            <div className="flex-1 flex items-end space-x-1">
              {months.map((month, index) => (
                <div key={month} className="flex-1 flex flex-col items-center">
                  <div className="flex-1 flex items-end w-full">
                    <div 
                      className="w-full bg-indigo-600" 
                      style={{ height: `${(revenueData[index] / maxValue) * 100}%` }}
                    ></div>
                    <div 
                      className="w-full bg-red-500" 
                      style={{ height: `${(expenseData[index] / maxValue) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-4 mt-4 mb-6 <div className='border-b border-gray-200' />">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-indigo-600 rounded mr-2"></div>
          <span className="text-sm">Revenue</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          <span className="text-sm">Expense</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueExpenseCard;
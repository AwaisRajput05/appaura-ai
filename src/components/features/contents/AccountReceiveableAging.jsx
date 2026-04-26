import React from 'react';

const AccountReceivableAging = () => {
  // Data for the graph
  const ranges = ['0 to 15', '16 to 35', '36 to 70', '71 to 180', '181 to 360'];
  const revenueData = [900, 800, 700, 600, 500, 400, 300, 200, 100, 0, 0, 0];
  const expenseData = [500, 400, 300, 200, 100, 0, 0, 0, 0, 0, 0, 0];

  // Find the maximum value for scaling
  const maxValue = Math.max(...revenueData, ...expenseData);

  return (
    <div className="bg-white">
      <h2 className="text-lg font-semibold p-6">Account Receivable Aging</h2>
      <div className='border-b border-gray-200 mb-4' />
      <div className="flex p-6">
       
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
              {ranges.map((range, index) => (
                <div key={range} className="flex-1 flex flex-col items-center">
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
                  <div className="text-xs text-gray-500 mt-1">{range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-4 mt-4 ">
        <div className="flex items-center mb-6">
          <div className="w-8 h-4 bg-indigo-600 rounded mr-2"></div>
          <span className="text-sm">All Aging</span>
        </div>
      </div>
    </div>
  );
};

export default AccountReceivableAging;
import React from 'react';

const LowInventoryMessage = () => {
  return (
    <div className='bg-white w-1/3'>
    <h2 className="text-lg font-semibold text-gray-800 mb-2 p-4">Low Inventory</h2>
    <div className="flex flex-col p-6 bg-gray-100">
      <p className="text-orange-500 font-bold">There is no data available.</p>
    </div>
    </div>
  );
};

export default LowInventoryMessage;
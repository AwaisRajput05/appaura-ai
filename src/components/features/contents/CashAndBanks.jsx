import React from 'react';

const CashAndBanks = () => {
  return (
    <div className="bg-white w-1/3">
      <h1 className="text-xl font-bold mb-4 p-4">Cash and Banks</h1>
      <div className='flex flex-col gap-4'>
      <div className='flex justify-between p-4 hover:bg-gray-200 '>
            <p className='text-green-400'>Cash in Hand</p>
            <p>PKR 0.00</p>
      </div>
      <div className='flex justify-between p-4 hover:bg-gray-200'>
            <p className='text-green-400'>Undeposited Funds</p>
            <p>PKR 0.00</p>
      </div>
      </div>
    </div>
  );
};

export default CashAndBanks;
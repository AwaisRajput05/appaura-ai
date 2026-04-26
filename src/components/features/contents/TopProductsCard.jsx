import React from 'react';

const TopProductsCard = ({ products = [], loading = false }) => {
  const totalQuantity = products?.reduce((sum, product) => sum + product.qty, 0) || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex justify-between p-6">
        <h2 className="text-lg font-semibold text-gray-800">Top Products</h2>
        <button className="text-sm text-gray-500 bg-gray-200 px-5 py-1">This Month</button>
      </div>
      <div className='border-b border-gray-200' />
      <div className="p-6">
        <div className="text-center mb-6">
          <p className="text-4xl font-bold text-gray-800">{totalQuantity}</p>
          <p className="text-sm text-gray-500">Total Units Sold</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            products?.map((product, index) => {
              const percentage = ((product.qty / totalQuantity) * 100).toFixed(1);
              return (
                <div key={product.name} className="flex items-center gap-4">
                  <div className="w-1/2">
                    <p className="text-sm font-medium text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.qty} units</p>
                  </div>
                  <div className="w-1/2 flex items-center gap-2">
                    <div className="flex-grow bg-gray-200 h-2 rounded-full">
                      <div 
                        className={'h-full rounded-full ' + (
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 
                          'bg-yellow-500'
                        )}
                        style={{ width: percentage + '%' }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12">{percentage}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TopProductsCard;
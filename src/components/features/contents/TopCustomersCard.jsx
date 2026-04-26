import React from 'react';
import { motion } from 'framer-motion';

const TopCustomersCard = ({ customers = [], loading = false }) => {
  const getTotalSpent = () => {
    return customers?.reduce((sum, customer) => sum + customer.total_spent, 0) || 0;
  };

  const getPercentage = (value) => {
    const total = getTotalSpent();
    return total ? ((value / total) * 100).toFixed(1) : 0;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-white  border border-gray-200 rounded-lg shadow-sm">
      <div className="flex justify-between p-6">
        <h2 className="text-lg font-semibold text-gray-800">Top Customers</h2>
        <div className="text-sm font-medium text-gray-600">
          Total Spent: PKR {getTotalSpent().toFixed(2)}
        </div>
      </div>
      
      <div className="border-b border-gray-200" />
      
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <motion.div 
          className="p-6 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {customers?.map((customer, index) => (
            <motion.div
              key={customer.name}
              variants={itemVariants}
              className="relative"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-100 text-yellow-600' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                    <p className="text-sm text-gray-500">{customer.order_count} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">PKR {customer.total_spent.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{getPercentage(customer.total_spent)}% of total</p>
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-3 mt-2">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-600">Most Ordered:</span>
                    <p className="font-medium text-gray-800">{customer.most_ordered_product}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600">Quantity:</span>
                    <p className="font-medium text-gray-800">{customer.product_qty} units</p>
                  </div>
                </div>
              </div>

              <div className="w-full h-1 bg-gray-100 rounded-full mt-3">
                <motion.div
                  className={`h-full rounded-full ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-500' :
                    'bg-orange-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${getPercentage(customer.total_spent)}%` }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};



export default TopCustomersCard;
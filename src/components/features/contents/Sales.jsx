import React from 'react';
import { motion } from 'framer-motion';

export default function Sales({ transactionData }) {
  const metrics = [
    {
      title: 'Total Transactions',
      value: transactionData?.['Total Transactions'] || 0,
      color: 'bg-blue-500',
      icon: '🛍️'
    },
    {
      title: 'Total Revenue',
      value: transactionData?.['Total Spend by Customers']?.toFixed(2) || '0.00',
      color: 'bg-green-500',
      prefix: 'PKR',
      icon: '💰'
    },
    {
      title: 'Average Spend',
      value: transactionData?.['Average Spend by Customers']?.toFixed(2) || '0.00',
      color: 'bg-purple-500',
      prefix: 'PKR',
      icon: '📊'
    },
    {
      title: 'Business Hours',
      value: transactionData?.['Total Business Hours'] || 0,
      color: 'bg-yellow-400',
      suffix: 'hrs',
      icon: '⏰'
    }
  ];

  const additionalMetrics = [
    {
      title: 'Customers with Discounts',
      value: transactionData?.['Customers Availed Discount'] || 0,
      color: 'bg-pink-500',
      icon: '🏷️'
    },
    {
      title: 'Total Discount Given',
      value: Math.abs(transactionData?.['Total Discount Given'] || 0).toFixed(2),
      color: 'bg-red-500',
      prefix: 'PKR',
      icon: '💯'
    },
    {
      title: 'Top Store',
      value: transactionData?.['Store with Highest Transactions'] || '-',
      subValue: `${transactionData?.['Transactions at that Store'] || 0} transactions`,
      color: 'bg-indigo-500',
      icon: '🏪'
    }
  ];

  return (
    <div className="bg-white overflow-hidden rounded-lg shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Transaction Overview</h2>
        
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, idx) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{metric.icon}</span>
                <span className={`w-2 h-2 rounded-full ${metric.color}`}></span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">{metric.title}</h3>
              <p className="text-2xl font-bold text-gray-800">
                {metric.prefix && <span className="text-sm font-normal mr-1">{metric.prefix}</span>}
                {metric.value}
                {metric.suffix && <span className="text-sm font-normal ml-1">{metric.suffix}</span>}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
          {additionalMetrics.map((metric, idx) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx + 4) * 0.1 }}
              className="bg-gray-50 p-6 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{metric.icon}</span>
                <span className={`w-2 h-2 rounded-full ${metric.color}`}></span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">{metric.title}</h3>
              <p className="text-2xl font-bold text-gray-800">
                {metric.prefix && <span className="text-sm font-normal mr-1">{metric.prefix}</span>}
                {metric.value}
              </p>
              {metric.subValue && (
                <p className="text-sm text-gray-500 mt-1">{metric.subValue}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TopProductsChart = ({ products = [], loading = false }) => {
  const data = {
    labels: products.map(product => product.name),
    datasets: [
      {
        label: 'Units Sold',
        data: products.map(product => product.qty),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Top Products by Units Sold' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Quantity' } },
    },
  };

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mt-4"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {loading ? (
        <div className="text-center text-gray-500">Loading chart...</div>
      ) : products.length > 0 ? (
        <Bar data={data} options={options} />
      ) : (
        <div className="text-center text-red-500">No data available for chart.</div>
      )}
    </motion.div>
  );
};

export default TopProductsChart;
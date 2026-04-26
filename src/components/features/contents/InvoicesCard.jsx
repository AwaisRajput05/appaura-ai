import React from 'react';
import Chart from 'react-apexcharts';

const InvoicesPieChart = () => {
  const options = {
    chart: {
      type: 'pie',
    },
    labels: ['Payment', 'Invoiced', 'Over Due'],
    colors: ['#bebdc9', '#6f9c8d', '#df9595'], // Purple, Green, Red
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: '#6b7280',
            }
          }
        }
      }
    }
  };

  const series = [900, 800, 700]; // Payment, Invoiced, Over Due amounts

  return (
    <div className="bg-white w-1/3">
      <h2 className="text-lg font-semibold p-6">Invoices</h2>
      <div className='border-b border-gray-200 mb-6' />
      <div className="flex justify-center mb-10">
        <div >
          <Chart
            options={options}
            series={series}
            type="pie"
            
          />
        </div>
      </div>
    </div>
  );
};

export default InvoicesPieChart;
import React from 'react';
import { Link } from 'react-router-dom';
import DoughnutChart from '../../charts/DoughnutChart';
import EditMenu from '../../components/DropdownEditMenu';

// Import utilities
import { tailwindConfig } from '../../utils/Utils';

function DealMultipleCard() {

  const chartData = {
    labels: ['2-3x', '3-4x', '4-5x', '5-6x', '6x+'],
    datasets: [
      {
        label: 'Deal Multiples',
        data: [35, 30, 20, 10, 5],
        backgroundColor: [
          tailwindConfig().theme.colors.violet[500],
          tailwindConfig().theme.colors.blue[500],
          tailwindConfig().theme.colors.green[500],
          tailwindConfig().theme.colors.yellow[500],
          tailwindConfig().theme.colors.red[500],
        ],
        hoverBackgroundColor: [
          tailwindConfig().theme.colors.violet[600],
          tailwindConfig().theme.colors.blue[600],
          tailwindConfig().theme.colors.green[600],
          tailwindConfig().theme.colors.yellow[600],
          tailwindConfig().theme.colors.red[600],
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Revenue Multiples</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="/deals/analytics">
                View Analytics
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Export Data
              </Link>
            </li>
          </EditMenu>
        </header>
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Average Multiple</div>
        <div className="flex items-start">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">3.2x</div>
          <div className="text-sm font-medium text-green-700 px-1.5 bg-green-500/20 rounded-full">+0.3x</div>
        </div>
      </div>
      <div className="grow flex items-center">
        <DoughnutChart data={chartData} width={128} height={128} />
      </div>
    </div>
  );
}

export default DealMultipleCard;
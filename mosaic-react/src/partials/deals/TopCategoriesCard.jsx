import React from 'react';
import { Link } from 'react-router-dom';
import BarChart from '../../charts/BarChart01';
import EditMenu from '../../components/DropdownEditMenu';

// Import utilities
import { tailwindConfig } from '../../utils/Utils';

function TopCategoriesCard() {

  const chartData = {
    labels: [
      'Home & Kitchen', 'Electronics', 'Beauty', 'Pet Supplies', 'Sports', 'Toys'
    ],
    datasets: [
      {
        label: 'Deals',
        data: [18, 15, 12, 9, 7, 5],
        backgroundColor: [
          tailwindConfig().theme.colors.violet[500],
          tailwindConfig().theme.colors.blue[500],
          tailwindConfig().theme.colors.green[500],
          tailwindConfig().theme.colors.yellow[500],
          tailwindConfig().theme.colors.red[500],
          tailwindConfig().theme.colors.indigo[500],
        ],
        hoverBackgroundColor: [
          tailwindConfig().theme.colors.violet[600],
          tailwindConfig().theme.colors.blue[600],
          tailwindConfig().theme.colors.green[600],
          tailwindConfig().theme.colors.yellow[600],
          tailwindConfig().theme.colors.red[600],
          tailwindConfig().theme.colors.indigo[600],
        ],
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Top Categories</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="/listings">
                Browse Listings
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="/deals/analytics">
                View Analytics
              </Link>
            </li>
          </EditMenu>
        </div>
      </header>
      <div className="px-5 py-3">
        <div className="flex items-start mb-4">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">66</div>
          <div className="text-sm font-medium text-green-700 px-1.5 bg-green-500/20 rounded-full">Active</div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Deals across categories</div>
      </div>
      <div className="grow">
        <BarChart data={chartData} width={389} height={220} />
      </div>
    </div>
  );
}

export default TopCategoriesCard;
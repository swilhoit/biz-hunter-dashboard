import React from 'react';
import { Link } from 'react-router-dom';
import EditMenu from '../../components/DropdownEditMenu';

function RecentDealsCard() {

  const deals = [
    {
      id: 1,
      business: 'Kitchen Gadgets Pro',
      category: 'Home & Kitchen',
      revenue: '$2.4M',
      multiple: '3.2x',
      stage: 'due-diligence',
      status: 'active'
    },
    {
      id: 2,
      business: 'Pet Supplies Direct',
      category: 'Pet Supplies',
      revenue: '$1.8M',
      multiple: '2.9x',
      stage: 'negotiation',
      status: 'active'
    },
    {
      id: 3,
      business: 'Outdoor Adventure Co',
      category: 'Sports & Outdoors',
      revenue: '$3.1M',
      multiple: '3.8x',
      stage: 'closing',
      status: 'hot'
    },
    {
      id: 4,
      business: 'Beauty Essentials',
      category: 'Beauty & Personal Care',
      revenue: '$920K',
      multiple: '2.5x',
      stage: 'initial-contact',
      status: 'new'
    },
    {
      id: 5,
      business: 'Tech Accessories Hub',
      category: 'Electronics',
      revenue: '$1.5M',
      multiple: '4.1x',
      stage: 'prospecting',
      status: 'cold'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'hot':
        return 'text-red-600 bg-red-100 dark:bg-red-500/20';
      case 'active':
        return 'text-green-600 bg-green-100 dark:bg-green-500/20';
      case 'new':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-500/20';
      case 'cold':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-500/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-500/20';
    }
  };

  return (
    <div className="col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Recent Deals</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="/deals">
                View All Deals
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
      <div className="p-3">
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20">
              <tr>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Business</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Category</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Revenue</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-center">Multiple</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-center">Status</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-center">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="p-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="font-medium text-gray-800 dark:text-gray-100">{deal.business}</div>
                    </div>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="text-left text-gray-600 dark:text-gray-300">{deal.category}</div>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="text-left font-medium text-gray-800 dark:text-gray-100">{deal.revenue}</div>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="text-center font-medium text-gray-800 dark:text-gray-100">{deal.multiple}</div>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deal.status)}`}>
                        {deal.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="text-center">
                      <Link 
                        className="text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" 
                        to={`/deals/${deal.id}`}
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RecentDealsCard;
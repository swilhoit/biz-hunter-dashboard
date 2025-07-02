import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon } from 'lucide-react';
import EditMenu from '../../components/DropdownEditMenu';
import { getFallbackImage } from '../../utils/imageUtils';
import { dbAdapter } from '../../lib/database-adapter';
import { useAuth } from '@/hooks/useAuth';

function RecentDealsCard() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRecentDeals();
    }
  }, [user]);

  const fetchRecentDeals = async () => {
    try {
      setLoading(true);
      const fetchedDeals = await dbAdapter.deals.fetchDeals();
      // Get the 5 most recent deals
      const recentDeals = fetchedDeals
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(deal => ({
          id: deal.id,
          business: deal.business_name || 'Unnamed Business',
          category: deal.category || 'Uncategorized',
          revenue: deal.annual_revenue ? `$${(deal.annual_revenue / 1000000).toFixed(1)}M` : 
                   deal.monthly_revenue ? `$${(deal.monthly_revenue * 12 / 1000000).toFixed(1)}M` : 'N/A',
          multiple: deal.asking_price && deal.annual_profit ? 
                    `${(deal.asking_price / deal.annual_profit).toFixed(1)}x` : 'N/A',
          stage: deal.status,
          status: getStatusLabel(deal.status),
          image_url: deal.image_url
        }));
      setDeals(recentDeals);
    } catch (error) {
      console.error('Error fetching recent deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'prospecting': 'new',
      'initial_contact': 'active',
      'loi_submitted': 'active',
      'due_diligence': 'hot',
      'negotiation': 'hot',
      'under_contract': 'hot',
      'closing': 'hot'
    };
    return statusMap[status] || 'cold';
  };

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
                  <div className="font-semibold text-left">Image</div>
                </th>
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
              {loading && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Loading deals...
                  </td>
                </tr>
              )}
              {!loading && deals.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No deals found. Create your first deal in the pipeline.
                  </td>
                </tr>
              )}
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="p-2 whitespace-nowrap">
                    <div className="w-10 h-10 flex-shrink-0">
                      {deal.image_url ? (
                        <img
                          src={deal.image_url}
                          alt={deal.business}
                          className="w-10 h-10 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = getFallbackImage();
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <Link 
                        to={`/deals/${deal.id}`}
                        className="font-medium text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {deal.business}
                      </Link>
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
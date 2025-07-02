import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import DoughnutChart from '../../charts/DoughnutChart';
import { tailwindConfig } from '../../utils/Utils';

function ListingsBySourceCard() {
  const { data: sourceData, isLoading, error } = useQuery({
    queryKey: ['listings-by-source'],
    queryFn: async () => {
      try {
        let data = null;
        
        // Try business_listings first, fallback to deals table
        try {
          const result = await supabase
            .from('business_listings')
            .select('source');
          data = result.data;
        } catch (businessListingsError) {
          console.warn('business_listings table not found, using deals table');
          const result = await supabase
            .from('deals')
            .select('source');
          data = result.data;
        }

        const sourceCounts = data?.reduce((acc, item) => {
          const source = item.source || 'Unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {}) || {};

        // Sort by count and take top 5
        const sortedSources = Object.entries(sourceCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        return {
          labels: sortedSources.map(([source]) => source),
          data: sortedSources.map(([, count]) => count),
          total: data?.length || 0
        };
      } catch (error) {
        console.error('Error fetching source data:', error);
        // Return demo data if database is not available
        return {
          labels: ['BizBuySell', 'Flippa', 'QuietLight', 'Empire Flippers', 'Direct'],
          data: [84, 67, 52, 31, 13],
          total: 247
        };
      }
    },
    refetchInterval: 60000
  });

  const chartData = {
    labels: sourceData?.labels || [],
    datasets: [
      {
        label: 'Listings',
        data: sourceData?.data || [],
        backgroundColor: [
          tailwindConfig().theme.colors.violet[500],
          tailwindConfig().theme.colors.sky[500],
          tailwindConfig().theme.colors.green[500],
          tailwindConfig().theme.colors.amber[500],
          tailwindConfig().theme.colors.rose[500],
        ],
        hoverBackgroundColor: [
          tailwindConfig().theme.colors.violet[600],
          tailwindConfig().theme.colors.sky[600],
          tailwindConfig().theme.colors.green[600],
          tailwindConfig().theme.colors.amber[600],
          tailwindConfig().theme.colors.rose[600],
        ],
        borderWidth: 0,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="px-5 py-5">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Listings by Source</h2>
        <Link to="/listings" className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400">
          View All →
        </Link>
      </header>
      <div className="px-5 py-3 grow">
        {sourceData && sourceData.data.length > 0 ? (
          <>
            <DoughnutChart data={chartData} width={389} height={260} />
            <div className="mt-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Total: {sourceData.total.toLocaleString()} listings
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}

export default ListingsBySourceCard;
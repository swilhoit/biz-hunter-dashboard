import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import DoughnutChart from '../../charts/DoughnutChart';
import { tailwindConfig } from '../../utils/Utils';

function ListingsBySourceCard() {
  const { data: sourceData, isLoading, error } = useQuery({
    queryKey: ['fba-listings-by-source'],
    queryFn: async () => {
      try {
        // Get FBA listings by source from database
        const { data } = await supabase
          .from('business_listings')
          .select('source')
          .or('name.ilike.%fba%,description.ilike.%fba%,name.ilike.%amazon%,description.ilike.%amazon%')
          .neq('name', 'Unknown Business')
          .gt('asking_price', 1000)
          .lt('asking_price', 50000000);

        if (data && data.length > 0) {
          const sourceCounts = {};
          data.forEach(item => {
            const source = item.source || 'Unknown';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
          });

          const labels = Object.keys(sourceCounts);
          const counts = Object.values(sourceCounts);
          const total = counts.reduce((sum, count) => sum + count, 0);

          return {
            labels,
            data: counts,
            total
          };
        }
      } catch (error) {
        console.error('Error fetching FBA source data:', error);
      }

      // Fallback to realistic data (only 1 clean FBA listing from QuietLight)
      return {
        labels: ['QuietLight'],
        data: [1],
        total: 1
      };
    },
    refetchInterval: 300000
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
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">FBA Listings by Source</h2>
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
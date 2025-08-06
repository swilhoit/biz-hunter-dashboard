import React, { useState, useEffect } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import OffMarketSellersTable from '../partials/off-market/OffMarketSellersTable';
import CrawlStatusCard from '../partials/off-market/CrawlStatusCard';
import ContactStatsCard from '../partials/off-market/ContactStatsCard';
import RevenueDistributionCard from '../partials/off-market/RevenueDistributionCard';
import PipelineControlsCard from '../partials/off-market/PipelineControlsCard';
import { supabase } from '../lib/supabase';

function OffMarketDeals() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState([]);
  const [stats, setStats] = useState({
    totalSellers: 0,
    whales: 0,
    withContacts: 0,
    avgRevenue: 0
  });
  const [filters, setFilters] = useState({
    minRevenue: 10000,
    hasContacts: false,
    isWhale: false,
    category: '',
    sortBy: 'total_est_revenue',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadOffMarketData();
  }, [filters]);

  const loadOffMarketData = async () => {
    try {
      setLoading(true);
      
      // Get sellers based on filters
      const { data: sellersData, error: sellersError } = await supabase
        .rpc('get_off_market_sellers', {
          min_revenue: filters.minRevenue,
          min_listings: 5,
          has_contacts: filters.hasContacts
        });

      if (sellersError) throw sellersError;

      let filteredSellers = sellersData || [];

      // Apply additional filters
      if (filters.isWhale) {
        filteredSellers = filteredSellers.filter(seller => seller.is_whale);
      }

      // Sort sellers
      filteredSellers.sort((a, b) => {
        const aValue = a[filters.sortBy] || 0;
        const bValue = b[filters.sortBy] || 0;
        return filters.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });

      setSellers(filteredSellers);

      // Calculate stats
      const totalSellers = filteredSellers.length;
      const whales = filteredSellers.filter(s => s.is_whale).length;
      const withContacts = filteredSellers.filter(s => s.email_contacts > 0 || s.phone_contacts > 0).length;
      const avgRevenue = totalSellers > 0 ? 
        filteredSellers.reduce((sum, s) => sum + (s.total_est_revenue || 0), 0) / totalSellers : 0;

      setStats({
        totalSellers,
        whales,
        withContacts,
        avgRevenue
      });

    } catch (error) {
      console.error('Error loading off-market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExportContacts = async (sellerIds) => {
    try {
      const { data: contacts, error } = await supabase
        .from('seller_contacts')
        .select(`
          seller_id,
          contact_type,
          contact_value,
          source,
          verified,
          sellers (
            seller_name,
            seller_url,
            total_est_revenue
          )
        `)
        .in('seller_id', sellerIds)
        .in('contact_type', ['email', 'phone']);

      if (error) throw error;

      // Convert to CSV and download
      const csvContent = convertContactsToCSV(contacts);
      downloadCSV(csvContent, 'off-market-contacts.csv');
    } catch (error) {
      console.error('Error exporting contacts:', error);
    }
  };

  const convertContactsToCSV = (contacts) => {
    const headers = ['Seller Name', 'Seller URL', 'Est Revenue', 'Contact Type', 'Contact Value', 'Source', 'Verified'];
    const rows = contacts.map(contact => [
      contact.sellers.seller_name || '',
      contact.sellers.seller_url || '',
      contact.sellers.total_est_revenue || 0,
      contact.contact_type || '',
      contact.contact_value || '',
      contact.source || '',
      contact.verified ? 'Yes' : 'No'
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Off-Market Deals</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Discover and connect with high-value Amazon sellers for potential acquisitions
                </p>
              </div>

              {/* Right: Actions */}
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                <button 
                  onClick={loadOffMarketData}
                  className="btn bg-blue-500 text-white hover:bg-blue-600"
                  disabled={loading}
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 16 16">
                    <path d="M8 0a8 8 0 0 1 8 8 1 1 0 1 1-2 0 6 6 0 1 0-6 6 1 1 0 1 1 0 2 8 8 0 1 1 0-16z"/>
                  </svg>
                  <span className="max-xs:sr-only">{loading ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
                <button 
                  onClick={() => handleExportContacts(sellers.map(s => s.seller_id))}
                  className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
                  disabled={sellers.length === 0}
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 16 16">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM3.82 8.5l2.12 2.12 1.06-1.06L6.18 8.74 3.82 8.5zm4.78.12L8 11.38l-.6-.76-1.2-1.5 1.06-1.06 2.12 2.12z"/>
                  </svg>
                  <span className="max-xs:sr-only">Export Contacts</span>
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 16 16">
                        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM3.82 8.5l2.12 2.12 1.06-1.06L6.18 8.74 3.82 8.5z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sellers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSellers.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 16 16">
                        <path d="M8 0L6.34 2.34 4 3.68l2.34 1.34L8 8l1.66-2.98L12 3.68 9.66 2.34 8 0z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Whale Sellers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.whales.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 16 16">
                        <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H7V7h2v6zm0-8H7V3h2v2z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">With Contacts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.withContacts.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 16 16">
                        <path d="M8.5 2.687c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-2.213.492V2.687zM7.5 12.433c.065-.531-1.119-.603-2.213-.492-1.18.118-2.369.46-3.287.81V3.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${Math.round(stats.avgRevenue).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-12 gap-6">
              
              {/* Pipeline Controls */}
              <PipelineControlsCard />
              
              {/* Crawl Status */}
              <CrawlStatusCard />
              
              {/* Contact Stats */}
              <ContactStatsCard />
              
              {/* Revenue Distribution */}
              <RevenueDistributionCard />

              {/* Sellers Table */}
              <OffMarketSellersTable 
                sellers={sellers}
                loading={loading}
                filters={filters}
                onFilterChange={handleFilterChange}
                onExportContacts={handleExportContacts}
              />

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default OffMarketDeals;
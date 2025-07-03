import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import Header from '../partials/Header';
import Sidebar from '../partials/Sidebar';
import { formatDistanceToNow } from 'date-fns';
import { DollarSign, TrendingUp, Package, Calendar, FileText, AlertCircle, Plus, Edit2, Trash2, Settings, Search, Filter, X } from 'lucide-react';

function Portfolio() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ownedBusinesses, setOwnedBusinesses] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalMetrics, setTotalMetrics] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalBusinesses: 0,
    avgGrowthRate: 0
  });
  
  // ASIN Management State
  const [activeTab, setActiveTab] = useState('businesses'); // 'businesses' or 'asins'
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showAddAsin, setShowAddAsin] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [portfolioAsins, setPortfolioAsins] = useState([]);
  
  // Form states
  const [portfolioForm, setPortfolioForm] = useState({ name: '', description: '' });
  const [asinForm, setAsinForm] = useState({
    asin: '',
    productName: '',
    brand: '',
    category: '',
    currentPrice: '',
    monthlyRevenue: '',
    monthlyProfit: '',
    monthlyUnitsSold: '',
    profitMargin: ''
  });

  // Get current user
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    getCurrentUser();
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchOwnedBusinesses(),
        fetchPortfolios()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnedBusinesses = async () => {
    const { data: deals, error } = await supabase
      .from('deals')
      .select('*')
      .eq('status', 'closed_won')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const metrics = deals.reduce((acc, deal) => {
      acc.totalRevenue += deal.annual_revenue || 0;
      acc.totalProfit += deal.annual_profit || 0;
      acc.totalBusinesses += 1;
      return acc;
    }, { totalRevenue: 0, totalProfit: 0, totalBusinesses: 0, avgGrowthRate: 0 });

    setTotalMetrics(metrics);
    setOwnedBusinesses(deals);
  };

  const fetchPortfolios = async () => {
    if (!user) return;
    
    const response = await fetch(`http://localhost:3001/api/portfolio/${user.id}`);
    const data = await response.json();
    
    if (data.success) {
      setPortfolios(data.data.portfolios);
      setPortfolioSummary(data.data.summary);
    } else {
      throw new Error(data.message);
    }
  };

  const fetchPortfolioAsins = async (portfolioId) => {
    const response = await fetch(`http://localhost:3001/api/portfolio/${portfolioId}/asins`);
    const data = await response.json();
    
    if (data.success) {
      setPortfolioAsins(data.data);
    } else {
      throw new Error(data.message);
    }
  };

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3001/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: portfolioForm.name,
          description: portfolioForm.description
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreatePortfolio(false);
        setPortfolioForm({ name: '', description: '' });
        fetchPortfolios();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error creating portfolio:', error);
      setError(error.message);
    }
  };

  const handleAddAsin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`http://localhost:3001/api/portfolio/${selectedPortfolio}/asins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          asin: asinForm.asin,
          productName: asinForm.productName,
          brand: asinForm.brand,
          category: asinForm.category,
          currentPrice: parseFloat(asinForm.currentPrice) || 0,
          monthlyRevenue: parseFloat(asinForm.monthlyRevenue) || 0,
          monthlyProfit: parseFloat(asinForm.monthlyProfit) || 0,
          monthlyUnitsSold: parseInt(asinForm.monthlyUnitsSold) || 0,
          profitMargin: parseFloat(asinForm.profitMargin) || 0
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowAddAsin(false);
        setAsinForm({
          asin: '',
          productName: '',
          brand: '',
          category: '',
          currentPrice: '',
          monthlyRevenue: '',
          monthlyProfit: '',
          monthlyUnitsSold: '',
          profitMargin: ''
        });
        fetchPortfolios();
        if (selectedPortfolio) {
          fetchPortfolioAsins(selectedPortfolio);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error adding ASIN:', error);
      setError(error.message);
    }
  };

  const handleDeleteAsin = async (asinId) => {
    if (!confirm('Are you sure you want to delete this ASIN?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/portfolio/asins/${asinId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchPortfolios();
        if (selectedPortfolio) {
          fetchPortfolioAsins(selectedPortfolio);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error deleting ASIN:', error);
      setError(error.message);
    }
  };

  const handlePortfolioClick = (portfolioId) => {
    setSelectedPortfolio(portfolioId);
    fetchPortfolioAsins(portfolioId);
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow flex items-center justify-center">
            <div className="animate-pulse">Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Portfolio</h1>
              <p className="text-gray-600 dark:text-gray-400">Track and manage your owned FBA businesses and ASINs</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('businesses')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'businesses'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Owned Businesses
                </button>
                <button
                  onClick={() => setActiveTab('asins')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'asins'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  ASIN Portfolio
                </button>
              </nav>
            </div>

            {activeTab === 'businesses' && (
              <>
                {/* Business Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          ${totalMetrics.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Profit</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          ${totalMetrics.totalProfit.toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Businesses</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {totalMetrics.totalBusinesses}
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Avg Profit Margin</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {totalMetrics.totalRevenue > 0 
                            ? ((totalMetrics.totalProfit / totalMetrics.totalRevenue) * 100).toFixed(1) 
                            : 0}%
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                </div>

                {/* Owned Businesses List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Owned Businesses</h2>
                  </div>
                  
                  {error ? (
                    <div className="p-8 text-center text-red-500">
                      Error: {error}
                    </div>
                  ) : ownedBusinesses.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No owned businesses yet.</p>
                      <p className="text-sm mt-2">Closed deals will appear here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Business Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Revenue
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Profit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Purchase Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {ownedBusinesses.map((business) => (
                            <tr key={business.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {business.business_name || 'Untitled Business'}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {business.amazon_category || 'Unknown Category'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  ${(business.annual_revenue || 0).toLocaleString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  ${(business.annual_profit || 0).toLocaleString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  {business.closed_at 
                                    ? new Date(business.closed_at).toLocaleDateString()
                                    : formatDistanceToNow(new Date(business.created_at), { addSuffix: true })
                                  }
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 px-2 py-1">
                                  Active
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link
                                  to={`/deal/${business.id}`}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'asins' && (
              <>
                {/* ASIN Portfolio Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Monthly Revenue</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          ${(portfolioSummary.total_monthly_revenue || 0).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Monthly Profit</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          ${(portfolioSummary.total_monthly_profit || 0).toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total ASINs</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {portfolioSummary.total_asins || 0}
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Avg Profit Margin</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {(portfolioSummary.avg_profit_margin || 0).toFixed(1)}%
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                </div>

                {/* Portfolio Management */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">ASIN Portfolios</h2>
                    <button
                      onClick={() => setShowCreatePortfolio(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Portfolio
                    </button>
                  </div>
                  
                  {portfolios.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No portfolios created yet.</p>
                      <p className="text-sm mt-2">Create your first portfolio to start tracking ASINs.</p>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {portfolios.map((portfolio) => (
                          <div 
                            key={portfolio.portfolio_id} 
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedPortfolio === portfolio.portfolio_id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => handlePortfolioClick(portfolio.portfolio_id)}
                          >
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                              {portfolio.portfolio_name}
                            </h3>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <p>{portfolio.total_asins || 0} ASINs</p>
                              <p>${(portfolio.total_monthly_revenue || 0).toLocaleString()} monthly revenue</p>
                              <p>${(portfolio.total_monthly_profit || 0).toLocaleString()} monthly profit</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Portfolio ASINs */}
                {selectedPortfolio && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Portfolio ASINs
                      </h3>
                      <button
                        onClick={() => setShowAddAsin(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add ASIN
                      </button>
                    </div>
                    
                    {portfolioAsins.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No ASINs in this portfolio yet.</p>
                        <p className="text-sm mt-2">Add ASINs to start tracking performance.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                ASIN
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Monthly Revenue
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Monthly Profit
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Profit Margin
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {portfolioAsins.map((asin) => (
                              <tr key={asin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {asin.asin}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {asin.product_name || 'Unnamed Product'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {asin.brand} • {asin.category}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-gray-100">
                                    ${(asin.monthly_revenue || 0).toLocaleString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-gray-100">
                                    ${(asin.monthly_profit || 0).toLocaleString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-gray-100">
                                    {(asin.profit_margin || 0).toFixed(1)}%
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => handleDeleteAsin(asin.id)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create Portfolio Modal */}
      {showCreatePortfolio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Create New Portfolio</h3>
              <button
                onClick={() => setShowCreatePortfolio(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePortfolio} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Portfolio Name
                </label>
                <input
                  type="text"
                  value={portfolioForm.name}
                  onChange={(e) => setPortfolioForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  rows="3"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePortfolio(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add ASIN Modal */}
      {showAddAsin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Add ASIN to Portfolio</h3>
              <button
                onClick={() => setShowAddAsin(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddAsin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ASIN
                  </label>
                  <input
                    type="text"
                    value={asinForm.asin}
                    onChange={(e) => setAsinForm(prev => ({ ...prev, asin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={asinForm.productName}
                    onChange={(e) => setAsinForm(prev => ({ ...prev, productName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={asinForm.brand}
                    onChange={(e) => setAsinForm(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={asinForm.category}
                    onChange={(e) => setAsinForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={asinForm.currentPrice}
                    onChange={(e) => setAsinForm(prev => ({ ...prev, currentPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Revenue ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={asinForm.monthlyRevenue}
                    onChange={(e) => setAsinForm(prev => ({ ...prev, monthlyRevenue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Profit ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={asinForm.monthlyProfit}
                    onChange={(e) => setAsinForm(prev => ({ ...prev, monthlyProfit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Units Sold
                  </label>
                  <input
                    type="number"
                    value={asinForm.monthlyUnitsSold}
                    onChange={(e) => setAsinForm(prev => ({ ...prev, monthlyUnitsSold: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profit Margin (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={asinForm.profitMargin}
                    onChange={(e) => setAsinForm(prev => ({ ...prev, profitMargin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddAsin(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add ASIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Portfolio;
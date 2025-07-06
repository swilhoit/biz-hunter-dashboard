import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import Header from '../partials/Header';
import Sidebar from '../partials/Sidebar';
import BrandCard from '../components/portfolio/BrandCard';
import AddBrandModal from '../components/portfolio/AddBrandModal';
import BulkImportModal from '../components/portfolio/BulkImportModal';
import { formatDistanceToNow } from 'date-fns';
import { 
  DollarSign, TrendingUp, Package, Calendar, FileText, AlertCircle, 
  Plus, Edit2, Trash2, Settings, Search, Filter, X, Building2,
  Upload, ChevronDown, BarChart3, Download, Grid3X3
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

function EnhancedPortfolio() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Portfolio state
  const [ownedBusinesses, setOwnedBusinesses] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [brands, setBrands] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState({});
  const [brandSummary, setBrandSummary] = useState({});
  
  // UI state
  const [activeTab, setActiveTab] = useState('brands'); // 'businesses', 'portfolios', 'brands'
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [brandAsins, setBrandAsins] = useState([]);
  const [portfolioAsins, setPortfolioAsins] = useState([]);
  
  // Modal states
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddAsin, setShowAddAsin] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  
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
  
  // Total metrics
  const [totalMetrics, setTotalMetrics] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalBusinesses: 0,
    avgGrowthRate: 0,
    totalBrands: 0,
    totalASINs: 0,
    avgProfitMargin: 0
  });

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
        fetchPortfolios(),
        fetchBrands()
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
      .eq('stage', 'closed_won')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const metrics = deals.reduce((acc, deal) => {
      acc.totalRevenue += deal.annual_revenue || 0;
      acc.totalProfit += deal.annual_profit || 0;
      acc.totalBusinesses += 1;
      return acc;
    }, { totalRevenue: 0, totalProfit: 0, totalBusinesses: 0, avgGrowthRate: 0 });

    setTotalMetrics(prev => ({ ...prev, ...metrics }));
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

  const fetchBrands = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/brands/${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setBrands(data.data);
        
        // Calculate brand summary
        const summary = data.data.reduce((acc, brand) => {
          acc.totalBrands += 1;
          acc.totalASINs += brand.total_asins || 0;
          acc.totalRevenue += parseFloat(brand.total_monthly_revenue) || 0;
          acc.totalProfit += parseFloat(brand.total_monthly_profit) || 0;
          return acc;
        }, { totalBrands: 0, totalASINs: 0, totalRevenue: 0, totalProfit: 0 });
        
        setBrandSummary(summary);
        setTotalMetrics(prev => ({ 
          ...prev, 
          totalBrands: summary.totalBrands,
          totalASINs: summary.totalASINs
        }));
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchBrandAsins = async (brandId) => {
    const response = await fetch(`http://localhost:3001/api/brands/${brandId}/asins`);
    const data = await response.json();
    
    if (data.success) {
      setBrandAsins(data.data);
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

  const handleCreateBrand = async (brandData) => {
    try {
      const response = await fetch('http://localhost:3001/api/brands', {
        method: editingBrand ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...brandData,
          userId: user.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowAddBrand(false);
        setEditingBrand(null);
        fetchBrands();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error saving brand:', error);
      setError(error.message);
    }
  };

  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setShowAddBrand(true);
  };

  const handleDeleteBrand = async (brandId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/brands/${brandId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchBrands();
        if (selectedBrand === brandId) {
          setSelectedBrand(null);
          setBrandAsins([]);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      setError(error.message);
    }
  };

  const handleBrandClick = (brandId) => {
    setSelectedBrand(brandId);
    fetchBrandAsins(brandId);
  };

  const handleBulkImport = async (asins) => {
    try {
      const response = await fetch('http://localhost:3001/api/asins/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          asins: asins.map(asin => ({
            ...asin,
            brand_id: selectedBrand,
            portfolio_id: selectedPortfolio
          }))
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh data
        fetchBrands();
        if (selectedBrand) {
          fetchBrandAsins(selectedBrand);
        }
        if (selectedPortfolio) {
          fetchPortfolioAsins(selectedPortfolio);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error bulk importing ASINs:', error);
      throw error;
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
        fetchBrands();
        if (selectedBrand) {
          fetchBrandAsins(selectedBrand);
        }
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

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
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
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Portfolio Management</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your FBA businesses, brands, and product portfolios</p>
            </div>

            {/* Overall Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {formatCurrency(totalMetrics.totalRevenue + brandSummary.totalRevenue)}
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
                      {formatCurrency(totalMetrics.totalProfit + brandSummary.totalProfit)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Brands</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {totalMetrics.totalBrands}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total ASINs</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {totalMetrics.totalASINs}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="brands" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Brands
                </TabsTrigger>
                <TabsTrigger value="portfolios" className="flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  Portfolios
                </TabsTrigger>
                <TabsTrigger value="businesses" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Owned Businesses
                </TabsTrigger>
              </TabsList>

              {/* Brands Tab */}
              <TabsContent value="brands" className="mt-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Brand Management</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowBulkImport(true)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Bulk Import
                      </button>
                      <button
                        onClick={() => setShowAddBrand(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Brand
                      </button>
                    </div>
                  </div>

                  {/* Brands Grid */}
                  {brands.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                      <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400">No brands created yet.</p>
                      <p className="text-sm text-gray-400 mt-2">Create your first brand to start organizing your ASINs.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {brands.map((brand) => (
                        <BrandCard
                          key={brand.brand_id}
                          brand={{
                            id: brand.brand_id,
                            name: brand.brand_name,
                            logo_url: brand.logo_url,
                            description: brand.description,
                            website_url: brand.website_url,
                            amazon_store_url: brand.amazon_store_url,
                            total_asins: brand.total_asins,
                            total_monthly_revenue: brand.total_monthly_revenue,
                            total_monthly_profit: brand.total_monthly_profit,
                            avg_profit_margin: brand.avg_profit_margin
                          }}
                          onEdit={handleEditBrand}
                          onDelete={handleDeleteBrand}
                          onClick={handleBrandClick}
                          isSelected={selectedBrand === brand.brand_id}
                        />
                      ))}
                    </div>
                  )}

                  {/* Selected Brand ASINs */}
                  {selectedBrand && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          Brand ASINs
                        </h3>
                        <button
                          onClick={() => setShowAddAsin(true)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add ASIN
                        </button>
                      </div>
                      
                      {brandAsins.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>No ASINs in this brand yet.</p>
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
                                  Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Profit
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {brandAsins.map((asin) => (
                                <tr key={asin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {asin.asin}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {asin.product_name || 'Unnamed Product'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {asin.category || 'Uncategorized'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {formatCurrency(asin.monthly_revenue)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {formatCurrency(asin.monthly_profit)}
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
                </div>
              </TabsContent>

              {/* Portfolios Tab - Keep existing functionality */}
              <TabsContent value="portfolios" className="mt-6">
                {/* Copy existing portfolio content from Portfolio.jsx */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">ASIN Portfolios</h2>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-500 dark:text-gray-400">Portfolio management content here...</p>
                  </div>
                </div>
              </TabsContent>

              {/* Businesses Tab - Keep existing functionality */}
              <TabsContent value="businesses" className="mt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Owned Businesses</h2>
                  </div>
                  
                  {ownedBusinesses.length === 0 ? (
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
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {ownedBusinesses.map((business) => (
                            <tr key={business.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {business.business_name || 'Untitled Business'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  {formatCurrency(business.annual_revenue)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  {formatCurrency(business.annual_profit)}
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
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddBrandModal
        isOpen={showAddBrand}
        onClose={() => {
          setShowAddBrand(false);
          setEditingBrand(null);
        }}
        onSave={handleCreateBrand}
        brand={editingBrand}
      />

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImport={handleBulkImport}
        brandId={selectedBrand}
        portfolioId={selectedPortfolio}
      />
    </div>
  );
}

export default EnhancedPortfolio;
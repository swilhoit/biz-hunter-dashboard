import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
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

function Portfolio() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Portfolio state
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandAsins, setBrandAsins] = useState([]);
  
  // Modal states
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddAsin, setShowAddAsin] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  
  // Form state for adding individual ASINs
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
  
  // Summary metrics
  const [summary, setSummary] = useState({
    totalBrands: 0,
    totalASINs: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgProfitMargin: 0
  });

  useEffect(() => {
    getCurrentUser();
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchBrands();
    }
  }, [user]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchBrands = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/brands/${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setBrands(data.data);
        
        // Calculate summary metrics
        const summary = data.data.reduce((acc, brand) => {
          acc.totalBrands += 1;
          acc.totalASINs += brand.total_asins || 0;
          acc.totalRevenue += parseFloat(brand.total_monthly_revenue) || 0;
          acc.totalProfit += parseFloat(brand.total_monthly_profit) || 0;
          return acc;
        }, { totalBrands: 0, totalASINs: 0, totalRevenue: 0, totalProfit: 0 });
        
        summary.avgProfitMargin = summary.totalRevenue > 0 
          ? (summary.totalProfit / summary.totalRevenue) * 100 
          : 0;
        
        setSummary(summary);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandAsins = async (brandId) => {
    try {
      const response = await fetch(`http://localhost:3002/api/brands/${brandId}/asins`);
      const data = await response.json();
      
      if (data.success) {
        setBrandAsins(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching brand ASINs:', error);
      setError(error.message);
    }
  };

  const handleCreateBrand = async (brandData) => {
    try {
      const url = editingBrand 
        ? `http://localhost:3002/api/brands/${editingBrand.id}`
        : 'http://localhost:3002/api/brands';
        
      const response = await fetch(url, {
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
    setEditingBrand({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      logo_url: brand.logo_url,
      website_url: brand.website_url,
      amazon_store_url: brand.amazon_store_url
    });
    setShowAddBrand(true);
  };

  const handleDeleteBrand = async (brandId) => {
    try {
      const response = await fetch(`http://localhost:3002/api/brands/${brandId}`, {
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

  const handleAddAsin = async (e) => {
    e.preventDefault();
    
    if (!selectedBrand) {
      setError('Please select a brand first');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3002/api/portfolio/0/asins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          brand_id: selectedBrand,
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
        fetchBrands();
        fetchBrandAsins(selectedBrand);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error adding ASIN:', error);
      setError(error.message);
    }
  };

  const handleBulkImport = async (asins) => {
    try {
      const response = await fetch('http://localhost:3002/api/asins/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          asins: asins.map(asin => ({
            ...asin,
            brand_id: selectedBrand
          }))
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchBrands();
        if (selectedBrand) {
          fetchBrandAsins(selectedBrand);
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
      const response = await fetch(`http://localhost:3002/api/portfolio/asins/${asinId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchBrands();
        fetchBrandAsins(selectedBrand);
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
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Brand Portfolio</h1>
              <p className="text-gray-600 dark:text-gray-400">Organize and track your products by brand</p>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Brands</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {summary.totalBrands}
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
                      {summary.totalASINs}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {formatCurrency(summary.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Monthly Profit</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {formatCurrency(summary.totalProfit)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Avg Margin</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {summary.avgProfitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Your Brands</h2>
              <button
                onClick={() => setShowAddBrand(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Brand
              </button>
            </div>

            {/* Brands Grid */}
            {brands.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No brands yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first brand to start organizing your product portfolio</p>
                <button
                  onClick={() => setShowAddBrand(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Brand
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

                {/* Selected Brand ASINs */}
                {selectedBrand && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {brands.find(b => b.brand_id === selectedBrand)?.brand_name} Products
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowBulkImport(true)}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Bulk Import
                        </button>
                        <button
                          onClick={() => setShowAddAsin(true)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Product
                        </button>
                      </div>
                    </div>
                    
                    {brandAsins.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No products in this brand yet.</p>
                        <p className="text-sm mt-2">Add products to start tracking performance.</p>
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
                                Product Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Monthly Revenue
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Monthly Profit
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Margin
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
                                    ${asin.current_price || 0}
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
      />

      {/* Add ASIN Modal */}
      {showAddAsin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Add Product to Brand</h3>
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
                    ASIN *
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
                  Add Product
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
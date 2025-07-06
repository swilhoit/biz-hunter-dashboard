import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import BrandOverview from '../partials/brands/BrandOverview';
import BrandFinancials from '../partials/brands/BrandFinancials';
import BrandProducts from '../partials/brands/BrandProducts';
import BrandPerformance from '../partials/brands/BrandPerformance';
import BrandAnalytics from '../partials/brands/BrandAnalytics';
import BrandNotes from '../partials/brands/BrandNotes';
import AddBrandModal from '../components/portfolio/AddBrandModal';
import BulkImportModal from '../components/portfolio/BulkImportModal';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Edit2, Trash2, Download, Upload, Plus, 
  Building2, Package, DollarSign, TrendingUp, BarChart3,
  Calendar, ExternalLink, AlertCircle
} from 'lucide-react';

function BrandDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [brand, setBrand] = useState(null);
  const [brandAsins, setBrandAsins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [user, setUser] = useState(null);
  
  // Summary metrics
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    avgMargin: 0,
    totalUnits: 0,
    performanceTrend: 'stable'
  });

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (id && user) {
      loadBrandData(id);
    }
  }, [id, user]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadBrandData = async (brandId) => {
    try {
      setLoading(true);
      
      // Fetch brand details from the view
      const { data: brandData, error: brandError } = await supabase
        .from('brand_metrics')
        .select('*')
        .eq('brand_id', brandId)
        .single();

      if (brandError) throw brandError;

      if (brandData) {
        setBrand(brandData);
        
        // Calculate metrics
        setMetrics({
          totalRevenue: brandData.total_monthly_revenue || 0,
          totalProfit: brandData.total_monthly_profit || 0,
          avgMargin: brandData.avg_profit_margin || 0,
          totalUnits: brandData.total_monthly_units || 0,
          performanceTrend: calculateTrend(brandData)
        });
        
        // Fetch ASINs
        await loadBrandAsins(brandId);
      } else {
        setError('Brand not found');
        navigate('/portfolio');
      }
    } catch (err) {
      console.error('Error loading brand:', err);
      setError(err.message || 'Failed to load brand');
    } finally {
      setLoading(false);
    }
  };

  const loadBrandAsins = async (brandId) => {
    try {
      const { data: asins, error } = await supabase
        .from('user_asins')
        .select('*')
        .eq('brand_id', brandId)
        .order('monthly_revenue', { ascending: false });

      if (error) throw error;
      setBrandAsins(asins || []);
    } catch (err) {
      console.error('Error loading brand ASINs:', err);
    }
  };

  const calculateTrend = (brandData) => {
    // This would normally calculate based on historical data
    // For now, return based on simple logic
    if (brandData.total_monthly_revenue > 100000) return 'growing';
    if (brandData.total_monthly_revenue > 50000) return 'stable';
    return 'declining';
  };

  const handleEdit = async (updates) => {
    if (!brand) return;
    try {
      const response = await fetch(`http://localhost:3001/api/brands/${brand.brand_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadBrandData(brand.brand_id);
        setIsEditing(false);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to update brand');
    }
  };

  const handleDelete = async () => {
    if (!brand) return;
    if (confirm('Are you sure you want to delete this brand? The ASINs will remain but will be unlinked from this brand.')) {
      try {
        const response = await fetch(`http://localhost:3001/api/brands/${brand.brand_id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
          navigate('/portfolio');
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        setError(err.message || 'Failed to delete brand');
      }
    }
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
            brand_id: brand.brand_id
          }))
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadBrandData(brand.brand_id);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error bulk importing ASINs:', error);
      throw error;
    }
  };

  const exportBrandData = () => {
    // Create CSV content
    const headers = ['ASIN', 'Product Name', 'Category', 'Monthly Revenue', 'Monthly Profit', 'Units Sold', 'Profit Margin'];
    const rows = brandAsins.map(asin => [
      asin.asin,
      asin.product_name || '',
      asin.category || '',
      asin.monthly_revenue || 0,
      asin.monthly_profit || 0,
      asin.monthly_units_sold || 0,
      asin.profit_margin || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brand.brand_name.replace(/\s+/g, '_')}_products.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'growing':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining':
        return <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow flex items-center justify-center">
            <div className="animate-pulse">Loading brand details...</div>
          </main>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Brand not found</p>
              <button
                onClick={() => navigate('/portfolio')}
                className="mt-4 text-indigo-600 hover:text-indigo-700"
              >
                Back to Portfolio
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/portfolio')}
                className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Portfolio
              </button>
              
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  {brand.logo_url ? (
                    <img 
                      src={brand.logo_url} 
                      alt={brand.brand_name} 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold flex items-center">
                      {brand.brand_name}
                      {metrics.performanceTrend && (
                        <span className="ml-3">{getTrendIcon(metrics.performanceTrend)}</span>
                      )}
                    </h1>
                    {brand.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{brand.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      {brand.website_url && (
                        <a
                          href={brand.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Website
                        </a>
                      )}
                      {brand.amazon_store_url && (
                        <a
                          href={brand.amazon_store_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Amazon Store
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportBrandData}
                    className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                  <button
                    onClick={() => setShowBulkImport(true)}
                    className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import ASINs
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-red-500 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                      {brand.total_asins || 0}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                      {formatCurrency(metrics.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Profit</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                      {formatCurrency(metrics.totalProfit)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Margin</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                      {metrics.avgMargin.toFixed(1)}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-indigo-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                      {brand.avg_rating ? brand.avg_rating.toFixed(1) : '0.0'}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
              <div className="border-b border-gray-200 dark:border-gray-700/60">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { id: 'overview', name: 'Overview', icon: Building2 },
                    { id: 'products', name: 'Products', icon: Package },
                    { id: 'financials', name: 'Financials', icon: DollarSign },
                    { id: 'performance', name: 'Performance', icon: TrendingUp },
                    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
                    { id: 'notes', name: 'Notes', icon: Calendar }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                        ${activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }
                      `}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {activeTab === 'overview' && (
                  <BrandOverview brand={brand} asins={brandAsins} />
                )}
                {activeTab === 'products' && (
                  <BrandProducts 
                    brand={brand} 
                    asins={brandAsins} 
                    onRefresh={() => loadBrandData(brand.brand_id)}
                  />
                )}
                {activeTab === 'financials' && (
                  <BrandFinancials brand={brand} asins={brandAsins} />
                )}
                {activeTab === 'performance' && (
                  <BrandPerformance brandId={brand.brand_id} />
                )}
                {activeTab === 'analytics' && (
                  <BrandAnalytics brand={brand} asins={brandAsins} />
                )}
                {activeTab === 'notes' && (
                  <BrandNotes brandId={brand.brand_id} />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddBrandModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleEdit}
        brand={{
          id: brand.brand_id,
          name: brand.brand_name,
          description: brand.description,
          logo_url: brand.logo_url,
          website_url: brand.website_url,
          amazon_store_url: brand.amazon_store_url
        }}
      />

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImport={handleBulkImport}
        brandId={brand.brand_id}
      />
    </div>
  );
}

export default BrandDetails;
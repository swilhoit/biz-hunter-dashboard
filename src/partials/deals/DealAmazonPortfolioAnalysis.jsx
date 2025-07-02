import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription, Progress } from '../../components/SimpleCard';
import { Loader2, Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import AmazonAnalyticsService from '../../services/AmazonAnalyticsService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const DealAmazonPortfolioAnalysis = ({ deal }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [analyticsService] = useState(() => new AmazonAnalyticsService());

  const analyzeStorePortfolio = async () => {
    if (!deal?.amazon_store_url && !deal?.amazon_store_name) {
      setError('No Amazon store information available for this deal');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let portfolioAnalysis = null;

      // Try store URL first, then fallback to store name search
      if (deal.amazon_store_url) {
        const storeAnalysis = await analyticsService.analyzeStoreByUrl(deal.amazon_store_url);
        if (storeAnalysis) {
          portfolioAnalysis = await analyticsService.analyzeProductPortfolio(storeAnalysis.products);
        }
      }

      // Fallback to searching by store name or category
      if (!portfolioAnalysis && deal.amazon_store_name) {
        const products = await analyticsService.searchProductsByKeywords([deal.amazon_store_name]);
        if (products.length > 0) {
          portfolioAnalysis = await analyticsService.analyzeProductPortfolio(products);
        }
      }

      // Final fallback to category search
      if (!portfolioAnalysis && deal.amazon_category) {
        const products = await analyticsService.searchProductsByKeywords([deal.amazon_category]);
        if (products.length > 0) {
          portfolioAnalysis = await analyticsService.analyzeProductPortfolio(products.slice(0, 20)); // Limit to 20 for demo
        }
      }

      if (!portfolioAnalysis) {
        throw new Error('Unable to analyze store portfolio. Try the manual Amazon Portfolio Analyzer for more options.');
      }

      setAnalysis(portfolioAnalysis);
    } catch (err) {
      console.error('Error analyzing portfolio:', err);
      setError(err.message || 'Failed to analyze Amazon portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-analyze if we have store information
    if (deal?.amazon_store_url || deal?.amazon_store_name) {
      analyzeStorePortfolio();
    }
  }, [deal]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <CheckCircle className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Amazon Portfolio Analysis</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                AI-powered analysis of the seller's Amazon product portfolio
              </p>
            </div>
            <Button 
              onClick={analyzeStorePortfolio} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Store Name</p>
              <p className="font-semibold">{deal?.amazon_store_name || 'Unknown'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
              <p className="font-semibold">{deal?.amazon_category || 'Unknown'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">FBA %</p>
              <p className="font-semibold">{deal?.fba_percentage || 0}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Account Health</p>
              <Badge variant={deal?.seller_account_health === 'Excellent' ? 'success' : 'warning'}>
                {deal?.seller_account_health || 'Unknown'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button 
                onClick={() => window.open('/deals/amazon-portfolio', '_blank')} 
                variant="outline" 
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Open Portfolio Analyzer
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Analyzing Amazon portfolio...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Products Found</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analysis.segments.reduce((total, segment) => total + segment.products.length, 0)}
                    </p>
                  </div>
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Est. Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(analysis.segments.reduce((total, segment) => total + segment.totalRevenue, 0))}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Segments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analysis.segments.length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Score</p>
                    <div className="flex items-center space-x-2">
                      <p className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore}/100
                      </p>
                      {getScoreIcon(analysis.overallScore)}
                    </div>
                  </div>
                  <div className="w-full max-w-16">
                    <Progress value={analysis.overallScore} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Segments */}
          <Card>
            <CardHeader>
              <CardTitle>Product Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analysis.segments.map(segment => ({
                          name: segment.name.length > 20 ? segment.name.substring(0, 20) + '...' : segment.name,
                          value: segment.products.length,
                          revenue: segment.totalRevenue
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analysis.segments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {analysis.segments.slice(0, 6).map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium text-sm">{segment.name}</p>
                          <p className="text-xs text-gray-600">
                            {segment.products.length} products • {formatCurrency(segment.totalRevenue)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {segment.marketShare.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.topPerformers.slice(0, 3).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {product.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          ASIN: {product.asin} • {product.brand || 'Unknown Brand'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatNumber(product.sales)} units
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>Risk Factors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.riskFactors.slice(0, 4).map((risk, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="flex-shrink-0 w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{risk}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Opportunities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.opportunities.slice(0, 4).map((opportunity, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="flex-shrink-0 w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{opportunity}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <Button 
                  onClick={() => window.open('/deals/amazon-portfolio', '_blank')}
                  className="flex-1"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Full Portfolio Analysis
                </Button>
                <Button 
                  onClick={analyzeStorePortfolio}
                  variant="outline"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DealAmazonPortfolioAnalysis;
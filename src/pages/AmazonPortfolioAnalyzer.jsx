import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  Label, 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger, 
  Badge, 
  Alert, 
  AlertDescription, 
  Progress 
} from '../components/SimpleCard';
import { Loader2, Search, Upload, FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import AmazonAnalyticsService from '../services/AmazonAnalyticsService';
import DocumentASINExtractor from '../components/DocumentASINExtractor';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const AmazonPortfolioAnalyzer = () => {
  const [loading, setLoading] = useState(false);
  const [inputMethod, setInputMethod] = useState('asins');
  const [asinInput, setAsinInput] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [analyticsService] = useState(() => new AmazonAnalyticsService());

  // Handle ASINs extracted from document
  const handleASINsExtracted = (asins) => {
    setAsinInput(asins.join(', '));
    setInputMethod('asins');
  };

  const handleAnalyzeASINs = async () => {
    if (!asinInput.trim()) {
      setError('Please enter at least one ASIN');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const asins = asinInput.split(/[,\n\s]+/).filter(asin => asin.trim().length === 10);
      
      if (asins.length === 0) {
        throw new Error('No valid ASINs found. ASINs should be 10 characters long.');
      }

      const products = await analyticsService.fetchProductsByASINs(asins);
      
      if (products.length === 0) {
        throw new Error('No product data found for the provided ASINs');
      }

      const portfolioAnalysis = await analyticsService.analyzeProductPortfolio(products);
      setAnalysis(portfolioAnalysis);
    } catch (err) {
      console.error('Error analyzing ASINs:', err);
      setError(err.message || 'Failed to analyze ASINs');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeStore = async () => {
    if (!storeUrl.trim()) {
      setError('Please enter a store URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const storeAnalysis = await analyticsService.analyzeStoreByUrl(storeUrl);
      
      if (!storeAnalysis) {
        throw new Error('Could not analyze store. Please check the URL or try manual ASIN input.');
      }

      const portfolioAnalysis = await analyticsService.analyzeProductPortfolio(storeAnalysis.products);
      setAnalysis(portfolioAnalysis);
    } catch (err) {
      console.error('Error analyzing store:', err);
      setError(err.message || 'Failed to analyze store');
    } finally {
      setLoading(false);
    }
  };


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
    <div className="p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Amazon Portfolio Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze Amazon seller portfolios using ASINs, store URLs, or business documents
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={inputMethod} onValueChange={setInputMethod}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="asins">
                  <Search className="h-4 w-4 mr-2" />
                  ASINs
                </TabsTrigger>
                <TabsTrigger value="store">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Store URL
                </TabsTrigger>
                <TabsTrigger value="document">
                  <FileText className="h-4 w-4 mr-2" />
                  Document
                </TabsTrigger>
              </TabsList>

              <TabsContent value="asins" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="asin-input">Enter ASINs (comma or line separated)</Label>
                  <textarea
                    id="asin-input"
                    placeholder="B08N5WRWNW, B07XJ8C8F5, B09ABC123D..."
                    value={asinInput}
                    onChange={(e) => setAsinInput(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <Button onClick={handleAnalyzeASINs} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Analyze ASINs
                </Button>
              </TabsContent>

              <TabsContent value="store" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-url">Amazon Store URL</Label>
                  <Input
                    id="store-url"
                    placeholder="https://www.amazon.com/stores/BrandName/..."
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                  />
                </div>
                <Button onClick={handleAnalyzeStore} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Analyze Store
                </Button>
              </TabsContent>

              <TabsContent value="document" className="space-y-4">
                <DocumentASINExtractor onASINsExtracted={handleASINsExtracted} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analysis.segments.reduce((total, segment) => total + segment.products.length, 0)}
                      </p>
                    </div>
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(analysis.segments.reduce((total, segment) => total + segment.totalRevenue, 0))}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Market Segments</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analysis.segments.length}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Portfolio Score</p>
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
                <CardTitle>Market Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analysis.segments.map(segment => ({
                            name: segment.name,
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
                  <div className="space-y-4">
                    {analysis.segments.map((segment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium">{segment.name}</p>
                            <p className="text-sm text-gray-600">
                              {segment.products.length} products • {formatCurrency(segment.totalRevenue)} revenue
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
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
                <div className="space-y-4">
                  {analysis.topPerformers.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                            #{index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {product.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ASIN: {product.asin} • {product.brand || 'Unknown Brand'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(product.revenue)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatNumber(product.sales)} units
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Factors & Opportunities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span>Risk Factors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2" />
                        <p className="text-gray-700 dark:text-gray-300">{risk}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Opportunities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.opportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2" />
                        <p className="text-gray-700 dark:text-gray-300">{opportunity}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmazonPortfolioAnalyzer;
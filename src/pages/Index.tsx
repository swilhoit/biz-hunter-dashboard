import { useState } from "react";
import Navigation from "@/components/Navigation";
import { BusinessCard } from "@/components/BusinessCard";
import { BusinessTable } from "@/components/BusinessTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MultiSelect } from "@/components/MultiSelect";
import { useBusinessListingsWithSavedStatus } from "@/hooks/useBusinessListings";
import { useAuth } from "@/hooks/useAuth";
import { AdminClear } from "@/components/AdminClear";
import { ScraperManagement } from "@/components/ScraperManagement";
import { SourceFilter } from "@/components/SourceFilter";
import { SaveListingDebug } from "@/components/SaveListingDebug";
import { SaveTestButton } from "@/components/SaveTestButton";
import { ToastTest } from "@/components/ToastTest";
import { UserDashboard } from "@/components/UserDashboard";
import { Search, Filter, SlidersHorizontal, Grid2X2, List, Settings, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { useScrapingStatus } from "@/hooks/useScrapingStatus";
import { useIntegratedScraping } from "@/hooks/useIntegratedScraping";

const Index = () => {
  const { user } = useAuth();
  const { data: listings = [], isLoading, error } = useBusinessListingsWithSavedStatus(user?.id);
  const scrapingStatus = useScrapingStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [revenueRange, setRevenueRange] = useState([0, 5000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showScraperPanel, setShowScraperPanel] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [isScrapingReal, setIsScrapingReal] = useState(false);
  const [scrapingResult, setScrapingResult] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearResult, setClearResult] = useState<string | null>(null);

  // Get unique industries and sources from listings
  const uniqueIndustries = [...new Set(listings.map(listing => listing.industry))];
  const uniqueSources = [...new Set(listings.map(listing => listing.source))];
  
  // Source filtering
  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };
  
  // Get listing counts by source
  const sourceListingCounts = listings.reduce((acc, listing) => {
    acc[listing.source] = (acc[listing.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter listings based on search and filters
  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = selectedIndustries.length === 0 || 
                           selectedIndustries.includes(listing.industry);
    
    const matchesSource = selectedSources.length === 0 ||
                         selectedSources.includes(listing.source);
    
    const matchesPrice = listing.asking_price >= priceRange[0] && 
                        listing.asking_price <= priceRange[1];
    
    const matchesRevenue = listing.annual_revenue >= revenueRange[0] && 
                          listing.annual_revenue <= revenueRange[1];

    return matchesSearch && matchesIndustry && matchesPrice && matchesRevenue && matchesSource;
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const handleRealScraping = async () => {
    setIsScrapingReal(true);
    setScrapingResult(null);
    
    try {
      // Dynamic import to avoid build issues
      const { performRealScraping } = await import('../api/realDataScraper');
      const result = await performRealScraping();
      
      if (result.success) {
        setScrapingResult(`✅ ${result.message}`);
        // Refresh the listings data
        window.location.reload();
      } else {
        setScrapingResult(`❌ ${result.message}`);
      }
    } catch (error) {
      setScrapingResult(`❌ Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsScrapingReal(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to delete ALL business listings? This cannot be undone.')) {
      return;
    }
    
    setIsClearing(true);
    setClearResult(null);
    
    try {
      const { clearAllListings } = await import('../api/realDataScraper');
      const result = await clearAllListings();
      
      if (result.success) {
        setClearResult(`✅ ${result.message}`);
        // Refresh the page to show empty state
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setClearResult(`❌ ${result.message}`);
      }
    } catch (error) {
      setClearResult(`❌ Clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsClearing(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading business listings...</p>
            {scrapingStatus.apiRunning && (
              <p className="mt-2 text-sm text-blue-600">Auto-scraping may be populating fresh data...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">Error loading business listings</p>
            <p className="text-gray-600 mt-2">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-light mb-6 text-white">
              Find Your Next Business Opportunity
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover profitable businesses for sale from trusted brokers and marketplaces
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search businesses by name, industry, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg rounded-full border-0 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard Section - Only show when signed in */}
      {user && (
        <section className="bg-white py-8 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <UserDashboard />
          </div>
        </section>
      )}

      {/* Filters Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowScraperPanel(!showScraperPanel)}
                className="flex items-center space-x-2"
              >
                <Database className="h-4 w-4" />
                <span>Scrapers</span>
              </Button>
            </div>

            {selectedIndustries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedIndustries.map(industry => (
                  <Badge key={industry} variant="secondary" className="flex items-center space-x-1">
                    <span>{industry}</span>
                    <button
                      onClick={() => setSelectedIndustries(prev => prev.filter(i => i !== industry))}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 space-y-4">
              {/* Source Filter */}
              <SourceFilter
                availableSources={uniqueSources}
                selectedSources={selectedSources}
                onSourceToggle={handleSourceToggle}
                listingCounts={sourceListingCounts}
              />
              
              {/* Other Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industries
                    </label>
                    <MultiSelect
                      options={uniqueIndustries}
                      selected={selectedIndustries}
                      onChange={setSelectedIndustries}
                      placeholder="Select industries..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asking Price Range
                    </label>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={10000000}
                        min={0}
                        step={50000}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{formatCurrency(priceRange[0])}</span>
                        <span>{formatCurrency(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Revenue Range
                    </label>
                    <div className="px-2">
                      <Slider
                        value={revenueRange}
                        onValueChange={setRevenueRange}
                        max={5000000}
                        min={0}
                        step={25000}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{formatCurrency(revenueRange[0])}</span>
                        <span>{formatCurrency(revenueRange[1])}</span>
                      </div>
                    </div>
                  </div>
                  
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedIndustries([]);
                          setSelectedSources([]);
                          setPriceRange([0, 10000000]);
                          setRevenueRange([0, 5000000]);
                          setSearchTerm("");
                        }}
                        className="w-full"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {showAdminPanel && (
            <div className="mt-4 space-y-4">
              {/* Save Listing Debug Tool */}
              <SaveListingDebug />
              
              {/* Direct Save Test */}
              <SaveTestButton />
              
              {/* Toast Test */}
              <ToastTest />
              
              {/* Scraping Status */}
              <div className={`p-4 border rounded-lg ${scrapingStatus.apiRunning ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {scrapingStatus.apiRunning ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">Scraper API Running</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-900">Scraper API Not Running</span>
                    </>
                  )}
                </div>
                {!scrapingStatus.apiRunning && (
                  <p className="text-red-700 text-sm">
                    Run: <code className="bg-red-100 px-1 rounded">./start-scraper.sh</code> to start the scraper API
                  </p>
                )}
              </div>

              {/* Scraping Section */}
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">🔥 REAL Data Scraper with ScraperAPI</h3>
                <p className="text-blue-700 mb-4">
                  Powered by ScraperAPI with permanent storage. Auto-scrapes every hour. Results stored for 24h to save credits.
                </p>
                <div className="flex gap-3">
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    onClick={handleRealScraping}
                    disabled={isScrapingReal || isClearing || !scrapingStatus.apiRunning}
                  >
                    {isScrapingReal ? 'Scraping REAL Data...' : 'Manual Refresh Now'}
                  </button>
                  <div className="text-sm text-blue-600 flex items-center">
                    💡 Tip: Uses stored data if available within 24h to save API credits
                  </div>
                </div>
                {scrapingResult && (
                  <p className="mt-2 text-sm">
                    {scrapingResult}
                  </p>
                )}
              </div>

              {/* Emergency Clear */}
              <AdminClear />

              {/* Data Management Section */}
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold text-red-900 mb-2">🗑️ Data Management</h3>
                <p className="text-red-700 mb-4">
                  Clear all listings to start fresh with only real scraped data.
                </p>
                <button 
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  onClick={handleClearAllData}
                  disabled={isClearing || isScrapingReal}
                >
                  {isClearing ? 'Clearing...' : 'Clear ALL Data'}
                </button>
                {clearResult && (
                  <p className="mt-2 text-sm">
                    {clearResult}
                  </p>
                )}
              </div>
            </div>
          )}

          {showScraperPanel && (
            <div className="mt-4">
              <ScraperManagement />
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-light text-gray-900">
              Available Businesses ({filteredListings.length})
            </h2>
            
            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="flex items-center space-x-2"
              >
                <Grid2X2 className="h-4 w-4" />
                <span>Cards</span>
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="flex items-center space-x-2"
              >
                <List className="h-4 w-4" />
                <span>Table</span>
              </Button>
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No businesses match your current filters.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedIndustries([]);
                  setSelectedSources([]);
                  setPriceRange([0, 10000000]);
                  setRevenueRange([0, 5000000]);
                  setSearchTerm("");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredListings.map((listing) => (
                    <BusinessCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <BusinessTable listings={filteredListings} />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;

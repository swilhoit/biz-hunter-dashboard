import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIntegratedScraping } from '@/hooks/useIntegratedScraping';
import { ScraperName } from '@/services/scraping/scrapers';
import { integratedScrapingAPI } from '@/api/integratedScraper';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock,
  Globe,
  TrendingUp,
  Building2,
  Laptop,
  ShoppingCart,
  Zap,
  Crown,
  FileText
} from 'lucide-react';

const scraperIcons: Record<string, React.ReactNode> = {
  'BizBuySell': <Building2 className="h-4 w-4" />,
  'QuietLight': <Globe className="h-4 w-4" />,
  'Acquire': <TrendingUp className="h-4 w-4" />,
  'BizQuest': <Building2 className="h-4 w-4" />,
  'MicroAcquire': <Laptop className="h-4 w-4" />,
  'Flippa': <ShoppingCart className="h-4 w-4" />,
  'EmpireFlippers': <Crown className="h-4 w-4" />,
  'ExitAdviser': <FileText className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  'Traditional Business': 'bg-blue-100 text-blue-800',
  'Digital Business': 'bg-green-100 text-green-800',
  'Startup': 'bg-purple-100 text-purple-800',
  'Micro SaaS': 'bg-orange-100 text-orange-800',
  'Digital Asset': 'bg-cyan-100 text-cyan-800',
  'Small Business': 'bg-rose-100 text-rose-800',
};

export const ScraperManagement: React.FC = () => {
  const { currentOperation, isLoading, getAvailableScrapers } = useIntegratedScraping();
  const [selectedScraper, setSelectedScraper] = useState<ScraperName | 'all'>('all');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResult, setApiResult] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const scrapers = getAvailableScrapers();
  const scraperOptions = Object.entries(scrapers) as [ScraperName, typeof scrapers[ScraperName]][];

  const handleRunScraping = async () => {
    setApiLoading(true);
    setApiResult(null);
    
    try {
      let result;
      if (selectedScraper === 'all') {
        result = await integratedScrapingAPI.runAllScrapers();
      } else {
        result = await integratedScrapingAPI.runSingleScraper(selectedScraper);
      }
      
      if (result.success) {
        setApiResult(`✅ ${result.message}`);
        // Refresh the listings data
        queryClient.invalidateQueries({ queryKey: ['business-listings'] });
      } else {
        setApiResult(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Scraping failed:', error);
      setApiResult(`❌ Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setApiLoading(false);
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Multi-Source Scraper Management</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage data collection from 8 popular business directories
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedScraper} onValueChange={(value) => setSelectedScraper(value as ScraperName | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scraper" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>All Scrapers</span>
                    </div>
                  </SelectItem>
                  {scraperOptions.map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        {scraperIcons[info.name] || <Globe className="h-4 w-4" />}
                        <span>{info.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleRunScraping}
              disabled={isLoading || apiLoading}
              className="flex items-center space-x-2"
            >
              {(isLoading || apiLoading) ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start Scraping</span>
                </>
              )}
            </Button>
          </div>
          
          {apiResult && (
            <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
              <p className="text-sm">{apiResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Scrapers */}
      <Card>
        <CardHeader>
          <CardTitle>Available Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scraperOptions.map(([key, info]) => (
              <div key={key} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {scraperIcons[info.name] || <Globe className="h-4 w-4" />}
                    <h3 className="font-medium">{info.name}</h3>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={categoryColors[info.category] || 'bg-gray-100 text-gray-800'}
                  >
                    {info.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{info.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Operation Status */}
      {currentOperation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Scraping Operation Status</span>
              <Badge variant={
                currentOperation.status === 'running' ? 'default' :
                currentOperation.status === 'completed' ? 'secondary' : 'destructive'
              }>
                {currentOperation.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {currentOperation.currentScraper || 'Initializing...'}
                </span>
                <span>
                  {currentOperation.completedScrapers}/{currentOperation.totalScrapers} completed
                </span>
              </div>
              <Progress value={currentOperation.progress} className="h-2" />
            </div>

            {/* Timing */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Duration: {formatDuration(currentOperation.startTime, currentOperation.endTime)}</span>
              <span>Started: {currentOperation.startTime.toLocaleTimeString()}</span>
            </div>

            {/* Results */}
            {currentOperation.results && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Results Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Listings:</span>
                    <div className="font-medium text-green-600">{currentOperation.results.totalListings}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">New Listings:</span>
                    <div className="font-medium text-blue-600">{currentOperation.results.newListings}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Errors:</span>
                    <div className="font-medium text-red-600">{currentOperation.results.errors}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Success Rate:</span>
                    <div className="font-medium">
                      {Math.round((currentOperation.completedScrapers / currentOperation.totalScrapers) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Individual Scraper Results */}
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Individual Results</h5>
                  <div className="space-y-2">
                    {Object.entries(currentOperation.results.scraperResults).map(([scraperName, result]) => {
                      const scraperInfo = scrapers[scraperName as ScraperName];
                      return (
                        <div key={scraperName} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center space-x-2">
                            {scraperIcons[scraperInfo?.name || scraperName] || <Globe className="h-4 w-4" />}
                            <span className="font-medium">{scraperInfo?.name || scraperName}</span>
                            {result.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.listings} listings
                            {result.errors.length > 0 && `, ${result.errors.length} errors`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {currentOperation.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Error</h4>
                <p className="text-sm text-red-700">{currentOperation.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
import React, { useState, useCallback } from 'react';
import { Search, TrendingUp, Brain, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { fetchDataForKeywords, fetchRelatedKeywords } from '../../utils/explorer/junglescout';
import { generateKeywords } from '../../utils/explorer/aiKeywordGenerator';
import { formatNumberWithCommas } from '../../utils/explorer/dataProcessing';
import { 
  mergeKeywordData, 
  fetchGoogleAdsKeywordData,
  formatCompetitionLevel 
} from '../../utils/explorer/keywordDataMerger';

interface KeywordData {
  keyword: string;
  searchVolume: number;
  searchVolumeTrend: number;
  ppcBid: number;
  relevancyScore: number;
  trendData?: Array<{ date: string; volume: number }>;
  // Google Ads data
  googleAdsSearchVolume?: number;
  competitionLevel?: string;
  competitionIndex?: number;
  googleAdsAvgCpc?: number;
  dataSources?: string[];
}

interface KeywordResearchProps {
  initialKeywords: string;
  onKeywordSelect: (keyword: string) => void;
  products: any[];
}

export function KeywordResearch({ initialKeywords, onKeywordSelect, products }: KeywordResearchProps) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [keywordData, setKeywordData] = useState<KeywordData[]>([]);
  const [relatedKeywords, setRelatedKeywords] = useState<KeywordData[]>([]);
  const [aiGeneratedKeywords, setAiGeneratedKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'related' | 'ai'>('search');

  const handleKeywordSearch = useCallback(async () => {
    if (!keywords.trim()) {
      setError('Please enter keywords to search');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const keywordList = keywords.split(',').map(k => k.trim());
      
      // Fetch data from both sources in parallel
      const [jungleScoutData, googleAdsData] = await Promise.all([
        fetchDataForKeywords(keywordList).catch(() => []),
        fetchGoogleAdsKeywordData(keywordList).catch(() => [])
      ]);
      
      // Merge the data from both sources
      const mergedData = mergeKeywordData(jungleScoutData, googleAdsData);
      
      // Convert merged data to component format
      const formattedData = mergedData.map(item => ({
        keyword: item.keyword,
        searchVolume: item.combinedSearchVolume,
        searchVolumeTrend: item.searchVolumeTrend || 0,
        ppcBid: item.recommendedBid,
        relevancyScore: item.relevancyScore || 0,
        trendData: item.trendData,
        googleAdsSearchVolume: item.googleAdsSearchVolume,
        competitionLevel: item.competitionLevel,
        competitionIndex: item.competitionIndex,
        googleAdsAvgCpc: item.googleAdsAvgCpc,
        dataSources: item.dataSources
      }));
      
      setKeywordData(formattedData);
    } catch (err) {
      setError('Failed to fetch keyword data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [keywords]);

  const handleRelatedKeywords = useCallback(async () => {
    if (!keywords.trim()) {
      setError('Please enter a seed keyword');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const seedKeyword = keywords.split(',')[0].trim();
      const related = await fetchRelatedKeywords(seedKeyword);
      setRelatedKeywords(related);
      setActiveTab('related');
    } catch (err) {
      setError('Failed to fetch related keywords');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [keywords]);

  const handleAIKeywordGeneration = useCallback(async () => {
    if (products.length === 0) {
      setError('Please search for products first to generate AI keywords');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const productTitles = products.slice(0, 10).map(p => p.title);
      const generated = await generateKeywords(productTitles, keywords);
      setAiGeneratedKeywords(generated);
      setActiveTab('ai');
    } catch (err) {
      setError('Failed to generate AI keywords');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [products, keywords]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Keyword Research</CardTitle>
          <CardDescription>
            Discover high-value keywords for your Amazon products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Enter keywords to research (comma-separated)..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleKeywordSearch()}
              className="pl-10"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleKeywordSearch}
              disabled={isLoading}
            >
              <Search className="w-4 h-4 mr-2" />
              Search Keywords
            </Button>
            <Button
              onClick={handleRelatedKeywords}
              disabled={isLoading}
              variant="outline"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Find Related
            </Button>
            <Button
              onClick={handleAIKeywordGeneration}
              disabled={isLoading}
              variant="outline"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Generate
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <div className="border-b">
              <TabsList className="w-full justify-start rounded-none h-auto p-0">
                <TabsTrigger 
                  value="search" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500"
                >
                  Search Results ({keywordData.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="related"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500"
                >
                  Related Keywords ({relatedKeywords.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="ai"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500"
                >
                  AI Generated ({aiGeneratedKeywords.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              ) : (
                <>
                  {/* Search Results Tab */}
                  <TabsContent value="search" className="mt-0">
                    {keywordData.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Keyword</TableHead>
                            <TableHead className="text-right">Search Volume</TableHead>
                            <TableHead className="text-right">Google Ads Volume</TableHead>
                            <TableHead className="text-right">Competition</TableHead>
                            <TableHead className="text-right">Trend</TableHead>
                            <TableHead className="text-right">PPC Bid</TableHead>
                            <TableHead className="text-right">Google CPC</TableHead>
                            <TableHead>Sources</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keywordData.map((kw, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{kw.keyword}</TableCell>
                              <TableCell className="text-right">
                                {formatNumberWithCommas(kw.searchVolume)}
                              </TableCell>
                              <TableCell className="text-right">
                                {kw.googleAdsSearchVolume !== undefined ? (
                                  formatNumberWithCommas(kw.googleAdsSearchVolume)
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {kw.competitionLevel ? (
                                  <Badge variant={
                                    kw.competitionLevel === 'High' ? 'destructive' :
                                    kw.competitionLevel === 'Medium' ? 'secondary' :
                                    'outline'
                                  }>
                                    {formatCompetitionLevel(kw.competitionLevel, kw.competitionIndex)}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`flex items-center justify-end gap-1 ${
                                  kw.searchVolumeTrend > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  <TrendingUp className="w-4 h-4" />
                                  {kw.searchVolumeTrend > 0 ? '+' : ''}{kw.searchVolumeTrend}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                ${kw.ppcBid.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                {kw.googleAdsAvgCpc ? (
                                  `$${kw.googleAdsAvgCpc.toFixed(2)}`
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {kw.dataSources?.map(source => (
                                    <Badge key={source} variant="outline" className="text-xs">
                                      {source === 'JungleScout' ? 'JS' : 'GA'}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() => onKeywordSelect(kw.keyword)}
                                  size="sm"
                                  variant="link"
                                >
                                  Use
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Enter keywords above to see search data
                      </p>
                    )}
                  </TabsContent>

                  {/* Related Keywords Tab */}
                  <TabsContent value="related" className="mt-0">
                    {relatedKeywords.length > 0 ? (
                      <div className="space-y-3">
                        {relatedKeywords.map((kw, index) => (
                          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</h4>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  <span>Volume: {formatNumberWithCommas(kw.searchVolume)}</span>
                                  <span>PPC: ${kw.ppcBid.toFixed(2)}</span>
                                  <span className={`flex items-center gap-1 ${
                                    kw.searchVolumeTrend > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    <TrendingUp className="w-3 h-3" />
                                    {kw.searchVolumeTrend > 0 ? '+' : ''}{kw.searchVolumeTrend}%
                                  </span>
                                </div>
                              </div>
                              <Button
                                onClick={() => onKeywordSelect(kw.keyword)}
                                size="sm"
                              >
                                Use
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Click "Find Related" to discover related keywords
                      </p>
                    )}
                  </TabsContent>

                  {/* AI Generated Tab */}
                  <TabsContent value="ai" className="mt-0">
                    {aiGeneratedKeywords.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {aiGeneratedKeywords.map((keyword, index) => (
                          <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{keyword}</span>
                              <Button
                                onClick={() => onKeywordSelect(keyword)}
                                size="sm"
                                variant="link"
                              >
                                Use
                              </Button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={handleAIKeywordGeneration}
                          className="p-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Generate More
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Click "AI Generate" to get keyword suggestions
                      </p>
                    )}
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Eye,
  BarChart3,
  Award,
  AlertTriangle,
  Shield,
  Zap,
  Users,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { CompetitorAnalysisService, CompetitorBrand, MarketShareAnalysis, CompetitorInsight } from '../../services/CompetitorAnalysisService';

interface CompetitorMarketAnalysisProps {
  brandName: string;
  className?: string;
}

export function CompetitorMarketAnalysis({ brandName, className = '' }: CompetitorMarketAnalysisProps) {
  const [competitors, setCompetitors] = useState<CompetitorBrand[]>([]);
  const [marketShare, setMarketShare] = useState<MarketShareAnalysis[]>([]);
  const [insights, setInsights] = useState<CompetitorInsight[]>([]);
  const [concentration, setConcentration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'competitors' | 'insights'>('overview');

  useEffect(() => {
    loadCompetitorData();
  }, [brandName]);

  const loadCompetitorData = async () => {
    if (!brandName) return;
    
    setLoading(true);
    try {
      const [competitorData, marketData, insightData, concentrationData] = await Promise.all([
        CompetitorAnalysisService.getCompetitorBrands(brandName),
        CompetitorAnalysisService.getMarketShareAnalysis(brandName),
        CompetitorAnalysisService.generateCompetitorInsights(brandName),
        CompetitorAnalysisService.calculateMarketConcentration(brandName)
      ]);

      setCompetitors(competitorData);
      setMarketShare(marketData);
      setInsights(insightData);
      setConcentration(concentrationData);
    } catch (error) {
      console.error('Error loading competitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Very Strong': return 'text-red-600 bg-red-50';
      case 'Strong': return 'text-orange-600 bg-orange-50';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50';
      case 'Weak': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMarketPosition = (brandName: string) => {
    const position = marketShare.findIndex(m => 
      m.brand_name.toLowerCase() === brandName.toLowerCase()
    ) + 1;
    return position || 'Not Ranked';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Competitive Market Analysis
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Analysis of {competitors.length} competitors detected across {brandName}'s keyword landscape
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'overview' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('competitors')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'competitors' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Competitors
            </button>
            <button
              onClick={() => setSelectedTab('insights')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'insights' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Insights
            </button>
          </div>
        </div>

        {/* Market Overview Stats */}
        {concentration && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Market Position</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    #{getMarketPosition(brandName)}
                  </p>
                </div>
                <Award className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">HHI Index</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {concentration.hhi}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {concentration.concentration_level} Concentration
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Top 3 Share</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {concentration.top_3_share}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Competitors</p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                    {competitors.length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market Share Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Market Share Distribution
            </h4>
            <div className="space-y-3">
              {marketShare.slice(0, 8).map((brand, index) => (
                <div key={brand.brand_name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className={`text-sm font-medium ${
                      brand.brand_name.toLowerCase() === brandName.toLowerCase() 
                        ? 'text-blue-600 font-bold' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {brand.brand_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          brand.brand_name.toLowerCase() === brandName.toLowerCase()
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(brand.estimated_market_share * 5, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                      {brand.estimated_market_share.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Competitors Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Top Competitive Threats
            </h4>
            <div className="space-y-4">
              {insights.slice(0, 5).map((insight) => (
                <div key={insight.brand_name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {insight.brand_name}
                    </span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(insight.trending)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStrengthColor(insight.strength)}`}>
                        {insight.strength}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {insight.market_share.toFixed(1)}% market share
                  </div>
                  {insight.key_advantages.length > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      Key strength: {insight.key_advantages[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'competitors' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Detailed Competitor Analysis
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">Brand</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">Market Share</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">Keywords</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">Top 10</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">Avg Position</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">Strength</th>
                </tr>
              </thead>
              <tbody>
                {marketShare.slice(0, 15).map((brand) => {
                  const insight = insights.find(i => i.brand_name === brand.brand_name);
                  return (
                    <tr key={brand.brand_name} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          brand.brand_name.toLowerCase() === brandName.toLowerCase()
                            ? 'text-blue-600 font-bold'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {brand.brand_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {brand.estimated_market_share.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {brand.total_keywords}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {brand.top_10_keywords}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {brand.avg_position.toFixed(1)}
                      </td>
                      <td className="py-3 px-4">
                        {insight && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStrengthColor(insight.strength)}`}>
                            {insight.strength}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'insights' && (
        <div className="space-y-6">
          {insights.map((insight) => (
            <div key={insight.brand_name} className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {insight.brand_name}
                </h4>
                <div className="flex items-center gap-3">
                  {getTrendIcon(insight.trending)}
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStrengthColor(insight.strength)}`}>
                    {insight.strength}
                  </span>
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {insight.market_share.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Competitive Advantages */}
                <div>
                  <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    Key Advantages
                  </h5>
                  <div className="space-y-2">
                    {insight.key_advantages.length > 0 ? (
                      insight.key_advantages.map((advantage, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {advantage}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">No significant advantages identified</div>
                    )}
                  </div>
                </div>

                {/* Vulnerabilities */}
                <div>
                  <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Vulnerabilities
                  </h5>
                  <div className="space-y-2">
                    {insight.vulnerabilities.length > 0 ? (
                      insight.vulnerabilities.map((vulnerability, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          {vulnerability}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">No major vulnerabilities identified</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
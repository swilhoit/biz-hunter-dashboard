import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Search, 
  BarChart3, 
  Lightbulb,
  Loader2,
  RefreshCw,
  Award,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import AIAnalysisService from '../../services/AIAnalysisService';

interface DealAnalysisProps {
  deal: any;
}

interface AnalysisReport {
  summary: string;
  competitiveAnalysis: {
    competitors: Array<{
      name: string;
      marketPosition: string;
      strengths: string[];
      threats: string[];
    }>;
    marketDynamics: {
      competitionLevel: 'Low' | 'Medium' | 'High';
      barrierToEntry: 'Low' | 'Medium' | 'High';
      marketTrends: string[];
    };
    positioningAnalysis: string;
  };
  keywordAnalysis: {
    primaryKeywords: Array<{
      keyword: string;
      searchVolume: string;
      difficulty: string;
      relevance: number;
    }>;
    longTailOpportunities: string[];
    seasonalTrends: string[];
    keywordStrategy: string;
  };
  opportunityScore: {
    overall: number;
    breakdown: {
      financial: number;
      market: number;
      growth: number;
      risk: number;
    };
    reasoning: string;
    improvements: string[];
  };
  riskFactors: string[];
  growthOpportunities: string[];
  recommendations: string[];
  confidenceLevel: number;
  lastUpdated: string;
}

function DealAnalysis({ deal }: DealAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiService] = useState(() => new AIAnalysisService());

  useEffect(() => {
    generateAnalysis();
  }, [deal.id]);

  const generateAnalysis = async () => {
    if (!deal) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const report = await aiService.generateDealAnalysis(deal);
      setAnalysis(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalysis = async () => {
    await generateAnalysis();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getCompetitionLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Generating AI analysis...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Analysis Error</h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={generateAnalysis}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No analysis available</p>
        <button
          onClick={generateAnalysis}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Generate Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI Analysis Report</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Updated {new Date(analysis.lastUpdated).toLocaleDateString()}
          </span>
        </div>
        <button
          onClick={refreshAnalysis}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Executive Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Award className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Executive Summary</h3>
          <div className="ml-auto flex items-center space-x-2">
            <span className="text-sm text-gray-500">Confidence:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(analysis.confidenceLevel)}`}>
              {analysis.confidenceLevel}%
            </span>
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Opportunity Score */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <Target className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Opportunity Score</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold ${getScoreColor(analysis.opportunityScore.overall)}`}>
              {analysis.opportunityScore.overall}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Overall Score</p>
          </div>
          
          <div className="space-y-3">
            {Object.entries(analysis.opportunityScore.breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{key}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : value >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.opportunityScore.reasoning}</p>
        </div>
      </div>

      {/* Competitive Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <Users className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Competitive Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Market Dynamics</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Competition Level</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCompetitionLevelColor(analysis.competitiveAnalysis.marketDynamics.competitionLevel)}`}>
                  {analysis.competitiveAnalysis.marketDynamics.competitionLevel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Barrier to Entry</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCompetitionLevelColor(analysis.competitiveAnalysis.marketDynamics.barrierToEntry)}`}>
                  {analysis.competitiveAnalysis.marketDynamics.barrierToEntry}
                </span>
              </div>
            </div>
            
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mt-4 mb-2">Market Trends</h5>
            <ul className="space-y-1">
              {analysis.competitiveAnalysis.marketDynamics.marketTrends.slice(0, 3).map((trend, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <TrendingUp className="h-3 w-3 mt-1 mr-2 flex-shrink-0" />
                  {trend}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Key Competitors</h4>
            <div className="space-y-3">
              {analysis.competitiveAnalysis.competitors.slice(0, 3).map((competitor, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{competitor.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{competitor.marketPosition}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Positioning Analysis</h5>
          <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.competitiveAnalysis.positioningAnalysis}</p>
        </div>
      </div>

      {/* Keyword Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <Search className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Keyword Research</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Primary Keywords</h4>
            <div className="space-y-2">
              {analysis.keywordAnalysis.primaryKeywords.slice(0, 5).map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{keyword.keyword}</span>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Vol: {keyword.searchVolume}</span>
                    <span className="text-gray-600 dark:text-gray-400">Diff: {keyword.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Long-tail Opportunities</h4>
            <ul className="space-y-1">
              {analysis.keywordAnalysis.longTailOpportunities.slice(0, 5).map((opportunity, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <BarChart3 className="h-3 w-3 mt-1 mr-2 flex-shrink-0" />
                  {opportunity}
                </li>
              ))}
            </ul>
            
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mt-4 mb-2">Seasonal Trends</h5>
            <ul className="space-y-1">
              {analysis.keywordAnalysis.seasonalTrends.slice(0, 3).map((trend, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <Calendar className="h-3 w-3 mt-1 mr-2 flex-shrink-0" />
                  {trend}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Keyword Strategy</h5>
          <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.keywordAnalysis.keywordStrategy}</p>
        </div>
      </div>

      {/* Risks and Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Risk Factors</h3>
          </div>
          <ul className="space-y-2">
            {analysis.riskFactors.map((risk, index) => (
              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Lightbulb className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Growth Opportunities</h3>
          </div>
          <ul className="space-y-2">
            {analysis.growthOpportunities.map((opportunity, index) => (
              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                <Lightbulb className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                {opportunity}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Target className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Strategic Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.recommendations.map((recommendation, index) => (
            <div key={index} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <p className="text-sm text-indigo-800 dark:text-indigo-200">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DealAnalysis;
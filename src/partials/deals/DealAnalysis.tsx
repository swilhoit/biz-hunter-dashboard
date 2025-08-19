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
  deal: {
    id: string;
    business_name: string;
    amazon_category: string;
    amazon_subcategory?: string;
    asking_price: number;
    annual_revenue: number;
    annual_profit: number;
    monthly_revenue?: number;
    monthly_profit?: number;
    amazon_store_url?: string;
    fba_percentage?: number;
    business_age?: number;
    [key: string]: unknown;
  };
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
    criticalRisks?: string[];
    redFlags?: string[];
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
    majorConcerns?: string[];
    dealBreakers?: string[];
  };
  riskFactors: string[];
  growthOpportunities: string[];
  recommendations: string[];
  dueDiligencePriorities?: string[];
  confidenceLevel: number;
  lastUpdated: string;
}

function DealAnalysis({ deal }: DealAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [aiService] = useState(() => new AIAnalysisService());

  useEffect(() => {
    generateAnalysis();
  }, [deal.id]);

  const generateAnalysis = async () => {
    if (!deal) return;
    
    setLoading(true);
    setError(null);
    setLoadingStage('Initializing analysis...');
    
    try {
      const report = await aiService.generateDealAnalysis(deal, (stage) => {
        setLoadingStage(stage);
      });
      setAnalysis(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
    } finally {
      setLoading(false);
      setLoadingStage('');
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
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{loadingStage || 'This may take a few moments'}</p>
          {loadingStage.includes('document') && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Analyzing uploaded documents for deeper insights...
            </p>
          )}
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
        {analysis.summary.includes('document') && (
          <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Analysis enhanced with uploaded documents
          </div>
        )}
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
        
        {/* Major Concerns and Deal Breakers */}
        {(analysis.opportunityScore.majorConcerns?.length > 0 || analysis.opportunityScore.dealBreakers?.length > 0) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.opportunityScore.majorConcerns?.length > 0 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Major Concerns
                </h5>
                <ul className="space-y-1">
                  {analysis.opportunityScore.majorConcerns.map((concern, index) => (
                    <li key={index} className="text-sm text-orange-700 dark:text-orange-300">• {concern}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.opportunityScore.dealBreakers?.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h5 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Potential Deal Breakers
                </h5>
                <ul className="space-y-1">
                  {analysis.opportunityScore.dealBreakers.map((breaker, index) => (
                    <li key={index} className="text-sm text-red-700 dark:text-red-300">• {breaker}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
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
        
        {/* Critical Risks and Red Flags from Competitive Analysis */}
        {(analysis.competitiveAnalysis.criticalRisks?.length > 0 || analysis.competitiveAnalysis.redFlags?.length > 0) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.competitiveAnalysis.criticalRisks?.length > 0 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Critical Market Risks
                </h5>
                <ul className="space-y-1">
                  {analysis.competitiveAnalysis.criticalRisks.map((risk, index) => (
                    <li key={index} className="text-sm text-orange-700 dark:text-orange-300">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.competitiveAnalysis.redFlags?.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h5 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Red Flags
                </h5>
                <ul className="space-y-1">
                  {analysis.competitiveAnalysis.redFlags.map((flag, index) => (
                    <li key={index} className="text-sm text-red-700 dark:text-red-300">• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
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

      {/* Due Diligence Priorities */}
      {analysis.dueDiligencePriorities?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Due Diligence Priorities</h3>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">Critical items to verify before proceeding:</p>
            <ul className="space-y-2">
              {analysis.dueDiligencePriorities.map((priority, index) => (
                <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start">
                  <span className="font-bold mr-2">{index + 1}.</span>
                  {priority}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default DealAnalysis;
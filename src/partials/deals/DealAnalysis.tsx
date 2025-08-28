import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  BarChart3, 
  Lightbulb,
  Loader2,
  RefreshCw,
  Award,
  Users,
  DollarSign
} from 'lucide-react';
import AIAnalysisService from '../../services/AIAnalysisService';
import { ExtendedDeal } from '../../types/deal-extended';

interface DealAnalysisProps {
  deal: ExtendedDeal | any; // Support both extended and basic deal types
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
  marketAnalysis: {
    targetMarket: string;
    marketSize: string;
    growthRate: string;
    keyTrends: string[];
    opportunities: string[];
    threats: string[];
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
    
    // Check for critical data required for basic analysis
    const hasCriticalData = 
      deal.annual_revenue && 
      deal.annual_profit && 
      deal.asking_price &&
      (deal.business_name || deal.category || deal.industry);
    
    // Check for comprehensive data that enhances analysis quality
    const hasComprehensiveData = hasCriticalData && (
      deal.website_url ||
      deal.brand_name ||
      deal.market_size ||
      deal.competitors?.length > 0 ||
      deal.marketing_channels?.length > 0 ||
      deal.customer_retention_rate ||
      deal.gross_margin ||
      deal.employee_count
    );
    
    if (!hasCriticalData) {
      setError('Insufficient data for AI analysis. Please ensure the deal has annual revenue, annual profit, asking price, and business information. Click "Edit Details" to add more data or use AI Auto-Fill.');
      return;
    }
    
    // Warn if data is minimal but proceed with analysis
    if (!hasComprehensiveData) {
      console.warn('Limited business data available. Analysis quality may be reduced. Consider adding more business details for better insights.');
    }
    
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
        </div>
      </div>
    );
  }

  if (error) {
    const isInsufficientData = error.includes('Insufficient data');
    return (
      <div className={`${isInsufficientData ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border rounded-lg p-6`}>
        <div className="flex items-center mb-4">
          <AlertTriangle className={`h-5 w-5 ${isInsufficientData ? 'text-yellow-600' : 'text-red-600'} mr-2`} />
          <h3 className={`text-lg font-medium ${isInsufficientData ? 'text-yellow-800 dark:text-yellow-200' : 'text-red-800 dark:text-red-200'}`}>
            {isInsufficientData ? 'Insufficient Data' : 'Analysis Error'}
          </h3>
        </div>
        <p className={`${isInsufficientData ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'} mb-4`}>{error}</p>
        {isInsufficientData && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-md">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Required Data Fields:</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className={deal.annual_revenue ? 'text-green-600' : 'text-red-600'}>
                {deal.annual_revenue ? '✓' : '✗'} Annual Revenue
              </li>
              <li className={deal.annual_profit ? 'text-green-600' : 'text-red-600'}>
                {deal.annual_profit ? '✓' : '✗'} Annual Profit
              </li>
              <li className={deal.asking_price ? 'text-green-600' : 'text-red-600'}>
                {deal.asking_price ? '✓' : '✗'} Asking Price
              </li>
              <li className={(deal.business_name || deal.category || deal.industry) ? 'text-green-600' : 'text-red-600'}>
                {(deal.business_name || deal.category || deal.industry) ? '✓' : '✗'} Business Information (Name, Category, or Industry)
              </li>
            </ul>
          </div>
        )}
        <button
          onClick={generateAnalysis}
          className={`mt-4 ${isInsufficientData ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-2 rounded-md transition-colors`}
        >
          {isInsufficientData ? 'Check Again' : 'Retry Analysis'}
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
        
        {/* Major Concerns and Deal Breakers */}
        {((analysis.opportunityScore.majorConcerns?.length ?? 0) > 0 || (analysis.opportunityScore.dealBreakers?.length ?? 0) > 0) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {(analysis.opportunityScore.majorConcerns?.length ?? 0) > 0 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Major Concerns
                </h5>
                <ul className="space-y-1">
                  {analysis.opportunityScore.majorConcerns?.map((concern, index) => (
                    <li key={index} className="text-sm text-orange-700 dark:text-orange-300">• {concern}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {(analysis.opportunityScore.dealBreakers?.length ?? 0) > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h5 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Potential Deal Breakers
                </h5>
                <ul className="space-y-1">
                  {analysis.opportunityScore.dealBreakers?.map((breaker, index) => (
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
        {((analysis.competitiveAnalysis.criticalRisks?.length ?? 0) > 0 || (analysis.competitiveAnalysis.redFlags?.length ?? 0) > 0) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {(analysis.competitiveAnalysis.criticalRisks?.length ?? 0) > 0 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Critical Market Risks
                </h5>
                <ul className="space-y-1">
                  {analysis.competitiveAnalysis.criticalRisks?.map((risk, index) => (
                    <li key={index} className="text-sm text-orange-700 dark:text-orange-300">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {(analysis.competitiveAnalysis.redFlags?.length ?? 0) > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h5 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Red Flags
                </h5>
                <ul className="space-y-1">
                  {analysis.competitiveAnalysis.redFlags?.map((flag, index) => (
                    <li key={index} className="text-sm text-red-700 dark:text-red-300">• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Market Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Market Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Market Overview</h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Target Market</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{analysis.marketAnalysis.targetMarket}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Market Size</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{analysis.marketAnalysis.marketSize}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Growth Rate</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{analysis.marketAnalysis.growthRate}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Key Market Trends</h4>
            <ul className="space-y-2">
              {analysis.marketAnalysis.keyTrends.map((trend, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <TrendingUp className="h-3 w-3 mt-1 mr-2 flex-shrink-0" />
                  {trend}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">Market Opportunities</h5>
            <ul className="space-y-1">
              {analysis.marketAnalysis.opportunities.map((opportunity, index) => (
                <li key={index} className="text-sm text-green-700 dark:text-green-300">• {opportunity}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">Market Threats</h5>
            <ul className="space-y-1">
              {analysis.marketAnalysis.threats.map((threat, index) => (
                <li key={index} className="text-sm text-red-700 dark:text-red-300">• {threat}</li>
              ))}
            </ul>
          </div>
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
      {(analysis.dueDiligencePriorities?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Due Diligence Priorities</h3>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">Critical items to verify before proceeding:</p>
            <ul className="space-y-2">
              {analysis.dueDiligencePriorities?.map((priority, index) => (
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
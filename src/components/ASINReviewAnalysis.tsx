import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  AlertCircle, 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { ReviewAnalysisService } from '../services/ReviewAnalysisService';
import { QuickReviewService } from '../services/QuickReviewService';

interface ReviewAnalysisProps {
  asin: string;
  asinId?: string;
}

export function ASINReviewAnalysis({ asin, asinId }: ReviewAnalysisProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    painPoints: true,
    issues: true,
    positive: false,
    recommendations: true,
    themes: false,
    reviews: false
  });

  // Check for existing analysis on mount
  useEffect(() => {
    if (asinId) {
      loadExistingAnalysis();
    }
  }, [asinId]);

  const loadExistingAnalysis = async () => {
    if (!asinId) return;
    
    try {
      const existingAnalysis = await ReviewAnalysisService.getReviewAnalysis(asinId);
      if (existingAnalysis) {
        setAnalysis(existingAnalysis);
      }
    } catch (err) {
      console.warn('No existing analysis found or error loading:', err);
      // Don't set error state for this, as missing analysis is normal
    }
  };

  const performAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await QuickReviewService.getQuickAnalysis(asin, asinId);
      
      if (result.status === 'cached' && result.analysis) {
        setAnalysis(result.analysis);
        setError(null);
      } else if (result.status === 'processing') {
        setError(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to start analysis. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSentimentIcon = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <ThumbsDown className="w-4 h-4 text-red-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-500" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Review Analysis</h2>
            {analysis && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                AI-powered insights from customer reviews
              </span>
            )}
          </div>
          <button
            onClick={performAnalysis}
            disabled={loading}
            className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {analysis ? 'Refresh Analysis' : 'Analyze Pain Points'}
              </>
            )}
          </button>
        </div>
      </header>

      <div className="p-5">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Fetching reviews and analyzing customer feedback...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-6">
            {/* Sentiment Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <ThumbsUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {analysis.sentiment.positive}%
                </div>
                <div className="text-sm text-green-700 dark:text-green-400">Positive</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 text-center">
                <TrendingUp className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-600">
                  {analysis.sentiment.neutral}%
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-400">Neutral</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <ThumbsDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {analysis.sentiment.negative}%
                </div>
                <div className="text-sm text-red-700 dark:text-red-400">Negative</div>
              </div>
            </div>

            {/* Pain Points */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('painPoints')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    Customer Pain Points ({analysis.painPoints.length})
                  </span>
                </div>
                {expandedSections.painPoints ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedSections.painPoints && (
                <div className="p-4 space-y-2">
                  {analysis.painPoints.map((point: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{point}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Common Issues */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('issues')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    Common Issues ({analysis.commonIssues.length})
                  </span>
                </div>
                {expandedSections.issues ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedSections.issues && (
                <div className="p-4 space-y-2">
                  {analysis.commonIssues.map((issue: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Positive Aspects - Hidden for pain point focused analysis */}
            {analysis.positiveAspects.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('positive')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      Positive Aspects ({analysis.positiveAspects.length})
                    </span>
                  </div>
                  {expandedSections.positive ? <ChevronUp /> : <ChevronDown />}
                </button>
                {expandedSections.positive && (
                  <div className="p-4 space-y-2">
                    {analysis.positiveAspects.map((aspect: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-gray-700 dark:text-gray-300">{aspect}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('recommendations')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    AI Recommendations ({analysis.recommendations.length})
                  </span>
                </div>
                {expandedSections.recommendations ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedSections.recommendations && (
                <div className="p-4 space-y-2">
                  {analysis.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-violet-500 mt-1">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Themes */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('themes')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    Key Themes ({analysis.keyThemes.length})
                  </span>
                </div>
                {expandedSections.themes ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedSections.themes && (
                <div className="p-4">
                  <div className="space-y-3">
                    {analysis.keyThemes.map((theme: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(theme.sentiment)}
                          <span className="text-gray-700 dark:text-gray-300">{theme.theme}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {theme.frequency} mentions
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            theme.sentiment === 'positive' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : theme.sentiment === 'negative'
                              ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                          }`}>
                            {theme.sentiment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sample Reviews */}
            {reviews.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('reviews')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      Sample Reviews ({reviews.length})
                    </span>
                  </div>
                  {expandedSections.reviews ? <ChevronUp /> : <ChevronDown />}
                </button>
                {expandedSections.reviews && (
                  <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                    {reviews.slice(0, 10).map((review, index) => (
                      <div key={index} className="border-b border-gray-100 dark:border-gray-700/60 pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < review.rating ? '' : 'opacity-30'}>★</span>
                                ))}
                              </div>
                              <span className="font-medium text-gray-800 dark:text-gray-100">
                                {review.title}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              by {review.author} • {new Date(review.date).toLocaleDateString()}
                              {review.verified_purchase && (
                                <span className="ml-2 text-green-600">✓ Verified Purchase</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {review.body.length > 200 
                            ? `${review.body.substring(0, 200)}...` 
                            : review.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!analysis && !loading && !error && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No pain point analysis available yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Click "Analyze Pain Points" to identify customer issues from critical reviews (1-2 stars)
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🚀 This feature uses DataForSEO's Amazon Reviews API with priority processing (~1 minute) 
                combined with OpenAI GPT-4o-mini for AI-powered insights.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
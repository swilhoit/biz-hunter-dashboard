import { supabase } from '../lib/supabase';

interface QuickAnalysis {
  message: string;
  status: 'cached' | 'processing' | 'error';
  analysis?: any;
}

export class QuickReviewService {
  /**
   * Get immediate response - either cached data or start background task
   */
  static async getQuickAnalysis(asin: string, asinId?: string): Promise<QuickAnalysis> {
    try {
      // Check for existing analysis first
      if (asinId) {
        const { data } = await supabase
          .from('asin_review_analysis')
          .select('*')
          .eq('asin_id', asinId)
          .maybeSingle();

        if (data) {
          return {
            status: 'cached',
            message: 'Showing cached pain point analysis',
            analysis: {
              painPoints: data.pain_points || [],
              commonIssues: data.common_issues || [],
              positiveAspects: data.positive_aspects || [],
              recommendations: data.recommendations || [],
              sentiment: {
                positive: data.sentiment_positive || 0,
                negative: data.sentiment_negative || 0,
                neutral: data.sentiment_neutral || 0
              },
              keyThemes: data.key_themes || []
            }
          };
        }
      }

      // Start background task
      const taskStarted = await this.startBackgroundAnalysis(asin, asinId);
      
      if (taskStarted) {
        return {
          status: 'processing',
          message: 'Pain point analysis started. Refresh in 2-3 minutes for results.'
        };
      }

      return {
        status: 'error',
        message: 'Unable to start analysis. Please check DataForSEO configuration.'
      };
    } catch (error) {
      console.error('Quick analysis error:', error);
      return {
        status: 'error',
        message: 'Error accessing analysis data.'
      };
    }
  }

  /**
   * Start background analysis task
   */
  private static async startBackgroundAnalysis(asin: string, asinId?: string): Promise<boolean> {
    try {
      const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
      const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
      
      if (!username || !password) {
        return false;
      }

      const credentials = btoa(`${username}:${password}`);
      const response = await fetch('https://api.dataforseo.com/v3/merchant/amazon/reviews/task_post', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          asin: asin,
          location_code: 2840,
          language_code: "en",
          priority: 1,
          depth: 30,
          sort_by: "lowest_rating",
          tag: `quick-analysis-${asin}`
        }])
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status_code === 20000 && data.tasks?.[0]?.id) {
          console.log(`[QuickReview] Task started: ${data.tasks[0].id}`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to start background analysis:', error);
      return false;
    }
  }
}
import { supabase } from '../lib/supabase';

interface ReviewData {
  id: string;
  title: string;
  body: string;
  rating: number;
  verified_purchase: boolean;
  helpful_votes: number;
  date: string;
  author: string;
  variant?: string;
}

interface ReviewAnalysis {
  painPoints: string[];
  commonIssues: string[];
  positiveAspects: string[];
  recommendations: string[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  keyThemes: Array<{
    theme: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
}

export class ReviewAnalysisService {
  /**
   * Fetch reviews for an ASIN from DataForSEO
   */
  static async fetchReviewsFromDataForSEO(asin: string): Promise<ReviewData[]> {
    try {
      const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
      const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
      
      if (!username || !password) {
        console.error('[DataForSEO] Credentials not configured');
        return [];
      }

      const credentials = btoa(`${username}:${password}`);
      const endpoint = 'https://api.dataforseo.com/v3/merchant/amazon/reviews/task_post';
      
      // Create task to fetch reviews
      const taskPayload = [{
        asin: asin,
        location_code: 2840, // USA
        language_code: 'en',
        depth: 100, // Number of reviews to fetch
        sort_by: 'helpful' // Sort by most helpful reviews
      }];

      console.log('[DataForSEO] Creating reviews task for ASIN:', asin);

      const taskResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskPayload)
      });

      if (!taskResponse.ok) {
        const errorText = await taskResponse.text();
        console.error('[DataForSEO] Task creation error:', taskResponse.status, errorText);
        return [];
      }

      const taskData = await taskResponse.json();
      
      if (taskData.status_code !== 20000 || !taskData.tasks?.[0]?.id) {
        console.error('[DataForSEO] Failed to create review task');
        return [];
      }

      const taskId = taskData.tasks[0].id;
      
      // Wait for task completion (polling)
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      // Get task results
      const resultEndpoint = `https://api.dataforseo.com/v3/merchant/amazon/reviews/task_get/${taskId}`;
      
      const resultResponse = await fetch(resultEndpoint, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (!resultResponse.ok) {
        console.error('[DataForSEO] Failed to get review results');
        return [];
      }

      const resultData = await resultResponse.json();
      
      if (resultData.status_code === 20000 && resultData.tasks?.[0]?.result?.[0]?.items) {
        const items = resultData.tasks[0].result[0].items;
        console.log('[DataForSEO] Found', items.length, 'reviews');
        
        // Map DataForSEO review format to our format
        return items.map((item: any, index: number) => ({
          id: `${asin}-review-${index}`,
          title: item.title || '',
          body: item.content || '',
          rating: item.rating?.value || 0,
          verified_purchase: item.verified || false,
          helpful_votes: item.helpful_votes || 0,
          date: item.publication_date || new Date().toISOString(),
          author: item.author || 'Anonymous',
          variant: item.variant
        }));
      }
      
      console.log('[DataForSEO] No reviews found');
      return [];
    } catch (error) {
      console.error('Error fetching reviews from DataForSEO:', error);
      return [];
    }
  }

  /**
   * Analyze reviews using AI to extract pain points and insights
   */
  static async analyzeReviewsWithAI(reviews: ReviewData[]): Promise<ReviewAnalysis | null> {
    try {
      if (reviews.length === 0) {
        return null;
      }

      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiApiKey) {
        console.error('OpenAI API key not configured');
        return null;
      }

      // Prepare review text for analysis
      const reviewTexts = reviews.slice(0, 50).map(r => 
        `Rating: ${r.rating}/5\nTitle: ${r.title}\nReview: ${r.body}\n---`
      ).join('\n');

      const prompt = `Analyze these Amazon product reviews and provide a comprehensive analysis in JSON format.

Reviews:
${reviewTexts}

Please analyze and return ONLY a JSON object with the following structure (no markdown, no additional text):
{
  "painPoints": ["array of specific customer pain points mentioned in reviews"],
  "commonIssues": ["array of recurring problems or complaints"],
  "positiveAspects": ["array of features/aspects customers love"],
  "recommendations": ["array of actionable improvements based on feedback"],
  "sentiment": {
    "positive": <percentage as number>,
    "negative": <percentage as number>,
    "neutral": <percentage as number>
  },
  "keyThemes": [
    {
      "theme": "theme name",
      "frequency": <number of times mentioned>,
      "sentiment": "positive|negative|neutral"
    }
  ]
}

Focus on:
1. Specific pain points that could be addressed
2. Recurring quality or functionality issues
3. What customers love about the product
4. Actionable recommendations for improvement
5. Overall sentiment distribution
6. Key themes across all reviews`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert product analyst specializing in Amazon review analysis. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      // Parse the JSON response
      try {
        const analysis = JSON.parse(analysisText);
        return analysis as ReviewAnalysis;
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', analysisText);
        return null;
      }
    } catch (error) {
      console.error('Error analyzing reviews with AI:', error);
      return null;
    }
  }

  /**
   * Save review analysis to database
   */
  static async saveReviewAnalysis(asinId: string, analysis: ReviewAnalysis): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('asin_review_analysis')
        .upsert({
          asin_id: asinId,
          pain_points: analysis.painPoints,
          common_issues: analysis.commonIssues,
          positive_aspects: analysis.positiveAspects,
          recommendations: analysis.recommendations,
          sentiment_positive: analysis.sentiment.positive,
          sentiment_negative: analysis.sentiment.negative,
          sentiment_neutral: analysis.sentiment.neutral,
          key_themes: analysis.keyThemes,
          analyzed_at: new Date().toISOString()
        }, {
          onConflict: 'asin_id'
        });

      if (error) {
        console.error('Error saving review analysis:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveReviewAnalysis:', error);
      return false;
    }
  }

  /**
   * Get saved review analysis from database
   */
  static async getReviewAnalysis(asinId: string): Promise<ReviewAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('asin_review_analysis')
        .select('*')
        .eq('asin_id', asinId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
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
      };
    } catch (error) {
      console.error('Error getting review analysis:', error);
      return null;
    }
  }

  /**
   * Full review analysis workflow
   */
  static async performFullReviewAnalysis(asin: string): Promise<{
    reviews: ReviewData[];
    analysis: ReviewAnalysis | null;
  }> {
    try {
      // Fetch reviews from DataForSEO
      const reviews = await this.fetchReviewsFromDataForSEO(asin);
      
      if (reviews.length === 0) {
        return { reviews: [], analysis: null };
      }

      // Analyze reviews with AI
      const analysis = await this.analyzeReviewsWithAI(reviews);
      
      // Save analysis to database if successful
      if (analysis) {
        // First get the ASIN ID from database
        const { data: asinData } = await supabase
          .from('asins')
          .select('id')
          .eq('asin', asin)
          .single();

        if (asinData) {
          await this.saveReviewAnalysis(asinData.id, analysis);
        }
      }

      return { reviews, analysis };
    } catch (error) {
      console.error('Error in performFullReviewAnalysis:', error);
      return { reviews: [], analysis: null };
    }
  }
}
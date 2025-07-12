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
   * Get overall product rating from Amazon API (faster alternative)
   */
  private static async getProductRating(asin: string, credentials: string): Promise<{ rating: number; reviewCount: number } | null> {
    try {
      // Use the lighter products endpoint to get overall rating quickly
      const response = await fetch('https://api.dataforseo.com/v3/merchant/amazon/products/task_post', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          keyword: asin,
          location_code: 2840,
          language_code: "en",
          priority: 1
        }])
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status_code === 20000 && data.tasks?.[0]?.id) {
          // This would require polling, but for now we'll get it from reviews
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting product rating:', error);
      return null;
    }
  }

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
      
      // DataForSEO Merchant Amazon Reviews endpoint - using task_post pattern
      const endpoint = 'https://api.dataforseo.com/v3/merchant/amazon/reviews/task_post';
      
      // Focus only on critical reviews (1-2 stars) for pain point analysis
      const payload = [{
        language_code: "en",
        location_code: 2840,
        asin: asin,
        priority: 1,
        depth: 30, // Focus on getting enough critical reviews
        sort_by: "lowest_rating", // Get the worst reviews first for pain points
        tag: `pain-point-analysis-${asin}`
      }];

      console.log('[DataForSEO] Fetching reviews for ASIN:', asin);

      // Single focused request for critical reviews
      console.log('[DataForSEO] Fetching critical reviews for pain point analysis');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DataForSEO] API error:', response.status, errorText);
        return [];
      }

      const data = await response.json();
      
      if (data.status_code !== 20000 || !data.tasks?.[0]?.id) {
        console.error('[DataForSEO] Failed to create task');
        return [];
      }
      
      const taskId = data.tasks[0].id;
      console.log('[DataForSEO] Task created:', taskId);
      
      // Poll for task completion
      console.log('[DataForSEO] Waiting for critical review analysis...');
      
      let taskReady = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!taskReady && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        const tasksReadyResponse = await fetch('https://api.dataforseo.com/v3/merchant/amazon/reviews/tasks_ready', {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tasksReadyResponse.ok) {
          const readyData = await tasksReadyResponse.json();
          if (readyData.status_code === 20000 && readyData.tasks) {
            taskReady = readyData.tasks.some((task: any) => task.id === taskId);
            console.log(`[DataForSEO] Attempt ${attempts + 1}: ${taskReady ? 'Ready' : 'Processing...'}`);
          }
        }
        
        attempts++;
      }
      
      if (!taskReady) {
        console.error('[DataForSEO] Task timeout');
        return [];
      }
        
      // Get results
      const getResponse = await fetch(`https://api.dataforseo.com/v3/merchant/amazon/reviews/task_get/advanced/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!getResponse.ok) {
        console.error('[DataForSEO] Failed to get results');
        return [];
      }
      
      const result = await getResponse.json();
      
      if (result.status_code === 20000 && result.tasks?.[0]?.result?.[0]?.reviews) {
        const reviews = result.tasks[0].result[0].reviews;
        console.log(`[DataForSEO] Found ${reviews.length} reviews`);
        
        // Filter for critical reviews (1-2 stars) and prioritize for pain points
        const criticalReviews = reviews
          .filter((review: any) => review.rating <= 2) // Only 1-2 star reviews
          .filter((review: any) => review.text && review.text.length > 20) // Must have substantial text
          .sort((a: any, b: any) => {
            // Prioritize verified purchases
            if (a.verified_purchase && !b.verified_purchase) return -1;
            if (!a.verified_purchase && b.verified_purchase) return 1;
            // Then by lowest rating
            return a.rating - b.rating;
          })
          .slice(0, 25); // Limit to 25 most critical reviews for focused analysis
        
        console.log(`[DataForSEO] Filtered to ${criticalReviews.length} critical reviews (1-2 stars)`);
        
        // Map to our format
        return criticalReviews.map((review: any, index: number) => ({
          id: `${asin}-critical-${index}`,
          title: review.title || '',
          body: review.text || '',
          rating: review.rating || 0,
          verified_purchase: review.verified_purchase || false,
          helpful_votes: 0,
          date: review.publication_date || new Date().toISOString(),
          author: review.author_name || 'Anonymous',
          variant: undefined
        }));
      }
      
      console.log('[DataForSEO] No critical reviews found');
      return [];
    } catch (error) {
      console.error('Error fetching reviews from DataForSEO:', error);
      return [];
    }
  }

  /**
   * Analyze critical reviews for pain points (optimized for speed)
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

      // Focus only on the most critical reviews for pain point extraction
      const criticalReviews = reviews.filter(r => r.rating <= 2).slice(0, 15);
      
      if (criticalReviews.length === 0) {
        console.log('[AI Analysis] No critical reviews found');
        return {
          painPoints: [],
          commonIssues: [],
          positiveAspects: [],
          recommendations: [],
          sentiment: { positive: 0, negative: 100, neutral: 0 },
          keyThemes: []
        };
      }
      
      console.log(`[AI Analysis] Analyzing ${criticalReviews.length} critical reviews for pain points`);
      
      const reviewTexts = criticalReviews.map(r => 
        `${r.rating}★: ${r.title}\n${r.body}\n---`
      ).join('\n');

      // Focused prompt for pain point extraction only
      const prompt = `Extract pain points from these critical Amazon reviews (1-2 stars only). Return ONLY JSON:

Critical Reviews:
${reviewTexts}

{
  "painPoints": ["specific customer pain points and frustrations"],
  "commonIssues": ["recurring problems mentioned multiple times"],
  "recommendations": ["actionable fixes for the main issues"],
  "keyThemes": [{"theme": "problem category", "frequency": count, "sentiment": "negative"}]
}

Focus ONLY on:
- Specific problems customers experienced
- Quality issues and defects
- Functionality failures
- Design flaws
- Recurring complaints

Be concise and specific.`;

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
              content: 'You are a product analyst focused on identifying customer pain points. Return only valid JSON with specific, actionable insights from negative reviews.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Lower for more consistent pain point extraction
          max_tokens: 1000 // Reduced for faster response
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      // Parse and complete the analysis structure
      try {
        const analysis = JSON.parse(analysisText);
        
        // Complete the analysis with calculated sentiment based on critical reviews
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        return {
          painPoints: analysis.painPoints || [],
          commonIssues: analysis.commonIssues || [],
          positiveAspects: [], // No positive aspects from critical reviews
          recommendations: analysis.recommendations || [],
          sentiment: {
            positive: Math.max(0, Math.round((avgRating - 1) * 25)), // Rough estimate
            negative: Math.min(100, Math.round((3 - avgRating) * 50)),
            neutral: Math.round(100 - Math.max(0, Math.round((avgRating - 1) * 25)) - Math.min(100, Math.round((3 - avgRating) * 50)))
          },
          keyThemes: analysis.keyThemes || []
        } as ReviewAnalysis;
      } catch (parseError) {
        console.error('Failed to parse AI response:', analysisText);
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
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
      
      // DataForSEO Merchant Amazon Reviews endpoint - using task_post pattern
      const endpoint = 'https://api.dataforseo.com/v3/merchant/amazon/reviews/task_post';
      
      const payload = [{
        language_code: "en",
        location_code: 2840, // United States
        asin: asin,
        priority: 1, // Priority queue for faster processing (~1 min vs ~45 min)
        depth: 50, // Number of reviews to fetch (max 1000)
        tag: `review-analysis-${asin}`
      }];

      console.log('[DataForSEO] Fetching reviews for ASIN:', asin);

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
      console.log('[DataForSEO] Response:', data);
      
      // Check if this is a task_post response (task ID returned)
      if (data.status_code === 20000 && data.tasks?.[0]?.id) {
        const taskId = data.tasks[0].id;
        console.log('[DataForSEO] Task created with ID:', taskId);
        console.log('[DataForSEO] Waiting for task completion...');
        
        // Poll for task completion using tasks_ready endpoint
        let taskReady = false;
        let attempts = 0;
        const maxAttempts = 12; // 2 minutes max wait time
        
        while (!taskReady && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
          
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
              // Check if our task ID is in the ready list
              taskReady = readyData.tasks.some((task: any) => task.id === taskId);
              console.log(`[DataForSEO] Task ready check ${attempts + 1}/${maxAttempts}: ${taskReady ? 'Ready' : 'Not ready'}`);
            }
          }
          
          attempts++;
        }
        
        if (!taskReady) {
          console.error('[DataForSEO] Task did not complete within timeout period');
          return [];
        }
        
        // Get task results
        const getEndpoint = `https://api.dataforseo.com/v3/merchant/amazon/reviews/task_get/advanced/${taskId}`;
        
        const getResponse = await fetch(getEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!getResponse.ok) {
          console.error('[DataForSEO] Task GET error:', getResponse.status, await getResponse.text());
          return [];
        }
        
        const getResult = await getResponse.json();
        
        if (getResult.status_code === 20000 && getResult.tasks?.[0]?.result?.[0]?.reviews) {
          const reviews = getResult.tasks[0].result[0].reviews;
          console.log('[DataForSEO] Found', reviews.length, 'reviews');
          
          // Map DataForSEO review format to our format based on official documentation
          return reviews.map((review: any, index: number) => ({
            id: `${asin}-review-${index}`,
            title: review.title || '',
            body: review.text || '',
            rating: review.rating || 0,
            verified_purchase: review.verified_purchase || false,
            helpful_votes: 0, // Not provided in standard response
            date: review.publication_date || new Date().toISOString(),
            author: review.author_name || 'Anonymous',
            variant: undefined
          }));
        } else {
          console.error('[DataForSEO] Task failed or no reviews found:', getResult);
          return [];
        }
      }
      
      // Check if this is a live response with immediate results (fallback)
      else if (data.status_code === 20000 && data.tasks?.[0]?.result?.[0]?.reviews) {
        const reviews = data.tasks[0].result[0].reviews;
        console.log('[DataForSEO] Found', reviews.length, 'reviews');
        
        // Map DataForSEO review format to our format based on official documentation
        return reviews.map((review: any, index: number) => ({
          id: `${asin}-review-${index}`,
          title: review.title || '',
          body: review.text || '',
          rating: review.rating || 0,
          verified_purchase: review.verified_purchase || false,
          helpful_votes: 0, // Not provided in standard response
          date: review.publication_date || new Date().toISOString(),
          author: review.author_name || 'Anonymous',
          variant: undefined
        }));
      }
      
      console.log('[DataForSEO] No reviews found or API error');
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
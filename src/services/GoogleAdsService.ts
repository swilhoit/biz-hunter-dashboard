import { GoogleAdsApi, enums } from 'google-ads-api';

interface GoogleAdsKeywordData {
  keyword: string;
  searchVolume: number;
  competitionLevel: string;
  competitionIndex?: number;
  lowTopPageBid?: number;
  highTopPageBid?: number;
  averageCpc?: number;
  monthlySearchVolumes?: Array<{
    month: string;
    year: number;
    monthlySearches: number;
  }>;
}

interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
}

class GoogleAdsService {
  private client: any;
  private customer: any;
  private isInitialized: boolean = false;

  constructor(private config: GoogleAdsConfig) {}

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.client = new GoogleAdsApi({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        developer_token: this.config.developerToken,
      });

      this.customer = this.client.Customer({
        customer_id: this.config.customerId,
        refresh_token: this.config.refreshToken,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Ads API:', error);
      throw new Error('Google Ads API initialization failed');
    }
  }

  async getKeywordIdeas(keywords: string[], locationId: string = '2840'): Promise<GoogleAdsKeywordData[]> {
    await this.initialize();

    try {
      const keywordPlanIdeaService = this.customer.keywordPlanIdeas;

      // Generate keyword ideas
      const response = await keywordPlanIdeaService.generateKeywordIdeas({
        customer_id: this.config.customerId,
        keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH,
        keyword_annotation: [
          enums.KeywordPlanKeywordAnnotation.KEYWORD_METRICS,
        ],
        include_adult_keywords: false,
        geo_target_constants: [`geoTargetConstants/${locationId}`], // US by default
        keyword_seed: {
          keywords: keywords,
        },
      });

      return this.mapKeywordIdeasToData(response);
    } catch (error) {
      console.error('Error fetching keyword ideas:', error);
      throw error;
    }
  }

  async getKeywordMetrics(keywords: string[], locationId: string = '2840'): Promise<GoogleAdsKeywordData[]> {
    await this.initialize();

    try {
      const keywordPlanService = this.customer.keywordPlans;
      
      // Create a temporary keyword plan to get metrics
      const keywordPlan = {
        name: `Keyword Metrics Plan ${Date.now()}`,
        forecast_period: {
          date_interval: enums.KeywordPlanForecastInterval.NEXT_MONTH,
        },
      };

      const planResource = await keywordPlanService.create(keywordPlan);

      // Add keywords to the plan
      const keywordPlanKeywordService = this.customer.keywordPlanKeywords;
      
      for (const keyword of keywords) {
        await keywordPlanKeywordService.create({
          keyword_plan_campaign: planResource.resource_name,
          text: keyword,
          match_type: enums.KeywordMatchType.EXACT,
        });
      }

      // Get historical metrics
      const metricsResponse = await keywordPlanService.generateHistoricalMetrics({
        keyword_plan: planResource.resource_name,
      });

      // Clean up - delete the temporary plan
      await keywordPlanService.remove(planResource.resource_name);

      return this.mapMetricsToData(metricsResponse);
    } catch (error) {
      console.error('Error fetching keyword metrics:', error);
      throw error;
    }
  }

  async getSearchVolumeForKeywords(keywords: string[]): Promise<Map<string, number>> {
    await this.initialize();

    try {
      const keywordData = await this.getKeywordIdeas(keywords);
      const volumeMap = new Map<string, number>();

      keywordData.forEach(data => {
        volumeMap.set(data.keyword.toLowerCase(), data.searchVolume);
      });

      // Also check for exact matches if not found
      for (const keyword of keywords) {
        if (!volumeMap.has(keyword.toLowerCase())) {
          // Try to get exact match data
          const exactData = keywordData.find(
            d => d.keyword.toLowerCase() === keyword.toLowerCase()
          );
          if (exactData) {
            volumeMap.set(keyword.toLowerCase(), exactData.searchVolume);
          }
        }
      }

      return volumeMap;
    } catch (error) {
      console.error('Error fetching search volumes:', error);
      throw error;
    }
  }

  private mapKeywordIdeasToData(response: any): GoogleAdsKeywordData[] {
    if (!response.results) return [];

    return response.results.map((result: any) => {
      const metrics = result.keyword_idea_metrics;
      const keyword = result.text;

      return {
        keyword: keyword,
        searchVolume: metrics.avg_monthly_searches || 0,
        competitionLevel: this.mapCompetitionLevel(metrics.competition),
        competitionIndex: metrics.competition_index,
        lowTopPageBid: metrics.low_top_of_page_bid_micros 
          ? metrics.low_top_of_page_bid_micros / 1000000 
          : undefined,
        highTopPageBid: metrics.high_top_of_page_bid_micros 
          ? metrics.high_top_of_page_bid_micros / 1000000 
          : undefined,
        averageCpc: metrics.average_cpc_micros 
          ? metrics.average_cpc_micros / 1000000 
          : undefined,
        monthlySearchVolumes: metrics.monthly_search_volumes 
          ? this.mapMonthlySearchVolumes(metrics.monthly_search_volumes)
          : undefined,
      };
    });
  }

  private mapMetricsToData(response: any): GoogleAdsKeywordData[] {
    if (!response.metrics) return [];

    return response.metrics.map((metric: any) => ({
      keyword: metric.keyword_plan_keyword,
      searchVolume: metric.keyword_metrics.avg_monthly_searches || 0,
      competitionLevel: this.mapCompetitionLevel(metric.keyword_metrics.competition),
      competitionIndex: metric.keyword_metrics.competition_index,
      lowTopPageBid: metric.keyword_metrics.low_top_of_page_bid_micros 
        ? metric.keyword_metrics.low_top_of_page_bid_micros / 1000000 
        : undefined,
      highTopPageBid: metric.keyword_metrics.high_top_of_page_bid_micros 
        ? metric.keyword_metrics.high_top_of_page_bid_micros / 1000000 
        : undefined,
      averageCpc: metric.keyword_metrics.average_cpc_micros 
        ? metric.keyword_metrics.average_cpc_micros / 1000000 
        : undefined,
    }));
  }

  private mapCompetitionLevel(competition: any): string {
    switch (competition) {
      case enums.KeywordPlanCompetitionLevel.LOW:
        return 'Low';
      case enums.KeywordPlanCompetitionLevel.MEDIUM:
        return 'Medium';
      case enums.KeywordPlanCompetitionLevel.HIGH:
        return 'High';
      default:
        return 'Unknown';
    }
  }

  private mapMonthlySearchVolumes(monthlyVolumes: any[]): any[] {
    return monthlyVolumes.map(volume => ({
      month: volume.month,
      year: volume.year,
      monthlySearches: volume.monthly_searches || 0,
    }));
  }

  // Helper method to get location codes
  static getLocationCodes() {
    return {
      US: '2840',
      UK: '2826',
      CA: '2124',
      AU: '2036',
      DE: '2276',
      FR: '2250',
      ES: '2724',
      IT: '2380',
      JP: '2392',
      // Add more as needed
    };
  }
}

// Factory function to create service instance
export function createGoogleAdsService(config: GoogleAdsConfig): GoogleAdsService {
  return new GoogleAdsService(config);
}

export type { GoogleAdsKeywordData, GoogleAdsConfig };
export { GoogleAdsService };
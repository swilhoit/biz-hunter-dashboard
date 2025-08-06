const express = require('express');
const router = express.Router();
const { GoogleAdsApi, enums } = require('google-ads-api');

// Google Ads API configuration from environment variables
const googleAdsConfig = {
  clientId: process.env.GOOGLE_ADS_CLIENT_ID,
  clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
};

let googleAdsClient = null;
let googleAdsCustomer = null;

// Initialize Google Ads client
async function initializeGoogleAds() {
  if (googleAdsClient && googleAdsCustomer) return;

  try {
    // Check if all required config is present
    const requiredFields = ['clientId', 'clientSecret', 'developerToken', 'refreshToken', 'customerId'];
    const missingFields = requiredFields.filter(field => !googleAdsConfig[field]);
    
    if (missingFields.length > 0) {
      console.warn('Google Ads API not configured. Missing:', missingFields);
      return false;
    }

    googleAdsClient = new GoogleAdsApi({
      client_id: googleAdsConfig.clientId,
      client_secret: googleAdsConfig.clientSecret,
      developer_token: googleAdsConfig.developerToken,
    });

    googleAdsCustomer = googleAdsClient.Customer({
      customer_id: googleAdsConfig.customerId,
      refresh_token: googleAdsConfig.refreshToken,
    });

    console.log('Google Ads API initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Google Ads API:', error);
    return false;
  }
}

// Helper function to map competition level
function mapCompetitionLevel(competition) {
  const competitionMap = {
    'LOW': 'Low',
    'MEDIUM': 'Medium',
    'HIGH': 'High',
  };
  return competitionMap[competition] || 'Unknown';
}

// Get keyword ideas and metrics
router.post('/keywords/ideas', async (req, res) => {
  try {
    const initialized = await initializeGoogleAds();
    if (!initialized) {
      return res.status(503).json({ 
        error: 'Google Ads API not configured',
        message: 'Please configure Google Ads API credentials in environment variables'
      });
    }

    const { keywords, locationId = '2840' } = req.body; // Default to US

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Keywords array is required' });
    }

    const keywordPlanIdeaService = googleAdsCustomer.keywordPlanIdeas;

    // Generate keyword ideas
    const response = await keywordPlanIdeaService.generateKeywordIdeas({
      customer_id: googleAdsConfig.customerId,
      keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH,
      keyword_annotation: [
        enums.KeywordPlanKeywordAnnotation.KEYWORD_METRICS,
      ],
      include_adult_keywords: false,
      geo_target_constants: [`geoTargetConstants/${locationId}`],
      keyword_seed: {
        keywords: keywords,
      },
    });

    // Map the response to a cleaner format
    const keywordData = response.results.map(result => {
      const metrics = result.keyword_idea_metrics;
      return {
        keyword: result.text,
        searchVolume: metrics.avg_monthly_searches || 0,
        competitionLevel: mapCompetitionLevel(metrics.competition),
        competitionIndex: metrics.competition_index,
        lowTopPageBid: metrics.low_top_of_page_bid_micros 
          ? metrics.low_top_of_page_bid_micros / 1000000 
          : null,
        highTopPageBid: metrics.high_top_of_page_bid_micros 
          ? metrics.high_top_of_page_bid_micros / 1000000 
          : null,
        averageCpc: metrics.average_cpc_micros 
          ? metrics.average_cpc_micros / 1000000 
          : null,
        monthlySearchVolumes: metrics.monthly_search_volumes || [],
      };
    });

    res.json({ success: true, data: keywordData });
  } catch (error) {
    console.error('Error fetching keyword ideas:', error);
    res.status(500).json({ 
      error: 'Failed to fetch keyword ideas',
      message: error.message 
    });
  }
});

// Get search volume for specific keywords
router.post('/keywords/search-volume', async (req, res) => {
  try {
    const initialized = await initializeGoogleAds();
    if (!initialized) {
      return res.status(503).json({ 
        error: 'Google Ads API not configured',
        message: 'Please configure Google Ads API credentials in environment variables'
      });
    }

    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Keywords array is required' });
    }

    // Use keyword ideas to get search volume
    const keywordPlanIdeaService = googleAdsCustomer.keywordPlanIdeas;

    const response = await keywordPlanIdeaService.generateKeywordIdeas({
      customer_id: googleAdsConfig.customerId,
      keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH,
      keyword_annotation: [
        enums.KeywordPlanKeywordAnnotation.KEYWORD_METRICS,
      ],
      include_adult_keywords: false,
      geo_target_constants: ['geoTargetConstants/2840'], // US
      keyword_seed: {
        keywords: keywords,
      },
    });

    // Create a map of keyword to search volume
    const volumeMap = {};
    response.results.forEach(result => {
      const keyword = result.text.toLowerCase();
      const metrics = result.keyword_idea_metrics;
      volumeMap[keyword] = metrics.avg_monthly_searches || 0;
    });

    // Ensure all requested keywords are in the map
    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      if (!(lowerKeyword in volumeMap)) {
        volumeMap[lowerKeyword] = 0; // Default to 0 if not found
      }
    });

    res.json({ success: true, data: volumeMap });
  } catch (error) {
    console.error('Error fetching search volumes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch search volumes',
      message: error.message 
    });
  }
});

// Get keyword metrics with historical data
router.post('/keywords/metrics', async (req, res) => {
  try {
    const initialized = await initializeGoogleAds();
    if (!initialized) {
      return res.status(503).json({ 
        error: 'Google Ads API not configured',
        message: 'Please configure Google Ads API credentials in environment variables'
      });
    }

    const { keywords, includeHistorical = false } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Keywords array is required' });
    }

    // Get keyword ideas with metrics
    const keywordPlanIdeaService = googleAdsCustomer.keywordPlanIdeas;

    const response = await keywordPlanIdeaService.generateKeywordIdeas({
      customer_id: googleAdsConfig.customerId,
      keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH,
      keyword_annotation: [
        enums.KeywordPlanKeywordAnnotation.KEYWORD_METRICS,
      ],
      historical_metrics_options: includeHistorical ? {
        year_month_range: {
          start: {
            year: new Date().getFullYear() - 1,
            month: enums.MonthOfYear[new Date().toLocaleString('en', { month: 'long' }).toUpperCase()],
          },
          end: {
            year: new Date().getFullYear(),
            month: enums.MonthOfYear[new Date().toLocaleString('en', { month: 'long' }).toUpperCase()],
          },
        },
      } : undefined,
      include_adult_keywords: false,
      geo_target_constants: ['geoTargetConstants/2840'], // US
      keyword_seed: {
        keywords: keywords,
      },
    });

    // Process and return the metrics
    const metricsData = response.results.map(result => {
      const metrics = result.keyword_idea_metrics;
      return {
        keyword: result.text,
        metrics: {
          avgMonthlySearches: metrics.avg_monthly_searches || 0,
          competition: mapCompetitionLevel(metrics.competition),
          competitionIndex: metrics.competition_index,
          lowTopPageBidMicros: metrics.low_top_of_page_bid_micros,
          highTopPageBidMicros: metrics.high_top_of_page_bid_micros,
          averageCpcMicros: metrics.average_cpc_micros,
          monthlySearchVolumes: metrics.monthly_search_volumes || [],
        },
      };
    });

    res.json({ success: true, data: metricsData });
  } catch (error) {
    console.error('Error fetching keyword metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch keyword metrics',
      message: error.message 
    });
  }
});

module.exports = router;
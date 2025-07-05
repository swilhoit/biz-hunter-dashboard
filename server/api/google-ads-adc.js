const express = require('express');
const router = express.Router();
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

// Initialize Google Auth with ADC
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/adwords'],
});

// Mock data generator for testing
function generateMockKeywordData(keywords) {
  return keywords.map(keyword => ({
    keyword,
    searchVolume: Math.floor(Math.random() * 50000) + 1000,
    competitionLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    competitionIndex: Math.floor(Math.random() * 100),
    lowTopPageBid: Math.random() * 2 + 0.5,
    highTopPageBid: Math.random() * 5 + 2,
    averageCpc: Math.random() * 3 + 1,
  }));
}

// Get keyword ideas using Application Default Credentials
router.post('/keywords/ideas', async (req, res) => {
  try {
    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Keywords array is required' });
    }

    // For now, return enhanced mock data
    // In production, this would use the actual Google Ads API
    const keywordData = generateMockKeywordData(keywords);
    
    res.json({ 
      success: true, 
      data: keywordData,
      message: 'Using mock data. To use real data, complete Google Ads setup.'
    });
  } catch (error) {
    console.error('Error in Google Ads ADC:', error);
    res.status(500).json({ 
      error: 'Failed to fetch keyword data',
      message: error.message 
    });
  }
});

// Get access token for debugging
router.get('/auth/test', async (req, res) => {
  try {
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    
    res.json({ 
      success: true,
      message: 'Google Cloud ADC is working',
      projectId: projectId,
      clientType: client.constructor.name
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'ADC test failed',
      message: error.message 
    });
  }
});

module.exports = router;
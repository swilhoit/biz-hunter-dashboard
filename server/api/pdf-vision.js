import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});

/**
 * Analyze a PDF document using vision API
 * This endpoint accepts a PDF file ID, downloads it, and analyzes it
 */
router.post('/analyze/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log('Analyzing PDF with vision API, file ID:', fileId);

    // Download the file from our files API
    const fileResponse = await fetch(`http://localhost:${process.env.SERVER_PORT || 3002}/api/files/download/${fileId}`);
    
    if (!fileResponse.ok) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileBuffer = await fileResponse.buffer();
    const contentType = fileResponse.headers.get('content-type');
    
    // For PDFs, we need to inform the user that we can't directly process them with vision API
    // Vision API only accepts images, not PDFs
    if (contentType?.includes('pdf')) {
      console.log('File is a PDF, providing instructions for manual processing');
      
      return res.json({
        success: false,
        requiresConversion: true,
        message: 'PDF files cannot be directly processed by vision API. Please convert PDF pages to images first.',
        instructions: [
          '1. Use a PDF to image converter to extract pages as PNG/JPG files',
          '2. Upload the image files for AI analysis',
          '3. Or use dedicated OCR software for PDF text extraction'
        ],
        alternatives: [
          'Upload screenshots of the PDF pages',
          'Use Adobe Acrobat or similar tools to export as images',
          'Use online PDF to image converters'
        ]
      });
    }

    // If it's an image, process it with vision API
    if (contentType?.includes('image')) {
      const base64Image = `data:${contentType};base64,${fileBuffer.toString('base64')}`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this business document image and extract ALL information. Focus on:
                1. Business name and description
                2. Financial data (revenue, profit, EBITDA, asking price, valuation)
                3. All numerical metrics with labels
                4. Tables and structured data
                5. Business details and operations
                6. Any other relevant information

                Extract and organize all visible text and data.`
              },
              {
                type: "image_url",
                image_url: { url: base64Image }
              }
            ]
          }
        ],
        max_tokens: 4000
      });

      const extractedContent = response.choices[0]?.message?.content || '';
      
      // Now parse the extracted content for structured data
      const structuredResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a business document analyzer. Extract structured data from text."
          },
          {
            role: "user",
            content: `Parse this extracted business document content into structured JSON:

${extractedContent}

Return JSON with these fields:
{
  "businessName": "extracted business name",
  "description": "business description",
  "askingPrice": number or null,
  "annualRevenue": number or null,
  "annualProfit": number or null,
  "monthlyRevenue": number or null,
  "monthlyProfit": number or null,
  "ebitda": number or null,
  "inventoryValue": number or null,
  "keyFindings": ["key point 1", "key point 2"],
  "financialData": {
    "revenue": { "annual": number, "monthly": number },
    "profit": { "annual": number, "monthly": number },
    "margins": { "gross": number, "net": number }
  },
  "businessDetails": {
    "age": "business age",
    "employees": "employee count",
    "location": "location",
    "industry": "industry"
  }
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      let structuredData;
      try {
        structuredData = JSON.parse(structuredResponse.choices[0]?.message?.content || '{}');
      } catch (e) {
        structuredData = {};
      }

      return res.json({
        success: true,
        extractedText: extractedContent,
        structuredData: structuredData,
        confidence: 0.85
      });
    }

    return res.status(400).json({
      error: 'Unsupported file type',
      contentType: contentType
    });

  } catch (error) {
    console.error('PDF vision analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze document',
      details: error.message 
    });
  }
});

export default router;
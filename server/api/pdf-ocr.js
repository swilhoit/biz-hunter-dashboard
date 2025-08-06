import express from 'express';
import multer from 'multer';
import { pdfToPng } from 'pdf-to-png-converter';
import OpenAI from 'openai';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});

/**
 * Convert PDF to images and extract text using Vision API
 */
router.post('/extract', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    console.log('Processing PDF for OCR:', req.file.originalname);

    // Convert PDF to PNG images
    const options = {
      disableFontFace: true,
      useSystemFonts: true,
      viewportScale: 2.0, // Higher resolution for better OCR
      outputFolder: null, // Return as buffer
      outputFileMask: null,
      pagesToProcess: [], // Process all pages
      strictPagesToProcess: false,
      verbosityLevel: 0
    };

    console.log('Converting PDF to images...');
    const pdfBuffer = req.file.buffer;
    const images = await pdfToPng(pdfBuffer, options);
    
    console.log(`Converted ${images.length} pages to images`);

    // Process each page with Vision API
    const extractedTexts = [];
    const pageAnalyses = [];

    for (let i = 0; i < images.length; i++) {
      const page = images[i];
      console.log(`Processing page ${i + 1}/${images.length}...`);
      
      // Convert buffer to base64
      const base64Image = `data:image/png;base64,${page.content.toString('base64')}`;
      
      // Use Vision API to extract text
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract ALL text from this business document page ${i + 1}. Focus on:
                1. Business name and description
                2. Financial figures (revenue, profit, EBITDA, asking price, multiples)
                3. All numerical data with context
                4. Tables and structured data
                5. Key business metrics and dates
                6. Any Amazon/FBA related information
                
                Return the extracted text maintaining the document structure as much as possible.`
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

      const pageText = response.choices[0]?.message?.content || '';
      extractedTexts.push(pageText);
      pageAnalyses.push({
        pageNumber: i + 1,
        text: pageText,
        width: page.width,
        height: page.height
      });
    }

    // Combine all extracted text
    const fullText = extractedTexts.join('\n\n--- Page Break ---\n\n');

    // Now analyze the combined text for structured data
    console.log('Analyzing extracted text for structured business data...');
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

${fullText}

Return JSON with these fields (use null for missing data):
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
  "valuationMultiple": number or null,
  "businessAge": "age or years in business",
  "industry": "industry/category",
  "location": "location",
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
    "industry": "industry",
    "reasonForSelling": "reason if mentioned"
  },
  "amazonInfo": {
    "storeName": "store name if mentioned",
    "category": "amazon category",
    "fbaPercentage": number or null,
    "asinCount": number or null,
    "accountHealth": "account health status"
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
      console.error('Failed to parse structured data:', e);
      structuredData = {};
    }

    res.json({
      success: true,
      message: 'PDF OCR extraction completed successfully',
      pageCount: images.length,
      fullText: fullText,
      structuredData: structuredData,
      pageAnalyses: pageAnalyses,
      confidence: 0.9
    });

  } catch (error) {
    console.error('PDF OCR error:', error);
    res.status(500).json({ 
      error: 'Failed to process PDF',
      details: error.message 
    });
  }
});

/**
 * Process an image with Vision API for text extraction
 */
router.post('/extract-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('Processing image for OCR:', req.file.originalname);

    // Convert image to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Use Vision API to extract text
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL text from this business document image. Focus on:
              1. Business name and description
              2. Financial figures (revenue, profit, EBITDA, asking price)
              3. All numerical data with context
              4. Tables and structured data
              5. Key business metrics
              
              Return the extracted text maintaining the document structure as much as possible.`
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

    const extractedText = response.choices[0]?.message?.content || '';

    res.json({
      success: true,
      text: extractedText,
      confidence: 0.85
    });

  } catch (error) {
    console.error('Image OCR error:', error);
    res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message 
    });
  }
});

export default router;
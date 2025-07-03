// Types
export interface ProcessedProduct {
  asin: string;
  title: string;
  brand: string;
  price: number;
  reviews: number;
  rating: number;
  sales: number;
  revenue: number;
  sellerCountry: string;
  fulfillment: string;
  dateFirstAvailable: string;
  category: string;
  imageUrl: string;
  amazonUrl: string;
  attributes: string[];
  featureBullets: string[];
  percentOfTotalSales?: string;
  percentOfTotalRevenue?: string;
}

export interface SummaryData {
  asin: string;
  title: string;
  brand: string;
  price: string;
  reviews: string;
  rating: string;
  sales: number;
  percentOfTotalSales: string;
  revenue: number;
  percentOfTotalRevenue: string;
  category: string;
  imageUrl: string;
  sellerCountry: string;
  fulfillment: string;
  dateFirstAvailable: string;
}

export interface PriceSegment {
  title: string;
  items: ProcessedProduct[];
  averagePrice: number;
  reviews: number;
  sales: number;
  revenue: number;
  percentOfTotalSales: number;
  percentOfTotalRevenue: number;
  productCount: number;
}

// Utility function for formatting numbers with commas
export const formatNumberWithCommas = (number: number): string => {
  return Math.round(number).toLocaleString('en-US');
};

// Process data from either JungleScout API or CSV
export const processData = (inputData: any[]): ProcessedProduct[] => {
  console.log('ProcessData - Input:', inputData);

  if (!Array.isArray(inputData) || inputData.length === 0) {
    console.error('ProcessData - Invalid input: inputData is not an array or is empty');
    return [];
  }

  const isJungleScoutData = inputData[0] && 'attributes' in inputData[0];

  const processedData = inputData.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      console.error(`ProcessData - Invalid item at index ${index}:`, item);
      return null;
    }

    if (isJungleScoutData) {
      return processJungleScoutItem(item);
    } else {
      return processCSVItem(item);
    }
  }).filter((item): item is ProcessedProduct => item !== null);

  if (processedData.length === 0) {
    console.error('ProcessData - All items were invalid');
    return [];
  }

  const totalSales = processedData.reduce((sum, item) => sum + item.sales, 0);
  const totalRevenue = processedData.reduce((sum, item) => sum + item.revenue, 0);

  const finalData = processedData.map(item => ({
    ...item,
    percentOfTotalSales: totalSales ? ((item.sales / totalSales) * 100).toFixed(2) : '0.00',
    percentOfTotalRevenue: totalRevenue ? ((item.revenue / totalRevenue) * 100).toFixed(2) : '0.00',
  }));

  console.log('ProcessData - Output:', finalData);
  return finalData;
};

// Process JungleScout API item
const processJungleScoutItem = (item: any): ProcessedProduct => {
  const attributes = item.attributes;
  return {
    asin: item.id.replace('us/', ''),
    title: attributes.title || '',
    brand: attributes.brand || '',
    price: parseFloat(attributes.price || 0),
    reviews: parseInt(attributes.reviews || 0),
    rating: parseFloat(attributes.rating || 0),
    sales: parseInt(attributes.approximate_30_day_units_sold || 0),
    revenue: Math.round(parseFloat(attributes.approximate_30_day_revenue || 0)),
    sellerCountry: attributes.seller_country || '',
    fulfillment: attributes.fulfillment || '',
    dateFirstAvailable: attributes.date_first_available || '',
    category: attributes.category || '',
    imageUrl: attributes.image_url || '',
    amazonUrl: `https://www.amazon.com/dp/${item.id.replace('us/', '')}`,
    attributes: attributes.attributes || [],
    featureBullets: attributes.feature_bullets || []
  };
};

// Process CSV item
const processCSVItem = (row: any): ProcessedProduct => {
  let sales = 0;
  if (row['Sales'] && typeof row['Sales'] === 'string') {
    sales = parseInt(row['Sales'].replace(/,/g, ''), 10);
  } else if (typeof row['Sales'] === 'number') {
    sales = row['Sales'];
  }

  let revenue = 0;
  if (row['Revenue'] && typeof row['Revenue'] === 'string') {
    revenue = Math.round(parseFloat(row['Revenue'].replace(/[,$]/g, '')));
  } else if (typeof row['Revenue'] === 'number') {
    revenue = Math.round(row['Revenue']);
  }

  // Calculate sales from revenue if sales is 0
  if (revenue > 0 && sales === 0) {
    const price = parseFloat(row['Price  $']) || 0;
    if (price > 0) {
      sales = Math.round(revenue / price);
    }
  }

  return {
    asin: row['ASIN'] || '',
    title: row['Product Details'] || '',
    brand: row['Brand'] || '',
    price: parseFloat(row['Price  $']) || 0,
    reviews: parseInt(row['Review Count']) || 0,
    rating: parseFloat(row['Ratings']) || 0,
    sales: isNaN(sales) ? 0 : sales,
    revenue: isNaN(revenue) ? 0 : revenue,
    sellerCountry: row['Seller Country/Region'] || '',
    fulfillment: row['Fulfillment'] || '',
    dateFirstAvailable: row['Creation Date'] || '',
    category: row['Category'] || '',
    imageUrl: row['Image URL'] || '',
    amazonUrl: row['URL'] || '',
    attributes: row['Attributes'] || [],
    featureBullets: row['Feature Bullets'] || []
  };
};

// Create summary data from processed products
export const updateSummary = (data: ProcessedProduct[]): SummaryData => {
  console.log('UpdateSummary - Input:', data);

  if (!Array.isArray(data) || data.length === 0) {
    console.error('UpdateSummary - Invalid input: data is not an array or is empty');
    return {
      asin: "Summary",
      title: "",
      brand: "",
      price: "$0.00",
      reviews: "0",
      rating: "",
      sales: 0,
      percentOfTotalSales: "100.00",
      revenue: 0,
      percentOfTotalRevenue: "100.00",
      category: "",
      imageUrl: "",
      sellerCountry: "",
      fulfillment: "",
      dateFirstAvailable: "",
    };
  }

  const totalSales = data.reduce((sum, item) => sum + (item.sales || 0), 0);
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalPrice = data.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalReviews = data.reduce((sum, item) => sum + (item.reviews || 0), 0);

  const averagePrice = data.length > 0 ? (totalPrice / data.length).toFixed(2) : '0.00';
  const averageReviews = data.length > 0 ? Math.round(totalReviews / data.length) : 0;

  const summary: SummaryData = {
    asin: "Summary",
    title: "",
    brand: "",
    price: `$${averagePrice}`,
    reviews: averageReviews.toString(),
    rating: "",
    sales: Math.round(totalSales),
    percentOfTotalSales: "100.00",
    revenue: Math.round(totalRevenue),
    percentOfTotalRevenue: "100.00",
    category: "",
    imageUrl: "",
    sellerCountry: "",
    fulfillment: "",
    dateFirstAvailable: "",
  };

  console.log('UpdateSummary - Output:', summary);
  return summary;
};

// Get price segments for analysis
export const getPriceSegments = (
  data: ProcessedProduct[], 
  increment: number, 
  summaryData: SummaryData | null
): PriceSegment[] => {
  console.log('GetPriceSegments - Input:', { data, increment, summaryData });

  if (!Array.isArray(data) || data.length === 0) {
    console.error('GetPriceSegments - Invalid input: data is not an array or is empty');
    return [];
  }

  const maxPrice = Math.max(...data.map(item => item.price || 0));
  const segments: PriceSegment[] = [];

  const totalSalesValue = summaryData?.sales || 0;
  const totalRevenueValue = summaryData?.revenue || 0;

  for (let i = 0; i <= maxPrice; i += increment) {
    const segmentItems = data.filter(item => {
      const price = item.price || 0;
      return price > i && price <= i + increment;
    });

    if (segmentItems.length === 0) continue;

    const totalSales = segmentItems.reduce((sum, item) => sum + (item.sales || 0), 0);
    const totalRevenue = segmentItems.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalReviews = segmentItems.reduce((sum, item) => sum + (item.reviews || 0), 0);

    const avgPrice = segmentItems.reduce((sum, item) => sum + (item.price || 0), 0) / segmentItems.length;

    segments.push({
      title: `$${i} - $${i + increment}`,
      items: segmentItems,
      averagePrice: Number(avgPrice.toFixed(2)),
      reviews: totalReviews,
      sales: Math.round(totalSales),
      revenue: Math.round(totalRevenue),
      percentOfTotalSales: totalSalesValue ? (totalSales / totalSalesValue) * 100 : 0,
      percentOfTotalRevenue: totalRevenueValue ? (totalRevenue / totalRevenueValue) * 100 : 0,
      productCount: segmentItems.length
    });
  }

  console.log('GetPriceSegments - Output:', segments);
  return segments;
};
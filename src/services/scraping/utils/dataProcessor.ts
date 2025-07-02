/**
 * Utility functions for processing scraped data
 */

/**
 * Format price string to numeric value
 */
export function formatPrice(priceStr: string | number | undefined | null): number | null {
  if (!priceStr) return null;
  
  // If already a number, return it
  if (typeof priceStr === 'number') {
    return Math.round(priceStr);
  }
  
  // Clean the string
  let cleaned = priceStr.toString()
    .replace(/[$,]/g, '')
    .replace(/\s+/g, '')
    .trim();
  
  // Handle different formats
  let multiplier = 1;
  
  if (cleaned.toLowerCase().includes('m') || cleaned.toLowerCase().includes('million')) {
    multiplier = 1000000;
    cleaned = cleaned.replace(/m|million/gi, '');
  } else if (cleaned.toLowerCase().includes('k') || cleaned.toLowerCase().includes('thousand')) {
    multiplier = 1000;
    cleaned = cleaned.replace(/k|thousand/gi, '');
  } else if (cleaned.toLowerCase().includes('b') || cleaned.toLowerCase().includes('billion')) {
    multiplier = 1000000000;
    cleaned = cleaned.replace(/b|billion/gi, '');
  }
  
  // Extract numeric value
  const match = cleaned.match(/[\d.]+/);
  if (!match) return null;
  
  const value = parseFloat(match[0]) * multiplier;
  
  // Sanity check - business prices should be reasonable
  if (value < 1000 || value > 1000000000) {
    return null;
  }
  
  return Math.round(value);
}

/**
 * Clean and normalize text
 */
export function cleanText(text: string | undefined | null): string {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

/**
 * Extract industry/category from text
 */
export function extractIndustry(text: string): string {
  const lower = text.toLowerCase();
  
  if (lower.includes('amazon') || lower.includes('fba')) return 'Amazon FBA';
  if (lower.includes('ecommerce') || lower.includes('e-commerce')) return 'E-commerce';
  if (lower.includes('saas') || lower.includes('software')) return 'SaaS';
  if (lower.includes('content') || lower.includes('blog')) return 'Content/Publishing';
  if (lower.includes('service')) return 'Services';
  if (lower.includes('agency')) return 'Agency';
  if (lower.includes('app') || lower.includes('mobile')) return 'Mobile App';
  
  return 'Online Business';
}

/**
 * Parse date string to ISO format
 */
export function parseDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}
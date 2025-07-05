import { Deal } from '../types/deal';

/**
 * Calculate an opportunity score for a deal based on various factors
 * Score ranges from 0-100, where higher is better
 */
export function calculateOpportunityScore(deal: Deal): number {
  let score = 50; // Start with a base score
  
  // Valuation Multiple Factor (20 points)
  // Lower multiple = better opportunity
  if (deal.valuation_multiple) {
    if (deal.valuation_multiple <= 2.0) score += 20;
    else if (deal.valuation_multiple <= 2.5) score += 15;
    else if (deal.valuation_multiple <= 3.0) score += 10;
    else if (deal.valuation_multiple <= 3.5) score += 5;
    else if (deal.valuation_multiple > 4.0) score -= 10;
  }
  
  // Profit Margin Factor (20 points)
  if (deal.annual_revenue && deal.annual_profit) {
    const profitMargin = (deal.annual_profit / deal.annual_revenue) * 100;
    if (profitMargin >= 30) score += 20;
    else if (profitMargin >= 25) score += 15;
    else if (profitMargin >= 20) score += 10;
    else if (profitMargin >= 15) score += 5;
    else if (profitMargin < 10) score -= 10;
  }
  
  // FBA Percentage Factor (15 points)
  // Higher FBA % = more automated = better
  if (deal.fba_percentage) {
    if (deal.fba_percentage >= 95) score += 15;
    else if (deal.fba_percentage >= 90) score += 12;
    else if (deal.fba_percentage >= 85) score += 8;
    else if (deal.fba_percentage >= 80) score += 5;
    else if (deal.fba_percentage < 70) score -= 5;
  }
  
  // Business Age Factor (10 points)
  // Established businesses are better
  if (deal.business_age) {
    const yearsInBusiness = deal.business_age / 12;
    if (yearsInBusiness >= 5) score += 10;
    else if (yearsInBusiness >= 3) score += 7;
    else if (yearsInBusiness >= 2) score += 5;
    else if (yearsInBusiness >= 1) score += 3;
    else score -= 5; // Less than 1 year is risky
  }
  
  // ASIN Diversity Factor (10 points)
  // More ASINs = better diversification
  if (deal.asin_list && Array.isArray(deal.asin_list)) {
    const asinCount = deal.asin_list.length;
    if (asinCount >= 50) score += 10;
    else if (asinCount >= 30) score += 7;
    else if (asinCount >= 20) score += 5;
    else if (asinCount >= 10) score += 3;
    else if (asinCount < 5) score -= 5;
  }
  
  // Deal Size Factor (10 points)
  // Mid-range deals often have best opportunity
  if (deal.asking_price) {
    if (deal.asking_price >= 1000000 && deal.asking_price <= 5000000) score += 10;
    else if (deal.asking_price >= 500000 && deal.asking_price <= 1000000) score += 7;
    else if (deal.asking_price >= 5000000 && deal.asking_price <= 10000000) score += 5;
    else if (deal.asking_price < 100000) score -= 5;
  }
  
  // Seller Account Health Factor (10 points)
  if (deal.seller_account_health) {
    const health = deal.seller_account_health.toLowerCase();
    if (health.includes('excellent')) score += 10;
    else if (health.includes('very good')) score += 7;
    else if (health.includes('good')) score += 5;
    else if (health.includes('fair')) score -= 5;
    else if (health.includes('poor')) score -= 10;
  }
  
  // Priority Factor (5 points)
  // Higher priority deals get a small boost
  if (deal.priority) {
    if (deal.priority === 5) score += 5;
    else if (deal.priority === 4) score += 3;
    else if (deal.priority === 3) score += 1;
  }
  
  // Ensure score stays within 0-100 range
  score = Math.max(0, Math.min(100, score));
  
  return Math.round(score);
}

/**
 * Get a color class based on the opportunity score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get a label for the opportunity score
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}
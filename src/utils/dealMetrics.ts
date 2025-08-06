/**
 * Utility functions for converting between monthly and annual metrics
 * Some platforms show monthly metrics, others show annual metrics for the same data
 */

export interface DealMetrics {
  monthly_revenue?: number;
  annual_revenue?: number;
  monthly_profit?: number;
  annual_profit?: number;
  avg_monthly_revenue?: number;
  avg_monthly_profit?: number;
  ttm_revenue?: number;
  ttm_profit?: number;
  pricing_period?: number;
}

/**
 * Convert between monthly and annual metrics
 */
export class DealMetricsConverter {
  /**
   * Get monthly revenue from available data
   */
  static getMonthlyRevenue(metrics: DealMetrics): number | undefined {
    if (metrics.monthly_revenue) return metrics.monthly_revenue;
    if (metrics.avg_monthly_revenue) return metrics.avg_monthly_revenue;
    if (metrics.annual_revenue) return metrics.annual_revenue / 12;
    if (metrics.ttm_revenue) return metrics.ttm_revenue / 12;
    return undefined;
  }

  /**
   * Get annual revenue from available data
   */
  static getAnnualRevenue(metrics: DealMetrics): number | undefined {
    if (metrics.annual_revenue) return metrics.annual_revenue;
    if (metrics.ttm_revenue) return metrics.ttm_revenue;
    if (metrics.monthly_revenue) return metrics.monthly_revenue * 12;
    if (metrics.avg_monthly_revenue) return metrics.avg_monthly_revenue * 12;
    return undefined;
  }

  /**
   * Get monthly profit from available data
   */
  static getMonthlyProfit(metrics: DealMetrics): number | undefined {
    if (metrics.monthly_profit) return metrics.monthly_profit;
    if (metrics.avg_monthly_profit) return metrics.avg_monthly_profit;
    if (metrics.annual_profit) return metrics.annual_profit / 12;
    if (metrics.ttm_profit) return metrics.ttm_profit / 12;
    return undefined;
  }

  /**
   * Get annual profit from available data
   */
  static getAnnualProfit(metrics: DealMetrics): number | undefined {
    if (metrics.annual_profit) return metrics.annual_profit;
    if (metrics.ttm_profit) return metrics.ttm_profit;
    if (metrics.monthly_profit) return metrics.monthly_profit * 12;
    if (metrics.avg_monthly_profit) return metrics.avg_monthly_profit * 12;
    return undefined;
  }

  /**
   * Calculate profit margin percentage
   */
  static getProfitMargin(revenue?: number, profit?: number): number | undefined {
    if (!revenue || !profit || revenue === 0) return undefined;
    return (profit / revenue) * 100;
  }

  /**
   * Calculate valuation multiple
   */
  static getMultiple(askingPrice?: number, profit?: number, pricingPeriod: number = 12): number | undefined {
    if (!askingPrice || !profit || profit === 0) return undefined;
    
    // Convert profit to match pricing period
    const periodProfit = pricingPeriod === 12 ? profit : profit * (pricingPeriod / 12);
    return askingPrice / periodProfit;
  }

  /**
   * Calculate business age in years from start date
   */
  static calculateBusinessAgeYears(startDate?: string | Date): number | undefined {
    if (!startDate) return undefined;
    
    const start = new Date(startDate);
    const now = new Date();
    
    let years = now.getFullYear() - start.getFullYear();
    const monthDiff = now.getMonth() - start.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) {
      years--;
    }
    
    return years;
  }

  /**
   * Calculate business age in months from start date
   */
  static calculateBusinessAgeMonths(startDate?: string | Date): number | undefined {
    if (!startDate) return undefined;
    
    const start = new Date(startDate);
    const now = new Date();
    
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();
    
    return years * 12 + months;
  }

  /**
   * Format business age for display
   */
  static formatBusinessAge(months?: number, startDate?: string | Date): string {
    // Calculate from start date if provided
    if (startDate) {
      months = this.calculateBusinessAgeMonths(startDate);
    }
    
    if (!months) return 'Unknown';
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Normalize all metrics to have both monthly and annual values
   */
  static normalizeMetrics(metrics: DealMetrics): Required<Pick<DealMetrics, 'monthly_revenue' | 'annual_revenue' | 'monthly_profit' | 'annual_profit'>> & { profit_margin?: number } {
    const monthlyRevenue = this.getMonthlyRevenue(metrics) || 0;
    const annualRevenue = this.getAnnualRevenue(metrics) || 0;
    const monthlyProfit = this.getMonthlyProfit(metrics) || 0;
    const annualProfit = this.getAnnualProfit(metrics) || 0;
    
    return {
      monthly_revenue: monthlyRevenue,
      annual_revenue: annualRevenue,
      monthly_profit: monthlyProfit,
      annual_profit: annualProfit,
      profit_margin: this.getProfitMargin(annualRevenue, annualProfit)
    };
  }
}

/**
 * Format currency values
 */
export function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '$0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercentage(value?: number): string {
  if (value === undefined || value === null) return '0%';
  
  return `${value.toFixed(1)}%`;
}
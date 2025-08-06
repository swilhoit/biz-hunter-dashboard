import React from 'react';
import { Deal } from '../types/deal';
import { TrendingUp, DollarSign, Calculator, AlertCircle, FileText } from 'lucide-react';

interface BusinessValuationProps {
  deal: Deal;
}

export default function BusinessValuation({ deal }: BusinessValuationProps) {
  // Calculate various valuation metrics
  const calculateMetrics = () => {
    const metrics = {
      hasData: false,
      askingPrice: deal.asking_price || 0,
      annualRevenue: deal.annual_revenue || 0,
      annualProfit: deal.annual_profit || 0,
      ebitda: deal.ebitda || 0,
      sde: deal.sde || 0,
      calculatedMultiple: 0,
      revenueMultiple: 0,
      profitMultiple: 0,
      ebitdaMultiple: 0,
      sdeMultiple: 0,
      valuationRange: { low: 0, high: 0 },
      suggestedValuation: 0
    };

    // Check if we have financial data
    if (deal.annual_revenue || deal.annual_profit || deal.ebitda || deal.sde) {
      metrics.hasData = true;
    }

    // Calculate multiples based on available data
    if (deal.asking_price) {
      if (deal.annual_revenue && deal.annual_revenue > 0) {
        metrics.revenueMultiple = deal.asking_price / deal.annual_revenue;
      }
      if (deal.annual_profit && deal.annual_profit > 0) {
        metrics.profitMultiple = deal.asking_price / deal.annual_profit;
      }
      if (deal.ebitda && deal.ebitda > 0) {
        metrics.ebitdaMultiple = deal.asking_price / deal.ebitda;
      }
      if (deal.sde && deal.sde > 0) {
        metrics.sdeMultiple = deal.asking_price / deal.sde;
      }
    }

    // Calculate suggested valuation based on industry standards
    // For Amazon FBA businesses, typical multiples are:
    // SDE: 2.5-4.5x
    // EBITDA: 3-5x
    // Revenue: 0.3-1.2x (depending on margin)
    
    const valuations = [];
    
    if (deal.sde && deal.sde > 0) {
      const sdeLow = deal.sde * 2.5;
      const sdeHigh = deal.sde * 4.5;
      valuations.push({ low: sdeLow, high: sdeHigh, weight: 0.4 });
    }
    
    if (deal.ebitda && deal.ebitda > 0) {
      const ebitdaLow = deal.ebitda * 3;
      const ebitdaHigh = deal.ebitda * 5;
      valuations.push({ low: ebitdaLow, high: ebitdaHigh, weight: 0.3 });
    }
    
    if (deal.annual_profit && deal.annual_profit > 0) {
      const profitLow = deal.annual_profit * 2.5;
      const profitHigh = deal.annual_profit * 4;
      valuations.push({ low: profitLow, high: profitHigh, weight: 0.2 });
    }
    
    if (deal.annual_revenue && deal.annual_revenue > 0) {
      // Use revenue multiple based on profit margin
      const margin = deal.annual_profit ? (deal.annual_profit / deal.annual_revenue) : 0.15;
      const revMultipleLow = margin > 0.2 ? 0.6 : 0.3;
      const revMultipleHigh = margin > 0.2 ? 1.2 : 0.8;
      const revLow = deal.annual_revenue * revMultipleLow;
      const revHigh = deal.annual_revenue * revMultipleHigh;
      valuations.push({ low: revLow, high: revHigh, weight: 0.1 });
    }

    // Calculate weighted average valuation range
    if (valuations.length > 0) {
      const totalWeight = valuations.reduce((sum, v) => sum + v.weight, 0);
      metrics.valuationRange.low = valuations.reduce((sum, v) => sum + (v.low * v.weight), 0) / totalWeight;
      metrics.valuationRange.high = valuations.reduce((sum, v) => sum + (v.high * v.weight), 0) / totalWeight;
      metrics.suggestedValuation = (metrics.valuationRange.low + metrics.valuationRange.high) / 2;
    }

    // Use the valuation_multiple field if no calculated multiple exists
    if (!metrics.calculatedMultiple && deal.valuation_multiple) {
      metrics.calculatedMultiple = deal.valuation_multiple;
    } else if (metrics.sdeMultiple > 0) {
      metrics.calculatedMultiple = metrics.sdeMultiple;
    } else if (metrics.ebitdaMultiple > 0) {
      metrics.calculatedMultiple = metrics.ebitdaMultiple;
    } else if (metrics.profitMultiple > 0) {
      metrics.calculatedMultiple = metrics.profitMultiple;
    }

    return metrics;
  };

  const metrics = calculateMetrics();

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '$0';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatMultiple = (multiple: number) => {
    if (multiple === 0) return 'N/A';
    return `${multiple.toFixed(2)}x`;
  };

  const getValuationStatus = () => {
    if (!metrics.hasData || !deal.asking_price || metrics.suggestedValuation === 0) {
      return null;
    }

    const diff = ((deal.asking_price - metrics.suggestedValuation) / metrics.suggestedValuation) * 100;
    
    if (diff > 20) {
      return { status: 'Overpriced', color: 'text-red-600 bg-red-100', percentage: diff };
    } else if (diff < -20) {
      return { status: 'Undervalued', color: 'text-green-600 bg-green-100', percentage: Math.abs(diff) };
    } else {
      return { status: 'Fair Value', color: 'text-blue-600 bg-blue-100', percentage: Math.abs(diff) };
    }
  };

  const valuationStatus = getValuationStatus();

  if (!metrics.hasData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Business Valuation
        </h3>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No financial data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload financial documents for valuation analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
        <Calculator className="w-5 h-5 mr-2" />
        Business Valuation Analysis
      </h3>

      {/* Valuation Summary */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Asking Price</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(metrics.askingPrice)}
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Suggested Valuation</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.suggestedValuation > 0 
                ? formatCurrency(metrics.suggestedValuation)
                : 'N/A'
              }
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valuation Range</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {metrics.valuationRange.low > 0 
                ? `${formatCurrency(metrics.valuationRange.low)} - ${formatCurrency(metrics.valuationRange.high)}`
                : 'N/A'
              }
            </p>
          </div>
        </div>

        {valuationStatus && (
          <div className={`rounded-lg p-3 ${valuationStatus.color.replace('text-', 'bg-').replace('-600', '-100')} dark:bg-opacity-20`}>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${valuationStatus.color.split(' ')[0]}`}>
                {valuationStatus.status}
              </span>
              <span className={`text-sm ${valuationStatus.color.split(' ')[0]}`}>
                {valuationStatus.percentage.toFixed(1)}% {valuationStatus.status === 'Overpriced' ? 'above' : 'below'} suggested value
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Multiple Analysis */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">Valuation Multiples</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.sdeMultiple > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">SDE Multiple</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {formatMultiple(metrics.sdeMultiple)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Industry: 2.5-4.5x
              </p>
            </div>
          )}
          
          {metrics.ebitdaMultiple > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">EBITDA Multiple</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {formatMultiple(metrics.ebitdaMultiple)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Industry: 3-5x
              </p>
            </div>
          )}
          
          {metrics.profitMultiple > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Profit Multiple</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {formatMultiple(metrics.profitMultiple)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Industry: 2.5-4x
              </p>
            </div>
          )}
          
          {metrics.revenueMultiple > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Multiple</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {formatMultiple(metrics.revenueMultiple)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Industry: 0.3-1.2x
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Financial Metrics Used</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {metrics.annualRevenue > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Annual Revenue:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(metrics.annualRevenue)}
              </span>
            </div>
          )}
          {metrics.annualProfit > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Annual Profit:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(metrics.annualProfit)}
              </span>
            </div>
          )}
          {metrics.sde > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">SDE:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(metrics.sde)}
              </span>
            </div>
          )}
          {metrics.ebitda > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">EBITDA:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(metrics.ebitda)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            This valuation is based on industry averages for Amazon FBA businesses. 
            Actual value depends on growth trends, market position, and other qualitative factors.
          </p>
        </div>
      </div>
    </div>
  );
}
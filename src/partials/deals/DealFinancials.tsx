import React, { useState, useEffect } from 'react';
import { Deal } from '../../types/deal';
import { DollarSign, TrendingUp, TrendingDown, Calculator, PieChart, FileText, Brain, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import LineChart01 from '../../charts/LineChart01';
import BarChart01 from '../../charts/BarChart01';
import DoughnutChart from '../../charts/DoughnutChart';
import { chartColors } from '../../charts/ChartjsConfig';
import { tailwindConfig, hexToRGB } from '../../utils/Utils';
import { FinancialDocumentService, FinancialExtraction } from '../../services/FinancialDocumentService';
import FinancialExtractionModal from '../../components/FinancialExtractionModal';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface DealFinancialsProps {
  deal: Deal;
}

function DealFinancials({ deal }: DealFinancialsProps) {
  const [financialExtractions, setFinancialExtractions] = useState<FinancialExtraction[]>([]);
  const [latestExtraction, setLatestExtraction] = useState<FinancialExtraction | null>(null);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [pendingExtraction, setPendingExtraction] = useState<FinancialExtraction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const financialService = new FinancialDocumentService();

  useEffect(() => {
    loadFinancialExtractions();
    
    // Listen for navigate-to-finance event from DealFiles
    const handleNavigateToFinance = (event: CustomEvent) => {
      if (event.detail.dealId === deal.id && event.detail.extraction) {
        setPendingExtraction(event.detail.extraction);
        setShowExtractionModal(true);
      }
    };
    
    window.addEventListener('navigate-to-finance', handleNavigateToFinance as EventListener);
    return () => {
      window.removeEventListener('navigate-to-finance', handleNavigateToFinance as EventListener);
    };
  }, [deal.id]);

  const loadFinancialExtractions = async () => {
    try {
      setIsLoading(true);
      const extractions = await financialService.getDealFinancialExtractions(deal.id);
      setFinancialExtractions(extractions);
      
      const validated = await financialService.getLatestValidatedFinancials(deal.id);
      setLatestExtraction(validated);
    } catch (error) {
      console.error('Error loading financial extractions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmExtraction = async (extraction: FinancialExtraction) => {
    try {
      // Update the extraction with validation status
      const supabaseAny: any = supabase;
      const { error } = await supabaseAny
        .from('financial_extractions')
        .update({
          validation_status: extraction.validation_status,
          financial_data: extraction.financial_data
        })
        .eq('id', extraction.id);

      if (error) throw error;

      showToast('Financial data validated and applied!', 'success');
      setShowExtractionModal(false);
      setPendingExtraction(null);
      
      // Reload extractions
      await loadFinancialExtractions();
      
      // Reload deal data to get updated financials
      window.location.reload();
    } catch (error: any) {
      showToast(`Failed to save validation: ${error.message}`, 'error');
    }
  };

  const handleRejectExtraction = () => {
    setShowExtractionModal(false);
    setPendingExtraction(null);
    showToast('Financial extraction rejected', 'info');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return `$${amount.toLocaleString()}`;
  };

  const calculateProfitMargin = () => {
    if (!deal.annual_revenue || !deal.annual_profit) return 0;
    return ((deal.annual_profit / deal.annual_revenue) * 100);
  };

  const calculateROI = () => {
    if (!deal.asking_price || !deal.annual_profit) return 0;
    return ((deal.annual_profit / deal.asking_price) * 100);
  };

  // Use AI-extracted data if available
  const financialData = latestExtraction?.financial_data || {
    revenue: { total: deal.annual_revenue || 0 },
    netIncome: deal.annual_profit || 0,
    ebitda: deal.ebitda || 0,
    metrics: {
      grossMargin: calculateProfitMargin() / 100,
      operatingMargin: 0,
      netMargin: calculateProfitMargin() / 100
    }
  };

  // Mock historical data - in real app this would come from API
  const monthlyData = [
    { month: 'Jan', revenue: 380000, profit: 76000 },
    { month: 'Feb', revenue: 395000, profit: 79000 },
    { month: 'Mar', revenue: 410000, profit: 82000 },
    { month: 'Apr', revenue: 385000, profit: 77000 },
    { month: 'May', revenue: 420000, profit: 84000 },
    { month: 'Jun', revenue: 405000, profit: 81000 },
  ];

  // Prepare data for Chart.js LineChart
  const lineChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyData.map(d => d.revenue),
        borderColor: tailwindConfig().theme.colors.emerald[500],
        backgroundColor: `rgba(${hexToRGB(tailwindConfig().theme.colors.emerald[500])}, 0.08)`,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: tailwindConfig().theme.colors.emerald[500],
        fill: true,
      },
      {
        label: 'Profit',
        data: monthlyData.map(d => d.profit),
        borderColor: tailwindConfig().theme.colors.blue[500],
        backgroundColor: `rgba(${hexToRGB(tailwindConfig().theme.colors.blue[500])}, 0.08)`,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: tailwindConfig().theme.colors.blue[500],
        fill: true,
      },
    ],
  };

  // Prepare data for Chart.js BarChart
  const barChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyData.map(d => d.revenue),
        backgroundColor: tailwindConfig().theme.colors.emerald[500],
        hoverBackgroundColor: tailwindConfig().theme.colors.emerald[600],
        borderRadius: 4,
        categoryPercentage: 0.66,
      },
      {
        label: 'Profit',
        data: monthlyData.map(d => d.profit),
        backgroundColor: tailwindConfig().theme.colors.blue[500],
        hoverBackgroundColor: tailwindConfig().theme.colors.blue[600],
        borderRadius: 4,
        categoryPercentage: 0.66,
      },
    ],
  };

  // Prepare data for profit breakdown doughnut chart
  const profitBreakdownData = {
    labels: ['Net Profit', 'Operating Costs', 'Marketing', 'Inventory'],
    datasets: [
      {
        label: 'Profit Breakdown',
        data: [
          deal.annual_profit || 0,
          (deal.annual_revenue || 0) * 0.4, // 40% operating costs
          (deal.annual_revenue || 0) * 0.15, // 15% marketing
          (deal.annual_revenue || 0) * 0.25, // 25% inventory
        ],
        backgroundColor: [
          tailwindConfig().theme.colors.emerald[500],
          tailwindConfig().theme.colors.amber[500],
          tailwindConfig().theme.colors.blue[500],
          tailwindConfig().theme.colors.purple[500],
        ],
        hoverBackgroundColor: [
          tailwindConfig().theme.colors.emerald[600],
          tailwindConfig().theme.colors.amber[600],
          tailwindConfig().theme.colors.blue[600],
          tailwindConfig().theme.colors.purple[600],
        ],
        borderWidth: 0,
      },
    ],
  };

  const keyMetrics = [
    {
      title: 'Annual Revenue',
      value: formatCurrency(financialData.revenue.total || deal.annual_revenue),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      isAIExtracted: latestExtraction && financialData.revenue.total ? true : false,
    },
    {
      title: 'Annual Profit',
      value: formatCurrency(financialData.netIncome || deal.annual_profit),
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      isAIExtracted: latestExtraction && financialData.netIncome ? true : false,
    },
    {
      title: 'EBITDA',
      value: formatCurrency(financialData.ebitda || deal.ebitda),
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      isAIExtracted: latestExtraction && financialData.ebitda ? true : false,
    },
    {
      title: 'SDE',
      value: formatCurrency(deal.sde),
      icon: Calculator,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    },
    {
      title: 'Asking Price',
      value: formatCurrency(deal.asking_price),
      icon: Calculator,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Profit Margin',
      value: `${(financialData.metrics.netMargin * 100).toFixed(1)}%`,
      icon: PieChart,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      isAIExtracted: latestExtraction && financialData.metrics.netMargin ? true : false,
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(latestExtraction?.financial_data?.assets?.current?.inventory || 0),
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      isAIExtracted: latestExtraction && latestExtraction.financial_data?.assets?.current?.inventory ? true : false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI Extraction Status */}
      {latestExtraction && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  AI-Extracted Financial Data Active
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Last updated: {new Date(latestExtraction.extraction_date).toLocaleDateString()} • 
                  Period: {new Date(latestExtraction.period_covered.startDate).toLocaleDateString()} - {new Date(latestExtraction.period_covered.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-700 dark:text-green-300">
                Confidence: {(latestExtraction.confidence_scores.overall * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => loadFinancialExtractions()}
                className="p-2 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors"
                title="Refresh extractions"
              >
                <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No AI Extraction Alert */}
      {!latestExtraction && financialExtractions.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                No AI-Extracted Financial Data
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Upload financial documents in the Files tab and click the dollar sign icon to extract financial data automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Extractions */}
      {financialExtractions.filter(e => !e.validation_status.isValidated).length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {financialExtractions.filter(e => !e.validation_status.isValidated).length} Pending Financial Extraction(s)
              </p>
            </div>
            <button
              onClick={() => {
                const pending = financialExtractions.find(e => !e.validation_status.isValidated);
                if (pending) {
                  setPendingExtraction(pending);
                  setShowExtractionModal(true);
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metric.value}</p>
                  </div>
                </div>
                {metric.isAIExtracted && (
                  <div className="flex items-center" title="AI-extracted data">
                    <Brain className="w-4 h-4 text-purple-500" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI-Extracted Detailed Financials */}
      {latestExtraction && latestExtraction.financial_data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-500" />
              AI-Extracted Financial Details
            </h3>
            <span className="text-sm text-gray-500">
              {latestExtraction.document_type.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Revenue Breakdown */}
            {latestExtraction.financial_data.revenue.breakdown && 
             Object.entries(latestExtraction.financial_data.revenue.breakdown).filter(([_, v]) => v !== null).length > 0 && (
              <div className="col-span-full">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Revenue Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(latestExtraction.financial_data.revenue.breakdown)
                    .filter(([_, value]) => value !== null)
                    .map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(value as number)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Expense Breakdown */}
            {latestExtraction.financial_data.operatingExpenses.breakdown && 
             Object.entries(latestExtraction.financial_data.operatingExpenses.breakdown).filter(([_, v]) => v !== null).length > 0 && (
              <div className="col-span-full">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Operating Expenses Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(latestExtraction.financial_data.operatingExpenses.breakdown)
                    .filter(([_, value]) => value !== null)
                    .map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(value as number)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Additional Metrics */}
            <div className="col-span-full">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {latestExtraction.financial_data.cogs.total > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">COGS</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(latestExtraction.financial_data.cogs.total)}
                    </p>
                  </div>
                )}
                {latestExtraction.financial_data.grossProfit > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Gross Profit</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(latestExtraction.financial_data.grossProfit)}
                    </p>
                  </div>
                )}
                {latestExtraction.financial_data.metrics.grossMargin > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Gross Margin</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {(latestExtraction.financial_data.metrics.grossMargin * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
                {latestExtraction.financial_data.assets?.current?.inventory && latestExtraction.financial_data.assets.current.inventory > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Inventory</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(latestExtraction.financial_data.assets.current.inventory)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Ratios</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-gray-600 dark:text-gray-400">Valuation Multiple</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {deal.valuation_multiple ? `${deal.valuation_multiple.toFixed(1)}x` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-gray-600 dark:text-gray-400">Profit Margin</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {calculateProfitMargin().toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-gray-600 dark:text-gray-400">Annual ROI</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {calculateROI().toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-gray-600 dark:text-gray-400">Monthly Revenue</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(deal.monthly_revenue)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-gray-600 dark:text-gray-400">Monthly Profit</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(deal.monthly_profit)}
              </span>
            </div>
            {deal.ebitda && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-400">EBITDA</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(deal.ebitda)}
                </span>
              </div>
            )}
            {deal.sde && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-400">SDE</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(deal.sde)}
                </span>
              </div>
            )}
            {deal.employee_count && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-400">Employees</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {deal.employee_count}
                </span>
              </div>
            )}
            {deal.inventory_value && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-400">Inventory Value</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(deal.inventory_value)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Investment Analysis</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-800 dark:text-green-200 font-medium">Payback Period</span>
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {deal.asking_price && deal.annual_profit 
                  ? `${(deal.asking_price / deal.annual_profit).toFixed(1)} years`
                  : 'N/A'
                }
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-800 dark:text-blue-200 font-medium">Cash-on-Cash Return</span>
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {calculateROI().toFixed(1)}%
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-800 dark:text-purple-200 font-medium">Deal Score</span>
                <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {deal.priority ? `${deal.priority * 20}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">6-Month Performance Trend</h3>
        <div className="relative">
          <LineChart01 data={lineChartData} width={800} height={320} />
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Revenue vs Profit</h3>
          <div className="relative">
            <BarChart01 data={barChartData} width={400} height={320} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Breakdown</h3>
          <div className="relative">
            <DoughnutChart data={profitBreakdownData} width={400} height={320} />
          </div>
        </div>
      </div>

      {/* Financial Extraction Modal */}
      {pendingExtraction && (
        <FinancialExtractionModal
          isOpen={showExtractionModal}
          onClose={() => setShowExtractionModal(false)}
          extraction={pendingExtraction}
          onConfirm={handleConfirmExtraction}
          onReject={handleRejectExtraction}
          fileName={`Financial Document - ${pendingExtraction.document_type}`}
        />
      )}
    </div>
  );
}

export default DealFinancials;
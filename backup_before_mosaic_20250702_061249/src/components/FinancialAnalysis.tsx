import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  BarChart3,
  PieChart,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FileSpreadsheet,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface FinancialData {
  id: string;
  deal_id: string;
  year: number;
  month?: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  operating_expenses: number;
  ebitda: number;
  net_income: number;
  units_sold?: number;
  average_order_value?: number;
  customer_count?: number;
  return_rate?: number;
  metrics?: any;
  created_at: string;
}

interface ValuationModel {
  id: string;
  deal_id: string;
  valuation_method: string;
  valuation_amount: number;
  assumptions: any;
  created_by: string;
  created_at: string;
}

interface FinancialAnalysisProps {
  dealId: string;
  dealName: string;
  currentAskingPrice?: number;
  currentRevenue?: number;
  currentEbitda?: number;
}

const VALUATION_METHODS = [
  {
    id: 'dcf',
    name: 'Discounted Cash Flow (DCF)',
    description: 'Values the business based on projected future cash flows',
    fields: ['growth_rate', 'discount_rate', 'terminal_value']
  },
  {
    id: 'multiples',
    name: 'Industry Multiples',
    description: 'Values based on comparable business sale multiples',
    fields: ['revenue_multiple', 'ebitda_multiple', 'industry_benchmark']
  },
  {
    id: 'asset_based',
    name: 'Asset-Based Valuation',
    description: 'Values based on net assets and tangible value',
    fields: ['book_value', 'asset_adjustments', 'intangible_value']
  },
  {
    id: 'roi',
    name: 'ROI Analysis',
    description: 'Values based on return on investment expectations',
    fields: ['target_roi', 'payback_period', 'risk_factor']
  }
];

export default function FinancialAnalysis({ 
  dealId, 
  dealName, 
  currentAskingPrice = 0,
  currentRevenue = 0,
  currentEbitda = 0 
}: FinancialAnalysisProps) {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [valuations, setValuations] = useState<ValuationModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddFinancial, setShowAddFinancial] = useState(false);
  const [showValuationModel, setShowValuationModel] = useState(false);
  const [selectedValuationMethod, setSelectedValuationMethod] = useState('multiples');

  useEffect(() => {
    fetchFinancialData();
    fetchValuations();
  }, [dealId]);

  const fetchFinancialData = async () => {
    try {
      const { data, error } = await supabase
        .from('deal_financials')
        .select('*')
        .eq('deal_id', dealId)
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (error) throw error;
      setFinancialData(data || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const fetchValuations = async () => {
    try {
      const { data, error } = await supabase
        .from('deal_valuations')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setValuations(data || []);
    } catch (error) {
      console.error('Error fetching valuations:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialMetrics = () => {
    if (financialData.length === 0) return null;

    const latestYear = Math.max(...financialData.map(d => d.year));
    const latestData = financialData.filter(d => d.year === latestYear);
    
    const totalRevenue = latestData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const totalEbitda = latestData.reduce((sum, d) => sum + (d.ebitda || 0), 0);
    const totalCogs = latestData.reduce((sum, d) => sum + (d.cogs || 0), 0);
    
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0;
    const ebitdaMargin = totalRevenue > 0 ? (totalEbitda / totalRevenue) * 100 : 0;
    
    // Calculate year-over-year growth
    const previousYear = latestYear - 1;
    const previousData = financialData.filter(d => d.year === previousYear);
    const previousRevenue = previousData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    const currentMultiple = totalEbitda > 0 ? currentAskingPrice / totalEbitda : 0;
    
    return {
      totalRevenue,
      totalEbitda,
      grossMargin,
      ebitdaMargin,
      revenueGrowth,
      currentMultiple,
      latestYear
    };
  };

  const runValuationModel = (method: string, assumptions: any) => {
    const metrics = calculateFinancialMetrics();
    if (!metrics) return 0;

    switch (method) {
      case 'multiples':
        const revenueMultiple = assumptions.revenue_multiple || 2;
        const ebitdaMultiple = assumptions.ebitda_multiple || 4;
        return Math.max(
          metrics.totalRevenue * revenueMultiple,
          metrics.totalEbitda * ebitdaMultiple
        );
        
      case 'dcf':
        const growthRate = assumptions.growth_rate || 0.1;
        const discountRate = assumptions.discount_rate || 0.12;
        const terminalMultiple = assumptions.terminal_multiple || 3;
        
        let dcfValue = 0;
        let cashFlow = metrics.totalEbitda;
        
        // 5-year projection
        for (let year = 1; year <= 5; year++) {
          cashFlow *= (1 + growthRate);
          dcfValue += cashFlow / Math.pow(1 + discountRate, year);
        }
        
        // Terminal value
        const terminalValue = (cashFlow * terminalMultiple) / Math.pow(1 + discountRate, 5);
        return dcfValue + terminalValue;
        
      case 'asset_based':
        const bookValue = assumptions.book_value || currentAskingPrice * 0.6;
        const assetAdjustments = assumptions.asset_adjustments || 0;
        const intangibleValue = assumptions.intangible_value || metrics.totalRevenue * 0.5;
        return bookValue + assetAdjustments + intangibleValue;
        
      case 'roi':
        const targetRoi = assumptions.target_roi || 0.25;
        const riskFactor = assumptions.risk_factor || 1;
        return (metrics.totalEbitda / targetRoi) * riskFactor;
        
      default:
        return 0;
    }
  };

  const metrics = calculateFinancialMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'historical', label: 'Historical Data', icon: Calendar },
    { id: 'valuation', label: 'Valuation Models', icon: Calculator },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Financial Analysis</h2>
            <p className="text-gray-600">{dealName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddFinancial(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Financial Data
            </button>
            <button
              onClick={() => setShowValuationModel(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Calculator className="w-4 h-4" />
              Run Valuation
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            metrics={metrics} 
            currentAskingPrice={currentAskingPrice}
            valuations={valuations}
          />
        )}
        {activeTab === 'historical' && (
          <HistoricalDataTab 
            financialData={financialData}
            onRefresh={fetchFinancialData}
          />
        )}
        {activeTab === 'valuation' && (
          <ValuationTab 
            valuations={valuations}
            onRefresh={fetchValuations}
            dealId={dealId}
          />
        )}
        {activeTab === 'analysis' && (
          <AnalysisTab 
            financialData={financialData}
            metrics={metrics}
          />
        )}
      </div>

      {/* Add Financial Data Modal */}
      {showAddFinancial && (
        <AddFinancialDataModal
          dealId={dealId}
          onClose={() => setShowAddFinancial(false)}
          onSave={() => {
            fetchFinancialData();
            setShowAddFinancial(false);
          }}
        />
      )}

      {/* Valuation Model Modal */}
      {showValuationModel && (
        <ValuationModelModal
          dealId={dealId}
          selectedMethod={selectedValuationMethod}
          onMethodChange={setSelectedValuationMethod}
          onRun={runValuationModel}
          onClose={() => setShowValuationModel(false)}
          onSave={() => {
            fetchValuations();
            setShowValuationModel(false);
          }}
        />
      )}
    </div>
  );
}

function OverviewTab({ metrics, currentAskingPrice, valuations }: any) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Data</h3>
        <p className="text-gray-600">Add historical financial data to see analysis and metrics.</p>
      </div>
    );
  }

  const avgValuation = valuations.length > 0 
    ? valuations.reduce((sum, v) => sum + v.valuation_amount, 0) / valuations.length 
    : 0;

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Annual Revenue</p>
              <p className="text-2xl font-semibold text-blue-900">{formatCurrency(metrics.totalRevenue)}</p>
              <div className="flex items-center mt-2 text-sm">
                {metrics.revenueGrowth > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={metrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPercent(Math.abs(metrics.revenueGrowth))} YoY
                </span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">EBITDA</p>
              <p className="text-2xl font-semibold text-green-900">{formatCurrency(metrics.totalEbitda)}</p>
              <p className="text-sm text-green-600 mt-2">{formatPercent(metrics.ebitdaMargin)} margin</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Current Multiple</p>
              <p className="text-2xl font-semibold text-orange-900">{metrics.currentMultiple.toFixed(1)}x</p>
              <p className="text-sm text-orange-600 mt-2">EBITDA multiple</p>
            </div>
            <Calculator className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Gross Margin</p>
              <p className="text-2xl font-semibold text-purple-900">{formatPercent(metrics.grossMargin)}</p>
              <p className="text-sm text-purple-600 mt-2">Profit margin</p>
            </div>
            <PieChart className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Valuation Summary */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Valuation Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Current Asking Price</p>
            <p className="text-xl font-semibold">{formatCurrency(currentAskingPrice)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Average Valuation</p>
            <p className="text-xl font-semibold">{formatCurrency(avgValuation)}</p>
            {avgValuation > 0 && (
              <p className="text-sm mt-1">
                {avgValuation > currentAskingPrice ? (
                  <span className="text-green-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {formatPercent(((avgValuation - currentAskingPrice) / currentAskingPrice) * 100)} above ask
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    {formatPercent(((currentAskingPrice - avgValuation) / currentAskingPrice) * 100)} below ask
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Valuations Run</p>
            <p className="text-xl font-semibold">{valuations.length}</p>
          </div>
        </div>
      </div>

      {/* Health Score */}
      <FinancialHealthScore metrics={metrics} />
    </div>
  );
}

function FinancialHealthScore({ metrics }: any) {
  const calculateHealthScore = () => {
    let score = 50; // Base score

    // Revenue growth (20 points max)
    if (metrics.revenueGrowth > 20) score += 20;
    else if (metrics.revenueGrowth > 10) score += 15;
    else if (metrics.revenueGrowth > 5) score += 10;
    else if (metrics.revenueGrowth > 0) score += 5;
    else score -= 10;

    // EBITDA margin (20 points max)
    if (metrics.ebitdaMargin > 30) score += 20;
    else if (metrics.ebitdaMargin > 20) score += 15;
    else if (metrics.ebitdaMargin > 15) score += 10;
    else if (metrics.ebitdaMargin > 10) score += 5;

    // Gross margin (15 points max)
    if (metrics.grossMargin > 70) score += 15;
    else if (metrics.grossMargin > 50) score += 10;
    else if (metrics.grossMargin > 30) score += 5;

    // Multiple reasonableness (15 points max)
    if (metrics.currentMultiple < 3) score += 15;
    else if (metrics.currentMultiple < 4) score += 10;
    else if (metrics.currentMultiple < 5) score += 5;
    else if (metrics.currentMultiple > 6) score -= 10;

    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Financial Health Score</h3>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getScoreColor(healthScore)}`}>
            {healthScore}
          </span>
          <span className="text-gray-500">/100</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span>Overall Rating:</span>
          <span className={`font-semibold ${getScoreColor(healthScore)}`}>
            {getScoreLabel(healthScore)}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              healthScore >= 80 ? 'bg-green-600' :
              healthScore >= 60 ? 'bg-yellow-600' :
              healthScore >= 40 ? 'bg-orange-600' : 'bg-red-600'
            }`}
            style={{ width: `${healthScore}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            {metrics.revenueGrowth > 0 ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span>Revenue Growth: {metrics.revenueGrowth.toFixed(1)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            {metrics.ebitdaMargin > 15 ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            )}
            <span>EBITDA Margin: {metrics.ebitdaMargin.toFixed(1)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            {metrics.grossMargin > 50 ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            )}
            <span>Gross Margin: {metrics.grossMargin.toFixed(1)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            {metrics.currentMultiple < 5 ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            )}
            <span>Valuation Multiple: {metrics.currentMultiple.toFixed(1)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoricalDataTab({ financialData, onRefresh }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Historical Financial Data</h3>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
      
      {financialData.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Historical Data</h3>
          <p className="text-gray-600">Add financial data for different time periods to track performance.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Period</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Revenue</th>
                <th className="border border-gray-300 px-4 py-2 text-right">COGS</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Gross Profit</th>
                <th className="border border-gray-300 px-4 py-2 text-right">EBITDA</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Net Income</th>
              </tr>
            </thead>
            <tbody>
              {financialData.map((data: FinancialData) => (
                <tr key={data.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    {data.month ? `${data.year}-${data.month.toString().padStart(2, '0')}` : data.year}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ${data.revenue?.toLocaleString() || 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ${data.cogs?.toLocaleString() || 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ${data.gross_profit?.toLocaleString() || 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ${data.ebitda?.toLocaleString() || 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ${data.net_income?.toLocaleString() || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ValuationTab({ valuations, onRefresh, dealId }: any) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Valuation Models</h3>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
      
      {valuations.length === 0 ? (
        <div className="text-center py-12">
          <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Valuations</h3>
          <p className="text-gray-600">Run valuation models to estimate business value.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {valuations.map((valuation: ValuationModel) => (
            <div key={valuation.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold">{valuation.valuation_method.toUpperCase()}</h4>
                  <p className="text-sm text-gray-600">
                    {format(new Date(valuation.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(valuation.valuation_amount)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <h5 className="font-medium">Assumptions:</h5>
                {Object.entries(valuation.assumptions || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key.replace('_', ' ')}:</span>
                    <span>{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalysisTab({ financialData, metrics }: any) {
  // This would contain charts and detailed analysis
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Detailed Analysis</h3>
      <p className="text-gray-600">
        Advanced charts and analysis tools will be implemented here.
        This could include trend analysis, seasonality patterns, 
        benchmarking against industry standards, and risk assessment.
      </p>
    </div>
  );
}

// Modal components would be implemented here
function AddFinancialDataModal({ dealId, onClose, onSave }: any) {
  // Implementation for adding financial data
  return null;
}

function ValuationModelModal({ dealId, selectedMethod, onMethodChange, onRun, onClose, onSave }: any) {
  // Implementation for valuation model
  return null;
}
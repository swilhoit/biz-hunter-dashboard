import React, { useState } from 'react';
import { X, DollarSign, TrendingUp, FileText, AlertCircle, Check, Edit2 } from 'lucide-react';
import { FinancialExtraction } from '../services/FinancialDocumentService';

interface FinancialExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  extraction: FinancialExtraction;
  fileName: string;
  onConfirm: (updatedData: FinancialExtraction) => void;
  onReject: () => void;
}

function FinancialExtractionModal({ 
  isOpen, 
  onClose, 
  extraction, 
  fileName,
  onConfirm,
  onReject 
}: FinancialExtractionModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(extraction?.financial_data || {
    revenue: { total: 0 },
    cogs: { total: 0 },
    grossProfit: 0,
    operatingExpenses: { total: 0 },
    ebitda: 0,
    netIncome: 0,
    margins: { gross: 0, operating: 0, net: 0 },
    assets: { total: 0 },
    liabilities: { total: 0 },
    equity: { total: 0 }
  });

  console.log('💰 FinancialExtractionModal rendered:', {
    isOpen,
    hasExtraction: !!extraction,
    fileName,
    financialData: extraction?.financial_data,
    revenue: extraction?.financial_data?.revenue?.total,
    netIncome: extraction?.financial_data?.netIncome
  });

  if (!isOpen || !extraction) {
    console.log('💰 Modal not showing because:', { isOpen, hasExtraction: !!extraction });
    return null;
  }

  const validationIssues = extraction.validation_status?.issues || [];
  const hasErrors = validationIssues.some(issue => issue.severity === 'error');
  const hasWarnings = validationIssues.some(issue => issue.severity === 'warning');

  const financialData = editedData || extraction.financial_data || {
    revenue: { total: 0 },
    cogs: { total: 0 },
    grossProfit: 0,
    operatingExpenses: { total: 0 },
    ebitda: 0,
    netIncome: 0,
    margins: { gross: 0, operating: 0, net: 0 },
    assets: { total: 0 },
    liabilities: { total: 0 },
    equity: { total: 0 }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const confidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleConfirm = () => {
    console.log('💰 Confirm button clicked!');
    const updatedExtraction = {
      ...extraction,
      financial_data: editedData,
      validation_status: {
        isValidated: true,
        validatedBy: 'user',
        validatedAt: new Date().toISOString(),
        issues: []
      }
    };
    console.log('💰 Updated extraction to save:', {
      dealId: updatedExtraction.deal_id,
      revenue: updatedExtraction.financial_data?.revenue?.total,
      netIncome: updatedExtraction.financial_data?.netIncome
    });
    onConfirm(updatedExtraction);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Financial Data Extraction
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {fileName} - Review and confirm the extracted data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Document Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Document Type: {extraction.document_type?.replace(/_/g, ' ').toUpperCase() || 'P&L'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Period: {extraction.period_covered?.startDate ? new Date(extraction.period_covered.startDate).toLocaleDateString() : 'N/A'} - {extraction.period_covered?.endDate ? new Date(extraction.period_covered.endDate).toLocaleDateString() : 'N/A'}
                </span>
                <span className={`text-sm font-medium ${confidenceColor(extraction.confidence_scores?.overall || 0.8)}`}>
                  Confidence: {formatPercent(extraction.confidence_scores?.overall || 0.8)}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Issues */}
          {(hasErrors || hasWarnings) && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Validation Issues Found
                  </p>
                  <ul className="mt-2 space-y-1">
                    {validationIssues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-300">
                        • {issue.message || issue.issue} {issue.field ? `(${issue.field})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Financial Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Statement */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Income Statement
              </h3>
              
              <div className="space-y-3">
                <DataRow
                  label="Revenue"
                  value={financialData.revenue?.total || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...financialData,
                    revenue: { ...financialData.revenue, total: val }
                  })}
                  confidence={extraction.confidence_scores?.revenue || 0.8}
                />
                
                <DataRow
                  label="COGS"
                  value={financialData.cogs?.total || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...financialData,
                    cogs: { ...financialData.cogs, total: val }
                  })}
                  confidence={extraction.confidence_scores?.expenses || 0.8}
                />
                
                <DataRow
                  label="Gross Profit"
                  value={financialData.grossProfit || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...financialData,
                    grossProfit: val
                  })}
                  confidence={extraction.confidence_scores?.profitability || 0.8}
                  isCalculated
                />
                
                <DataRow
                  label="Operating Expenses"
                  value={financialData.operatingExpenses?.total || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...financialData,
                    operatingExpenses: { ...financialData.operatingExpenses, total: val }
                  })}
                  confidence={extraction.confidence_scores?.expenses || 0.8}
                />
                
                <DataRow
                  label="EBITDA"
                  value={financialData.ebitda || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...financialData,
                    ebitda: val
                  })}
                  confidence={extraction.confidence_scores?.profitability || 0.8}
                />
                
                <DataRow
                  label="Net Income"
                  value={financialData.netIncome || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...financialData,
                    netIncome: val
                  })}
                  confidence={extraction.confidence_scores?.profitability || 0.8}
                  highlight
                />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Key Metrics
              </h3>
              
              <div className="space-y-3">
                <MetricRow
                  label="Gross Margin"
                  value={financialData.margins?.gross}
                  format="percent"
                />
                
                <MetricRow
                  label="Operating Margin"
                  value={financialData.margins?.operating}
                  format="percent"
                />
                
                <MetricRow
                  label="Net Margin"
                  value={financialData.margins?.net}
                  format="percent"
                />
                
                {financialData.currentRatio && (
                  <MetricRow
                    label="Current Ratio"
                    value={financialData.currentRatio}
                    format="ratio"
                  />
                )}
                
                {financialData.debtToEquity && (
                  <MetricRow
                    label="Debt to Equity"
                    value={financialData.debtToEquity}
                    format="ratio"
                  />
                )}
                
                {financialData.workingCapital && (
                  <MetricRow
                    label="Working Capital"
                    value={financialData.workingCapital}
                    format="currency"
                  />
                )}
              </div>

              {/* Balance Sheet Summary */}
              {(financialData.assets?.total || 0) > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Balance Sheet Summary
                  </h4>
                  <MetricRow
                    label="Total Assets"
                    value={financialData.assets?.total || 0}
                    format="currency"
                  />
                  <MetricRow
                    label="Total Liabilities"
                    value={financialData.liabilities?.total || 0}
                    format="currency"
                  />
                  <MetricRow
                    label="Total Equity"
                    value={financialData.equity?.total || 0}
                    format="currency"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Revenue Breakdown if available */}
          {financialData.revenue?.breakdown && Object.keys(financialData.revenue.breakdown).length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                Revenue Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(financialData.revenue.breakdown).map(([key, value]) => (
                  value !== null && (
                    <div key={key}>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(value)}
                      </p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {extraction.validation_status?.isValidated ? (
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4 mr-1" />
                  Data validated
                </span>
              ) : (
                <span>Please review the extracted data</span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                {isEditing ? 'Done Editing' : 'Edit Values'}
              </button>
              <button
                onClick={onReject}
                className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-red-600"
              >
                Reject
              </button>
              <button
                onClick={handleConfirm}
                className="btn bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm & Update Financials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function DataRow({ 
  label, 
  value, 
  isEditing, 
  onChange, 
  confidence, 
  isCalculated = false,
  highlight = false 
}: {
  label: string;
  value: number;
  isEditing: boolean;
  onChange: (value: number) => void;
  confidence: number;
  isCalculated?: boolean;
  highlight?: boolean;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`flex items-center justify-between py-2 ${highlight ? 'border-t border-gray-200 dark:border-gray-600 pt-3' : ''}`}>
      <span className={`text-sm ${highlight ? 'font-semibold' : ''} text-gray-700 dark:text-gray-300`}>
        {label}
      </span>
      <div className="flex items-center space-x-2">
        {isEditing && !isCalculated ? (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-32 px-2 py-1 text-right border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        ) : (
          <span className={`${highlight ? 'text-lg font-bold' : 'font-medium'} text-gray-900 dark:text-gray-100`}>
            {formatCurrency(value)}
          </span>
        )}
        {confidence < 0.8 && (
          <span className="text-xs text-yellow-600" title={`Confidence: ${(confidence * 100).toFixed(0)}%`}>
            ⚠
          </span>
        )}
      </div>
    </div>
  );
}

function MetricRow({ 
  label, 
  value, 
  format 
}: {
  label: string;
  value: number | null;
  format: 'percent' | 'currency' | 'ratio';
}) {
  if (value === null) return null;

  const formatValue = () => {
    switch (format) {
      case 'percent':
        return `${(value * 100).toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'ratio':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {formatValue()}
      </span>
    </div>
  );
}

export default FinancialExtractionModal;
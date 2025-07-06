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
  const [editedData, setEditedData] = useState(extraction.financial_data);

  if (!isOpen) return null;

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
                  Document Type: {extraction.document_type.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Period: {new Date(extraction.period_covered.startDate).toLocaleDateString()} - {new Date(extraction.period_covered.endDate).toLocaleDateString()}
                </span>
                <span className={`text-sm font-medium ${confidenceColor(extraction.confidence_scores.overall)}`}>
                  Confidence: {formatPercent(extraction.confidence_scores.overall)}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Issues */}
          {extraction.validation_status.issues && extraction.validation_status.issues.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Validation Issues Found
                  </p>
                  <ul className="mt-2 space-y-1">
                    {extraction.validation_status.issues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-300">
                        • {issue.issue} ({issue.field})
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
                  value={editedData.revenue?.total || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...editedData,
                    revenue: { ...editedData.revenue, total: val }
                  })}
                  confidence={extraction.confidence_scores.revenue || 0.8}
                />
                
                <DataRow
                  label="COGS"
                  value={editedData.cogs?.total || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...editedData,
                    cogs: { ...editedData.cogs, total: val }
                  })}
                  confidence={extraction.confidence_scores.expenses || 0.8}
                />
                
                <DataRow
                  label="Gross Profit"
                  value={editedData.grossProfit || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...editedData,
                    grossProfit: val
                  })}
                  confidence={extraction.confidence_scores.profitability || 0.8}
                  isCalculated
                />
                
                <DataRow
                  label="Operating Expenses"
                  value={editedData.operatingExpenses?.total || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...editedData,
                    operatingExpenses: { ...editedData.operatingExpenses, total: val }
                  })}
                  confidence={extraction.confidence_scores.expenses || 0.8}
                />
                
                <DataRow
                  label="EBITDA"
                  value={editedData.ebitda || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...editedData,
                    ebitda: val
                  })}
                  confidence={extraction.confidence_scores.profitability || 0.8}
                />
                
                <DataRow
                  label="Net Income"
                  value={editedData.netIncome || 0}
                  isEditing={isEditing}
                  onChange={(val) => setEditedData({
                    ...editedData,
                    netIncome: val
                  })}
                  confidence={extraction.confidence_scores.profitability || 0.8}
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
                  value={editedData.margins?.gross}
                  format="percent"
                />
                
                <MetricRow
                  label="Operating Margin"
                  value={editedData.margins?.operating}
                  format="percent"
                />
                
                <MetricRow
                  label="Net Margin"
                  value={editedData.margins?.net}
                  format="percent"
                />
                
                {editedData.currentRatio && (
                  <MetricRow
                    label="Current Ratio"
                    value={editedData.currentRatio}
                    format="ratio"
                  />
                )}
                
                {editedData.debtToEquity && (
                  <MetricRow
                    label="Debt to Equity"
                    value={editedData.debtToEquity}
                    format="ratio"
                  />
                )}
                
                {editedData.workingCapital && (
                  <MetricRow
                    label="Working Capital"
                    value={editedData.workingCapital}
                    format="currency"
                  />
                )}
              </div>

              {/* Balance Sheet Summary */}
              {editedData.assets?.total > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Balance Sheet Summary
                  </h4>
                  <MetricRow
                    label="Total Assets"
                    value={editedData.assets?.total || 0}
                    format="currency"
                  />
                  <MetricRow
                    label="Total Liabilities"
                    value={editedData.liabilities?.total || 0}
                    format="currency"
                  />
                  <MetricRow
                    label="Total Equity"
                    value={editedData.equity?.total || 0}
                    format="currency"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Revenue Breakdown if available */}
          {editedData.revenue.breakdown && Object.keys(editedData.revenue.breakdown).length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                Revenue Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(editedData.revenue.breakdown).map(([key, value]) => (
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
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {isEditing ? 'Done Editing' : 'Edit Values'}
            </button>
            
            <div className="flex items-center space-x-3">
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
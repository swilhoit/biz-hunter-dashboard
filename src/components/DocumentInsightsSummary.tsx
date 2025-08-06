import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, AlertTriangle, Target, Brain } from 'lucide-react';
import { DocumentIntelligenceService } from '../services/DocumentIntelligenceService';

interface DocumentInsightsSummaryProps {
  dealId: string;
}

export default function DocumentInsightsSummary({ dealId }: DocumentInsightsSummaryProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [dealId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const docService = new DocumentIntelligenceService();
      const data = await docService.getDealDocumentSummary(dealId);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load document insights summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary || summary.totalDocuments === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-4">
        <Brain className="w-5 h-5 mr-2 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Document Intelligence Summary
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {summary.totalDocuments}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Documents
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {summary.keyFindings.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Key Findings
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {summary.riskFactors.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Risk Factors
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {summary.opportunities.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Opportunities
          </div>
        </div>
      </div>

      {/* Document Types */}
      {Object.keys(summary.byType).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byType).map(([type, count]) => (
              <span
                key={type}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
              >
                {type.replace(/_/g, ' ')}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Findings */}
      {summary.keyFindings.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Key Findings
            </h4>
          </div>
          <ul className="space-y-1">
            {summary.keyFindings.map((finding: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                • {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Factors */}
      {summary.riskFactors.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 mr-1 text-red-600" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Risk Factors
            </h4>
          </div>
          <ul className="space-y-1">
            {summary.riskFactors.map((risk: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                • {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Opportunities */}
      {summary.opportunities.length > 0 && (
        <div>
          <div className="flex items-center mb-2">
            <Target className="w-4 h-4 mr-1 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Opportunities
            </h4>
          </div>
          <ul className="space-y-1">
            {summary.opportunities.map((opportunity: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                • {opportunity}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
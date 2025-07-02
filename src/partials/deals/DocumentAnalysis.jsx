import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import { tailwindConfig, hexToRGB } from '../../utils/Utils';

function DocumentAnalysis({ selectedDeal }) {
  const [selectedAnalysis, setSelectedAnalysis] = useState('financial');
  
  const analysisTypes = {
    financial: {
      title: 'Financial Analysis',
      insights: [
        {
          type: 'revenue_growth',
          title: 'Revenue Growth Trend',
          value: '+18.5%',
          description: 'Year-over-year revenue growth shows consistent upward trend',
          confidence: 'high',
          documents: ['Q3_Financial_Statement.pdf', 'Bank_Statement_Oct.pdf']
        },
        {
          type: 'margin_analysis',
          title: 'Profit Margin Stability',
          value: '32.1%',
          description: 'Gross margins maintained consistently above 30%',
          confidence: 'high',
          documents: ['Q3_Financial_Statement.pdf']
        },
        {
          type: 'cash_flow',
          title: 'Cash Flow Health',
          value: 'Positive',
          description: 'Strong operating cash flow with seasonal variations',
          confidence: 'medium',
          documents: ['Bank_Statement_Oct.pdf', 'Cash_Flow_Analysis.xlsx']
        },
        {
          type: 'working_capital',
          title: 'Working Capital Efficiency',
          value: '1.8x',
          description: 'Current ratio indicates healthy liquidity position',
          confidence: 'high',
          documents: ['Q3_Financial_Statement.pdf']
        }
      ]
    },
    amazon: {
      title: 'Amazon Performance Analysis',
      insights: [
        {
          type: 'sales_velocity',
          title: 'Sales Velocity Trend',
          value: '+25%',
          description: 'Monthly sales showing strong acceleration',
          confidence: 'high',
          documents: ['Amazon_Report_Nov.xlsx']
        },
        {
          type: 'bsr_performance',
          title: 'Best Seller Rank',
          value: 'Improving',
          description: 'Average BSR improved 40% across main ASINs',
          confidence: 'high',
          documents: ['Amazon_Report_Nov.xlsx']
        },
        {
          type: 'review_sentiment',
          title: 'Customer Satisfaction',
          value: '4.6/5',
          description: 'Strong review sentiment with 89% 4-5 star ratings',
          confidence: 'medium',
          documents: ['Review_Analysis.pdf']
        },
        {
          type: 'inventory_turns',
          title: 'Inventory Efficiency',
          value: '8.2x',
          description: 'Healthy inventory turnover indicating good demand forecasting',
          confidence: 'medium',
          documents: ['FBA_Inventory_Report.xlsx']
        }
      ]
    },
    risk: {
      title: 'Risk Analysis',
      insights: [
        {
          type: 'supplier_concentration',
          title: 'Supplier Dependency',
          value: 'Medium Risk',
          description: '65% of products from single supplier - diversification needed',
          confidence: 'high',
          documents: ['Supplier_Agreement.pdf']
        },
        {
          type: 'amazon_dependency',
          title: 'Platform Concentration',
          value: 'High Risk',
          description: '95% revenue from Amazon - consider multi-channel strategy',
          confidence: 'high',
          documents: ['Amazon_Report_Nov.xlsx']
        },
        {
          type: 'ip_protection',
          title: 'Intellectual Property',
          value: 'Low Risk',
          description: 'Trademarks registered, no pending IP disputes',
          confidence: 'medium',
          documents: ['Trademark_Registration.pdf']
        },
        {
          type: 'regulatory_compliance',
          title: 'Compliance Status',
          value: 'Low Risk',
          description: 'All required certifications current and valid',
          confidence: 'high',
          documents: ['Compliance_Report.pdf']
        }
      ]
    }
  };
  
  const financialChartData = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    datasets: [
      {
        label: 'Revenue ($K)',
        data: [180, 195, 210, 225, 240, 235, 250, 265, 280, 295, 310, 325],
        fill: true,
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          return chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: `rgba(${hexToRGB(tailwindConfig().theme.colors.green[500])}, 0)` },
            { stop: 1, color: `rgba(${hexToRGB(tailwindConfig().theme.colors.green[500])}, 0.2)` }
          ]);
        },            
        borderColor: tailwindConfig().theme.colors.green[500],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: tailwindConfig().theme.colors.green[500],
        pointHoverBackgroundColor: tailwindConfig().theme.colors.green[500],
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
      {
        label: 'Profit ($K)',
        data: [58, 62, 67, 72, 77, 75, 80, 85, 90, 95, 99, 104],
        fill: false,
        borderColor: tailwindConfig().theme.colors.blue[500],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: tailwindConfig().theme.colors.blue[500],
        pointHoverBackgroundColor: tailwindConfig().theme.colors.blue[500],
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  };
  
  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-100 dark:bg-green-500/20 dark:text-green-300';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20 dark:text-yellow-300';
      case 'low':
        return 'text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-500/20 dark:text-gray-300';
    }
  };
  
  const getRiskColor = (value) => {
    if (value.includes('Low')) return 'text-green-600 bg-green-100 dark:bg-green-500/20 dark:text-green-300';
    if (value.includes('Medium')) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20 dark:text-yellow-300';
    if (value.includes('High')) return 'text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-300';
    return 'text-blue-600 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300';
  };
  
  const currentAnalysis = analysisTypes[selectedAnalysis];

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Document Analysis</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            AI-powered insights from uploaded documents
          </div>
        </div>
        
        {/* Analysis Type Selector */}
        <div className="flex space-x-2">
          {Object.entries(analysisTypes).map(([key, analysis]) => (
            <button
              key={key}
              onClick={() => setSelectedAnalysis(key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedAnalysis === key
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {analysis.title}
            </button>
          ))}
        </div>
      </header>
      
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insights List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Key Insights
            </h3>
            <div className="space-y-4">
              {currentAnalysis.insights.map((insight, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800 dark:text-gray-100">
                      {insight.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedAnalysis === 'risk' ? getRiskColor(insight.value) : 'text-blue-600 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300'
                      }`}>
                        {insight.value}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(insight.confidence)}`}>
                        {insight.confidence} confidence
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {insight.description}
                  </p>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Sources:</span>
                    {insight.documents.map((doc, docIndex) => (
                      <span key={docIndex}>
                        {docIndex > 0 && ', '}
                        <Link to="#" className="text-violet-500 hover:text-violet-600 dark:hover:text-violet-400">
                          {doc}
                        </Link>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Visualization */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Financial Trends
            </h3>
            
            {selectedAnalysis === 'financial' && (
              <div>
                <div className="h-64 mb-4">
                  <LineChart data={financialChartData} width={400} height={256} />
                </div>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                    <div className="text-lg font-bold text-green-600">$3.9M</div>
                    <div className="text-xs text-green-600/80">Annual Revenue</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">$1.25M</div>
                    <div className="text-xs text-blue-600/80">Annual Profit</div>
                  </div>
                  <div className="text-center p-3 bg-violet-50 dark:bg-violet-500/10 rounded-lg">
                    <div className="text-lg font-bold text-violet-600">32.1%</div>
                    <div className="text-xs text-violet-600/80">Avg Margin</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">+18.5%</div>
                    <div className="text-xs text-yellow-600/80">YoY Growth</div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedAnalysis === 'amazon' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Top Performing ASINs</h4>
                  <div className="space-y-2">
                    {[
                      { asin: 'B087NWQT2M', name: 'Smart Kitchen Scale', performance: '+35%' },
                      { asin: 'B094ABC123', name: 'Wireless Charger', performance: '+28%' },
                      { asin: 'B089QX4B9N', name: 'Silicone Utensil Set', performance: '+22%' }
                    ].map((product, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{product.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{product.asin}</div>
                        </div>
                        <span className="text-sm font-medium text-green-600">{product.performance}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">6.2K</div>
                    <div className="text-xs text-blue-600/80">Avg Monthly Units</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                    <div className="text-lg font-bold text-green-600">4.6 ⭐</div>
                    <div className="text-xs text-green-600/80">Avg Rating</div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedAnalysis === 'risk' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                  <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">High Priority Risks</h4>
                  <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                    <li>• Platform concentration (95% Amazon)</li>
                    <li>• Supplier dependency (65% single source)</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Medium Priority</h4>
                  <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                    <li>• Seasonal demand variations</li>
                    <li>• Currency exchange exposure</li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100">6.8/10</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Overall Risk Score</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Analysis updated 2 hours ago
          </div>
          <div className="space-x-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              Re-analyze Documents
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-colors">
              Export Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentAnalysis;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function DocumentChecklist({ selectedDeal }) {
  const [checkedItems, setCheckedItems] = useState(new Set());
  
  const checklistCategories = [
    {
      category: 'Financial Documents',
      required: true,
      items: [
        { id: 'financial-1', name: 'Last 3 years Financial Statements', required: true, status: 'completed' },
        { id: 'financial-2', name: 'Monthly P&L for current year', required: true, status: 'completed' },
        { id: 'financial-3', name: 'Cash Flow Statements', required: true, status: 'pending' },
        { id: 'financial-4', name: 'Tax Returns (3 years)', required: true, status: 'pending' },
        { id: 'financial-5', name: 'Bank Statements (12 months)', required: true, status: 'completed' },
        { id: 'financial-6', name: 'Accounts Receivable Aging', required: false, status: 'not-required' }
      ]
    },
    {
      category: 'Amazon Business',
      required: true,
      items: [
        { id: 'amazon-1', name: 'Seller Central Reports (12 months)', required: true, status: 'completed' },
        { id: 'amazon-2', name: 'ASIN Performance Data', required: true, status: 'completed' },
        { id: 'amazon-3', name: 'FBA Inventory Reports', required: true, status: 'pending' },
        { id: 'amazon-4', name: 'Customer Review Analysis', required: false, status: 'completed' },
        { id: 'amazon-5', name: 'Advertising Spend Reports', required: true, status: 'pending' },
        { id: 'amazon-6', name: 'Return/Refund Reports', required: false, status: 'not-applicable' }
      ]
    },
    {
      category: 'Legal & Compliance',
      required: true,
      items: [
        { id: 'legal-1', name: 'Business Registration Documents', required: true, status: 'completed' },
        { id: 'legal-2', name: 'Trademark Registrations', required: false, status: 'pending' },
        { id: 'legal-3', name: 'Patent Documents', required: false, status: 'not-applicable' },
        { id: 'legal-4', name: 'Supplier Contracts', required: true, status: 'completed' },
        { id: 'legal-5', name: 'Employment Agreements', required: false, status: 'pending' },
        { id: 'legal-6', name: 'Insurance Policies', required: true, status: 'pending' }
      ]
    },
    {
      category: 'Operations',
      required: false,
      items: [
        { id: 'ops-1', name: 'Inventory Management System Data', required: false, status: 'completed' },
        { id: 'ops-2', name: 'Supply Chain Documentation', required: true, status: 'pending' },
        { id: 'ops-3', name: 'Quality Control Procedures', required: false, status: 'not-applicable' },
        { id: 'ops-4', name: 'Shipping/Logistics Agreements', required: false, status: 'completed' },
        { id: 'ops-5', name: 'Product Development Pipeline', required: false, status: 'pending' }
      ]
    },
    {
      category: 'Technology & IP',
      required: false,
      items: [
        { id: 'tech-1', name: 'Website/Platform Access', required: false, status: 'completed' },
        { id: 'tech-2', name: 'Software Licenses', required: false, status: 'pending' },
        { id: 'tech-3', name: 'Domain Registrations', required: false, status: 'completed' },
        { id: 'tech-4', name: 'Social Media Accounts', required: false, status: 'not-applicable' },
        { id: 'tech-5', name: 'Email/Marketing Lists', required: false, status: 'pending' }
      ]
    }
  ];
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-500/20 dark:text-green-300';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20 dark:text-yellow-300';
      case 'not-required':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-500/20 dark:text-gray-300';
      case 'not-applicable':
        return 'text-gray-400 bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-500/20 dark:text-gray-300';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'not-applicable':
        return (
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  const toggleItem = (itemId) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  const getTotalProgress = () => {
    const allItems = checklistCategories.flatMap(cat => cat.items.filter(item => item.required));
    const completedItems = allItems.filter(item => item.status === 'completed');
    return Math.round((completedItems.length / allItems.length) * 100);
  };
  
  const getCategoryProgress = (category) => {
    const requiredItems = category.items.filter(item => item.required);
    const completedItems = requiredItems.filter(item => item.status === 'completed');
    return requiredItems.length > 0 ? Math.round((completedItems.length / requiredItems.length) * 100) : 100;
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Due Diligence Checklist</h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-violet-600">{getTotalProgress()}%</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Complete</div>
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-violet-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getTotalProgress()}%` }}
            ></div>
          </div>
        </div>
      </header>
      
      <div className="p-5">
        <div className="space-y-6">
          {checklistCategories.map((category, categoryIndex) => {
            const categoryProgress = getCategoryProgress(category);
            
            return (
              <div key={categoryIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {category.category}
                      </h3>
                      {category.required && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {categoryProgress}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {category.items.filter(item => item.status === 'completed').length} of {category.items.filter(item => item.required).length} required
                      </div>
                    </div>
                  </div>
                  
                  {/* Category Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          categoryProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${categoryProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(item.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                {item.name}
                              </span>
                              {item.required && (
                                <span className="text-xs text-red-500">*</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                            {item.status.replace('-', ' ')}
                          </span>
                          
                          {item.status === 'pending' && (
                            <div className="flex space-x-1">
                              <button className="text-green-600 hover:text-green-700 dark:hover:text-green-500">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button className="text-violet-600 hover:text-violet-700 dark:hover:text-violet-500">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="text-red-500">*</span> Required for deal completion
          </div>
          <div className="space-x-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              Export Checklist
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentChecklist;
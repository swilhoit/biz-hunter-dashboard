import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EditMenu from '../../components/DropdownEditMenu';

function ValuationCalculator() {
  const [inputs, setInputs] = useState({
    monthlyRevenue: 180000,
    monthlyProfit: 54000,
    growthRate: 15,
    age: 24,
    marketMultiple: 3.2,
    riskFactor: 1.0
  });
  
  const [valuation, setValuation] = useState(null);
  
  const calculateValuation = () => {
    const annualRevenue = inputs.monthlyRevenue * 12;
    const annualProfit = inputs.monthlyProfit * 12;
    
    // Multiple-based valuation
    const revenueValuation = annualRevenue * inputs.marketMultiple;
    const profitValuation = annualProfit * (inputs.marketMultiple + 1.5); // Higher multiple for profit
    
    // Growth adjustment
    const growthMultiplier = 1 + (inputs.growthRate / 100);
    
    // Age adjustment (newer businesses get slight discount)
    const ageMultiplier = inputs.age < 12 ? 0.9 : inputs.age < 24 ? 0.95 : 1.0;
    
    // Risk adjustment
    const riskMultiplier = inputs.riskFactor;
    
    const baseValuation = (revenueValuation + profitValuation) / 2;
    const adjustedValuation = baseValuation * growthMultiplier * ageMultiplier * riskMultiplier;
    
    const result = {
      baseValuation: Math.round(baseValuation),
      adjustedValuation: Math.round(adjustedValuation),
      revenueMultiple: (adjustedValuation / annualRevenue).toFixed(1),
      profitMultiple: (adjustedValuation / annualProfit).toFixed(1),
      annualRevenue,
      annualProfit,
      roi: ((annualProfit / adjustedValuation) * 100).toFixed(1)
    };
    
    setValuation(result);
  };
  
  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };
  
  const presetBusinessTypes = {
    'Kitchen Gadgets': { marketMultiple: 3.2, riskFactor: 1.0 },
    'Electronics': { marketMultiple: 4.1, riskFactor: 0.9 },
    'Beauty Products': { marketMultiple: 2.8, riskFactor: 1.1 },
    'Pet Supplies': { marketMultiple: 3.5, riskFactor: 1.0 },
    'Sports & Outdoors': { marketMultiple: 3.0, riskFactor: 1.0 }
  };
  
  const applyPreset = (type) => {
    const preset = presetBusinessTypes[type];
    setInputs(prev => ({ ...prev, ...preset }));
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Valuation Calculator</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Save Template
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Export Report
              </Link>
            </li>
          </EditMenu>
        </div>
        
        {/* Business Type Presets */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.keys(presetBusinessTypes).map((type) => (
            <button
              key={type}
              onClick={() => applyPreset(type)}
              className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {type}
            </button>
          ))}
        </div>
      </header>
      
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Business Metrics</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Revenue ($)
                </label>
                <input
                  type="number"
                  value={inputs.monthlyRevenue}
                  onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Profit ($)
                </label>
                <input
                  type="number"
                  value={inputs.monthlyProfit}
                  onChange={(e) => handleInputChange('monthlyProfit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Growth Rate (%)
                </label>
                <input
                  type="number"
                  value={inputs.growthRate}
                  onChange={(e) => handleInputChange('growthRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Age (months)
                </label>
                <input
                  type="number"
                  value={inputs.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Market Multiple
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.marketMultiple}
                  onChange={(e) => handleInputChange('marketMultiple', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Risk Factor (0.5 - 1.5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="1.5"
                  value={inputs.riskFactor}
                  onChange={(e) => handleInputChange('riskFactor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={calculateValuation}
                className="w-full px-4 py-2 font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-colors"
              >
                Calculate Valuation
              </button>
            </div>
          </div>
          
          {/* Results */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Valuation Results</h3>
            {valuation ? (
              <div className="space-y-4">
                {/* Key Valuation */}
                <div className="p-4 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-violet-600">
                      ${valuation.adjustedValuation.toLocaleString()}
                    </div>
                    <div className="text-sm text-violet-600/80">Estimated Valuation</div>
                  </div>
                </div>
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      {valuation.revenueMultiple}x
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Revenue Multiple</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      {valuation.profitMultiple}x
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Profit Multiple</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">
                      {valuation.roi}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Annual ROI</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">
                      ${(valuation.annualProfit / 12).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Monthly CF</div>
                  </div>
                </div>
                
                {/* Annual Figures */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Annual Revenue:</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      ${valuation.annualRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Annual Profit:</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      ${valuation.annualProfit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Base Valuation:</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      ${valuation.baseValuation.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* Valuation Range */}
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Valuation Range</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    ${Math.round(valuation.adjustedValuation * 0.8).toLocaleString()} - ${Math.round(valuation.adjustedValuation * 1.2).toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    Based on market conditions and risk factors
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">📊</div>
                <p>Enter business metrics and click "Calculate Valuation" to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ValuationCalculator;
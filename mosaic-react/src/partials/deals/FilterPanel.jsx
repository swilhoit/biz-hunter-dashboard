import React from 'react';

function FilterPanel({ filters, setFilters }) {
  const categories = [
    'all',
    'Home & Kitchen',
    'Electronics',
    'Pet Supplies',
    'Beauty & Personal Care',
    'Sports & Outdoors',
    'Toys & Games'
  ];
  
  const stages = [
    'all',
    'prospecting',
    'initial-contact',
    'due-diligence',
    'negotiation',
    'closing',
    'closed-won',
    'closed-lost'
  ];
  
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      category: 'all',
      revenueRange: [0, 10000000],
      multipleRange: [0, 10],
      stage: 'all'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filters</h3>
        <button 
          onClick={resetFilters}
          className="text-sm text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 font-medium"
        >
          Reset All
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
        
        {/* Stage Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stage
          </label>
          <select
            value={filters.stage}
            onChange={(e) => updateFilter('stage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
          >
            {stages.map(stage => (
              <option key={stage} value={stage}>
                {stage === 'all' ? 'All Stages' : stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        
        {/* Revenue Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Revenue Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.revenueRange[0]}
              onChange={(e) => updateFilter('revenueRange', [parseInt(e.target.value) || 0, filters.revenueRange[1]])}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.revenueRange[1]}
              onChange={(e) => updateFilter('revenueRange', [filters.revenueRange[0], parseInt(e.target.value) || 10000000])}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        
        {/* Multiple Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Multiple Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.1"
              placeholder="Min"
              value={filters.multipleRange[0]}
              onChange={(e) => updateFilter('multipleRange', [parseFloat(e.target.value) || 0, filters.multipleRange[1]])}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Max"
              value={filters.multipleRange[1]}
              onChange={(e) => updateFilter('multipleRange', [filters.multipleRange[0], parseFloat(e.target.value) || 10])}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Quick Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Filters:</div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => updateFilter('multipleRange', [3, 10])}
            className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30 rounded-lg transition-colors"
          >
            High Multiple (3x+)
          </button>
          <button 
            onClick={() => updateFilter('revenueRange', [2000000, 10000000])}
            className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-500/30 rounded-lg transition-colors"
          >
            High Revenue ($2M+)
          </button>
          <button 
            onClick={() => updateFilter('stage', 'due-diligence')}
            className="px-3 py-1.5 text-sm bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-500/30 rounded-lg transition-colors"
          >
            In Due Diligence
          </button>
          <button 
            onClick={() => updateFilter('category', 'Electronics')}
            className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30 rounded-lg transition-colors"
          >
            Electronics Only
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;
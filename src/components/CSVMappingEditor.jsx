import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';

function CSVMappingEditor({ mappings, onMappingsChange, availableColumns, targetTable }) {
  const [localMappings, setLocalMappings] = useState(mappings);
  const [isOpen, setIsOpen] = useState(false);

  // Get available database fields based on target table
  const getDbFields = () => {
    if (targetTable === 'deals') {
      return [
        'business_name', 'amazon_store_name', 'asin_list', 'asking_price',
        'annual_revenue', 'annual_profit', 'monthly_revenue', 'monthly_profit',
        'ttm_revenue', 'ttm_profit', 'business_created', 'inventory_value',
        'multiple', 'sde_multiple', 'industry', 'location', 'niche',
        'listing_url', 'seller_interview_url', 'pnl_url', 'description',
        'reason_for_selling', 'growth_opportunity', 'empire_flippers_listing_number',
        'assets_included', 'seller_support', 'source', 'status', 'notes'
      ];
    } else {
      return [
        'name', 'source', 'asking_price', 'annual_revenue', 'annual_profit',
        'monthly_revenue', 'monthly_profit', 'location', 'industry', 'description',
        'years_in_business', 'employees', 'established_date', 'reason_for_selling',
        'seller_financing', 'multiple', 'inventory_value', 'real_estate_included',
        'image_urls', 'original_url', 'scraped_at', 'yoy_trend_percent'
      ];
    }
  };

  const dbFields = getDbFields();

  const handleAddMapping = () => {
    const newMapping = {
      csvColumn: '',
      dbField: '',
      confidence: 50,
      transformationType: 'direct'
    };
    setLocalMappings({
      ...localMappings,
      mappings: [...localMappings.mappings, newMapping]
    });
  };

  const handleRemoveMapping = (index) => {
    setLocalMappings({
      ...localMappings,
      mappings: localMappings.mappings.filter((_, i) => i !== index)
    });
  };

  const handleUpdateMapping = (index, field, value) => {
    const updatedMappings = [...localMappings.mappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      [field]: value
    };
    setLocalMappings({
      ...localMappings,
      mappings: updatedMappings
    });
  };

  const handleSave = () => {
    onMappingsChange(localMappings);
    setIsOpen(false);
  };

  const unmappedCsvColumns = availableColumns.filter(
    col => !localMappings.mappings.some(m => m.csvColumn === col)
  );

  const unmappedDbFields = dbFields.filter(
    field => !localMappings.mappings.some(m => m.dbField === field)
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-indigo-600 hover:text-indigo-700"
      >
        Edit Mappings
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Edit Column Mappings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              {/* Current Mappings */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Column Mappings
                </h4>
                <div className="space-y-3">
                  {localMappings.mappings.map((mapping, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <select
                        value={mapping.csvColumn}
                        onChange={(e) => handleUpdateMapping(index, 'csvColumn', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="">Select CSV Column</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>

                      <span className="text-gray-500">→</span>

                      <select
                        value={mapping.dbField}
                        onChange={(e) => handleUpdateMapping(index, 'dbField', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="">Select Database Field</option>
                        {dbFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>

                      <select
                        value={mapping.transformationType}
                        onChange={(e) => handleUpdateMapping(index, 'transformationType', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="direct">Direct</option>
                        <option value="numeric">Numeric</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="array">Array</option>
                      </select>

                      <button
                        onClick={() => handleRemoveMapping(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddMapping}
                  className="mt-3 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Mapping
                </button>
              </div>

              {/* Unmapped Columns Info */}
              {(unmappedCsvColumns.length > 0 || unmappedDbFields.length > 0) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Unmapped Fields
                      </h4>
                      {unmappedCsvColumns.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">
                            CSV Columns: 
                          </span>
                          <span className="text-sm text-yellow-600 dark:text-yellow-400 ml-1">
                            {unmappedCsvColumns.join(', ')}
                          </span>
                        </div>
                      )}
                      {unmappedDbFields.length > 0 && (
                        <div>
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">
                            Database Fields: 
                          </span>
                          <span className="text-sm text-yellow-600 dark:text-yellow-400 ml-1">
                            {unmappedDbFields.slice(0, 5).join(', ')}
                            {unmappedDbFields.length > 5 && ` and ${unmappedDbFields.length - 5} more`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Save Mappings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CSVMappingEditor;
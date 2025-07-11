import React, { useState, useEffect } from 'react';
import { Save, Bookmark, BookmarkCheck, Trash2, Star, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

function SavedFilters({ currentFilters, onLoadFilters, filterType = 'listings' }) {
  const { user } = useAuth();
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedFilters();
    }
  }, [user]);

  const loadSavedFilters = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('filter_type', filterType)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedFilters(data || []);
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  const saveFilter = async () => {
    if (!filterName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: user.id,
          name: filterName.trim(),
          filter_type: filterType,
          filters: currentFilters,
          is_default: makeDefault
        });

      if (error) throw error;

      setShowSaveDialog(false);
      setFilterName('');
      setMakeDefault(false);
      await loadSavedFilters();
    } catch (error) {
      console.error('Error saving filter:', error);
      alert('Failed to save filter');
    } finally {
      setLoading(false);
    }
  };

  const loadFilter = (savedFilter) => {
    onLoadFilters(savedFilter.filters);
    setShowDropdown(false);
  };

  const deleteFilter = async (id) => {
    if (!confirm('Are you sure you want to delete this saved filter?')) return;

    try {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadSavedFilters();
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };

  const toggleDefault = async (filter) => {
    try {
      const { error } = await supabase
        .from('saved_filters')
        .update({ is_default: !filter.is_default })
        .eq('id', filter.id);

      if (error) throw error;
      await loadSavedFilters();
    } catch (error) {
      console.error('Error updating default filter:', error);
    }
  };

  const hasActiveFilters = Object.values(currentFilters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.values(value).some(v => v !== '');
    return value !== '' && value !== false;
  });

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Save current filters button */}
        {hasActiveFilters && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="btn btn-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400"
            title="Save current filters"
          >
            <Save className="w-4 h-4" />
          </button>
        )}

        {/* Saved filters dropdown */}
        {savedFilters.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="btn btn-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Saved Filters
              <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                {savedFilters.length}
              </span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2">
                    Saved Filters
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {savedFilters.map((filter) => (
                      <div
                        key={filter.id}
                        className="group flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                      >
                        <button
                          onClick={() => loadFilter(filter)}
                          className="flex-1 text-left flex items-center gap-2"
                        >
                          {filter.is_default && (
                            <Star className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {filter.name}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDefault(filter);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            title={filter.is_default ? "Remove as default" : "Set as default"}
                          >
                            <Star className={`w-3 h-3 ${filter.is_default ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFilter(filter.id);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-500"
                            title="Delete filter"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save filter dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Save Current Filters
              </h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter Name
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g., High Revenue FBA Businesses"
                  className="form-input w-full"
                  autoFocus
                />
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Set as default filter
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="btn btn-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveFilter}
                disabled={!filterName.trim() || loading}
                className="btn btn-sm bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Filter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SavedFilters;
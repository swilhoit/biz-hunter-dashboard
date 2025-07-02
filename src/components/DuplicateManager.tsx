import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateDetectionService, DuplicateGroup } from '../services/duplicateDetection';
import { useToast } from '../contexts/ToastContext';
import { AlertTriangle, Merge, Eye, EyeOff, Filter, X } from 'lucide-react';
import { BusinessListing } from '../hooks/useBusinessListings';
import { supabase } from '../lib/supabase';

interface DuplicateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuplicateManager({ isOpen, onClose }: DuplicateManagerProps) {
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const [groupListings, setGroupListings] = useState<BusinessListing[]>([]);
  
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  // Fetch duplicate groups
  const { data: duplicateGroups, isLoading } = useQuery({
    queryKey: ['duplicate-groups'],
    queryFn: () => duplicateDetectionService.getDuplicateGroups(),
    enabled: isOpen
  });

  // Fetch duplicate statistics
  const { data: stats } = useQuery({
    queryKey: ['duplicate-stats'],
    queryFn: () => duplicateDetectionService.getDuplicateStats(),
    enabled: isOpen
  });

  // Load listings for selected group
  useEffect(() => {
    if (selectedGroup) {
      loadGroupListings(selectedGroup.listing_ids);
    }
  }, [selectedGroup]);

  const loadGroupListings = async (listingIds: string[]) => {
    const { data, error } = await supabase
      .from('business_listings')
      .select('*')
      .in('id', listingIds)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setGroupListings(data);
      // Set the first listing as primary by default
      if (data.length > 0) {
        setSelectedPrimary(data[0].id);
        setSelectedDuplicates(new Set(data.slice(1).map(l => l.id)));
      }
    }
  };

  // Merge duplicates mutation
  const mergeMutation = useMutation({
    mutationFn: ({ primaryId, duplicateIds }: { primaryId: string; duplicateIds: string[] }) =>
      duplicateDetectionService.mergeDuplicates(primaryId, duplicateIds),
    onSuccess: () => {
      showSuccess('Duplicates merged successfully');
      queryClient.invalidateQueries({ queryKey: ['duplicate-groups'] });
      queryClient.invalidateQueries({ queryKey: ['business-listings'] });
      setSelectedGroup(null);
      setGroupListings([]);
    },
    onError: (error) => {
      showError(`Failed to merge duplicates: ${error.message}`);
    }
  });

  const handleMerge = () => {
    if (!selectedPrimary || selectedDuplicates.size === 0) {
      showError('Please select a primary listing and at least one duplicate');
      return;
    }

    mergeMutation.mutate({
      primaryId: selectedPrimary,
      duplicateIds: Array.from(selectedDuplicates)
    });
  };

  const toggleDuplicate = (listingId: string) => {
    if (listingId === selectedPrimary) return;
    
    const newDuplicates = new Set(selectedDuplicates);
    if (newDuplicates.has(listingId)) {
      newDuplicates.delete(listingId);
    } else {
      newDuplicates.add(listingId);
    }
    setSelectedDuplicates(newDuplicates);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-30 z-50 transition-opacity">
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center my-4 justify-center px-4 sm:px-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="relative px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                    Duplicate Listings Manager
                  </h2>
                  {stats && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.totalDuplicates} duplicates found in {stats.duplicateGroups} groups
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Groups List */}
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  Duplicate Groups
                </h3>
                {isLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : duplicateGroups?.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No duplicates found</div>
                ) : (
                  <div className="space-y-2">
                    {duplicateGroups?.map((group) => (
                      <button
                        key={group.normalized_name}
                        onClick={() => setSelectedGroup(group)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedGroup?.normalized_name === group.normalized_name
                            ? 'bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/50'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                          {group.normalized_name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {group.duplicate_count} listings • {group.sources.join(', ')}
                        </div>
                        {group.min_price !== group.max_price && (
                          <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                            Price range: ${group.min_price?.toLocaleString()} - ${group.max_price?.toLocaleString()}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Group Details */}
            <div className="flex-1 overflow-y-auto">
              {selectedGroup ? (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                    Review and Merge Duplicates
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    Select the primary listing to keep and which duplicates to merge. Merged duplicates will be marked as inactive.
                  </p>

                  <div className="space-y-4">
                    {groupListings.map((listing) => (
                      <div
                        key={listing.id}
                        className={`border rounded-lg p-4 transition-all ${
                          listing.id === selectedPrimary
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                            : selectedDuplicates.has(listing.id)
                            ? 'border-red-300 bg-red-50 dark:bg-red-500/10'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="primary"
                                checked={listing.id === selectedPrimary}
                                onChange={() => {
                                  setSelectedPrimary(listing.id);
                                  const newDuplicates = new Set(selectedDuplicates);
                                  newDuplicates.delete(listing.id);
                                  setSelectedDuplicates(newDuplicates);
                                }}
                                className="text-indigo-600"
                              />
                              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                                {listing.name}
                              </h4>
                              {listing.id === selectedPrimary && (
                                <span className="px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="ml-6 mt-2 space-y-1">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Source: {listing.source} • Price: ${listing.asking_price?.toLocaleString() || 'N/A'}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-500">
                                Added: {new Date(listing.created_at).toLocaleDateString()}
                              </p>
                              {listing.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {listing.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {listing.id !== selectedPrimary && (
                            <button
                              onClick={() => toggleDuplicate(listing.id)}
                              className={`ml-4 px-3 py-1 text-sm rounded-lg transition-colors ${
                                selectedDuplicates.has(listing.id)
                                  ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {selectedDuplicates.has(listing.id) ? 'Marked as Duplicate' : 'Keep Separate'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-end space-x-3">
                    <button
                      onClick={() => {
                        setSelectedGroup(null);
                        setGroupListings([]);
                      }}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMerge}
                      disabled={!selectedPrimary || selectedDuplicates.size === 0 || mergeMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center space-x-2"
                    >
                      <Merge className="w-4 h-4" />
                      <span>
                        {mergeMutation.isPending 
                          ? 'Merging...' 
                          : `Merge ${selectedDuplicates.size} Duplicate${selectedDuplicates.size > 1 ? 's' : ''}`
                        }
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <Filter className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p>Select a duplicate group to review</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
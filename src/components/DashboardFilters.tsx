
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MultiSelect } from '@/components/MultiSelect';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface DashboardFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (value: string[]) => void;
  selectedSource: string;
  onSourceChange: (value: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (value: [number, number]) => void;
  onClearFilters: () => void;
  categories: string[];
  sources: string[];
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategories,
  onCategoriesChange,
  selectedSource,
  onSourceChange,
  priceRange,
  onPriceRangeChange,
  onClearFilters,
  categories,
  sources,
}) => {
  const hasActiveFilters = selectedCategories.length > 0 || selectedSource !== 'all' || 
    priceRange[0] > 0 || priceRange[1] < 10000000 || searchTerm;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Search Bar */}
      <div className="p-6 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search businesses, industries, or keywords..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-12 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-50 rounded-lg"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="ml-auto text-xs h-7 px-3"
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Categories</label>
            <MultiSelect
              options={categories}
              selected={selectedCategories}
              onChange={onCategoriesChange}
              placeholder="All categories"
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Platform</label>
            <Select value={selectedSource} onValueChange={onSourceChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All platforms</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Price range</label>
              <span className="text-sm text-gray-500">
                {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
              </span>
            </div>
            <Slider
              value={priceRange}
              onValueChange={(value) => onPriceRangeChange(value as [number, number])}
              max={10000000}
              min={0}
              step={50000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$0</span>
              <span>$10M+</span>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchTerm}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange('')} />
              </Badge>
            )}
            {selectedCategories.map(category => (
              <Badge key={category} variant="secondary" className="flex items-center gap-1">
                {category}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onCategoriesChange(selectedCategories.filter(c => c !== category))} 
                />
              </Badge>
            ))}
            {selectedSource !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedSource}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onSourceChange('all')} />
              </Badge>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 10000000) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onPriceRangeChange([0, 10000000])} 
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

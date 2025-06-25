
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface DashboardFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedSource: string;
  onSourceChange: (value: string) => void;
  priceRange: string;
  onPriceRangeChange: (value: string) => void;
  onClearFilters: () => void;
  categories: string[];
  sources: string[];
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSource,
  onSourceChange,
  priceRange,
  onPriceRangeChange,
  onClearFilters,
  categories,
  sources,
}) => {
  const hasActiveFilters = selectedCategory !== 'all' || selectedSource !== 'all' || priceRange !== 'all' || searchTerm;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search businesses..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 lg:gap-2">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="lg:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSource} onValueChange={onSourceChange}>
            <SelectTrigger className="lg:w-48">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceRange} onValueChange={onPriceRangeChange}>
            <SelectTrigger className="lg:w-48">
              <SelectValue placeholder="All Prices" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="0-100k">Under $100K</SelectItem>
              <SelectItem value="100k-500k">$100K - $500K</SelectItem>
              <SelectItem value="500k-1m">$500K - $1M</SelectItem>
              <SelectItem value="1m-5m">$1M - $5M</SelectItem>
              <SelectItem value="5m+">$5M+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchTerm}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange('')} />
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedCategory}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onCategoryChange('all')} />
              </Badge>
            )}
            {selectedSource !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedSource}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onSourceChange('all')} />
              </Badge>
            )}
            {priceRange !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {priceRange}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onPriceRangeChange('all')} />
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
};

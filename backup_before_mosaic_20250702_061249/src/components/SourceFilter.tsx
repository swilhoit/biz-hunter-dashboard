import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Globe, 
  TrendingUp, 
  Laptop, 
  ShoppingCart, 
  CheckCircle,
  Crown,
  FileText,
  Database
} from 'lucide-react';

const sourceIcons: Record<string, React.ReactNode> = {
  'BizBuySell': <Building2 className="h-4 w-4" />,
  'QuietLight': <Globe className="h-4 w-4" />,
  'BizQuest': <Building2 className="h-4 w-4" />,
  'Flippa': <ShoppingCart className="h-4 w-4" />,
  'Empire Flippers': <Crown className="h-4 w-4" />,
  'ExitAdviser': <FileText className="h-4 w-4" />,
  'Centurica': <Database className="h-4 w-4" />,
};

const sourceColors: Record<string, string> = {
  'BizBuySell': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'QuietLight': 'bg-green-100 text-green-800 hover:bg-green-200',
  'BizQuest': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  'Flippa': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
  'Empire Flippers': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'ExitAdviser': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  'Centurica': 'bg-red-100 text-red-800 hover:bg-red-200',
};

interface SourceFilterProps {
  availableSources: string[];
  selectedSources: string[];
  onSourceToggle: (source: string) => void;
  listingCounts?: Record<string, number>;
}

export const SourceFilter: React.FC<SourceFilterProps> = ({
  availableSources,
  selectedSources,
  onSourceToggle,
  listingCounts = {}
}) => {
  if (availableSources.length === 0) {
    return null;
  }

  const handleToggle = (source: string) => {
    onSourceToggle(source);
  };

  const handleSelectAll = () => {
    if (selectedSources.length === availableSources.length) {
      // Deselect all
      availableSources.forEach(source => {
        if (selectedSources.includes(source)) {
          onSourceToggle(source);
        }
      });
    } else {
      // Select all
      availableSources.forEach(source => {
        if (!selectedSources.includes(source)) {
          onSourceToggle(source);
        }
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Data Sources</h3>
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedSources.length === availableSources.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableSources.map(source => {
              const isSelected = selectedSources.includes(source);
              const count = listingCounts[source] || 0;
              
              return (
                <button
                  key={source}
                  onClick={() => handleToggle(source)}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all duration-200 text-left
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {sourceIcons[source] || <Globe className="h-4 w-4" />}
                      <span className="text-sm font-medium truncate">{source}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  {count > 0 && (
                    <div className="mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${sourceColors[source] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {count} listings
                      </Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedSources.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-gray-500">Active filters:</span>
                {selectedSources.map(source => (
                  <Badge
                    key={source}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    onClick={() => handleToggle(source)}
                  >
                    {source} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
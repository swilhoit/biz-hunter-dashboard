
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, TrendingUp, Building2 } from 'lucide-react';

interface BusinessListing {
  id: string;
  name: string;
  description: string;
  askingPrice: number;
  annualRevenue: number;
  industry: string;
  location: string;
  source: string;
  highlights: string[];
  imageUrl?: string;
}

interface BusinessCardProps {
  listing: BusinessListing;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ listing }) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Link to={`/listing/${listing.id}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg font-light text-gray-900 line-clamp-2 pr-2">
              {listing.name}
            </CardTitle>
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {listing.source}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {listing.description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Asking Price</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(listing.askingPrice)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Annual Revenue</p>
                <p className="font-semibold text-blue-600">
                  {formatCurrency(listing.annualRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Building2 className="h-4 w-4" />
              <span>{listing.industry}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{listing.location}</span>
            </div>
          </div>

          {listing.highlights.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Key Highlights:</p>
              <div className="flex flex-wrap gap-1">
                {listing.highlights.slice(0, 3).map((highlight, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

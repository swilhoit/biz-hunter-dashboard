
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, TrendingUp, Building2, ExternalLink } from 'lucide-react';
import { extractOriginalUrl } from '../utils/extractOriginalUrl';
import { SaveButton } from './SaveButton';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { useListingViews } from '@/hooks/useListingViews';

interface BusinessListing {
  id: string;
  name: string;
  description: string;
  asking_price: number;
  annual_revenue: number;
  industry: string;
  location: string;
  source: string;
  highlights: string[];
  image_url?: string;
  original_url?: string;
  is_active?: boolean;
  last_verified_at?: string;
  verification_status?: 'live' | 'removed' | 'pending';
  is_saved?: boolean;
}

interface BusinessCardProps {
  listing: BusinessListing;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ listing }) => {
  const { user } = useAuth();
  const { trackView: trackListingView } = useListingViews();
  
  // Track view when user clicks on listing
  const trackView = () => {
    if (user) {
      trackListingView(listing.id, listing.name);
      console.log('View tracked for listing:', listing.id);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Extract original URL from description and clean the description
  const originalUrl = extractOriginalUrl(listing.description);
  const cleanDescription = listing.description?.replace(/🔗 Original listing:.*$/m, '').trim() || '';

  const validOriginalUrl = originalUrl || listing.original_url;

  // Convert Supabase data to match original interface
  const businessData = {
    id: listing.id,
    name: listing.name,
    description: cleanDescription,
    askingPrice: listing.asking_price,
    annualRevenue: listing.annual_revenue,
    industry: listing.industry,
    location: listing.location,
    source: listing.source,
    highlights: listing.highlights || [],
    imageUrl: listing.image_url,
    originalUrl: validOriginalUrl
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/listing/${businessData.id}`} className="flex-1 pr-2" onClick={trackView}>
            <CardTitle className="text-lg font-light text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
              {businessData.name}
            </CardTitle>
          </Link>
          <div className="flex items-center space-x-2">
            <SaveButton 
              listingId={businessData.id} 
              isSaved={listing.is_saved}
            />
            {businessData.originalUrl ? (
              <a 
                href={businessData.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="group"
              >
                <Badge variant="outline" className="text-xs whitespace-nowrap hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  {businessData.source}
                  <ExternalLink className="inline h-3 w-3 ml-1 opacity-60 group-hover:opacity-100" />
                </Badge>
              </a>
            ) : (
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {businessData.source}
              </Badge>
            )}
          </div>
          </div>
          <Link to={`/listing/${businessData.id}`}>
            <p className="text-sm text-muted-foreground line-clamp-3 hover:text-gray-700 transition-colors">
              {businessData.description}
            </p>
          </Link>
        </CardHeader>
        
        <Link to={`/listing/${businessData.id}`}>
          <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Asking Price</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(businessData.askingPrice)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Annual Revenue</p>
                <p className="font-semibold text-blue-600">
                  {formatCurrency(businessData.annualRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Building2 className="h-4 w-4" />
              <span>{businessData.industry}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{businessData.location}</span>
            </div>
          </div>

          {businessData.highlights.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Key Highlights:</p>
              <div className="flex flex-wrap gap-1">
                {businessData.highlights.slice(0, 3).map((highlight, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Status Badge - only show if verification fields exist */}
          {listing.verification_status && (
            <div className="flex justify-end mt-2">
              <StatusBadge 
                status={listing.verification_status}
                lastVerified={listing.last_verified_at}
              />
            </div>
          )}
          </CardContent>
        </Link>
      </Card>
  );
};

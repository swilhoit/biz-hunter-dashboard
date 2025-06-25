
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2 } from 'lucide-react';

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
}

interface BusinessTableProps {
  listings: BusinessListing[];
}

export const BusinessTable: React.FC<BusinessTableProps> = ({ listings }) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Business</TableHead>
            <TableHead className="text-right">Asking Price</TableHead>
            <TableHead className="text-right">Annual Revenue</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => (
            <TableRow key={listing.id} className="cursor-pointer hover:bg-gray-50">
              <TableCell>
                <Link to={`/listing/${listing.id}`} className="block">
                  <div>
                    <div className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {listing.name}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {listing.description}
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold text-green-600">
                  {formatCurrency(listing.asking_price)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold text-blue-600">
                  {formatCurrency(listing.annual_revenue)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{listing.industry}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{listing.location}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {listing.source}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

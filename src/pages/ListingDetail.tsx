
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Building2, 
  Calendar,
  Users,
  ArrowLeft,
  Heart,
  Share2,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { mockListings } from '@/data/mockListings';

const ListingDetail = () => {
  const { id } = useParams();
  
  // Find the listing by id (in a real app, this would be an API call)
  const listing = mockListings.find(listing => listing.id === id);

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Business not found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            ← Back to listings
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to listings</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>Save</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Business Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.name}</h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Building2 className="h-4 w-4" />
                      <span>{listing.industry}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.location}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm">
                  {listing.source}
                </Badge>
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-600">Asking Price</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(listing.askingPrice)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-gray-600">Annual Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(listing.annualRevenue)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-sm text-gray-600">Employees</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.floor(Math.random() * 50) + 5}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      <span className="text-sm text-gray-600">Established</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {2024 - Math.floor(Math.random() * 20) - 3}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Key Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listing.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">About This Business</h4>
                  <p className="text-gray-700 leading-relaxed">
                    This established {listing.industry.toLowerCase()} business has been serving the {listing.location} market 
                    for several years. The company has built a strong reputation and customer base, offering excellent 
                    growth opportunities for the right buyer. With proven systems and processes in place, this represents 
                    an ideal acquisition opportunity.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Growth Opportunities</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Expand into adjacent markets</li>
                    <li>Implement digital marketing strategies</li>
                    <li>Add complementary services</li>
                    <li>Scale operations with proven business model</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact & Actions */}
          <div className="space-y-6">
            
            {/* Contact Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl">Contact Seller</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg">
                  <Phone className="h-4 w-4 mr-2" />
                  Request Information
                </Button>
                
                <Button variant="outline" className="w-full" size="lg">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                
                <Button variant="outline" className="w-full" size="lg">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on {listing.source}
                </Button>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 text-center">
                    Listed by verified broker
                  </p>
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Verified Listing</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Listings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Similar Businesses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockListings
                  .filter(l => l.id !== listing.id && l.industry === listing.industry)
                  .slice(0, 3)
                  .map((similarListing) => (
                    <Link 
                      key={similarListing.id}
                      to={`/listing/${similarListing.id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
                        {similarListing.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {similarListing.description}
                      </p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(similarListing.askingPrice)}
                      </p>
                    </Link>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;

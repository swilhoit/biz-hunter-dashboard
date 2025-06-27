
import { useParams, Link } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBusinessListing } from "@/hooks/useBusinessListings";
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Building2, 
  MapPin, 
  Calendar,
  ExternalLink,
  Heart,
  Mail,
  Phone
} from "lucide-react";
import { extractOriginalUrl } from "../utils/extractOriginalUrl";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading, error } = useBusinessListing(id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading business details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Business Not Found</h1>
            <p className="text-gray-600 mb-6">The business listing you're looking for doesn't exist or has been removed.</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Listings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Extract original URL and clean description
  const extractedUrl = extractOriginalUrl(listing.description);
  const originalUrl = extractedUrl || listing.original_url;
  const cleanDescription = listing.description?.replace(/🔗 Original listing:.*$/m, '').trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Listings</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                      {listing.name}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-4 w-4" />
                        <span>{listing.industry}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{listing.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Listed {formatDate(listing.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {originalUrl ? (
                      <a 
                        href={originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <Badge variant="outline" className="flex items-center space-x-1 hover:bg-blue-50 hover:border-blue-300 transition-colors">
                          <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                          <span>{listing.source}</span>
                        </Badge>
                      </a>
                    ) : (
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <ExternalLink className="h-3 w-3" />
                        <span>{listing.source}</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Asking Price</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(listing.asking_price)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Revenue</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(listing.annual_revenue)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Business Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {cleanDescription}
                </p>
                {originalUrl && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 mb-2 font-medium">View Original Listing:</p>
                    <a 
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="underline">Visit {listing.source}</span>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Highlights */}
            {listing.highlights && listing.highlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {listing.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-gray-700">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Interested in this business?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  <Phone className="h-4 w-4 mr-2" />
                  Request Call
                </Button>
                <Separator />
                <Button variant="ghost" className="w-full">
                  <Heart className="h-4 w-4 mr-2" />
                  Save to Favorites
                </Button>
                
                <div className="text-xs text-muted-foreground text-center">
                  By contacting the seller, you agree to our terms of service
                </div>
              </CardContent>
            </Card>

            {/* Business Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry:</span>
                  <span className="font-medium">{listing.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{listing.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source:</span>
                  {originalUrl ? (
                    <a 
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
                    >
                      <span>{listing.source}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="font-medium">{listing.source}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listed:</span>
                  <span className="font-medium">{formatDate(listing.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;

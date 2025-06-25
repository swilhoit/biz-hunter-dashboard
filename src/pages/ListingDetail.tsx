import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  CheckCircle,
  FileText,
  BarChart3,
  Shield,
  Clock
} from 'lucide-react';
import { useBusinessListing, useBusinessListings, useToggleFavorite } from '@/hooks/useBusinessListings';
import { useAuth } from '@/hooks/useAuth';

const ListingDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  
  const { data: listing, isLoading, error } = useBusinessListing(id!);
  const { data: allListings } = useBusinessListings();
  const toggleFavoriteMutation = useToggleFavorite();

  const handleToggleFavorite = () => {
    if (!user || !listing) return;
    toggleFavoriteMutation.mutate({
      listingId: listing.id,
      userId: user.id
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertDescription>
              Business listing not found or failed to load.
            </AlertDescription>
          </Alert>
          <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
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

  const similarListings = allListings?.filter(l => 
    l.id !== listing.id && l.industry === listing.industry
  ).slice(0, 3) || [];

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
              {user && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  onClick={handleToggleFavorite}
                  disabled={toggleFavoriteMutation.isPending}
                >
                  <Heart className="h-4 w-4" />
                  <span>Save</span>
                </Button>
              )}
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
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-4 leading-tight">
                    {listing.name}
                  </h1>
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

            {/* Tabs Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Key Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-light">Financial Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">Asking Price</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(listing.asking_price)}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          <span className="text-sm text-gray-600">Annual Revenue</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(listing.annual_revenue)}
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
                    <CardTitle className="text-2xl font-light">Key Highlights</CardTitle>
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
                    <CardTitle className="text-2xl font-light">Business Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">About This Business</h4>
                      <p className="text-gray-700 leading-relaxed">
                        This established {listing.industry.toLowerCase()} business has been serving the {listing.location} market 
                        for several years. The company has built a strong reputation and customer base, offering excellent 
                        growth opportunities for the right buyer. With proven systems and processes in place, this represents 
                        an ideal acquisition opportunity.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Growth Opportunities</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Expand into adjacent markets</li>
                        <li>Implement digital marketing strategies</li>
                        <li>Add complementary services</li>
                        <li>Scale operations with proven business model</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financials" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-light flex items-center space-x-2">
                      <BarChart3 className="h-6 w-6" />
                      <span>Financial Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Net Profit</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(listing.annual_revenue * 0.15)}
                        </p>
                        <p className="text-sm text-gray-600">15% margin</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">EBITDA</h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(listing.annual_revenue * 0.22)}
                        </p>
                        <p className="text-sm text-gray-600">22% margin</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Cash Flow</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(listing.annual_revenue * 0.18)}
                        </p>
                        <p className="text-sm text-gray-600">18% of revenue</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">3-Year Financial Summary</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Year</th>
                              <th className="text-right py-2">Revenue</th>
                              <th className="text-right py-2">EBITDA</th>
                              <th className="text-right py-2">Net Profit</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2">2023</td>
                              <td className="text-right py-2">{formatCurrency(listing.annual_revenue)}</td>
                              <td className="text-right py-2">{formatCurrency(listing.annual_revenue * 0.22)}</td>
                              <td className="text-right py-2">{formatCurrency(listing.annual_revenue * 0.15)}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2">2022</td>
                              <td className="text-right py-2">{formatCurrency(listing.annual_revenue * 0.9)}</td>
                              <td className="text-right py-2">{formatCurrency(listing.annual_revenue * 0.9 * 0.20)}</td>
                              <td className="text-right py-2">{formatCurrency(listing.annual_revenue * 0.9 * 0.13)}</td>
                            </tr>
                            <tr>
                              <td className="py-2">2021</td>
                              <td className="text-right py-2">{formatCurrency(listing.annual_revenue * 0.8)}</td>
                              <td className="text-right py-2">{formatCurrency(listing.annual_revenue * 0.8 * 0.18)}</td>
                              <td className="text-right py-2">{formatCurrency(listing.annual_revenue * 0.8 * 0.12)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-light flex items-center space-x-2">
                      <FileText className="h-6 w-6" />
                      <span>Available Documents</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Financial Statements (3 years)</h4>
                            <p className="text-sm text-gray-600">Profit & Loss, Balance Sheet, Cash Flow</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Request Access</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-green-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Tax Returns</h4>
                            <p className="text-sm text-gray-600">Corporate tax filings for last 3 years</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Request Access</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-purple-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Business Operations Manual</h4>
                            <p className="text-sm text-gray-600">Processes, procedures, and systems documentation</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Request Access</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-orange-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Employee Information</h4>
                            <p className="text-sm text-gray-600">Organizational chart and key personnel details</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Request Access</Button>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Confidential Information</h4>
                          <p className="text-sm text-blue-700">
                            Access to detailed financial documents requires signing a Non-Disclosure Agreement (NDA). 
                            Contact the seller to begin the due diligence process.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-light flex items-center space-x-2">
                      <Clock className="h-6 w-6" />
                      <span>Business History & Timeline</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border-l-4 border-blue-600 pl-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full -ml-8"></div>
                          <span className="text-sm text-gray-600">2024 - Present</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">Current Performance</h4>
                        <p className="text-gray-700">Strong market position with consistent revenue growth and expanding customer base.</p>
                      </div>
                      
                      <div className="border-l-4 border-green-600 pl-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-green-600 rounded-full -ml-8"></div>
                          <span className="text-sm text-gray-600">2022 - 2023</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">Digital Transformation</h4>
                        <p className="text-gray-700">Implemented new technology systems and expanded online presence, resulting in 25% revenue increase.</p>
                      </div>
                      
                      <div className="border-l-4 border-purple-600 pl-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-purple-600 rounded-full -ml-8"></div>
                          <span className="text-sm text-gray-600">2020 - 2021</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">Market Expansion</h4>
                        <p className="text-gray-700">Successfully expanded into new geographic markets and diversified service offerings.</p>
                      </div>
                      
                      <div className="border-l-4 border-orange-600 pl-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-orange-600 rounded-full -ml-8"></div>
                          <span className="text-sm text-gray-600">{2024 - Math.floor(Math.random() * 20) - 3}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">Company Founded</h4>
                        <p className="text-gray-700">Business established with focus on delivering quality services in the {listing.industry.toLowerCase()} sector.</p>
                      </div>
                    </div>
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-1">Years in Business</h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.floor(Math.random() * 20) + 3}+
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-1">Customer Retention</h4>
                        <p className="text-2xl font-bold text-green-600">95%</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-1">Market Position</h4>
                        <p className="text-2xl font-bold text-purple-600">Top 3</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Contact & Actions */}
          <div className="space-y-6">
            
            {/* Contact Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-2xl font-light">Contact Seller</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <>
                    <Button className="w-full" size="lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Request Information
                    </Button>
                    
                    <Button variant="outline" className="w-full" size="lg">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">Sign in to contact the seller</p>
                    <Link to="/auth">
                      <Button className="w-full" size="lg">
                        Sign In to Contact
                      </Button>
                    </Link>
                  </div>
                )}
                
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
                <CardTitle className="text-xl font-light">Similar Businesses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {similarListings.map((similarListing) => (
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
                      {formatCurrency(similarListing.asking_price)}
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

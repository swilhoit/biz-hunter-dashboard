import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Package, 
  TrendingUp, 
  Mail, 
  Phone, 
  Linkedin, 
  Globe,
  Building,
  MapPin,
  ExternalLink,
  Search,
  User
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

// Mock data - in production this would come from the database
const mockSellerData = {
  '1': {
    id: '1',
    seller_name: 'Premium Beauty Brands LLC',
    category: 'Beauty & Personal Care',
    monthly_revenue: 450000,
    monthly_profit: 112500,
    annual_revenue: 5400000,
    annual_profit: 1350000,
    business_age_months: 48,
    top_asins: [
      { asin: 'B09XYZ123', name: 'Vitamin C Serum', monthly_revenue: 85000 },
      { asin: 'B09XYZ124', name: 'Retinol Cream', monthly_revenue: 72000 },
      { asin: 'B09XYZ125', name: 'Hyaluronic Acid', monthly_revenue: 68000 }
    ],
    all_asins: Array(23).fill(null).map((_, i) => ({
      asin: `B09XYZ${(126 + i).toString().padStart(3, '0')}`,
      name: `Product ${i + 4}`,
      monthly_revenue: Math.floor(Math.random() * 50000) + 10000
    })),
    revenue_trend: 'increasing',
    profit_margin: 25,
    headquarters: 'Los Angeles, CA',
    established_year: 2021,
    description: 'Premium Beauty Brands is a leading seller of high-quality skincare products on Amazon, specializing in science-backed formulations.',
    highlights: [
      'Top 1% seller in Beauty category',
      'Average 4.5+ star ratings across all products',
      'Strong brand loyalty with 40% repeat purchase rate',
      'Proprietary formulations with patent pending'
    ]
  }
};

function OffMarketSellerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [searchingContact, setSearchingContact] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  const seller = mockSellerData[id] || mockSellerData['1'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatAge = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0) {
      return `${years} years ${remainingMonths} months`;
    }
    return `${months} months`;
  };

  const searchRocketReach = async () => {
    setSearchingContact(true);
    // Simulate API call
    setTimeout(() => {
      setContactInfo({
        owner_name: 'Sarah Johnson',
        title: 'CEO & Founder',
        email: 's.johnson@example.com',
        phone: '+1 (310) 555-0123',
        linkedin: 'linkedin.com/in/sarahjohnson',
        company_website: 'www.premiumbeautybrands.com',
        confidence_score: 85
      });
      setSearchingContact(false);
      showSuccess('Contact information found via RocketReach');
    }, 2000);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar />
      
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/listings')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </button>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold mb-2">
                {seller.seller_name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {seller.category}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {seller.headquarters}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Financial Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Financial Overview
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Monthly Revenue
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(seller.monthly_revenue)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Monthly Profit
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(seller.monthly_profit)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Annual Revenue
                      </div>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(seller.annual_revenue)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Profit Margin
                      </div>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {seller.profit_margin}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Business Details
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {seller.description}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Established: {seller.established_year} ({formatAge(seller.business_age_months)})
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Package className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Total ASINs: {seller.all_asins.length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Building className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Headquarters: {seller.headquarters}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Highlights */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Key Highlights
                  </h2>
                  <ul className="space-y-2">
                    {seller.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Top Products */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Top Products
                  </h2>
                  <div className="space-y-3">
                    {seller.top_asins.map((product, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {product.asin}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(product.monthly_revenue)}/mo
                        </p>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
                    View all {seller.all_asins.length} products →
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Contact Information
                  </h2>
                  
                  {!contactInfo && !showContactSearch && (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No contact information available
                      </p>
                      <button
                        onClick={() => setShowContactSearch(true)}
                        className="btn bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Find Contact Info
                      </button>
                    </div>
                  )}

                  {showContactSearch && !contactInfo && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          RocketReach Integration
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          Search for owner contact information using RocketReach
                        </p>
                        <button
                          onClick={searchRocketReach}
                          disabled={searchingContact}
                          className="w-full btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {searchingContact ? (
                            <>
                              <span className="animate-spin mr-2">⚪</span>
                              Searching...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Search RocketReach
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {contactInfo && (
                    <div className="space-y-3">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {contactInfo.owner_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {contactInfo.title}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <a href={`mailto:${contactInfo.email}`} className="flex items-center text-gray-700 dark:text-gray-300 hover:text-indigo-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {contactInfo.email}
                        </a>
                        <a href={`tel:${contactInfo.phone}`} className="flex items-center text-gray-700 dark:text-gray-300 hover:text-indigo-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {contactInfo.phone}
                        </a>
                        <a href={`https://${contactInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-indigo-600">
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn Profile
                        </a>
                        <a href={`https://${contactInfo.company_website}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-indigo-600">
                          <Globe className="w-4 h-4 mr-2" />
                          Company Website
                        </a>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500">
                          Confidence Score: {contactInfo.confidence_score}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Actions
                  </h2>
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        // In production, this would add to pipeline
                        showSuccess('Added to pipeline successfully');
                      }}
                      className="w-full btn bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Add to Pipeline
                    </button>
                    <button className="w-full btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">
                      Request More Info
                    </button>
                    <button className="w-full btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">
                      Schedule Call
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default OffMarketSellerDetails;
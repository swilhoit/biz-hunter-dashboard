import React, { useState, useEffect } from 'react';
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
import { supabase } from '../lib/supabase';

function OffMarketSellerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [searchingContact, setSearchingContact] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [asins, setAsins] = useState([]);

  useEffect(() => {
    loadSellerData();
  }, [id]);

  const loadSellerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load seller details
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', id)
        .single();

      if (sellerError) {
        setError('Seller not found');
        return;
      }

      // Load seller contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('seller_contacts')
        .select('*')
        .eq('seller_id', id);

      // Load seller ASINs
      const { data: asinsData, error: asinsError } = await supabase
        .from('asin_sellers')
        .select(`
          asins (
            asin,
            category,
            price,
            est_rev
          )
        `)
        .eq('seller_id', id);

      setSeller(sellerData);
      setContacts(contactsData || []);
      setAsins(asinsData?.map(item => item.asins) || []);

    } catch (error) {
      console.error('Error loading seller data:', error);
      setError('Failed to load seller data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatAge = (months) => {
    if (!months) return 'Unknown';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0) {
      return `${years} years ${remainingMonths} months`;
    }
    return `${months} months`;
  };

  const calculateMetrics = (seller) => {
    if (!seller) return { monthly_revenue: 0, monthly_profit: 0, annual_revenue: 0 };
    
    const annual_revenue = seller.total_est_revenue || 0;
    const monthly_revenue = Math.round(annual_revenue / 12);
    const profit_margin = 0.25; // Assume 25% profit margin
    const monthly_profit = Math.round(monthly_revenue * profit_margin);
    
    return {
      monthly_revenue,
      monthly_profit,
      annual_revenue,
      profit_margin: Math.round(profit_margin * 100)
    };
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading seller details...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <button
                onClick={() => navigate('/listings')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Feed
              </button>
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400">{error || 'Seller not found'}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics(seller);

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
                {seller.seller_name || 'Unknown Seller'}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Amazon Seller
                </span>
                {seller.is_whale && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    🐋 Whale Seller
                  </span>
                )}
                {seller.seller_url && (
                  <a
                    href={seller.seller_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Visit Amazon Store
                  </a>
                )}
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
                        Monthly Revenue (Est.)
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(metrics.monthly_revenue)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Monthly Profit (Est.)
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(metrics.monthly_profit)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Annual Revenue (Est.)
                      </div>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(metrics.annual_revenue)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <Package className="w-4 h-4 mr-1" />
                        Total Listings
                      </div>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {seller.listings_count || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Business Details
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <span className="text-gray-700 dark:text-gray-300">Amazon Store: </span>
                        {seller.seller_url ? (
                          <a 
                            href={seller.seller_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Store
                          </a>
                        ) : (
                          <span className="text-gray-500">Not available</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Package className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Total ASINs: {asins.length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Average Rating: {seller.avg_rating ? `${seller.avg_rating}/5 ⭐` : 'Not available'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Last Updated: {new Date(seller.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Contact Information
                  </h2>
                  {contacts.length > 0 ? (
                    <div className="space-y-3">
                      {contacts.map((contact, index) => (
                        <div key={index} className="flex items-center">
                          {contact.contact_type === 'email' && <Mail className="w-4 h-4 mr-3 text-gray-400" />}
                          {contact.contact_type === 'phone' && <Phone className="w-4 h-4 mr-3 text-gray-400" />}
                          {contact.contact_type === 'linkedin' && <Linkedin className="w-4 h-4 mr-3 text-gray-400" />}
                          {contact.contact_type === 'website' && <Globe className="w-4 h-4 mr-3 text-gray-400" />}
                          <div>
                            <span className="text-sm text-gray-500 capitalize">{contact.contact_type}: </span>
                            {contact.contact_type === 'email' || contact.contact_type === 'phone' ? (
                              <span className="text-gray-700 dark:text-gray-300">{contact.contact_value}</span>
                            ) : (
                              <a 
                                href={contact.contact_value} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {contact.contact_value}
                              </a>
                            )}
                            {contact.verified && (
                              <span className="ml-2 text-xs text-green-600">✓ Verified</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No contact information available</p>
                  )}
                </div>

                {/* Top Products */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Products (ASINs)
                  </h2>
                  {asins.length > 0 ? (
                    <div className="space-y-3">
                      {asins.slice(0, 5).map((product, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {product.asin}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Category: {product.category || 'Unknown'}
                            </p>
                            {product.price && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Price: {formatCurrency(product.price)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {product.est_rev && (
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrency(product.est_rev)}
                              </p>
                            )}
                            <a
                              href={`https://www.amazon.com/dp/${product.asin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View on Amazon
                            </a>
                          </div>
                        </div>
                      ))}
                      {asins.length > 5 && (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                          Showing 5 of {asins.length} total products
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No products found</p>
                  )}
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
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

function ContactStatsCard() {
  const [stats, setStats] = useState({
    totalContacts: 0,
    contactsByType: {},
    contactsBySource: {},
    verifiedContacts: 0,
    sellersWithContacts: 0,
    avgContactsPerSeller: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactStats();
  }, []);

  const loadContactStats = async () => {
    try {
      // Get all contacts with seller info
      const { data: contacts } = await supabase
        .from('seller_contacts')
        .select('contact_type, source, verified, seller_id');

      const totalContacts = contacts?.length || 0;
      const contactsByType = {};
      const contactsBySource = {};
      const sellerIds = new Set();
      let verifiedCount = 0;

      contacts?.forEach(contact => {
        // Count by type
        contactsByType[contact.contact_type] = (contactsByType[contact.contact_type] || 0) + 1;
        
        // Count by source
        contactsBySource[contact.source] = (contactsBySource[contact.source] || 0) + 1;
        
        // Track unique sellers
        sellerIds.add(contact.seller_id);
        
        // Count verified contacts
        if (contact.verified) verifiedCount++;
      });

      const sellersWithContacts = sellerIds.size;
      const avgContactsPerSeller = sellersWithContacts > 0 ? totalContacts / sellersWithContacts : 0;

      setStats({
        totalContacts,
        contactsByType,
        contactsBySource,
        verifiedContacts: verifiedCount,
        sellersWithContacts,
        avgContactsPerSeller
      });

    } catch (error) {
      console.error('Error loading contact stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      email: '📧',
      phone: '📞',
      domain: '🌐',
      social: '🔗'
    };
    return icons[type] || '📝';
  };

  const getSourceColor = (source) => {
    const colors = {
      storefront: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      whois: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      hunter: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      clearbit: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      rocketreach: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[source] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="col-span-12 lg:col-span-6 xl:col-span-4">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Contact Statistics</h2>
          </div>
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        </div>
      </div>
    );
  }

  const verificationRate = stats.totalContacts > 0 ? (stats.verifiedContacts / stats.totalContacts) * 100 : 0;

  return (
    <div className="col-span-12 lg:col-span-6 xl:col-span-4">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
        <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Contact Statistics</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Overview of extracted contact information
          </p>
        </header>
        
        <div className="p-5">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.totalContacts.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Contacts</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.sellersWithContacts.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Sellers w/ Contacts</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.avgContactsPerSeller.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Avg per Seller</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {Math.round(verificationRate)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Verified Rate</div>
            </div>
          </div>

          {/* Contact Types */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              By Contact Type
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.contactsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getTypeIcon(type)}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {count.toLocaleString()}
                    </span>
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ 
                          width: `${stats.totalContacts > 0 ? (count / stats.totalContacts) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Sources */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              By Source
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.contactsBySource).map(([source, count]) => (
                <span 
                  key={source}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getSourceColor(source)}`}
                >
                  {source}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Verification Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Progress
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.verifiedContacts}/{stats.totalContacts}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${verificationRate}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={loadContactStats}
              className="btn-sm bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
            >
              Refresh
            </button>
            <button className="btn-sm bg-blue-500 hover:bg-blue-600 text-white">
              Export All
            </button>
          </div>

          {/* Empty State */}
          {stats.totalContacts === 0 && (
            <div className="text-center py-6">
              <div className="text-gray-400 dark:text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No contacts yet</p>
                <p className="text-gray-500 dark:text-gray-400">Run storefront parsing to extract contact information.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactStatsCard;
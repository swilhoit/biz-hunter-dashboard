import { supabase } from '../lib/supabase';

interface WhoisData {
  domain: string;
  registrant_name?: string;
  registrant_email?: string;
  registrant_phone?: string;
  registrant_organization?: string;
  registrant_address?: string;
  registrant_city?: string;
  registrant_state?: string;
  registrant_country?: string;
  admin_email?: string;
  admin_phone?: string;
  tech_email?: string;
  tech_phone?: string;
  creation_date?: string;
  expiration_date?: string;
  registrar?: string;
  name_servers?: string[];
}

interface DomainEnrichmentResult {
  domain: string;
  enriched: boolean;
  contactsFound: number;
  whoisData?: WhoisData;
  error?: string;
  cost: number;
}

interface EnrichmentSummary {
  totalDomains: number;
  enrichedDomains: number;
  contactsFound: number;
  totalCost: number;
  failedEnrichments: number;
}

class DomainEnrichmentService {
  private dataForSEOBaseUrl = 'https://api.dataforseo.com';
  private credentials: string;

  constructor() {
    const username = process.env.DATAFORSEO_USERNAME || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    this.credentials = Buffer.from(`${username}:${password}`).toString('base64');
  }

  // Main method to enrich domains with WHOIS data
  async enrichDomainsWithWhois(options: {
    maxDomains?: number;
    batchSize?: number;
    prioritizeSellerDomains?: boolean;
  } = {}): Promise<EnrichmentSummary> {
    const { maxDomains = 100, batchSize = 10, prioritizeSellerDomains = true } = options;

    let totalDomains = 0;
    let enrichedDomains = 0;
    let contactsFound = 0;
    let totalCost = 0;
    let failedEnrichments = 0;

    try {
      // Get domains that need enrichment
      const domainsToEnrich = await this.getDomainsForEnrichment(maxDomains, prioritizeSellerDomains);
      
      if (domainsToEnrich.length === 0) {
        console.log('No domains found for enrichment');
        return {
          totalDomains: 0,
          enrichedDomains: 0,
          contactsFound: 0,
          totalCost: 0,
          failedEnrichments: 0
        };
      }

      console.log(`Starting domain enrichment for ${domainsToEnrich.length} domains`);

      // Process domains in batches
      const chunks = this.chunkArray(domainsToEnrich, batchSize);
      
      for (const chunk of chunks) {
        const promises = chunk.map(domain => this.enrichDomain(domain));
        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          totalDomains++;
          
          if (result.status === 'fulfilled') {
            const enrichmentResult = result.value;
            if (enrichmentResult.enriched) {
              enrichedDomains++;
              contactsFound += enrichmentResult.contactsFound;
            } else {
              failedEnrichments++;
            }
            totalCost += enrichmentResult.cost;
          } else {
            failedEnrichments++;
            console.error(`Failed to enrich domain ${chunk[index]}:`, result.reason);
          }
        });

        // Delay between batches to avoid rate limiting
        await this.sleep(2000);
      }

      console.log(`Domain enrichment completed: ${enrichedDomains} enriched, ${failedEnrichments} failed, ${contactsFound} contacts found`);

      return {
        totalDomains,
        enrichedDomains,
        contactsFound,
        totalCost,
        failedEnrichments
      };

    } catch (error) {
      console.error('Error in enrichDomainsWithWhois:', error);
      throw error;
    }
  }

  // Get domains that need enrichment
  private async getDomainsForEnrichment(limit: number, prioritizeSellerDomains: boolean): Promise<string[]> {
    const domains = new Set<string>();

    if (prioritizeSellerDomains) {
      // Get domains from seller contacts
      const { data: sellerDomains } = await supabase
        .from('seller_contacts')
        .select('contact_value, seller_id')
        .eq('contact_type', 'domain');

      sellerDomains?.forEach(contact => {
        const domain = this.cleanDomain(contact.contact_value);
        if (domain && this.isValidDomain(domain)) {
          domains.add(domain);
        }
      });

      // Get domains from seller storefronts
      const { data: storefronts } = await supabase
        .from('seller_storefronts')
        .select('external_domains, seller_id');

      storefronts?.forEach(storefront => {
        if (storefront.external_domains) {
          storefront.external_domains.forEach((domain: string) => {
            const cleanDomain = this.cleanDomain(domain);
            if (cleanDomain && this.isValidDomain(cleanDomain)) {
              domains.add(cleanDomain);
            }
          });
        }
      });
    }

    // Filter out already enriched domains
    const domainList = Array.from(domains);
    const { data: enrichedDomains } = await supabase
      .from('domain_enrichment')
      .select('domain')
      .in('domain', domainList);

    const enrichedSet = new Set(enrichedDomains?.map(d => d.domain) || []);
    const unenrichedDomains = domainList.filter(domain => !enrichedSet.has(domain));

    return unenrichedDomains.slice(0, limit);
  }

  // Enrich individual domain with WHOIS data
  private async enrichDomain(domain: string): Promise<DomainEnrichmentResult> {
    try {
      const whoisData = await this.getWhoisData(domain);
      
      if (!whoisData) {
        return {
          domain,
          enriched: false,
          contactsFound: 0,
          cost: 0.001,
          error: 'No WHOIS data found'
        };
      }

      // Store WHOIS data in database
      const { error: insertError } = await supabase
        .from('domain_enrichment')
        .upsert({
          domain,
          whois_data: whoisData,
          registrant_email: whoisData.registrant_email,
          registrant_phone: whoisData.registrant_phone,
          company_name: whoisData.registrant_organization,
          enriched_at: new Date().toISOString()
        }, { onConflict: 'domain' });

      if (insertError) {
        throw new Error(`Failed to store WHOIS data: ${insertError.message}`);
      }

      // Extract and store contact information
      const contactsFound = await this.extractAndStoreContacts(domain, whoisData);

      return {
        domain,
        enriched: true,
        contactsFound,
        whoisData,
        cost: 0.001 // DataForSEO WHOIS cost
      };

    } catch (error) {
      console.error(`Error enriching domain ${domain}:`, error);
      
      return {
        domain,
        enriched: false,
        contactsFound: 0,
        cost: 0.001,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get WHOIS data from DataForSEO API
  private async getWhoisData(domain: string): Promise<WhoisData | null> {
    try {
      const response = await fetch(`${this.dataForSEOBaseUrl}/v3/domain_analytics/whois/overview/live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.credentials}`
        },
        body: JSON.stringify([{
          target: domain
        }])
      });

      if (!response.ok) {
        throw new Error(`WHOIS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.tasks || data.tasks.length === 0 || !data.tasks[0].result) {
        return null;
      }

      const result = data.tasks[0].result[0];
      if (!result.items || result.items.length === 0) {
        return null;
      }

      const whoisItem = result.items[0];
      
      return {
        domain,
        registrant_name: whoisItem.registrant_name,
        registrant_email: whoisItem.registrant_email,
        registrant_phone: whoisItem.registrant_phone,
        registrant_organization: whoisItem.registrant_organization,
        registrant_address: whoisItem.registrant_address,
        registrant_city: whoisItem.registrant_city,
        registrant_state: whoisItem.registrant_state_province,
        registrant_country: whoisItem.registrant_country,
        admin_email: whoisItem.admin_email,
        admin_phone: whoisItem.admin_phone,
        tech_email: whoisItem.tech_email,
        tech_phone: whoisItem.tech_phone,
        creation_date: whoisItem.creation_date,
        expiration_date: whoisItem.expiration_date,
        registrar: whoisItem.registrar,
        name_servers: whoisItem.name_servers
      };

    } catch (error) {
      console.error(`Error getting WHOIS data for ${domain}:`, error);
      return null;
    }
  }

  // Extract and store contact information from WHOIS data
  private async extractAndStoreContacts(domain: string, whoisData: WhoisData): Promise<number> {
    const contacts = [];
    let contactsFound = 0;

    // Find sellers associated with this domain
    const { data: associatedSellers } = await supabase
      .from('seller_contacts')
      .select('seller_id')
      .eq('contact_type', 'domain')
      .eq('contact_value', domain);

    const sellerIds = associatedSellers?.map(s => s.seller_id) || [];

    // Also check external domains in storefronts
    const { data: storefrontSellers } = await supabase
      .from('seller_storefronts')
      .select('seller_id')
      .contains('external_domains', [domain]);

    const storefrontSellerIds = storefrontSellers?.map(s => s.seller_id) || [];
    const allSellerIds = [...new Set([...sellerIds, ...storefrontSellerIds])];

    // Extract contacts from WHOIS data
    const contactFields = [
      { field: 'registrant_email', type: 'email' },
      { field: 'registrant_phone', type: 'phone' },
      { field: 'admin_email', type: 'email' },
      { field: 'admin_phone', type: 'phone' },
      { field: 'tech_email', type: 'email' },
      { field: 'tech_phone', type: 'phone' }
    ];

    for (const { field, type } of contactFields) {
      const value = whoisData[field as keyof WhoisData];
      if (value && typeof value === 'string') {
        const cleanValue = this.cleanContact(value, type);
        if (cleanValue && this.isValidContact(cleanValue, type)) {
          // Add contact for each associated seller
          for (const sellerId of allSellerIds) {
            contacts.push({
              seller_id: sellerId,
              contact_type: type,
              contact_value: cleanValue,
              source: 'whois',
              verified: false
            });
          }
          contactsFound++;
        }
      }
    }

    // Insert contacts into database
    if (contacts.length > 0) {
      const { error } = await supabase
        .from('seller_contacts')
        .upsert(contacts, { onConflict: 'seller_id,contact_type,contact_value' });

      if (error) {
        console.error(`Failed to insert WHOIS contacts for ${domain}:`, error);
        return 0;
      }
    }

    return contactsFound;
  }

  // Clean domain name
  private cleanDomain(domain: string): string {
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .toLowerCase()
      .trim();
  }

  // Validate domain
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.includes('.');
  }

  // Clean contact information
  private cleanContact(value: string, type: string): string {
    if (type === 'email') {
      return value.toLowerCase().trim();
    } else if (type === 'phone') {
      return value.replace(/\D/g, '');
    }
    return value.trim();
  }

  // Validate contact information
  private isValidContact(value: string, type: string): boolean {
    if (type === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    } else if (type === 'phone') {
      return /^\+?1?\d{10,}$/.test(value);
    }
    return true;
  }

  // Get enrichment statistics
  async getEnrichmentStats(): Promise<{
    totalDomains: number;
    enrichedDomains: number;
    contactsFromWhois: number;
    topRegistrars: Array<{ registrar: string; count: number }>;
    topCountries: Array<{ country: string; count: number }>;
    expiringDomains: number;
  }> {
    const { data: enrichedDomains } = await supabase
      .from('domain_enrichment')
      .select('*');

    const totalDomains = enrichedDomains?.length || 0;

    const { data: whoisContacts } = await supabase
      .from('seller_contacts')
      .select('*')
      .eq('source', 'whois');

    const contactsFromWhois = whoisContacts?.length || 0;

    // Count registrars
    const registrarCount: { [key: string]: number } = {};
    const countryCount: { [key: string]: number } = {};
    let expiringDomains = 0;

    enrichedDomains?.forEach(domain => {
      const whoisData = domain.whois_data;
      if (whoisData) {
        if (whoisData.registrar) {
          registrarCount[whoisData.registrar] = (registrarCount[whoisData.registrar] || 0) + 1;
        }
        if (whoisData.registrant_country) {
          countryCount[whoisData.registrant_country] = (countryCount[whoisData.registrant_country] || 0) + 1;
        }
        if (whoisData.expiration_date) {
          const expirationDate = new Date(whoisData.expiration_date);
          const sixMonthsFromNow = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);
          if (expirationDate < sixMonthsFromNow) {
            expiringDomains++;
          }
        }
      }
    });

    const topRegistrars = Object.entries(registrarCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([registrar, count]) => ({ registrar, count }));

    const topCountries = Object.entries(countryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    return {
      totalDomains,
      enrichedDomains: totalDomains,
      contactsFromWhois,
      topRegistrars,
      topCountries,
      expiringDomains
    };
  }

  // Get sellers with enriched domain data
  async getSellersWithEnrichedDomains(limit: number = 50): Promise<Array<{
    seller_id: string;
    seller_name: string;
    seller_url: string;
    enriched_domains: Array<{
      domain: string;
      registrant_email?: string;
      registrant_phone?: string;
      company_name?: string;
      registrar?: string;
      expiration_date?: string;
    }>;
    total_contacts_from_whois: number;
  }>> {
    const { data: sellers } = await supabase
      .from('seller_metrics')
      .select('*')
      .order('total_est_revenue', { ascending: false })
      .limit(limit);

    const results = [];

    for (const seller of sellers || []) {
      // Get domain contacts for this seller
      const { data: domainContacts } = await supabase
        .from('seller_contacts')
        .select('contact_value')
        .eq('seller_id', seller.id)
        .eq('contact_type', 'domain');

      // Get external domains from storefronts
      const { data: storefronts } = await supabase
        .from('seller_storefronts')
        .select('external_domains')
        .eq('seller_id', seller.id);

      const allDomains = new Set<string>();
      domainContacts?.forEach(contact => allDomains.add(contact.contact_value));
      storefronts?.forEach(storefront => {
        if (storefront.external_domains) {
          storefront.external_domains.forEach((domain: string) => allDomains.add(domain));
        }
      });

      if (allDomains.size === 0) continue;

      // Get enrichment data for these domains
      const { data: enrichedDomains } = await supabase
        .from('domain_enrichment')
        .select('*')
        .in('domain', Array.from(allDomains));

      const { data: whoisContacts } = await supabase
        .from('seller_contacts')
        .select('*')
        .eq('seller_id', seller.id)
        .eq('source', 'whois');

      const enrichedDomainsData = enrichedDomains?.map(domain => ({
        domain: domain.domain,
        registrant_email: domain.registrant_email,
        registrant_phone: domain.registrant_phone,
        company_name: domain.company_name,
        registrar: domain.whois_data?.registrar,
        expiration_date: domain.whois_data?.expiration_date
      })) || [];

      if (enrichedDomainsData.length > 0) {
        results.push({
          seller_id: seller.id,
          seller_name: seller.seller_name,
          seller_url: seller.seller_url,
          enriched_domains: enrichedDomainsData,
          total_contacts_from_whois: whoisContacts?.length || 0
        });
      }
    }

    return results;
  }

  // Utility methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default DomainEnrichmentService;
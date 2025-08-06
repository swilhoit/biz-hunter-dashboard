import { supabase } from '../lib/supabase';
import DataForSEOService from './DataForSEOService';

interface ContactInfo {
  type: 'email' | 'phone' | 'domain' | 'social';
  value: string;
  source: 'storefront' | 'whois' | 'manual';
  confidence: number;
}

interface StorefrontParseResult {
  sellerId: string;
  sellerUrl: string;
  contacts: ContactInfo[];
  externalDomains: string[];
  businessInfo: any;
  parseSuccess: boolean;
  error?: string;
}

interface ParsedStorefront {
  sellerId: string;
  emails: string[];
  phones: string[];
  domains: string[];
  socialLinks: string[];
  businessInfo: {
    title?: string;
    description?: string;
    keywords?: string;
    companyName?: string;
    address?: string;
  };
}

class StorefrontParsingService {
  private dataForSEO: DataForSEOService;
  private emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  private phoneRegex = /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  private domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/g;

  constructor() {
    this.dataForSEO = new DataForSEOService();
  }

  // Main method to parse storefronts for sellers
  async parseStorefrontsForSellers(options: {
    sellersToProcess?: number;
    prioritizeWhales?: boolean;
    batchSize?: number;
    maxConcurrent?: number;
  } = {}): Promise<{
    totalProcessed: number;
    successfulParses: number;
    failedParses: number;
    contactsFound: number;
    domainsFound: number;
    totalCost: number;
  }> {
    const { 
      sellersToProcess = 100, 
      prioritizeWhales = true, 
      batchSize = 10,
      maxConcurrent = 3
    } = options;

    let totalProcessed = 0;
    let successfulParses = 0;
    let failedParses = 0;
    let contactsFound = 0;
    let domainsFound = 0;
    let totalCost = 0;

    try {
      // Get sellers that need storefront parsing
      const sellersToProcess = await this.getSellersForParsing(sellersToProcess, prioritizeWhales);
      
      if (sellersToProcess.length === 0) {
        console.log('No sellers found for storefront parsing');
        return {
          totalProcessed: 0,
          successfulParses: 0,
          failedParses: 0,
          contactsFound: 0,
          domainsFound: 0,
          totalCost: 0
        };
      }

      console.log(`Starting storefront parsing for ${sellersToProcess.length} sellers`);

      // Process sellers in batches
      const chunks = this.chunkArray(sellersToProcess, batchSize);
      
      for (const chunk of chunks) {
        const promises = chunk.map(seller => this.parseStorefrontForSeller(seller));
        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          totalProcessed++;
          
          if (result.status === 'fulfilled') {
            const parseResult = result.value;
            if (parseResult.parseSuccess) {
              successfulParses++;
              contactsFound += parseResult.contacts.length;
              domainsFound += parseResult.externalDomains.length;
              totalCost += 0.5; // Estimated cost per storefront parse
            } else {
              failedParses++;
            }
          } else {
            failedParses++;
            console.error(`Failed to parse storefront for seller ${chunk[index].seller_url}:`, result.reason);
          }
        });

        // Delay between batches to avoid overwhelming the API
        await this.sleep(3000);
      }

      console.log(`Storefront parsing completed: ${successfulParses} successful, ${failedParses} failed, ${contactsFound} contacts found`);

      return {
        totalProcessed,
        successfulParses,
        failedParses,
        contactsFound,
        domainsFound,
        totalCost
      };

    } catch (error) {
      console.error('Error in parseStorefrontsForSellers:', error);
      throw error;
    }
  }

  // Get sellers that need storefront parsing
  private async getSellersForParsing(limit: number, prioritizeWhales: boolean): Promise<Array<{
    id: string;
    seller_url: string;
    total_est_revenue: number;
    listings_count: number;
    is_whale: boolean;
  }>> {
    let query = supabase
      .from('sellers')
      .select('id, seller_url, total_est_revenue, listings_count, is_whale')
      .eq('storefront_parsed', false)
      .not('seller_url', 'is', null);

    if (prioritizeWhales) {
      query = query.order('is_whale', { ascending: false });
    }

    const { data: sellers, error } = await query
      .order('total_est_revenue', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch sellers for parsing: ${error.message}`);
    }

    return sellers || [];
  }

  // Parse storefront for individual seller
  private async parseStorefrontForSeller(seller: {
    id: string;
    seller_url: string;
    total_est_revenue: number;
    listings_count: number;
  }): Promise<StorefrontParseResult> {
    try {
      // Use DataForSEO service for parsing
      await this.dataForSEO.parseStorefront(seller.seller_url);

      // Get the parsed data from database
      const { data: storefrontData } = await supabase
        .from('seller_storefronts')
        .select('*')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: contacts } = await supabase
        .from('seller_contacts')
        .select('*')
        .eq('seller_id', seller.id)
        .eq('source', 'storefront');

      const contactsArray: ContactInfo[] = (contacts || []).map(contact => ({
        type: contact.contact_type as any,
        value: contact.contact_value,
        source: contact.source as any,
        confidence: contact.verified ? 1.0 : 0.7
      }));

      return {
        sellerId: seller.id,
        sellerUrl: seller.seller_url,
        contacts: contactsArray,
        externalDomains: storefrontData?.external_domains || [],
        businessInfo: storefrontData?.business_info || {},
        parseSuccess: true
      };

    } catch (error) {
      console.error(`Error parsing storefront for seller ${seller.id}:`, error);
      
      return {
        sellerId: seller.id,
        sellerUrl: seller.seller_url,
        contacts: [],
        externalDomains: [],
        businessInfo: {},
        parseSuccess: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Manual parsing method for custom HTML content
  async parseStorefrontContent(sellerId: string, htmlContent: string): Promise<ParsedStorefront> {
    const emails = this.extractEmails(htmlContent);
    const phones = this.extractPhones(htmlContent);
    const domains = this.extractDomains(htmlContent);
    const socialLinks = this.extractSocialLinks(htmlContent);
    const businessInfo = this.extractBusinessInfo(htmlContent);

    // Save parsed data to database
    const contacts = [
      ...emails.map(email => ({ type: 'email' as const, value: email })),
      ...phones.map(phone => ({ type: 'phone' as const, value: phone })),
      ...domains.map(domain => ({ type: 'domain' as const, value: domain })),
      ...socialLinks.map(link => ({ type: 'social' as const, value: link }))
    ];

    // Insert contacts into database
    if (contacts.length > 0) {
      const contactsToInsert = contacts.map(contact => ({
        seller_id: sellerId,
        contact_type: contact.type,
        contact_value: contact.value,
        source: 'storefront',
        verified: false
      }));

      await supabase
        .from('seller_contacts')
        .upsert(contactsToInsert, { onConflict: 'seller_id,contact_type,contact_value' });
    }

    // Insert storefront data
    await supabase
      .from('seller_storefronts')
      .upsert({
        seller_id: sellerId,
        external_domains: domains,
        social_links: socialLinks,
        business_info: businessInfo
      }, { onConflict: 'seller_id' });

    // Mark seller as parsed
    await supabase
      .from('sellers')
      .update({ storefront_parsed: true })
      .eq('id', sellerId);

    return {
      sellerId,
      emails,
      phones,
      domains,
      socialLinks,
      businessInfo
    };
  }

  // Extract email addresses from HTML content
  private extractEmails(content: string): string[] {
    const emails = content.match(this.emailRegex) || [];
    return [...new Set(emails.map(email => email.toLowerCase()))];
  }

  // Extract phone numbers from HTML content
  private extractPhones(content: string): string[] {
    const phones = content.match(this.phoneRegex) || [];
    return [...new Set(phones.map(phone => phone.replace(/\D/g, '')))];
  }

  // Extract domains from HTML content
  private extractDomains(content: string): string[] {
    const domains = content.match(this.domainRegex) || [];
    const cleanDomains = domains.map(domain => {
      return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
    });
    return [...new Set(cleanDomains)];
  }

  // Extract social media links
  private extractSocialLinks(content: string): string[] {
    const socialPlatforms = [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com',
      'youtube.com',
      'tiktok.com',
      'pinterest.com'
    ];

    const links: string[] = [];
    const urlRegex = /href="([^"]+)"/g;
    let match;

    while ((match = urlRegex.exec(content)) !== null) {
      const url = match[1];
      if (socialPlatforms.some(platform => url.includes(platform))) {
        links.push(url);
      }
    }

    return [...new Set(links)];
  }

  // Extract business information from HTML
  private extractBusinessInfo(content: string): any {
    const businessInfo: any = {};

    // Extract title
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      businessInfo.title = titleMatch[1].trim();
    }

    // Extract meta description
    const descMatch = content.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    if (descMatch) {
      businessInfo.description = descMatch[1].trim();
    }

    // Extract meta keywords
    const keywordsMatch = content.match(/<meta[^>]*name="keywords"[^>]*content="([^"]+)"/i);
    if (keywordsMatch) {
      businessInfo.keywords = keywordsMatch[1].trim();
    }

    // Extract company name (various methods)
    const companyPatterns = [
      /company[^>]*>([^<]+)/i,
      /business[^>]*>([^<]+)/i,
      /about[^>]*>([^<]+)/i
    ];

    for (const pattern of companyPatterns) {
      const match = content.match(pattern);
      if (match) {
        businessInfo.companyName = match[1].trim();
        break;
      }
    }

    return businessInfo;
  }

  // Validate and clean contact information
  private validateContact(type: string, value: string): boolean {
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^\+?1?\d{10,}$/.test(value.replace(/\D/g, ''));
      case 'domain':
        return /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(value);
      default:
        return true;
    }
  }

  // Get contact extraction statistics
  async getContactStats(): Promise<{
    totalContacts: number;
    contactsByType: { [key: string]: number };
    contactsBySource: { [key: string]: number };
    verifiedContacts: number;
    sellersWithContacts: number;
    avgContactsPerSeller: number;
  }> {
    const { data: contacts } = await supabase
      .from('seller_contacts')
      .select('contact_type, source, verified, seller_id');

    const totalContacts = contacts?.length || 0;
    const contactsByType: { [key: string]: number } = {};
    const contactsBySource: { [key: string]: number } = {};
    const sellerIds = new Set<string>();
    let verifiedContacts = 0;

    contacts?.forEach(contact => {
      contactsByType[contact.contact_type] = (contactsByType[contact.contact_type] || 0) + 1;
      contactsBySource[contact.source] = (contactsBySource[contact.source] || 0) + 1;
      sellerIds.add(contact.seller_id);
      if (contact.verified) verifiedContacts++;
    });

    const sellersWithContacts = sellerIds.size;
    const avgContactsPerSeller = sellersWithContacts > 0 ? totalContacts / sellersWithContacts : 0;

    return {
      totalContacts,
      contactsByType,
      contactsBySource,
      verifiedContacts,
      sellersWithContacts,
      avgContactsPerSeller
    };
  }

  // Get sellers with the most contacts
  async getTopContactSellers(limit: number = 20): Promise<Array<{
    seller_id: string;
    seller_name: string;
    seller_url: string;
    total_contacts: number;
    email_count: number;
    phone_count: number;
    domain_count: number;
    is_whale: boolean;
  }>> {
    const { data: sellers } = await supabase
      .from('seller_metrics')
      .select('*')
      .gt('total_contacts', 0)
      .order('total_contacts', { ascending: false })
      .limit(limit);

    return sellers || [];
  }

  // Mark contacts as verified
  async verifyContacts(contactIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('seller_contacts')
      .update({ verified: true })
      .in('id', contactIds);

    if (error) {
      throw new Error(`Failed to verify contacts: ${error.message}`);
    }
  }

  // Get contact recommendations for outreach
  async getContactRecommendations(criteria: {
    minRevenue?: number;
    maxContacts?: number;
    contactTypes?: string[];
    onlyWhales?: boolean;
  } = {}): Promise<Array<{
    seller_id: string;
    seller_name: string;
    seller_url: string;
    total_est_revenue: number;
    recommended_contacts: ContactInfo[];
    outreach_score: number;
  }>> {
    const {
      minRevenue = 10000,
      maxContacts = 50,
      contactTypes = ['email', 'phone'],
      onlyWhales = false
    } = criteria;

    let query = supabase
      .from('seller_metrics')
      .select('*')
      .gte('total_est_revenue', minRevenue)
      .lte('total_contacts', maxContacts);

    if (onlyWhales) {
      query = query.eq('is_whale', true);
    }

    const { data: sellers } = await query
      .order('total_est_revenue', { ascending: false })
      .limit(100);

    const recommendations = [];

    for (const seller of sellers || []) {
      const { data: contacts } = await supabase
        .from('seller_contacts')
        .select('*')
        .eq('seller_id', seller.id)
        .in('contact_type', contactTypes);

      const recommendedContacts: ContactInfo[] = (contacts || []).map(contact => ({
        type: contact.contact_type as any,
        value: contact.contact_value,
        source: contact.source as any,
        confidence: contact.verified ? 1.0 : 0.7
      }));

      // Calculate outreach score based on revenue, contacts, and verification
      const outreachScore = this.calculateOutreachScore(
        seller.total_est_revenue,
        recommendedContacts
      );

      recommendations.push({
        seller_id: seller.id,
        seller_name: seller.seller_name,
        seller_url: seller.seller_url,
        total_est_revenue: seller.total_est_revenue,
        recommended_contacts: recommendedContacts,
        outreach_score
      });
    }

    return recommendations.sort((a, b) => b.outreach_score - a.outreach_score);
  }

  // Calculate outreach score
  private calculateOutreachScore(revenue: number, contacts: ContactInfo[]): number {
    let score = 0;
    
    // Revenue score (0-40 points)
    score += Math.min(revenue / 1000, 40);
    
    // Contact score (0-30 points)
    score += Math.min(contacts.length * 5, 30);
    
    // Verification score (0-20 points)
    const verifiedContacts = contacts.filter(c => c.confidence >= 1.0).length;
    score += Math.min(verifiedContacts * 10, 20);
    
    // Contact type bonus (0-10 points)
    const hasEmail = contacts.some(c => c.type === 'email');
    const hasPhone = contacts.some(c => c.type === 'phone');
    if (hasEmail) score += 5;
    if (hasPhone) score += 5;
    
    return Math.round(score);
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

export default StorefrontParsingService;
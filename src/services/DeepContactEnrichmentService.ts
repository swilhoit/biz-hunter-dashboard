import { supabase } from '../lib/supabase';

interface ContactEnrichmentProvider {
  name: 'hunter' | 'clearbit' | 'rocketreach' | 'apollo';
  apiKey: string;
  baseUrl: string;
  costPerLookup: number;
  dailyLimit: number;
}

interface EnrichedContact {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  company?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  confidence: number;
  source: string;
}

interface SellerForEnrichment {
  id: string;
  seller_name: string;
  seller_url: string;
  total_est_revenue: number;
  listings_count: number;
  company_name?: string;
  existing_contacts: number;
  priority_score: number;
}

interface EnrichmentResult {
  sellerId: string;
  success: boolean;
  contactsFound: number;
  newContacts: EnrichedContact[];
  provider: string;
  cost: number;
  error?: string;
}

interface DeepEnrichmentSummary {
  totalSellers: number;
  successfulEnrichments: number;
  failedEnrichments: number;
  totalContactsFound: number;
  totalCost: number;
  providerUsage: { [provider: string]: number };
}

class DeepContactEnrichmentService {
  private providers: ContactEnrichmentProvider[] = [
    {
      name: 'hunter',
      apiKey: import.meta.env.VITE_HUNTER_API_KEY || '',
      baseUrl: 'https://api.hunter.io/v2',
      costPerLookup: 0.05, // Approximate cost
      dailyLimit: 100 // Free tier limit
    },
    {
      name: 'clearbit',
      apiKey: import.meta.env.VITE_CLEARBIT_API_KEY || '',
      baseUrl: 'https://person.clearbit.com/v1',
      costPerLookup: 0.10,
      dailyLimit: 50
    },
    {
      name: 'rocketreach',
      apiKey: import.meta.env.VITE_ROCKETREACH_API_KEY || '',
      baseUrl: 'https://api.rocketreach.co/v1',
      costPerLookup: 0.15,
      dailyLimit: 25
    }
  ];

  private dailyUsage: { [provider: string]: number } = {};

  constructor() {
    this.initializeDailyUsage();
  }

  // Initialize daily usage tracking
  private initializeDailyUsage(): void {
    this.providers.forEach(provider => {
      this.dailyUsage[provider.name] = 0;
    });
  }

  // Main method to enrich high-value sellers with deep contact information
  async enrichHighValueSellers(options: {
    maxSellers?: number;
    minRevenue?: number;
    prioritizeWhales?: boolean;
    maxCostPerSeller?: number;
  } = {}): Promise<DeepEnrichmentSummary> {
    const {
      maxSellers = 50,
      minRevenue = 50000,
      prioritizeWhales = true,
      maxCostPerSeller = 1.0
    } = options;

    let totalSellers = 0;
    let successfulEnrichments = 0;
    let failedEnrichments = 0;
    let totalContactsFound = 0;
    let totalCost = 0;
    const providerUsage: { [provider: string]: number } = {};

    try {
      // Get high-value sellers for enrichment
      const sellersToEnrich = await this.getHighValueSellers(maxSellers, minRevenue, prioritizeWhales);
      
      if (sellersToEnrich.length === 0) {
        console.log('No high-value sellers found for deep enrichment');
        return {
          totalSellers: 0,
          successfulEnrichments: 0,
          failedEnrichments: 0,
          totalContactsFound: 0,
          totalCost: 0,
          providerUsage: {}
        };
      }

      console.log(`Starting deep contact enrichment for ${sellersToEnrich.length} high-value sellers`);

      // Process sellers one by one to manage costs and rate limits
      for (const seller of sellersToEnrich) {
        totalSellers++;
        
        const enrichmentResult = await this.enrichSellerContacts(seller, maxCostPerSeller);
        
        if (enrichmentResult.success) {
          successfulEnrichments++;
          totalContactsFound += enrichmentResult.contactsFound;
        } else {
          failedEnrichments++;
        }
        
        totalCost += enrichmentResult.cost;
        providerUsage[enrichmentResult.provider] = (providerUsage[enrichmentResult.provider] || 0) + 1;

        // Delay between requests to avoid rate limiting
        await this.sleep(1000);
      }

      console.log(`Deep enrichment completed: ${successfulEnrichments} successful, ${totalContactsFound} contacts found, cost: $${totalCost.toFixed(2)}`);

      return {
        totalSellers,
        successfulEnrichments,
        failedEnrichments,
        totalContactsFound,
        totalCost,
        providerUsage
      };

    } catch (error) {
      console.error('Error in enrichHighValueSellers:', error);
      throw error;
    }
  }

  // Get high-value sellers for deep enrichment
  private async getHighValueSellers(limit: number, minRevenue: number, prioritizeWhales: boolean): Promise<SellerForEnrichment[]> {
    let query = supabase
      .from('seller_metrics')
      .select('*')
      .gte('total_est_revenue', minRevenue);

    if (prioritizeWhales) {
      query = query.eq('is_whale', true);
    }

    const { data: sellers, error } = await query
      .order('total_est_revenue', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch high-value sellers: ${error.message}`);
    }

    // Calculate priority scores and filter out sellers with many contacts already
    const sellersWithPriority: SellerForEnrichment[] = (sellers || [])
      .filter(seller => seller.total_contacts < 5) // Focus on sellers with few contacts
      .map(seller => ({
        id: seller.id,
        seller_name: seller.seller_name,
        seller_url: seller.seller_url,
        total_est_revenue: seller.total_est_revenue,
        listings_count: seller.listings_count,
        existing_contacts: seller.total_contacts,
        priority_score: this.calculatePriorityScore(seller)
      }));

    return sellersWithPriority.sort((a, b) => b.priority_score - a.priority_score);
  }

  // Calculate priority score for seller enrichment
  private calculatePriorityScore(seller: any): number {
    let score = 0;
    
    // Revenue score (0-50 points)
    score += Math.min(seller.total_est_revenue / 2000, 50);
    
    // Whale bonus (20 points)
    if (seller.is_whale) score += 20;
    
    // Listings count (0-20 points)
    score += Math.min(seller.listings_count, 20);
    
    // Penalty for existing contacts (fewer contacts = higher priority)
    score -= seller.total_contacts * 5;
    
    return Math.max(score, 0);
  }

  // Enrich contacts for individual seller
  private async enrichSellerContacts(seller: SellerForEnrichment, maxCost: number): Promise<EnrichmentResult> {
    const availableProviders = this.getAvailableProviders(maxCost);
    
    if (availableProviders.length === 0) {
      return {
        sellerId: seller.id,
        success: false,
        contactsFound: 0,
        newContacts: [],
        provider: 'none',
        cost: 0,
        error: 'No providers available within cost limit'
      };
    }

    // Try providers in order of preference (cheapest first for high volume)
    for (const provider of availableProviders) {
      try {
        const result = await this.enrichWithProvider(seller, provider);
        
        if (result.success && result.contactsFound > 0) {
          await this.storeEnrichedContacts(seller.id, result.newContacts, provider.name);
          this.dailyUsage[provider.name]++;
          
          return result;
        }
      } catch (error) {
        console.error(`Error with provider ${provider.name} for seller ${seller.id}:`, error);
        continue;
      }
    }

    return {
      sellerId: seller.id,
      success: false,
      contactsFound: 0,
      newContacts: [],
      provider: 'failed',
      cost: 0,
      error: 'All providers failed'
    };
  }

  // Get available providers within cost and usage limits
  private getAvailableProviders(maxCost: number): ContactEnrichmentProvider[] {
    return this.providers
      .filter(provider => 
        provider.apiKey && 
        provider.costPerLookup <= maxCost &&
        this.dailyUsage[provider.name] < provider.dailyLimit
      )
      .sort((a, b) => a.costPerLookup - b.costPerLookup);
  }

  // Enrich with Hunter.io
  private async enrichWithHunter(seller: SellerForEnrichment): Promise<EnrichedContact[]> {
    const provider = this.providers.find(p => p.name === 'hunter')!;
    
    // Extract domain from seller URL
    const domain = this.extractDomain(seller.seller_url);
    if (!domain) return [];

    const response = await fetch(
      `${provider.baseUrl}/domain-search?domain=${domain}&api_key=${provider.apiKey}&limit=10`
    );

    if (!response.ok) {
      throw new Error(`Hunter API error: ${response.status}`);
    }

    const data = await response.json();
    const contacts: EnrichedContact[] = [];

    if (data.data && data.data.emails) {
      data.data.emails.forEach((email: any) => {
        if (email.value && email.confidence > 70) {
          contacts.push({
            email: email.value,
            firstName: email.first_name,
            lastName: email.last_name,
            jobTitle: email.position,
            company: seller.seller_name,
            confidence: email.confidence / 100,
            source: 'hunter'
          });
        }
      });
    }

    return contacts;
  }

  // Enrich with Clearbit
  private async enrichWithClearbit(seller: SellerForEnrichment): Promise<EnrichedContact[]> {
    const provider = this.providers.find(p => p.name === 'clearbit')!;
    
    // Get existing email if available
    const { data: existingContacts } = await supabase
      .from('seller_contacts')
      .select('contact_value')
      .eq('seller_id', seller.id)
      .eq('contact_type', 'email')
      .limit(1);

    if (!existingContacts || existingContacts.length === 0) {
      return [];
    }

    const email = existingContacts[0].contact_value;
    
    const response = await fetch(
      `${provider.baseUrl}/people/find?email=${email}`,
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Clearbit API error: ${response.status}`);
    }

    const data = await response.json();
    const contacts: EnrichedContact[] = [];

    if (data.name) {
      contacts.push({
        email,
        firstName: data.name.givenName,
        lastName: data.name.familyName,
        fullName: data.name.fullName,
        jobTitle: data.employment?.title,
        company: data.employment?.name || seller.seller_name,
        linkedinUrl: data.linkedin?.handle ? `https://linkedin.com/in/${data.linkedin.handle}` : undefined,
        twitterUrl: data.twitter?.handle ? `https://twitter.com/${data.twitter.handle}` : undefined,
        confidence: 0.9,
        source: 'clearbit'
      });
    }

    return contacts;
  }

  // Enrich with generic provider
  private async enrichWithProvider(seller: SellerForEnrichment, provider: ContactEnrichmentProvider): Promise<EnrichmentResult> {
    try {
      let contacts: EnrichedContact[] = [];

      switch (provider.name) {
        case 'hunter':
          contacts = await this.enrichWithHunter(seller);
          break;
        case 'clearbit':
          contacts = await this.enrichWithClearbit(seller);
          break;
        case 'rocketreach':
          // Implement RocketReach if needed
          contacts = [];
          break;
        default:
          contacts = [];
      }

      return {
        sellerId: seller.id,
        success: contacts.length > 0,
        contactsFound: contacts.length,
        newContacts: contacts,
        provider: provider.name,
        cost: provider.costPerLookup
      };

    } catch (error) {
      return {
        sellerId: seller.id,
        success: false,
        contactsFound: 0,
        newContacts: [],
        provider: provider.name,
        cost: provider.costPerLookup,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Store enriched contacts in database
  private async storeEnrichedContacts(sellerId: string, contacts: EnrichedContact[], source: string): Promise<void> {
    const contactsToInsert = [];

    for (const contact of contacts) {
      if (contact.email) {
        contactsToInsert.push({
          seller_id: sellerId,
          contact_type: 'email',
          contact_value: contact.email,
          source,
          verified: contact.confidence > 0.8
        });
      }

      if (contact.phone) {
        contactsToInsert.push({
          seller_id: sellerId,
          contact_type: 'phone',
          contact_value: contact.phone,
          source,
          verified: contact.confidence > 0.8
        });
      }

      if (contact.linkedinUrl) {
        contactsToInsert.push({
          seller_id: sellerId,
          contact_type: 'social',
          contact_value: contact.linkedinUrl,
          source,
          verified: true
        });
      }

      if (contact.twitterUrl) {
        contactsToInsert.push({
          seller_id: sellerId,
          contact_type: 'social',
          contact_value: contact.twitterUrl,
          source,
          verified: true
        });
      }
    }

    if (contactsToInsert.length > 0) {
      const { error } = await supabase
        .from('seller_contacts')
        .upsert(contactsToInsert, { onConflict: 'seller_id,contact_type,contact_value' });

      if (error) {
        throw new Error(`Failed to store enriched contacts: ${error.message}`);
      }
    }

    // Store detailed contact information if needed
    // This could be a separate table for enriched contact details
  }

  // Extract domain from URL
  private extractDomain(url: string): string | null {
    try {
      const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const domain = cleanUrl.split('/')[0].toLowerCase();
      return domain.includes('.') ? domain : null;
    } catch {
      return null;
    }
  }

  // Get enrichment statistics
  async getEnrichmentStats(): Promise<{
    totalEnrichedSellers: number;
    contactsByProvider: { [provider: string]: number };
    highestValueEnriched: number;
    averageContactsPerSeller: number;
    verifiedContactsRatio: number;
  }> {
    const { data: enrichedContacts } = await supabase
      .from('seller_contacts')
      .select('seller_id, source, verified')
      .in('source', ['hunter', 'clearbit', 'rocketreach', 'apollo']);

    const { data: enrichedSellers } = await supabase
      .from('seller_metrics')
      .select('id, total_est_revenue')
      .in('id', [...new Set(enrichedContacts?.map(c => c.seller_id) || [])]);

    const contactsByProvider: { [provider: string]: number } = {};
    const enrichedSellerIds = new Set<string>();
    let verifiedCount = 0;

    enrichedContacts?.forEach(contact => {
      contactsByProvider[contact.source] = (contactsByProvider[contact.source] || 0) + 1;
      enrichedSellerIds.add(contact.seller_id);
      if (contact.verified) verifiedCount++;
    });

    const totalEnrichedSellers = enrichedSellerIds.size;
    const totalContacts = enrichedContacts?.length || 0;
    const averageContactsPerSeller = totalEnrichedSellers > 0 ? totalContacts / totalEnrichedSellers : 0;
    const verifiedContactsRatio = totalContacts > 0 ? verifiedCount / totalContacts : 0;
    const highestValueEnriched = Math.max(...(enrichedSellers?.map(s => s.total_est_revenue) || [0]));

    return {
      totalEnrichedSellers,
      contactsByProvider,
      highestValueEnriched,
      averageContactsPerSeller,
      verifiedContactsRatio
    };
  }

  // Get top enriched sellers
  async getTopEnrichedSellers(limit: number = 20): Promise<Array<{
    seller_id: string;
    seller_name: string;
    total_est_revenue: number;
    enriched_contacts: Array<{
      contact_type: string;
      contact_value: string;
      source: string;
      verified: boolean;
    }>;
    enrichment_score: number;
  }>> {
    const { data: sellers } = await supabase
      .from('seller_metrics')
      .select('*')
      .gt('total_contacts', 0)
      .order('total_est_revenue', { ascending: false })
      .limit(limit);

    const results = [];

    for (const seller of sellers || []) {
      const { data: enrichedContacts } = await supabase
        .from('seller_contacts')
        .select('contact_type, contact_value, source, verified')
        .eq('seller_id', seller.id)
        .in('source', ['hunter', 'clearbit', 'rocketreach', 'apollo']);

      if (enrichedContacts && enrichedContacts.length > 0) {
        const enrichmentScore = this.calculateEnrichmentScore(seller, enrichedContacts);
        
        results.push({
          seller_id: seller.id,
          seller_name: seller.seller_name,
          total_est_revenue: seller.total_est_revenue,
          enriched_contacts: enrichedContacts,
          enrichment_score: enrichmentScore
        });
      }
    }

    return results.sort((a, b) => b.enrichment_score - a.enrichment_score);
  }

  // Calculate enrichment score
  private calculateEnrichmentScore(seller: any, contacts: any[]): number {
    let score = 0;
    
    // Base score from revenue
    score += Math.min(seller.total_est_revenue / 1000, 50);
    
    // Contact diversity bonus
    const contactTypes = new Set(contacts.map(c => c.contact_type));
    score += contactTypes.size * 10;
    
    // Verification bonus
    const verifiedContacts = contacts.filter(c => c.verified).length;
    score += verifiedContacts * 5;
    
    // Provider diversity bonus
    const providers = new Set(contacts.map(c => c.source));
    score += providers.size * 5;
    
    return Math.round(score);
  }

  // Utility method
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default DeepContactEnrichmentService;
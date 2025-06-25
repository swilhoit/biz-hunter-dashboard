
export interface BusinessListing {
  id: string;
  name: string;
  description: string;
  askingPrice: number;
  annualRevenue: number;
  industry: string;
  location: string;
  source: string;
  highlights: string[];
  imageUrl?: string;
}

export const mockListings: BusinessListing[] = [
  {
    id: '1',
    name: 'E-commerce Jewelry Store',
    description: 'Established online jewelry retailer with strong brand recognition and loyal customer base. Specializes in handcrafted artisan pieces with sustainable sourcing.',
    askingPrice: 1250000,
    annualRevenue: 850000,
    industry: 'E-commerce',
    location: 'California, USA',
    source: 'Empire Flippers',
    highlights: ['Growing Revenue', '70% Profit Margin', 'Established Brand']
  },
  {
    id: '2',
    name: 'SaaS Analytics Platform',
    description: 'B2B analytics software serving mid-market companies. Recurring revenue model with 95% customer retention rate and growing user base.',
    askingPrice: 3500000,
    annualRevenue: 1200000,
    industry: 'SaaS',
    location: 'Austin, Texas',
    source: 'Flippa',
    highlights: ['Recurring Revenue', 'High Retention', 'Scalable']
  },
  {
    id: '3',
    name: 'Local Restaurant Chain',
    description: 'Three-location pizza restaurant chain with strong local presence. Established 15 years ago with loyal customer base and proven operating systems.',
    askingPrice: 875000,
    annualRevenue: 650000,
    industry: 'Food & Beverage',
    location: 'Denver, Colorado',
    source: 'BizBuySell',
    highlights: ['Multiple Locations', 'Established Operations', 'Local Brand']
  },
  {
    id: '4',
    name: 'Digital Marketing Agency',
    description: 'Full-service digital marketing agency specializing in healthcare clients. Team of 12 professionals with long-term client contracts.',
    askingPrice: 2200000,
    annualRevenue: 1800000,
    industry: 'Marketing',
    location: 'Miami, Florida',
    source: 'Website Closers',
    highlights: ['Niche Focus', 'Long-term Contracts', 'Experienced Team']
  },
  {
    id: '5',
    name: 'Manufacturing Equipment Supplier',
    description: 'B2B supplier of specialized manufacturing equipment with exclusive distributor agreements. Serves automotive and aerospace industries.',
    askingPrice: 4200000,
    annualRevenue: 2100000,
    industry: 'Manufacturing',
    location: 'Michigan, USA',
    source: 'BizBuySell',
    highlights: ['Exclusive Agreements', 'Industrial Focus', 'Stable Revenue']
  },
  {
    id: '6',
    name: 'Fitness App Subscription',
    description: 'Mobile fitness application with 50K+ active subscribers. Features workout plans, nutrition tracking, and community features.',
    askingPrice: 950000,
    annualRevenue: 420000,
    industry: 'Health & Fitness',
    location: 'San Francisco, CA',
    source: 'Empire Flippers',
    highlights: ['Mobile App', 'Subscription Model', 'Growing User Base']
  },
  {
    id: '7',
    name: 'Content Creation Platform',
    description: 'Online platform connecting freelance content creators with businesses. Revenue from subscription fees and transaction commissions.',
    askingPrice: 1800000,
    annualRevenue: 920000,
    industry: 'Technology',
    location: 'New York, NY',
    source: 'Flippa',
    highlights: ['Two Revenue Streams', 'Network Effects', 'Growing Market']
  },
  {
    id: '8',
    name: 'Automotive Service Centers',
    description: 'Two full-service automotive repair shops with loyal customer base. Includes all equipment, certifications, and trained staff.',
    askingPrice: 1350000,
    annualRevenue: 980000,
    industry: 'Automotive',
    location: 'Phoenix, Arizona',
    source: 'BizBuySell',
    highlights: ['Turn-key Operation', 'Loyal Customers', 'Full Equipment']
  },
  {
    id: '9',
    name: 'Educational Course Platform',
    description: 'Online learning platform offering professional development courses. Over 15,000 students enrolled with high completion rates.',
    askingPrice: 675000,
    annualRevenue: 380000,
    industry: 'Education',
    location: 'Remote Business',
    source: 'Website Closers',
    highlights: ['Remote Operation', 'High Completion Rates', 'Professional Focus']
  },
  {
    id: '10',
    name: 'Pet Supplies E-commerce',
    description: 'Specialized online retailer for premium pet supplies. Strong relationships with suppliers and excellent customer reviews.',
    askingPrice: 580000,
    annualRevenue: 425000,
    industry: 'E-commerce',
    location: 'Seattle, Washington',
    source: 'Empire Flippers',
    highlights: ['Premium Products', 'Strong Suppliers', 'Excellent Reviews']
  },
  {
    id: '11',
    name: 'Cloud Storage SaaS',
    description: 'Enterprise cloud storage solution with advanced security features. Serves Fortune 500 companies with multi-year contracts.',
    askingPrice: 5200000,
    annualRevenue: 2800000,
    industry: 'SaaS',
    location: 'Boston, Massachusetts',
    source: 'Flippa',
    highlights: ['Enterprise Clients', 'Multi-year Contracts', 'Security Focus']
  },
  {
    id: '12',
    name: 'Artisan Coffee Roastery',
    description: 'Small-batch coffee roastery with wholesale and retail operations. Supplies to 40+ local cafes and has an online subscription service.',
    askingPrice: 320000,
    annualRevenue: 240000,
    industry: 'Food & Beverage',
    location: 'Portland, Oregon',
    source: 'BizBuySell',
    highlights: ['Artisan Quality', 'Wholesale Network', 'Subscription Service']
  }
];


-- Create enum for business listing status
CREATE TYPE listing_status AS ENUM ('active', 'pending', 'sold', 'withdrawn');

-- Create enum for app roles
CREATE TYPE app_role AS ENUM ('admin', 'user', 'broker');

-- Create business_listings table
CREATE TABLE public.business_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    asking_price BIGINT NOT NULL,
    annual_revenue BIGINT NOT NULL,
    industry TEXT NOT NULL,
    location TEXT NOT NULL,
    source TEXT NOT NULL,
    highlights TEXT[] DEFAULT '{}',
    image_url TEXT,
    status listing_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create favorites table for saved listings
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- Create inquiries table for business contact requests
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.business_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- RLS Policies for business_listings (public read, authenticated users can see all)
CREATE POLICY "Anyone can view active listings" ON public.business_listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can create listings" ON public.business_listings
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own listings" ON public.business_listings
    FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for favorites
CREATE POLICY "Users can manage their own favorites" ON public.favorites
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for inquiries
CREATE POLICY "Users can view their own inquiries" ON public.inquiries
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create inquiries" ON public.inquiries
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        NEW.email
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert mock data into business_listings table
INSERT INTO public.business_listings (name, description, asking_price, annual_revenue, industry, location, source, highlights) VALUES
('E-commerce Jewelry Store', 'Established online jewelry retailer with strong brand recognition and loyal customer base. Specializes in handcrafted artisan pieces with sustainable sourcing.', 1250000, 850000, 'E-commerce', 'California, USA', 'Empire Flippers', ARRAY['Growing Revenue', '70% Profit Margin', 'Established Brand']),
('SaaS Analytics Platform', 'B2B analytics software serving mid-market companies. Recurring revenue model with 95% customer retention rate and growing user base.', 3500000, 1200000, 'SaaS', 'Austin, Texas', 'Flippa', ARRAY['Recurring Revenue', 'High Retention', 'Scalable']),
('Local Restaurant Chain', 'Three-location pizza restaurant chain with strong local presence. Established 15 years ago with loyal customer base and proven operating systems.', 875000, 650000, 'Food & Beverage', 'Denver, Colorado', 'BizBuySell', ARRAY['Multiple Locations', 'Established Operations', 'Local Brand']),
('Digital Marketing Agency', 'Full-service digital marketing agency specializing in healthcare clients. Team of 12 professionals with long-term client contracts.', 2200000, 1800000, 'Marketing', 'Miami, Florida', 'Website Closers', ARRAY['Niche Focus', 'Long-term Contracts', 'Experienced Team']),
('Manufacturing Equipment Supplier', 'B2B supplier of specialized manufacturing equipment with exclusive distributor agreements. Serves automotive and aerospace industries.', 4200000, 2100000, 'Manufacturing', 'Michigan, USA', 'BizBuySell', ARRAY['Exclusive Agreements', 'Industrial Focus', 'Stable Revenue']),
('Fitness App Subscription', 'Mobile fitness application with 50K+ active subscribers. Features workout plans, nutrition tracking, and community features.', 950000, 420000, 'Health & Fitness', 'San Francisco, CA', 'Empire Flippers', ARRAY['Mobile App', 'Subscription Model', 'Growing User Base']),
('Content Creation Platform', 'Online platform connecting freelance content creators with businesses. Revenue from subscription fees and transaction commissions.', 1800000, 920000, 'Technology', 'New York, NY', 'Flippa', ARRAY['Two Revenue Streams', 'Network Effects', 'Growing Market']),
('Automotive Service Centers', 'Two full-service automotive repair shops with loyal customer base. Includes all equipment, certifications, and trained staff.', 1350000, 980000, 'Automotive', 'Phoenix, Arizona', 'BizBuySell', ARRAY['Turn-key Operation', 'Loyal Customers', 'Full Equipment']),
('Educational Course Platform', 'Online learning platform offering professional development courses. Over 15,000 students enrolled with high completion rates.', 675000, 380000, 'Education', 'Remote Business', 'Website Closers', ARRAY['Remote Operation', 'High Completion Rates', 'Professional Focus']),
('Pet Supplies E-commerce', 'Specialized online retailer for premium pet supplies. Strong relationships with suppliers and excellent customer reviews.', 580000, 425000, 'E-commerce', 'Seattle, Washington', 'Empire Flippers', ARRAY['Premium Products', 'Strong Suppliers', 'Excellent Reviews']),
('Cloud Storage SaaS', 'Enterprise cloud storage solution with advanced security features. Serves Fortune 500 companies with multi-year contracts.', 5200000, 2800000, 'SaaS', 'Boston, Massachusetts', 'Flippa', ARRAY['Enterprise Clients', 'Multi-year Contracts', 'Security Focus']),
('Artisan Coffee Roastery', 'Small-batch coffee roastery with wholesale and retail operations. Supplies to 40+ local cafes and has an online subscription service.', 320000, 240000, 'Food & Beverage', 'Portland, Oregon', 'BizBuySell', ARRAY['Artisan Quality', 'Wholesale Network', 'Subscription Service']);

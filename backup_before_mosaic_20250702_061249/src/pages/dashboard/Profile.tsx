import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  bio: string;
  location: string;
  industry_interests: string[];
  budget_range: string;
  investment_timeline: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    first_name: '',
    last_name: '',
    email: user?.email || '',
    phone: '',
    company: '',
    bio: '',
    location: '',
    industry_interests: [],
    budget_range: '',
    investment_timeline: ''
  });

  const industryOptions = [
    'Technology', 'Food & Beverage', 'Retail', 'Healthcare', 
    'Manufacturing', 'Professional Services', 'E-commerce', 
    'Automotive', 'Real Estate', 'Education'
  ];

  const budgetRanges = [
    'Under $100K', '$100K - $500K', '$500K - $1M', 
    '$1M - $5M', '$5M - $10M', 'Over $10M'
  ];

  const timelineOptions = [
    'Immediately', 'Within 3 months', 'Within 6 months',
    'Within 1 year', 'More than 1 year', 'Just exploring'
  ];

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `https://biz-hunter-dashboard-production.up.railway.app/api/profile/${user?.id}`
      );
      const data = await response.json();
      
      if (data.success) {
        setProfile(prev => ({
          ...prev,
          ...data.data,
          // Handle extended profile fields stored in JSON or as separate fields
          bio: data.data.bio || '',
          location: data.data.location || '',
          industry_interests: data.data.industry_interests || [],
          budget_range: data.data.budget_range || '',
          investment_timeline: data.data.investment_timeline || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://biz-hunter-dashboard-production.up.railway.app/api/profile/${user?.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profile)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile(); // Reset changes
  };

  const toggleIndustryInterest = (industry: string) => {
    setProfile(prev => ({
      ...prev,
      industry_interests: prev.industry_interests.includes(industry)
        ? prev.industry_interests.filter(i => i !== industry)
        : [...prev.industry_interests, industry]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold">
                {profile.first_name} {profile.last_name}
              </h3>
              <p className="text-gray-600">{profile.email}</p>
              {profile.company && (
                <p className="text-sm text-gray-500">{profile.company}</p>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.company && (
                <div className="flex items-center space-x-2 text-sm">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>{profile.company}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Member since {new Date().getFullYear()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profile.first_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profile.last_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Your company or investment firm"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="City, State"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!isEditing}
                placeholder="Tell us about your investment goals and experience..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Investment Preferences */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Investment Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Industry Interests</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                {industryOptions.map((industry) => (
                  <button
                    key={industry}
                    onClick={() => isEditing && toggleIndustryInterest(industry)}
                    disabled={!isEditing}
                    className={`p-2 rounded-lg border text-sm transition-colors ${
                      profile.industry_interests.includes(industry)
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_range">Investment Budget</Label>
                <select
                  id="budget_range"
                  value={profile.budget_range}
                  onChange={(e) => setProfile(prev => ({ ...prev, budget_range: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select budget range</option>
                  {budgetRanges.map((range) => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="investment_timeline">Investment Timeline</Label>
                <select
                  id="investment_timeline"
                  value={profile.investment_timeline}
                  onChange={(e) => setProfile(prev => ({ ...prev, investment_timeline: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select timeline</option>
                  {timelineOptions.map((timeline) => (
                    <option key={timeline} value={timeline}>{timeline}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
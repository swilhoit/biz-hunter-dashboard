import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon,
  Shield,
  Bell,
  Eye,
  Download,
  Trash2,
  Lock,
  Key,
  Mail,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserSettings {
  // Privacy & Security
  profile_visibility: 'public' | 'private' | 'contacts_only';
  email_visibility: boolean;
  phone_visibility: boolean;
  two_factor_enabled: boolean;
  
  // Notifications
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  
  // Display & Preferences
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  timezone: string;
  language: 'en' | 'es' | 'fr' | 'de';
  
  // Search & Browsing
  save_search_history: boolean;
  personalized_recommendations: boolean;
  auto_save_preferences: boolean;
  
  // Data & Export
  data_export_enabled: boolean;
  analytics_tracking: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    profile_visibility: 'private',
    email_visibility: false,
    phone_visibility: false,
    two_factor_enabled: false,
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    theme: 'system',
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en',
    save_search_history: true,
    personalized_recommendations: true,
    auto_save_preferences: true,
    data_export_enabled: true,
    analytics_tracking: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(
        `https://biz-hunter-dashboard-production.up.railway.app/api/settings/${user?.id}`
      );
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(
        `https://biz-hunter-dashboard-production.up.railway.app/api/settings/${user?.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Settings saved successfully');
        setHasChanges(false);
      } else {
        throw new Error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setIsLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    try {
      toast.info('Preparing your data export...');
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Data export sent to your email');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Account deletion initiated. You will receive a confirmation email.');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const timezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' }
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'CAD'];

  if (isLoading && !hasChanges) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light text-gray-900 flex items-center space-x-2">
            <SettingsIcon className="h-6 w-6" />
            <span>Settings</span>
          </h1>
          <p className="text-gray-600">Manage your account preferences and privacy settings</p>
        </div>
        {hasChanges && (
          <Button onClick={saveSettings} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Privacy & Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Profile Visibility</Label>
              <select
                value={settings.profile_visibility}
                onChange={(e) => updateSetting('profile_visibility', e.target.value)}
                className="w-full mt-1 p-2 border border-gray-200 rounded-md"
              >
                <option value="public">Public</option>
                <option value="contacts_only">Contacts Only</option>
                <option value="private">Private</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Control who can see your profile information
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Show Email Address</span>
                  <p className="text-xs text-gray-500">Make your email visible to others</p>
                </div>
                <Switch
                  checked={settings.email_visibility}
                  onCheckedChange={(checked) => updateSetting('email_visibility', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Show Phone Number</span>
                  <p className="text-xs text-gray-500">Make your phone visible to others</p>
                </div>
                <Switch
                  checked={settings.phone_visibility}
                  onCheckedChange={(checked) => updateSetting('phone_visibility', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Two-Factor Authentication</span>
                  <p className="text-xs text-gray-500">Add extra security to your account</p>
                </div>
                <div className="flex items-center space-x-2">
                  {settings.two_factor_enabled && (
                    <Badge variant="secondary" className="text-xs">Enabled</Badge>
                  )}
                  <Switch
                    checked={settings.two_factor_enabled}
                    onCheckedChange={(checked) => updateSetting('two_factor_enabled', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">Email Notifications</span>
                  <p className="text-xs text-gray-500">Receive updates via email</p>
                </div>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">Push Notifications</span>
                  <p className="text-xs text-gray-500">Receive push notifications</p>
                </div>
              </div>
              <Switch
                checked={settings.push_notifications}
                onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">Marketing Emails</span>
                  <p className="text-xs text-gray-500">Tips, news, and updates</p>
                </div>
              </div>
              <Switch
                checked={settings.marketing_emails}
                onCheckedChange={(checked) => updateSetting('marketing_emails', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Display & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Display & Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'system', icon: Monitor, label: 'System' }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => updateSetting('theme', value)}
                    className={`p-2 rounded-lg border text-sm flex flex-col items-center space-y-1 ${
                      settings.theme === value
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency</Label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting('currency', e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-200 rounded-md text-sm"
                >
                  {currencies.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Language</Label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-200 rounded-md text-sm"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Timezone</Label>
              <select
                value={settings.timezone}
                onChange={(e) => updateSetting('timezone', e.target.value)}
                className="w-full mt-1 p-2 border border-gray-200 rounded-md text-sm"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Search & Browsing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Search & Browsing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Save Search History</span>
                <p className="text-xs text-gray-500">Keep track of your searches</p>
              </div>
              <Switch
                checked={settings.save_search_history}
                onCheckedChange={(checked) => updateSetting('save_search_history', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Personalized Recommendations</span>
                <p className="text-xs text-gray-500">Get suggestions based on your activity</p>
              </div>
              <Switch
                checked={settings.personalized_recommendations}
                onCheckedChange={(checked) => updateSetting('personalized_recommendations', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Auto-save Preferences</span>
                <p className="text-xs text-gray-500">Remember your filter settings</p>
              </div>
              <Switch
                checked={settings.auto_save_preferences}
                onCheckedChange={(checked) => updateSetting('auto_save_preferences', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Analytics Tracking</span>
                <p className="text-xs text-gray-500">Help improve our platform</p>
              </div>
              <Switch
                checked={settings.analytics_tracking}
                onCheckedChange={(checked) => updateSetting('analytics_tracking', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Change Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button 
              onClick={changePassword} 
              disabled={!currentPassword || !newPassword || !confirmPassword || isLoading}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Data & Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Data & Export</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Export Your Data</h4>
              <p className="text-xs text-gray-500 mb-3">
                Download a copy of your account data including saved listings, search history, and preferences.
              </p>
              <Button variant="outline" onClick={exportData} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Request Data Export
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2 text-red-600 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Danger Zone</span>
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" onClick={deleteAccount} className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
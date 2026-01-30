import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

interface SiteSetting {
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
}

interface SocialMediaAccount {
  platform: string;
  platform_name: string;
  url: string;
  username: string;
  icon_name: string;
  follower_count: number;
  description: string;
}

interface ContactInfo {
  contact_type: string;
  label: string;
  value: string;
  is_primary: boolean;
  icon_name: string;
  additional_info: any;
}

interface FooterLink {
  id: string;
  section_name: string;
  link_text: string;
  link_url: string;
  opens_new_tab: boolean;
}

interface BusinessHours {
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  is_24_hours: boolean;
  notes: string;
}

export interface PublicSettings {
  siteSettings: SiteSetting[];
  socialMedia: SocialMediaAccount[];
  contactInfo: ContactInfo[];
  footerLinks: FooterLink[];
  businessHours: BusinessHours[];
}

export const usePublicSettings = () => {
  const [settings, setSettings] = useState<PublicSettings>({
    siteSettings: [],
    socialMedia: [],
    contactInfo: [],
    footerLinks: [],
    businessHours: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchPublicSettings = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Fetch all public settings in a single combined request
          // This reduces the number of function invocations in serverless environments
          const response = await apiClient.get('/public/settings');
          
          if (response && response.success && response.data) {
            setSettings({
              siteSettings: response.data.siteSettings || [],
              socialMedia: response.data.socialMedia || [],
              contactInfo: response.data.contactInfo || [],
              footerLinks: response.data.footerLinks || [],
              businessHours: response.data.businessHours || []
            });
          } else {
            console.warn('Invalid response format from settings API:', response);
            throw new Error('Invalid response format from settings API');
          }
        } catch (err: any) {
          console.error('Error fetching public settings:', err);
          setError(err.message || 'Failed to fetch public settings');
        } finally {
          setLoading(false);
        }
      };


    fetchPublicSettings();

    // Listen for settings updates from admin panel
    const handleSettingsUpdate = () => {
      fetchPublicSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  // Helper functions to get specific settings
  const getSiteSetting = (key: string): string | undefined => {
    const setting = settings.siteSettings.find(s => s.setting_key === key);
    return setting?.setting_value;
  };

  const getSiteSettingsByCategory = (category: string): SiteSetting[] => {
    return settings.siteSettings.filter(s => s.category === category);
  };

  return {
    ...settings,
    loading,
    error,
    getSiteSetting,
    getSiteSettingsByCategory
  };
};
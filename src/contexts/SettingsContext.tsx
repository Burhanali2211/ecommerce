import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { db } from '../lib/supabase';

// Type definitions matching the backend response
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
  is_active?: boolean;
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

interface SettingsContextType {
  settings: PublicSettings;
  loading: boolean;
  error: string | null;
  getSiteSetting: (key: string) => string | undefined;
  getSiteSettingsByCategory: (category: string) => SiteSetting[];
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<PublicSettings>({
    siteSettings: [],
    socialMedia: [],
    contactInfo: [],
    footerLinks: [],
    businessHours: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const settingsData = await db.getAllPublicSettings();
      
      if (settingsData) {
        setSettings({
          siteSettings: settingsData.siteSettings || [],
          socialMedia: settingsData.socialMedia || [],
          contactInfo: settingsData.contactInfo || [],
          footerLinks: settingsData.footerLinks || [],
          businessHours: settingsData.businessHours || []
        });
      }
    } catch (err: any) {
      console.error('Error fetching public settings:', err);
      setError(err.message || 'Failed to fetch public settings');
      setSettings({
        siteSettings: [],
        socialMedia: [],
        contactInfo: [],
        footerLinks: [],
        businessHours: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    const handleSettingsUpdate = () => {
      fetchSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [fetchSettings]);

  const getSiteSetting = useCallback((key: string): string | undefined => {
    const setting = settings.siteSettings.find(s => s.setting_key === key);
    return setting?.setting_value;
  }, [settings.siteSettings]);

  const getSiteSettingsByCategory = useCallback((category: string): SiteSetting[] => {
    return settings.siteSettings.filter(s => s.category === category);
  }, [settings.siteSettings]);

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    getSiteSetting,
    getSiteSettingsByCategory,
    refetch: fetchSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

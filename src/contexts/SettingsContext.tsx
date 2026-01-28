import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

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

/**
 * SettingsProvider - Centralized provider for public site settings
 * 
 * This provider fetches all public settings once on app load and provides
 * them to all components via context. This eliminates redundant API calls
 * and ensures a single source of truth for settings data.
 * 
 * Features:
 * - Fetches all settings in a single API call via /api/public/settings
 * - Caches settings in memory
 * - Provides helper methods for accessing specific settings
 * - Supports manual refetch for admin updates
 */
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
      
      // Use the combined endpoint to fetch all settings in one request
      const response = await apiClient.get<{ success: boolean; data: PublicSettings }>('/public/settings');
      
      // apiClient.get returns the JSON response directly from the server
      // The server returns: { success: true, data: { siteSettings: [...], ... } }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from settings API');
      }
      
      // Handle different response formats
      let settingsData: PublicSettings | null = null;
      
      // Format 1: { success: true, data: {...} }
      if ('success' in response && 'data' in response) {
        const typedResponse = response as { success: boolean; data: PublicSettings };
        if (typedResponse.success && typedResponse.data) {
          settingsData = typedResponse.data;
        } else {
          throw new Error('Settings API returned unsuccessful response');
        }
      } 
      // Format 2: { data: {...} }
      else if ('data' in response) {
        const typedResponse = response as { data: PublicSettings };
        if (typedResponse.data) {
          settingsData = typedResponse.data;
        }
      }
      // Format 3: Direct settings object (unlikely but handle it)
      else if ('siteSettings' in response || 'socialMedia' in response) {
        settingsData = response as PublicSettings;
      }
      
      if (settingsData) {
        setSettings(settingsData);
      } else {
        throw new Error('Invalid response format from settings API');
      }
    } catch (err: any) {
      console.error('Error fetching public settings:', err);
      const errorMessage = err.message || 'Failed to fetch public settings';
      setError(errorMessage);
      // Set default empty settings to prevent undefined errors
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

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();

    // Listen for settings updates from admin panel
    const handleSettingsUpdate = () => {
      fetchSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [fetchSettings]);

  // Helper function to get a specific site setting by key
  const getSiteSetting = useCallback((key: string): string | undefined => {
    const setting = settings.siteSettings.find(s => s.setting_key === key);
    return setting?.setting_value;
  }, [settings.siteSettings]);

  // Helper function to get all settings in a category
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

/**
 * Hook to access settings from the SettingsContext
 * 
 * @example
 * ```tsx
 * const { settings, loading, getSiteSetting } = useSettings();
 * const siteName = getSiteSetting('site_name');
 * ```
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};


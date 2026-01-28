import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Palette, Image, Sparkles, Wand2 } from 'lucide-react';
import { api, API_ENDPOINTS } from '@/config/api';
import { useNotification } from '../../../contexts/NotificationContext';
import { updateDashboardStyles, clearSettingsCache } from '../../../utils/adminDashboardStyles';

interface DashboardSettings {
  dashboard_name: string;
  dashboard_logo_url: string;
  background_gradient_from: string;
  background_gradient_via: string;
  background_gradient_to: string;
  primary_color_from: string;
  primary_color_to: string;
  secondary_color_from: string;
  secondary_color_to: string;
  glass_background_opacity: string;
  glass_border_opacity: string;
  backdrop_blur: string;
  sidebar_background: string;
  header_background: string;
}

const defaultSettings: DashboardSettings = {
  dashboard_name: 'Admin Panel',
  dashboard_logo_url: '',
  background_gradient_from: '#0f172a',
  background_gradient_via: '#581c87',
  background_gradient_to: '#0f172a',
  primary_color_from: '#fbbf24',
  primary_color_to: '#f97316',
  secondary_color_from: '#a855f7',
  secondary_color_to: '#6366f1',
  glass_background_opacity: '0.95',
  glass_border_opacity: '0.1',
  backdrop_blur: 'xl',
  sidebar_background: 'rgba(15, 23, 42, 0.95)',
  header_background: 'rgba(15, 23, 42, 0.8)'
};

// Color Preset Templates
const colorPresets = {
  default: {
    name: 'Default (Current)',
    description: 'Orange, Pink, Dark Blue',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#0f172a',
    background_gradient_via: '#581c87',
    background_gradient_to: '#0f172a',
    primary_color_from: '#fbbf24',
    primary_color_to: '#f97316',
    secondary_color_from: '#a855f7',
    secondary_color_to: '#6366f1',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.1',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(15, 23, 42, 0.95)',
    header_background: 'rgba(15, 23, 42, 0.8)'
  },
  ocean: {
    name: 'Ocean Breeze',
    description: 'Deep blue to teal gradient',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#0a1929',
    background_gradient_via: '#1a365d',
    background_gradient_to: '#0a1929',
    primary_color_from: '#06b6d4',
    primary_color_to: '#0891b2',
    secondary_color_from: '#3b82f6',
    secondary_color_to: '#2563eb',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.15',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(10, 25, 41, 0.95)',
    header_background: 'rgba(10, 25, 41, 0.85)'
  },
  sunset: {
    name: 'Sunset Glow',
    description: 'Warm orange to pink gradient',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#1a0a0a',
    background_gradient_via: '#4a1a1a',
    background_gradient_to: '#1a0a0a',
    primary_color_from: '#f97316',
    primary_color_to: '#ea580c',
    secondary_color_from: '#ec4899',
    secondary_color_to: '#db2777',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.1',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(26, 10, 10, 0.95)',
    header_background: 'rgba(26, 10, 10, 0.8)'
  },
  forest: {
    name: 'Forest Green',
    description: 'Deep green to emerald',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#0a1f0a',
    background_gradient_via: '#1a3a1a',
    background_gradient_to: '#0a1f0a',
    primary_color_from: '#10b981',
    primary_color_to: '#059669',
    secondary_color_from: '#34d399',
    secondary_color_to: '#22c55e',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.1',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(10, 31, 10, 0.95)',
    header_background: 'rgba(10, 31, 10, 0.8)'
  },
  royal: {
    name: 'Royal Purple',
    description: 'Rich purple to violet',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#1a0a2a',
    background_gradient_via: '#3a1a5a',
    background_gradient_to: '#1a0a2a',
    primary_color_from: '#a855f7',
    primary_color_to: '#9333ea',
    secondary_color_from: '#c084fc',
    secondary_color_to: '#a855f7',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.15',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(26, 10, 42, 0.95)',
    header_background: 'rgba(26, 10, 42, 0.8)'
  },
  midnight: {
    name: 'Midnight Blue',
    description: 'Deep navy to indigo',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#0a0a1a',
    background_gradient_via: '#1a1a3a',
    background_gradient_to: '#0a0a1a',
    primary_color_from: '#6366f1',
    primary_color_to: '#4f46e5',
    secondary_color_from: '#818cf8',
    secondary_color_to: '#6366f1',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.1',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(10, 10, 26, 0.95)',
    header_background: 'rgba(10, 10, 26, 0.8)'
  },
  fire: {
    name: 'Fire Red',
    description: 'Bold red to orange',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#1a0a0a',
    background_gradient_via: '#3a1a0a',
    background_gradient_to: '#1a0a0a',
    primary_color_from: '#ef4444',
    primary_color_to: '#dc2626',
    secondary_color_from: '#f97316',
    secondary_color_to: '#ea580c',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.1',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(26, 10, 10, 0.95)',
    header_background: 'rgba(26, 10, 10, 0.8)'
  },
  elegant: {
    name: 'Elegant Gold',
    description: 'Luxury gold and amber',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#1a1810',
    background_gradient_via: '#2a2818',
    background_gradient_to: '#1a1810',
    primary_color_from: '#fbbf24',
    primary_color_to: '#f59e0b',
    secondary_color_from: '#fcd34d',
    secondary_color_to: '#fbbf24',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.15',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(26, 24, 16, 0.95)',
    header_background: 'rgba(26, 24, 16, 0.8)'
  },
  lightElegant: {
    name: 'Light Elegant',
    description: 'Soft cream and gold',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#f5f3ef',
    background_gradient_via: '#ede8e0',
    background_gradient_to: '#f5f3ef',
    primary_color_from: '#b8941f',
    primary_color_to: '#9a7a17',
    secondary_color_from: '#d4af37',
    secondary_color_to: '#b8941f',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(245, 243, 239, 0.95)',
    header_background: 'rgba(245, 243, 239, 0.92)'
  },
  lightMinimal: {
    name: 'Light Minimal',
    description: 'Clean white and gray',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#f8f9fa',
    background_gradient_via: '#e9ecef',
    background_gradient_to: '#f8f9fa',
    primary_color_from: '#2d3748',
    primary_color_to: '#1a202c',
    secondary_color_from: '#4a5568',
    secondary_color_to: '#2d3748',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(248, 249, 250, 0.95)',
    header_background: 'rgba(248, 249, 250, 0.92)'
  },
  lightRose: {
    name: 'Light Rose',
    description: 'Soft pink and rose',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#fce7e7',
    background_gradient_via: '#f9d1d1',
    background_gradient_to: '#fce7e7',
    primary_color_from: '#db2777',
    primary_color_to: '#be185d',
    secondary_color_from: '#ec4899',
    secondary_color_to: '#db2777',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(252, 231, 231, 0.95)',
    header_background: 'rgba(252, 231, 231, 0.92)'
  },
  lightBlue: {
    name: 'Light Blue',
    description: 'Sky blue and azure',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#e0f2fe',
    background_gradient_via: '#cfe8fc',
    background_gradient_to: '#e0f2fe',
    primary_color_from: '#0284c7',
    primary_color_to: '#0369a1',
    secondary_color_from: '#0ea5e9',
    secondary_color_to: '#0284c7',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(224, 242, 254, 0.95)',
    header_background: 'rgba(224, 242, 254, 0.92)'
  },
  lightLavender: {
    name: 'Light Lavender',
    description: 'Soft purple and lavender',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#f3e8ff',
    background_gradient_via: '#e9d5ff',
    background_gradient_to: '#f3e8ff',
    primary_color_from: '#9333ea',
    primary_color_to: '#7e22ce',
    secondary_color_from: '#a855f7',
    secondary_color_to: '#9333ea',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(243, 232, 255, 0.95)',
    header_background: 'rgba(243, 232, 255, 0.92)'
  },
  lightMint: {
    name: 'Light Mint',
    description: 'Fresh mint and green',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#dcfce7',
    background_gradient_via: '#c8f4d9',
    background_gradient_to: '#dcfce7',
    primary_color_from: '#059669',
    primary_color_to: '#047857',
    secondary_color_from: '#10b981',
    secondary_color_to: '#059669',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(220, 252, 231, 0.95)',
    header_background: 'rgba(220, 252, 231, 0.92)'
  },
  lightPeach: {
    name: 'Light Peach',
    description: 'Warm peach and coral',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#ffedd5',
    background_gradient_via: '#ffe0b8',
    background_gradient_to: '#ffedd5',
    primary_color_from: '#ea580c',
    primary_color_to: '#c2410c',
    secondary_color_from: '#f97316',
    secondary_color_to: '#ea580c',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(255, 237, 213, 0.95)',
    header_background: 'rgba(255, 237, 213, 0.92)'
  },
  lightSage: {
    name: 'Light Sage',
    description: 'Calm sage and olive',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#e8ebe8',
    background_gradient_via: '#d4ddd4',
    background_gradient_to: '#e8ebe8',
    primary_color_from: '#65a30d',
    primary_color_to: '#4d7c0f',
    secondary_color_from: '#84cc16',
    secondary_color_to: '#65a30d',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(232, 235, 232, 0.95)',
    header_background: 'rgba(232, 235, 232, 0.92)'
  },
  lightIvory: {
    name: 'Light Ivory',
    description: 'Classic ivory and beige',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#faf8f5',
    background_gradient_via: '#f0ede8',
    background_gradient_to: '#faf8f5',
    primary_color_from: '#57534e',
    primary_color_to: '#44403c',
    secondary_color_from: '#78716c',
    secondary_color_to: '#57534e',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(250, 248, 245, 0.95)',
    header_background: 'rgba(250, 248, 245, 0.92)'
  },
  lightCyan: {
    name: 'Light Cyan',
    description: 'Fresh cyan and teal',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#cffafe',
    background_gradient_via: '#b0e8f5',
    background_gradient_to: '#cffafe',
    primary_color_from: '#0891b2',
    primary_color_to: '#0e7490',
    secondary_color_from: '#06b6d4',
    secondary_color_to: '#0891b2',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(207, 250, 254, 0.95)',
    header_background: 'rgba(207, 250, 254, 0.92)'
  },
  lightAmber: {
    name: 'Light Amber',
    description: 'Warm amber and honey',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#fef3c7',
    background_gradient_via: '#fde68a',
    background_gradient_to: '#fef3c7',
    primary_color_from: '#d97706',
    primary_color_to: '#b45309',
    secondary_color_from: '#f59e0b',
    secondary_color_to: '#d97706',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(254, 243, 199, 0.95)',
    header_background: 'rgba(254, 243, 199, 0.92)'
  },
  lightSlate: {
    name: 'Light Slate',
    description: 'Sophisticated slate gray',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#f1f5f9',
    background_gradient_via: '#e2e8f0',
    background_gradient_to: '#f1f5f9',
    primary_color_from: '#334155',
    primary_color_to: '#1e293b',
    secondary_color_from: '#475569',
    secondary_color_to: '#334155',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(241, 245, 249, 0.95)',
    header_background: 'rgba(241, 245, 249, 0.92)'
  },
  lightCoral: {
    name: 'Light Coral',
    description: 'Soft coral and salmon',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#ffe4e6',
    background_gradient_via: '#ffd1d5',
    background_gradient_to: '#ffe4e6',
    primary_color_from: '#e11d48',
    primary_color_to: '#be123c',
    secondary_color_from: '#f43f5e',
    secondary_color_to: '#e11d48',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(255, 228, 230, 0.95)',
    header_background: 'rgba(255, 228, 230, 0.92)'
  },
  lightEmerald: {
    name: 'Light Emerald',
    description: 'Elegant emerald green',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#d1fae5',
    background_gradient_via: '#b8f0d3',
    background_gradient_to: '#d1fae5',
    primary_color_from: '#059669',
    primary_color_to: '#047857',
    secondary_color_from: '#10b981',
    secondary_color_to: '#059669',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(209, 250, 229, 0.95)',
    header_background: 'rgba(209, 250, 229, 0.92)'
  },
  lightIndigo: {
    name: 'Light Indigo',
    description: 'Calm indigo and blue',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#e0e7ff',
    background_gradient_via: '#c7d2fe',
    background_gradient_to: '#e0e7ff',
    primary_color_from: '#4f46e5',
    primary_color_to: '#4338ca',
    secondary_color_from: '#6366f1',
    secondary_color_to: '#4f46e5',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(224, 231, 255, 0.95)',
    header_background: 'rgba(224, 231, 255, 0.92)'
  },
  lightChampagne: {
    name: 'Light Champagne',
    description: 'Luxury champagne gold',
    dashboard_name: 'Admin Panel',
    background_gradient_from: '#fdf4e3',
    background_gradient_via: '#fae8c8',
    background_gradient_to: '#fdf4e3',
    primary_color_from: '#b45309',
    primary_color_to: '#92400e',
    secondary_color_from: '#d97706',
    secondary_color_to: '#b45309',
    glass_background_opacity: '0.95',
    glass_border_opacity: '0.4',
    backdrop_blur: 'xl',
    sidebar_background: 'rgba(253, 244, 227, 0.95)',
    header_background: 'rgba(253, 244, 227, 0.92)'
  }
};

export const AdminDashboardSettings: React.FC = () => {
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const { showNotification } = useNotification();

  // Fetch dashboard settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.ADMIN.SETTINGS.DASHBOARD);
      const data = response.data;
      
      if (data.success && data.data) {
        console.log('Fetched settings data:', data.data);
        console.log('Flat format:', data.flat);
        
        // Use flat format if available, otherwise use nested format
        const sourceData = data.flat || data.data;
        
        // Convert the key-value object to our settings format
        const settingsObj: Partial<DashboardSettings> = {};
        Object.keys(defaultSettings).forEach(key => {
          const settingKey = key as keyof DashboardSettings;
          // Check if the setting exists in the response
          if (sourceData[settingKey] !== undefined && sourceData[settingKey] !== null) {
            // Handle both object format {value: ...} and direct value
            let value: string;
            if (typeof sourceData[settingKey] === 'object' && sourceData[settingKey] !== null) {
              value = sourceData[settingKey].value || sourceData[settingKey];
            } else {
              value = sourceData[settingKey];
            }
            settingsObj[settingKey] = value || defaultSettings[settingKey];
          } else {
            // Use default if not found
            settingsObj[settingKey] = defaultSettings[settingKey];
          }
        });
        
        const loadedSettings = { ...defaultSettings, ...settingsObj };
        console.log('Loaded settings:', loadedSettings);
        setSettings(loadedSettings);
        
        // Check which preset matches (if any)
        const matchingPreset = Object.entries(colorPresets).find(([_, preset]) => {
          return Object.keys(defaultSettings).every(key => {
            const k = key as keyof DashboardSettings;
            // Skip logo_url in comparison
            if (k === 'dashboard_logo_url') return true;
            return preset[k] === loadedSettings[k];
          });
        });
        
        if (matchingPreset) {
          setSelectedPreset(matchingPreset[0]);
        }
      } else {
        // If no data, use defaults
        console.warn('No settings data received, using defaults');
        setSettings(defaultSettings);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard settings:', error);
      console.error('Error details:', error.response?.data);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to load dashboard settings. Using defaults.'
      });
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save dashboard settings
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Convert settings to key-value format for bulk update
      // Ensure all values are strings and not null/undefined
      const settingsToUpdate: Record<string, string> = {};
      Object.keys(settings).forEach(key => {
        const value = settings[key as keyof DashboardSettings];
        // Convert to string, handle null/undefined
        if (value === null || value === undefined) {
          settingsToUpdate[key] = '';
        } else {
          settingsToUpdate[key] = String(value);
        }
      });

      console.log('Saving settings:', settingsToUpdate);
      console.log('Settings count:', Object.keys(settingsToUpdate).length);

      const response = await api.put(API_ENDPOINTS.ADMIN.SETTINGS.DASHBOARD, {
        settings: settingsToUpdate
      });

      console.log('Save response:', response.data);

      if (response.data.success) {
        // Immediately apply styles to prevent flash of old colors
        // This happens BEFORE page reload, so no flash occurs
        updateDashboardStyles(settings);
        
        showNotification({
          type: 'success',
          title: 'Success',
          message: response.data.message || 'Dashboard settings saved successfully! Styles applied immediately.'
        });
        
        // Refresh the page to ensure all components get the new settings
        // But styles are already applied, so there's no flash
        setTimeout(() => {
          // Use replace with cache-busting to ensure fresh data
          const url = new URL(window.location.href);
          url.searchParams.set('_t', Date.now().toString());
          window.location.replace(url.toString());
        }, 800);
      } else {
        throw new Error(response.data.message || 'Save failed');
      }
    } catch (error: any) {
      console.error('Error saving dashboard settings:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to save dashboard settings';
      
      showNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(defaultSettings);
      // Clear cache when resetting
      clearSettingsCache();
      // Apply default styles immediately
      updateDashboardStyles(defaultSettings);
    }
  };

  const handleChange = (key: keyof DashboardSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    // Clear preset selection when manually changing
    setSelectedPreset('');
  };

  // Apply preset template
  const applyPreset = (presetKey: string) => {
    const preset = colorPresets[presetKey as keyof typeof colorPresets];
    if (preset) {
      setSettings({
        dashboard_name: preset.dashboard_name,
        dashboard_logo_url: settings.dashboard_logo_url, // Keep logo
        background_gradient_from: preset.background_gradient_from,
        background_gradient_via: preset.background_gradient_via,
        background_gradient_to: preset.background_gradient_to,
        primary_color_from: preset.primary_color_from,
        primary_color_to: preset.primary_color_to,
        secondary_color_from: preset.secondary_color_from,
        secondary_color_to: preset.secondary_color_to,
        glass_background_opacity: preset.glass_background_opacity,
        glass_border_opacity: preset.glass_border_opacity,
        backdrop_blur: preset.backdrop_blur,
        sidebar_background: preset.sidebar_background,
        header_background: preset.header_background
      });
      setSelectedPreset(presetKey);
      showNotification({
        type: 'success',
        title: 'Preset Applied',
        message: `${preset.name} color scheme applied. Click Save to apply changes.`
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading dashboard settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Admin Dashboard Customization</h2>
              <p className="text-white/60 text-sm">Customize colors, logo, and appearance of your admin dashboard</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 mb-1">Current Values</p>
            <p className="text-sm text-amber-400 font-medium">
              {Object.keys(settings).filter(k => settings[k as keyof DashboardSettings] !== defaultSettings[k as keyof DashboardSettings]).length} / {Object.keys(settings).length} customized
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Live Preview</h3>
        <div 
          className="rounded-xl p-6 border border-white/10"
          style={{
            background: `linear-gradient(to bottom right, ${settings.background_gradient_from}, ${settings.background_gradient_via}, ${settings.background_gradient_to})`
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            {settings.dashboard_logo_url && settings.dashboard_logo_url.trim() !== '' ? (
              <img 
                src={settings.dashboard_logo_url} 
                alt="Logo" 
                className="w-10 h-10 rounded-lg object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(to bottom right, ${settings.primary_color_from}, ${settings.primary_color_to})`
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
            <span 
              className="text-xl font-bold"
              style={{
                background: `linear-gradient(to right, ${settings.primary_color_from}, ${settings.primary_color_to})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {settings.dashboard_name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div 
              className="rounded-lg p-3 border"
              style={{
                background: `linear-gradient(to right, ${settings.primary_color_from}40, ${settings.primary_color_to}40)`,
                borderColor: `${settings.primary_color_to}30`
              }}
            >
              <p className="text-white text-sm font-medium">Primary Gradient</p>
            </div>
            <div 
              className="rounded-lg p-3 border"
              style={{
                background: `linear-gradient(to right, ${settings.secondary_color_from}40, ${settings.secondary_color_to}40)`,
                borderColor: `${settings.secondary_color_to}30`
              }}
            >
              <p className="text-white text-sm font-medium">Secondary Gradient</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Values Debug Section (Collapsible) */}
      <details className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <summary className="text-sm font-medium text-white/80 cursor-pointer hover:text-white">
          📊 View Current Database Values
        </summary>
        <div className="mt-4 space-y-2 text-xs">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60 font-mono">{key}:</span>
              <span className="text-white/80 font-mono max-w-xs truncate">{String(value)}</span>
            </div>
          ))}
        </div>
      </details>

      {/* Color Preset Templates */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-amber-400" />
          Color Preset Templates
        </h3>
        <p className="text-white/60 text-sm mb-4">Choose a pre-designed color scheme or customize manually</p>
        
        {/* Dark Themes Section */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-white/80 mb-3">Dark Themes</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(colorPresets).filter(([key]) => 
              !key.includes('light') && key !== 'default'
            ).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedPreset === key
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div 
                  className="w-full h-16 rounded-lg mb-2"
                  style={{
                    background: `linear-gradient(to bottom right, ${preset.background_gradient_from}, ${preset.background_gradient_via}, ${preset.background_gradient_to})`
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center gap-2 p-2">
                    <div 
                      className="w-6 h-6 rounded"
                      style={{
                        background: `linear-gradient(to right, ${preset.primary_color_from}, ${preset.primary_color_to})`
                      }}
                    />
                    <div 
                      className="w-6 h-6 rounded"
                      style={{
                        background: `linear-gradient(to right, ${preset.secondary_color_from}, ${preset.secondary_color_to})`
                      }}
                    />
                  </div>
                </div>
                <p className="text-white font-medium text-sm">{preset.name}</p>
                <p className="text-white/50 text-xs mt-1">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Light Themes Section */}
        <div>
          <h4 className="text-sm font-semibold text-white/80 mb-3">Light Themes (Elegant & Classy)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(colorPresets).filter(([key]) => 
              key.includes('light') || key === 'default'
            ).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedPreset === key
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div 
                  className="w-full h-16 rounded-lg mb-2 border border-white/10"
                  style={{
                    background: `linear-gradient(to bottom right, ${preset.background_gradient_from}, ${preset.background_gradient_via}, ${preset.background_gradient_to})`
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center gap-2 p-2">
                    <div 
                      className="w-6 h-6 rounded shadow-sm"
                      style={{
                        background: `linear-gradient(to right, ${preset.primary_color_from}, ${preset.primary_color_to})`
                      }}
                    />
                    <div 
                      className="w-6 h-6 rounded shadow-sm"
                      style={{
                        background: `linear-gradient(to right, ${preset.secondary_color_from}, ${preset.secondary_color_to})`
                      }}
                    />
                  </div>
                </div>
                <p className="text-white font-medium text-sm">{preset.name}</p>
                <p className="text-white/50 text-xs mt-1">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Basic Settings */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-amber-400" />
            Basic Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Dashboard Name
              </label>
              <input
                type="text"
                value={settings.dashboard_name}
                onChange={(e) => handleChange('dashboard_name', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="Admin Panel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={settings.dashboard_logo_url}
                onChange={(e) => handleChange('dashboard_logo_url', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-white/50 mt-1">Leave empty to use default icon</p>
            </div>
          </div>
        </div>

        {/* Background Colors */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            Background Gradient
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                From Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.background_gradient_from}
                  onChange={(e) => handleChange('background_gradient_from', e.target.value)}
                  className="w-16 h-10 rounded-lg border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.background_gradient_from}
                  onChange={(e) => handleChange('background_gradient_from', e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Via Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.background_gradient_via}
                  onChange={(e) => handleChange('background_gradient_via', e.target.value)}
                  className="w-16 h-10 rounded-lg border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.background_gradient_via}
                  onChange={(e) => handleChange('background_gradient_via', e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                To Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.background_gradient_to}
                  onChange={(e) => handleChange('background_gradient_to', e.target.value)}
                  className="w-16 h-10 rounded-lg border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.background_gradient_to}
                  onChange={(e) => handleChange('background_gradient_to', e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Colors (Orange/Amber) */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Primary Colors (Orange/Amber Gradient)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                From Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primary_color_from}
                  onChange={(e) => handleChange('primary_color_from', e.target.value)}
                  className="w-16 h-10 rounded-lg border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color_from}
                  onChange={(e) => handleChange('primary_color_from', e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                To Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primary_color_to}
                  onChange={(e) => handleChange('primary_color_to', e.target.value)}
                  className="w-16 h-10 rounded-lg border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color_to}
                  onChange={(e) => handleChange('primary_color_to', e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Colors (Pink/Purple) */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Secondary Colors (Pink/Purple Gradient)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                From Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.secondary_color_from}
                  onChange={(e) => handleChange('secondary_color_from', e.target.value)}
                  className="w-16 h-10 rounded-lg border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondary_color_from}
                  onChange={(e) => handleChange('secondary_color_from', e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                To Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.secondary_color_to}
                  onChange={(e) => handleChange('secondary_color_to', e.target.value)}
                  className="w-16 h-10 rounded-lg border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondary_color_to}
                  onChange={(e) => handleChange('secondary_color_to', e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Glass Effect Settings */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Glass Effect Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Background Opacity
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={settings.glass_background_opacity}
                onChange={(e) => handleChange('glass_background_opacity', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Border Opacity
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={settings.glass_border_opacity}
                onChange={(e) => handleChange('glass_border_opacity', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Backdrop Blur
              </label>
              <select
                value={settings.backdrop_blur}
                onChange={(e) => handleChange('backdrop_blur', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={handleReset}
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};


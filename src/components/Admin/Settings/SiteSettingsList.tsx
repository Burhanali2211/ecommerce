import React, { useEffect, useState, useRef } from 'react';
import { Save, RefreshCw, Upload, X, Plus, Globe, Mail, Phone, DollarSign, Truck, FileText, Palette, Settings } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAdminDashboardSettings } from '../../../hooks/useAdminDashboardSettings';

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
  is_public: boolean;
}

// Essential settings that should always be available
const ESSENTIAL_SETTINGS = [
  { key: 'site_name', type: 'text', category: 'general', description: 'Website name', is_public: true, icon: Globe, defaultValue: 'HimalayanSpicesExports' },
  { key: 'logo_url', type: 'text', category: 'general', description: 'Website logo URL', is_public: true, icon: Upload, defaultValue: '/logo.png' },
  { key: 'site_description', type: 'text', category: 'general', description: 'Website description/meta description', is_public: true, icon: FileText, defaultValue: 'Premium Kashmir Perfumes & Attars' },
  { key: 'contact_email', type: 'email', category: 'contact', description: 'Contact email address', is_public: true, icon: Mail, defaultValue: 'admin@perfumes.com' },
  { key: 'contact_phone', type: 'text', category: 'contact', description: 'Contact phone number', is_public: true, icon: Phone, defaultValue: '+91-XXXXXXXXXX' },
  { key: 'currency', type: 'text', category: 'general', description: 'Default currency code (e.g., INR, USD)', is_public: true, icon: DollarSign, defaultValue: 'INR' },
  { key: 'free_shipping_threshold', type: 'number', category: 'shipping', description: 'Free shipping above this amount', is_public: true, icon: Truck, defaultValue: '2000' },
  { key: 'copyright_text', type: 'text', category: 'general', description: 'Copyright text for footer', is_public: true, icon: FileText, defaultValue: '© 2024 HimalayanSpicesExports. All rights reserved.' },
];

export const SiteSettingsList: React.FC = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [originalSettings, setOriginalSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useNotification();
  const { settings: dashboardSettings } = useAdminDashboardSettings();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching site settings...');
      const response = await apiClient.get('/admin/settings/site-settings');
      console.log('Site settings response:', response);

      if (response.success) {
        setSettings(response.data);
        setOriginalSettings(JSON.parse(JSON.stringify(response.data))); // Deep copy for comparison
      }
    } catch (error: any) {
      console.error('Error fetching site settings:', error);
      showError('Error Fetching Settings', error.message || 'Failed to fetch site settings');
    } finally {
      setLoading(false);
    }
  };

  // Check if a setting has been modified
  const isModified = (key: string): boolean => {
    const current = settings.find(s => s.setting_key === key);
    const original = originalSettings.find(s => s.setting_key === key);
    
    if (!current) return false;
    if (!original) return true; // New setting
    
    return current.setting_value !== original.setting_value;
  };

  // Get all modified settings
  const getModifiedSettings = (): Array<{ key: string; value: string; isNew: boolean }> => {
    const modified: Array<{ key: string; value: string; isNew: boolean }> = [];
    
    settings.forEach(setting => {
      const original = originalSettings.find(s => s.setting_key === setting.setting_key);
      if (!original || original.setting_value !== setting.setting_value) {
        modified.push({
          key: setting.setting_key,
          value: setting.setting_value,
          isNew: !original
        });
      }
    });
    
    return modified;
  };

  // Save all changes at once
  const handleSaveAll = async () => {
    const modified = getModifiedSettings();
    
    if (modified.length === 0) {
      showError('No Changes', 'No settings have been modified');
      return;
    }

    try {
      setSaving(true);
      const promises = modified.map(async ({ key, value, isNew }) => {
        if (isNew) {
          // Create new setting
          const essentialSetting = ESSENTIAL_SETTINGS.find(s => s.key === key);
          if (essentialSetting) {
            return apiClient.post('/admin/settings/site-settings', {
              setting_key: key,
              setting_value: value,
              setting_type: essentialSetting.type,
              category: essentialSetting.category,
              description: essentialSetting.description,
              is_public: essentialSetting.is_public
            });
          }
        } else {
          // Update existing setting
          return apiClient.put(`/admin/settings/site-settings/${key}`, {
            setting_value: value
          });
        }
      });

      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r && r.success);

      if (allSuccess) {
        showSuccess('Settings Saved', `${modified.length} setting(s) saved successfully`);
        // Fetch fresh settings from server to get updated IDs and values
        await fetchSettings();
        window.dispatchEvent(new Event('settingsUpdated'));
      } else {
        throw new Error('Some settings failed to save');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      showError('Error Saving Settings', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    const existing = settings.find(s => s.setting_key === key);
    if (existing) {
      // Update existing setting
      setSettings(settings.map(s =>
        s.setting_key === key ? { ...s, setting_value: value } : s
      ));
    } else {
      // Add new placeholder setting to state
      const essential = ESSENTIAL_SETTINGS.find(s => s.key === key);
      if (essential) {
        const newSetting: SiteSetting = {
          id: '',
          setting_key: key,
          setting_value: value,
          setting_type: essential.type,
          category: essential.category,
          description: essential.description,
          is_public: essential.is_public
        };
        setSettings([...settings, newSetting]);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Please upload an image smaller than 5MB');
      return;
    }

    try {
      setUploading(key);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;

          // Upload file to backend using dedicated upload endpoint
          const response = await apiClient.post('/upload/image', {
            file: base64String,
            folder: 'settings'
          });

          if (response.success && response.data?.url) {
            // Update the setting with the new URL immediately (file uploads save immediately)
            try {
              const existingSetting = settings.find(s => s.setting_key === key);
              if (existingSetting) {
                await apiClient.put(`/admin/settings/site-settings/${key}`, {
                  setting_value: response.data.url
                });
              } else {
                const essentialSetting = ESSENTIAL_SETTINGS.find(s => s.key === key);
                if (essentialSetting) {
                  await apiClient.post('/admin/settings/site-settings', {
                    setting_key: key,
                    setting_value: response.data.url,
                    setting_type: essentialSetting.type,
                    category: essentialSetting.category,
                    description: essentialSetting.description,
                    is_public: essentialSetting.is_public
                  });
                }
              }
              // Update local state
              handleChange(key, response.data.url);
              await fetchSettings(); // Refresh to get updated original
              showSuccess('Upload Successful', 'Logo uploaded and saved successfully');
              window.dispatchEvent(new Event('settingsUpdated'));
            } catch (error: any) {
              showError('Save Failed', 'Logo uploaded but failed to save');
            }
          } else {
            showError('Upload Failed', response.message || 'Failed to upload file');
          }
        } catch (error: any) {
          console.error('Error uploading file:', error);
          showError('Upload Error', error.message || 'Failed to upload file');
        } finally {
          setUploading(null);
          // Reset file input
          const fileInput = e.target;
          if (fileInput) {
            fileInput.value = '';
          }
        }
      };
      reader.onerror = () => {
        showError('Read Error', 'Failed to read file');
        setUploading(null);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      showError('Upload Error', error.message || 'Failed to upload file');
      setUploading(null);
    }
  };

  // Get essential settings (create placeholders if they don't exist)
  const getEssentialSetting = (key: string, alternativeKey?: string): SiteSetting | null => {
    // Check for primary key first
    let existing = settings.find(s => s.setting_key === key);
    
    // If not found and alternative key provided, check for that
    if (!existing && alternativeKey) {
      existing = settings.find(s => s.setting_key === alternativeKey);
      // If found with alternative key, migrate it to the primary key
      if (existing) {
        // Update the setting key to the primary key
        existing = { ...existing, setting_key: key };
      }
    }
    
    if (existing) return existing;
    
    const essential = ESSENTIAL_SETTINGS.find(s => s.key === key);
    if (essential) {
      return {
        id: '',
        setting_key: key,
        setting_value: essential.defaultValue,
        setting_type: essential.type,
        category: essential.category,
        description: essential.description,
        is_public: essential.is_public
      } as SiteSetting;
    }
    return null;
  };

  // Check if a setting exists in the database (has been saved before)
  const isSettingSaved = (key: string): boolean => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? Boolean(setting.id && setting.id !== '') : false;
  };

  // Separate essential settings for special display
  const siteName = getEssentialSetting('site_name');
  const logoUrl = getEssentialSetting('logo_url', 'site_logo'); // Check for both logo_url and site_logo
  const siteDescription = getEssentialSetting('site_description');
  const contactEmail = getEssentialSetting('contact_email');
  const contactPhone = getEssentialSetting('contact_phone');
  const currency = getEssentialSetting('currency');
  const freeShippingThreshold = getEssentialSetting('free_shipping_threshold');
  const copyrightText = getEssentialSetting('copyright_text');

  // Get other settings (non-essential)
  const essentialKeys = ESSENTIAL_SETTINGS.map(s => s.key);
  const otherSettings = settings.filter(s => !essentialKeys.includes(s.setting_key));

  const groupedSettings = otherSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category]?.push(setting);
    return acc;
  }, {} as Record<string, SiteSetting[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: dashboardSettings.primary_color_from }}
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(to bottom right, ${dashboardSettings.primary_color_from}20, ${dashboardSettings.primary_color_to}20)`
            }}
          >
            <Settings className="w-6 h-6" style={{ color: dashboardSettings.primary_color_from }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Site Settings</h2>
            <p className="text-sm text-white/60 mt-0.5">Configure general website settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all hover:scale-105 active:scale-95 text-sm"
          >
            <RefreshCw className="h-5 w-5 flex-shrink-0" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Save All Button - Top */}
      {getModifiedSettings().length > 0 && (
        <div 
          className="backdrop-blur-sm rounded-2xl border p-4"
          style={{
            background: `linear-gradient(to right, ${dashboardSettings.primary_color_from}20, ${dashboardSettings.primary_color_to}20)`,
            borderColor: `${dashboardSettings.primary_color_from}40`
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">
                {getModifiedSettings().length} setting(s) modified
              </p>
              <p className="text-xs text-white/60 mt-1">Click "Save All Changes" to apply your modifications</p>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:shadow-lg min-h-[44px] sm:min-h-auto disabled:hover:scale-100"
              style={{
                background: `linear-gradient(to right, ${dashboardSettings.primary_color_from}, ${dashboardSettings.primary_color_to})`
              }}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 flex-shrink-0" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Essential Settings Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div 
          className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/10"
          style={{
            background: `linear-gradient(to right, ${dashboardSettings.primary_color_from}20, ${dashboardSettings.primary_color_to}20)`
          }}
        >
          <h3 className="font-semibold text-sm sm:text-base text-white">Essential Website Settings</h3>
          <p className="text-xs sm:text-sm text-white/60 mt-1">Configure your website identity and basic information</p>
        </div>

        {/* Content - Grid Layout */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Site Name */}
            {siteName && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Globe className="h-4 w-4 flex-shrink-0" style={{ color: dashboardSettings.primary_color_from }} />
                  <label className="font-medium text-sm text-white">
                    Website Name
                  </label>
                  {siteName.is_public && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full">
                      Public
                    </span>
                  )}
                  {!isSettingSaved(siteName.setting_key) && !isModified(siteName.setting_key) && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs rounded-full">
                      Not Saved
                    </span>
                  )}
                  {isModified(siteName.setting_key) && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      Modified
                    </span>
                  )}
                </div>
                {siteName.description && (
                  <p className="text-xs text-white/60">{siteName.description}</p>
                )}
                <input
                  type="text"
                  value={siteName.setting_value || ''}
                  onChange={(e) => handleChange(siteName.setting_key, e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[44px] transition-colors ${
                    isModified(siteName.setting_key) 
                      ? 'border-orange-500/50 bg-orange-500/10' 
                      : 'border-white/10'
                  }`}
                  style={{
                    '--tw-ring-color': `${dashboardSettings.primary_color_from}50`
                  } as React.CSSProperties}
                  placeholder="Enter website name"
                />
              </div>
            )}

            {/* Logo Upload */}
            {logoUrl && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Upload className="h-4 w-4 flex-shrink-0" style={{ color: dashboardSettings.primary_color_from }} />
                  <label className="font-medium text-sm text-white">
                    Website Logo
                  </label>
                  {logoUrl.is_public && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full">
                      Public
                    </span>
                  )}
                  {!isSettingSaved(logoUrl.setting_key) && !isModified(logoUrl.setting_key) && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs rounded-full">
                      Not Saved
                    </span>
                  )}
                  {isModified(logoUrl.setting_key) && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      Modified
                    </span>
                  )}
                </div>
                {logoUrl.description && (
                  <p className="text-xs text-white/60">{logoUrl.description}</p>
                )}
                <div className="flex flex-col gap-3">
                  {logoUrl.setting_value && (() => {
                    // Normalize logo URL - convert relative paths to absolute URLs
                    let logoSrc = logoUrl.setting_value;
                    if (logoSrc && typeof logoSrc === 'string') {
                      // If it's a relative path starting with /uploads, make it absolute
                      if (logoSrc.startsWith('/uploads') && !logoSrc.startsWith('http')) {
                        // In production, use the current origin
                        const baseUrl = window.location.origin;
                        logoSrc = `${baseUrl}${logoSrc}`;
                      }
                    }
                    return (
                      <div className="flex items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 min-h-[80px]">
                        <img
                          key={logoUrl.setting_value} // Force re-render when URL changes
                          src={logoSrc}
                          alt="Logo preview"
                          className="h-20 w-auto max-w-full object-contain rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // Only show placeholder if it's not already the placeholder
                            if (!target.src.includes('data:image/svg')) {
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';
                            }
                          }}
                          onLoad={() => {
                            // Image loaded successfully
                            console.log('Logo preview loaded:', logoSrc);
                          }}
                        />
                      </div>
                    );
                  })()}
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, logoUrl.setting_key)}
                    className="hidden"
                  />
                  <button
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={uploading === logoUrl.setting_key}
                    className="w-full px-4 py-2 border-2 border-dashed rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm min-h-[44px] text-white"
                    style={{
                      borderColor: `${dashboardSettings.primary_color_from}50`,
                      color: dashboardSettings.primary_color_from
                    }}
                  >
                    {uploading === logoUrl.setting_key ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 flex-shrink-0" />
                        <span>Upload Logo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Site Description - Full Width */}
            {siteDescription && (
              <div className="flex flex-col gap-2 lg:col-span-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="h-4 w-4 flex-shrink-0" style={{ color: dashboardSettings.primary_color_from }} />
                  <label className="font-medium text-sm text-white">
                    Website Description
                  </label>
                  {siteDescription.is_public && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full">
                      Public
                    </span>
                  )}
                  {!isSettingSaved(siteDescription.setting_key) && !isModified(siteDescription.setting_key) && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs rounded-full">
                      Not Saved
                    </span>
                  )}
                  {isModified(siteDescription.setting_key) && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      Modified
                    </span>
                  )}
                </div>
                {siteDescription.description && (
                  <p className="text-xs text-white/60">{siteDescription.description}</p>
                )}
                <textarea
                  value={siteDescription.setting_value}
                  onChange={(e) => handleChange(siteDescription.setting_key, e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[100px] resize-y transition-colors ${
                    isModified(siteDescription.setting_key) 
                      ? 'border-orange-500/50 bg-orange-500/10' 
                      : 'border-white/10'
                  }`}
                  style={{
                    '--tw-ring-color': `${dashboardSettings.primary_color_from}50`
                  } as React.CSSProperties}
                  placeholder="Enter website description"
                  rows={3}
                />
              </div>
            )}

            {/* Contact Email */}
            {contactEmail && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Mail className="h-4 w-4 flex-shrink-0" style={{ color: dashboardSettings.primary_color_from }} />
                  <label className="font-medium text-sm text-white">
                    Contact Email
                  </label>
                  {contactEmail.is_public && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full">
                      Public
                    </span>
                  )}
                  {!isSettingSaved(contactEmail.setting_key) && !isModified(contactEmail.setting_key) && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs rounded-full">
                      Not Saved
                    </span>
                  )}
                  {isModified(contactEmail.setting_key) && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      Modified
                    </span>
                  )}
                </div>
                {contactEmail.description && (
                  <p className="text-xs text-white/60">{contactEmail.description}</p>
                )}
                <input
                  type="email"
                  value={contactEmail.setting_value}
                  onChange={(e) => handleChange(contactEmail.setting_key, e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[44px] transition-colors ${
                    isModified(contactEmail.setting_key) 
                      ? 'border-orange-500/50 bg-orange-500/10' 
                      : 'border-white/10'
                  }`}
                  style={{
                    '--tw-ring-color': `${dashboardSettings.primary_color_from}50`
                  } as React.CSSProperties}
                  placeholder="admin@example.com"
                />
              </div>
            )}

            {/* Contact Phone */}
            {contactPhone && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Phone className="h-4 w-4 flex-shrink-0" style={{ color: dashboardSettings.primary_color_from }} />
                  <label className="font-medium text-sm text-white">
                    Contact Phone
                  </label>
                  {contactPhone.is_public && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full">
                      Public
                    </span>
                  )}
                  {!isSettingSaved(contactPhone.setting_key) && !isModified(contactPhone.setting_key) && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs rounded-full">
                      Not Saved
                    </span>
                  )}
                  {isModified(contactPhone.setting_key) && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      Modified
                    </span>
                  )}
                </div>
                {contactPhone.description && (
                  <p className="text-xs text-white/60">{contactPhone.description}</p>
                )}
                <input
                  type="text"
                  value={contactPhone.setting_value}
                  onChange={(e) => handleChange(contactPhone.setting_key, e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[44px] transition-colors ${
                    isModified(contactPhone.setting_key) 
                      ? 'border-orange-500/50 bg-orange-500/10' 
                      : 'border-white/10'
                  }`}
                  style={{
                    '--tw-ring-color': `${dashboardSettings.primary_color_from}50`
                  } as React.CSSProperties}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
            )}

            {/* Currency */}
            {currency && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <DollarSign className="h-4 w-4 flex-shrink-0" style={{ color: dashboardSettings.primary_color_from }} />
                  <label className="font-medium text-sm text-white">
                    Currency
                  </label>
                  {currency.is_public && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full">
                      Public
                    </span>
                  )}
                  {!isSettingSaved(currency.setting_key) && !isModified(currency.setting_key) && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs rounded-full">
                      Not Saved
                    </span>
                  )}
                  {isModified(currency.setting_key) && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      Modified
                    </span>
                  )}
                </div>
                {currency.description && (
                  <p className="text-xs text-white/60">{currency.description}</p>
                )}
                <input
                  type="text"
                  value={currency.setting_value}
                  onChange={(e) => handleChange(currency.setting_key, e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[44px] transition-colors ${
                    isModified(currency.setting_key) 
                      ? 'border-orange-500/50 bg-orange-500/10' 
                      : 'border-white/10'
                  }`}
                  style={{
                    '--tw-ring-color': `${dashboardSettings.primary_color_from}50`
                  } as React.CSSProperties}
                  placeholder="INR, USD, EUR, etc."
                />
              </div>
            )}

            {/* Free Shipping Threshold */}
            {freeShippingThreshold && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Truck className="h-4 w-4 flex-shrink-0" style={{ color: dashboardSettings.primary_color_from }} />
                  <label className="font-medium text-sm text-white">
                    Free Shipping Threshold
                  </label>
                  {freeShippingThreshold.is_public && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full">
                      Public
                    </span>
                  )}
                  {!isSettingSaved(freeShippingThreshold.setting_key) && !isModified(freeShippingThreshold.setting_key) && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs rounded-full">
                      Not Saved
                    </span>
                  )}
                  {isModified(freeShippingThreshold.setting_key) && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      Modified
                    </span>
                  )}
                </div>
                {freeShippingThreshold.description && (
                  <p className="text-xs text-white/60">{freeShippingThreshold.description}</p>
                )}
                <input
                  type="number"
                  value={freeShippingThreshold.setting_value}
                  onChange={(e) => handleChange(freeShippingThreshold.setting_key, e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[44px] transition-colors ${
                    isModified(freeShippingThreshold.setting_key) 
                      ? 'border-orange-500/50 bg-orange-500/10' 
                      : 'border-white/10'
                  }`}
                  style={{
                    '--tw-ring-color': `${dashboardSettings.primary_color_from}50`
                  } as React.CSSProperties}
                  placeholder="2000"
                />
              </div>
            )}

            {/* Copyright Text */}
            {copyrightText && (
              <div className="flex flex-col gap-2 lg:col-span-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="h-4 w-4 flex-shrink-0" style={{ color: dashboardSettings.primary_color_from }} />
                  <label className="font-medium text-sm text-white">
                    Copyright Text
                  </label>
                  {copyrightText.is_public && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full">
                      Public
                    </span>
                  )}
                  {!isSettingSaved(copyrightText.setting_key) && !isModified(copyrightText.setting_key) && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs rounded-full">
                      Not Saved
                    </span>
                  )}
                  {isModified(copyrightText.setting_key) && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      Modified
                    </span>
                  )}
                </div>
                {copyrightText.description && (
                  <p className="text-xs text-white/60">{copyrightText.description}</p>
                )}
                <input
                  type="text"
                  value={copyrightText.setting_value}
                  onChange={(e) => handleChange(copyrightText.setting_key, e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[44px] transition-colors ${
                    isModified(copyrightText.setting_key) 
                      ? 'border-orange-500/50 bg-orange-500/10' 
                      : 'border-white/10'
                  }`}
                  style={{
                    '--tw-ring-color': `${dashboardSettings.primary_color_from}50`
                  } as React.CSSProperties}
                  placeholder="© 2024 Your Company. All rights reserved."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings by Category */}
      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([category, items]) => {
          const isDesignCategory = category.toLowerCase() === 'design';
          const colorSettings = items.filter(item => isColorField(item.setting_key));
          const otherSettings = items.filter(item => !isColorField(item.setting_key));
          
          return (
          <div key={category} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            {/* Category Header */}
            <div 
              className={`px-3 sm:px-6 py-2 sm:py-3 border-b border-white/10 ${isDesignCategory ? '' : ''}`}
              style={isDesignCategory ? {
                background: `linear-gradient(to right, ${dashboardSettings.secondary_color_from}20, ${dashboardSettings.secondary_color_to}20)`
              } : {
                background: `linear-gradient(to right, ${dashboardSettings.primary_color_from}20, ${dashboardSettings.primary_color_to}20)`
              }}
            >
              <h3 className="font-semibold text-xs sm:text-base text-white capitalize flex items-center gap-2">
                {isDesignCategory && <Palette className="h-4 w-4" style={{ color: dashboardSettings.secondary_color_from }} />}
                {category}
              </h3>
              {isDesignCategory && (
                <p className="text-xs text-white/60 mt-1">Customize colors and visual appearance</p>
              )}
            </div>

            {/* Settings - Grid Layout */}
            <div className="p-4 sm:p-6">
              {/* Color Settings Section (for design category) */}
              {isDesignCategory && colorSettings.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Palette className="h-4 w-4" style={{ color: dashboardSettings.secondary_color_from }} />
                    Color Settings
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    {colorSettings.map((setting) => (
                      <div key={setting.id} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="font-medium text-sm text-white">
                            {formatKey(setting.setting_key)}
                          </label>
                          {setting.is_public && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full">
                              Public
                            </span>
                          )}
                          {isModified(setting.setting_key) && (
                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                              Modified
                            </span>
                          )}
                        </div>
                        {setting.description && (
                          <p className="text-xs text-white/60">{setting.description}</p>
                        )}
                        <div className="flex gap-3 items-center">
                          <div className="relative flex-shrink-0">
                            <input
                              type="color"
                              value={isValidHexColor(setting.setting_value) ? setting.setting_value : '#000000'}
                              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                              className="w-16 h-16 rounded-lg border-2 cursor-pointer transition-colors shadow-sm appearance-none"
                              style={{ 
                                backgroundColor: isValidHexColor(setting.setting_value) ? setting.setting_value : '#000000',
                                borderColor: `${dashboardSettings.secondary_color_from}50`
                              }}
                              title="Click to pick a color"
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-1">
                            <input
                              type="text"
                              value={setting.setting_value}
                              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                              placeholder="#000000"
                              className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[44px] font-mono transition-colors ${
                                isModified(setting.setting_key) 
                                  ? 'border-orange-500/50 bg-orange-500/10' 
                                  : 'border-white/10'
                              } ${!isValidHexColor(setting.setting_value) && setting.setting_value ? 'border-red-500/50 bg-red-500/10' : ''}`}
                              style={{
                                '--tw-ring-color': `${dashboardSettings.secondary_color_from}50`
                              } as React.CSSProperties}
                            />
                            {!isValidHexColor(setting.setting_value) && setting.setting_value && (
                              <p className="text-xs text-red-300">Invalid hex color format</p>
                            )}
                          </div>
                          {setting.setting_value && isValidHexColor(setting.setting_value) && (
                            <div 
                              className="w-12 h-12 rounded-lg border-2 shadow-sm flex-shrink-0"
                              style={{ 
                                backgroundColor: setting.setting_value,
                                borderColor: `${dashboardSettings.secondary_color_from}50`
                              }}
                              title="Color preview"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Other Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {(isDesignCategory ? otherSettings : items).map((setting) => (
                  <div key={setting.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="font-medium text-sm text-white">
                        {formatKey(setting.setting_key)}
                      </label>
                      {setting.is_public && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full">
                          Public
                        </span>
                      )}
                      {isModified(setting.setting_key) && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                          Modified
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-white/60">{setting.description}</p>
                    )}

                    <div className="w-full">
                      {setting.setting_key === 'logo_url' ? (
                        <>
                          <div className="flex flex-col gap-3">
                            {setting.setting_value && (() => {
                              // Normalize logo URL - convert relative paths to absolute URLs
                              let logoSrc = setting.setting_value;
                              if (logoSrc && typeof logoSrc === 'string') {
                                // If it's a relative path starting with /uploads, make it absolute
                                if (logoSrc.startsWith('/uploads') && !logoSrc.startsWith('http')) {
                                  // In production, use the current origin
                                  const baseUrl = window.location.origin;
                                  logoSrc = `${baseUrl}${logoSrc}`;
                                }
                              }
                              return (
                                <div className="flex items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 min-h-[80px]">
                                  <img
                                    key={setting.setting_value} // Force re-render when URL changes
                                    src={logoSrc}
                                    alt="Logo preview"
                                    className="h-20 w-auto max-w-full object-contain rounded"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      // Only show placeholder if it's not already the placeholder
                                      if (!target.src.includes('data:image/svg')) {
                                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';
                                      }
                                    }}
                                    onLoad={() => {
                                      // Image loaded successfully
                                      console.log('Logo preview loaded:', logoSrc);
                                    }}
                                  />
                                </div>
                              );
                            })()}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, setting.setting_key)}
                              className="hidden"
                              id={`file-input-${setting.setting_key}`}
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById(`file-input-${setting.setting_key}`) as HTMLInputElement;
                                input?.click();
                              }}
                              disabled={uploading === setting.setting_key}
                              className="w-full px-4 py-2 border-2 border-dashed rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm min-h-[44px] text-white"
                              style={{
                                borderColor: `${dashboardSettings.primary_color_from}50`,
                                color: dashboardSettings.primary_color_from
                              }}
                            >
                              {uploading === setting.setting_key ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
                                  <span>Uploading...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 flex-shrink-0" />
                                  <span>Upload Logo</span>
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      ) : setting.setting_type === 'boolean' ? (
                        <select
                          value={setting.setting_value}
                          onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                          className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white min-h-[44px] transition-colors ${
                            isModified(setting.setting_key) 
                              ? 'border-orange-500/50 bg-orange-500/10' 
                              : 'border-white/10'
                          }`}
                          style={{
                            '--tw-ring-color': `${dashboardSettings.primary_color_from}50`
                          } as React.CSSProperties}
                        >
                          <option value="true" className="bg-gray-900">True</option>
                          <option value="false" className="bg-gray-900">False</option>
                        </select>
                      ) : setting.setting_type === 'number' ? (
                        <input
                          type="number"
                          value={setting.setting_value}
                          onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                          className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[44px] transition-colors ${
                            isModified(setting.setting_key) 
                              ? 'border-orange-500/50 bg-orange-500/10' 
                              : 'border-white/10'
                          }`}
                          style={{
                            '--tw-ring-color': `${dashboardSettings.primary_color_from}50`
                          } as React.CSSProperties}
                        />
                      ) : isColorField(setting.setting_key) ? (
                        <div className="flex gap-3 items-center">
                          <div className="relative flex-shrink-0">
                            <input
                              type="color"
                              value={isValidHexColor(setting.setting_value) ? setting.setting_value : '#000000'}
                              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                              className="w-16 h-16 rounded-lg border-2 cursor-pointer transition-colors shadow-sm appearance-none"
                              style={{ 
                                backgroundColor: isValidHexColor(setting.setting_value) ? setting.setting_value : '#000000',
                                borderColor: `${dashboardSettings.secondary_color_from}50`
                              }}
                              title="Click to pick a color"
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-1">
                            <input
                              type="text"
                              value={setting.setting_value}
                              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                              placeholder="#000000"
                              className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[44px] font-mono transition-colors ${
                                isModified(setting.setting_key) 
                                  ? 'border-orange-500/50 bg-orange-500/10' 
                                  : 'border-white/10'
                              } ${!isValidHexColor(setting.setting_value) && setting.setting_value ? 'border-red-500/50 bg-red-500/10' : ''}`}
                              style={{
                                '--tw-ring-color': `${dashboardSettings.secondary_color_from}50`
                              } as React.CSSProperties}
                            />
                            {!isValidHexColor(setting.setting_value) && setting.setting_value && (
                              <p className="text-xs text-red-300">Invalid hex color format</p>
                            )}
                          </div>
                          {setting.setting_value && isValidHexColor(setting.setting_value) && (
                            <div 
                              className="w-12 h-12 rounded-lg border-2 shadow-sm flex-shrink-0"
                              style={{ 
                                backgroundColor: setting.setting_value,
                                borderColor: `${dashboardSettings.secondary_color_from}50`
                              }}
                              title="Color preview"
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={setting.setting_value}
                          onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                          className={`w-full px-3 sm:px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 focus:border-transparent text-sm text-white placeholder-white/40 min-h-[44px] transition-colors ${
                            isModified(setting.setting_key) 
                              ? 'border-orange-500/50 bg-orange-500/10' 
                              : 'border-white/10'
                          }`}
                          style={{
                            '--tw-ring-color': `${dashboardSettings.primary_color_from}50`
                          } as React.CSSProperties}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {/* Save All Button - Bottom */}
      {getModifiedSettings().length > 0 && (
        <div 
          className="backdrop-blur-sm rounded-2xl border p-4 sticky bottom-4 shadow-lg"
          style={{
            background: `linear-gradient(to right, ${dashboardSettings.primary_color_from}20, ${dashboardSettings.primary_color_to}20)`,
            borderColor: `${dashboardSettings.primary_color_from}40`
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">
                {getModifiedSettings().length} setting(s) modified
              </p>
              <p className="text-xs text-white/60 mt-1">Click "Save All Changes" to apply your modifications</p>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:shadow-lg min-h-[44px] sm:min-h-auto disabled:hover:scale-100"
              style={{
                background: `linear-gradient(to right, ${dashboardSettings.primary_color_from}, ${dashboardSettings.primary_color_to})`
              }}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 flex-shrink-0" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {settings.length === 0 && (
        <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2">No Settings Found</h3>
          <p className="text-white/60">Site settings will appear here once configured</p>
        </div>
      )}
    </div>
  );
};

// Helper function to format setting keys
function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to check if a setting is a color field
function isColorField(key: string): boolean {
  const colorKeywords = ['color', 'primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color', 'button_color', 'cart_button_color', 'cart_button_text_color'];
  return colorKeywords.some(keyword => key.toLowerCase().includes(keyword));
}

// Helper function to validate hex color
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}


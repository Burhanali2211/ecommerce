import React, { useState, useEffect } from 'react';
import { Palette, Save, RefreshCw, Sun, Moon, Monitor } from 'lucide-react';
import { api, API_ENDPOINTS } from '@/config/api';

interface ThemeSetting {
  mode: 'light' | 'dark' | 'system';
  colorScheme: 'default' | 'warm' | 'cool' | 'vibrant';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  animationLevel: 'none' | 'reduced' | 'full';
}

const defaultTheme: ThemeSetting = {
  mode: 'light',
  colorScheme: 'default',
  primaryColor: '#8B5CF6',
  secondaryColor: '#EC4899',
  accentColor: '#F59E0B',
  fontFamily: 'Inter',
  fontSize: 'medium',
  borderRadius: 'medium',
  animationLevel: 'full'
};

export const ThemeSettings: React.FC = () => {
  const [theme, setTheme] = useState<ThemeSetting>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch theme settings
  const fetchTheme = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const response = await api.get(API_ENDPOINTS.ADMIN.SETTINGS.THEME);
      const data = response.data;
      if (data.success && data.data) {
        setTheme({ ...defaultTheme, ...data.data });
      } else {
        // If no data but success, use defaults
        if (data.success) {
          setTheme(defaultTheme);
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to load theme settings' });
        }
      }
    } catch (error: any) {
      console.error('Error fetching theme:', error);
      
      // Check if it's a real authentication error (401)
      const isAuthError = error.response?.status === 401;
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;
      
      if (isAuthError && (errorMessage?.includes('token') || errorMessage?.includes('authentication') || errorMessage?.includes('unauthorized'))) {
        // Real auth error - let the interceptor handle it
        setMessage({ 
          type: 'error', 
          text: 'Your session has expired. Please log in again.' 
        });
        return;
      }
      
      // For other errors (network, server errors, etc.), show error but don't logout
      setMessage({ 
        type: 'error', 
        text: errorMessage || 'Failed to load theme settings. Using default settings.' 
      });
      
      // Use default theme if fetch fails
      setTheme(defaultTheme);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  // Save theme settings
  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      console.log('Saving theme settings:', theme);
      console.log('API endpoint:', API_ENDPOINTS.ADMIN.SETTINGS.THEME);
      
      const response = await api.put(API_ENDPOINTS.ADMIN.SETTINGS.THEME, theme);
      console.log('Save response:', response);
      
      const data = response.data;
      if (data.success) {
        setMessage({ type: 'success', text: 'Theme settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
        // Optionally refresh the theme to confirm it was saved
        setTimeout(() => {
          fetchTheme();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save theme settings' });
      }
    } catch (error: any) {
      console.error('Error saving theme:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      // Check if it's a real authentication error (401)
      const isAuthError = error.response?.status === 401;
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message ||
                          'Failed to save theme settings';
      
      if (isAuthError && (errorMessage?.includes('token') || errorMessage?.includes('authentication') || errorMessage?.includes('unauthorized'))) {
        // Real auth error - let the interceptor handle it
        setMessage({ 
          type: 'error', 
          text: 'Your session has expired. Please log in again.' 
        });
        return;
      }
      
      // For other errors, show error message with more details
      setMessage({ 
        type: 'error', 
        text: errorMessage || 'Error saving theme settings. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Update theme field
  const updateTheme = (field: keyof ThemeSetting, value: any) => {
    setTheme(prev => {
      const updated = { ...prev, [field]: value };
      console.log('Theme updated:', field, value, updated);
      return updated;
    });
    // Clear any previous error messages when user makes changes
    if (message?.type === 'error') {
      setMessage(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Theme Settings</h1>
              <p className="text-gray-600 mt-1">Customize the look and feel of your website</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchTheme}
              disabled={loading}
              className="px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all border border-gray-200"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Theme Mode */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Mode</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
            { value: 'system', icon: Monitor, label: 'System' }
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => updateTheme('mode', value)}
              className={`p-4 rounded-lg border-2 transition-all ${theme.mode === value
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <Icon className={`h-6 w-6 mx-auto mb-2 ${theme.mode === value ? 'text-purple-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${theme.mode === value ? 'text-purple-900' : 'text-gray-700'}`}>{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Color Scheme</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: 'default', colors: ['#8B5CF6', '#EC4899', '#F59E0B'] },
            { value: 'warm', colors: ['#F59E0B', '#EF4444', '#DC2626'] },
            { value: 'cool', colors: ['#3B82F6', '#06B6D4', '#8B5CF6'] },
            { value: 'vibrant', colors: ['#EC4899', '#8B5CF6', '#06B6D4'] }
          ].map(({ value, colors }) => (
            <button
              key={value}
              onClick={() => updateTheme('colorScheme', value)}
              className={`p-4 rounded-lg border-2 transition-all ${theme.colorScheme === value
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex gap-2 mb-2">
                {colors.map((color, i) => (
                  <div key={i} className="w-8 h-8 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
              <p className={`text-sm font-medium capitalize ${theme.colorScheme === value ? 'text-purple-900' : 'text-gray-700'}`}>
                {value}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { field: 'primaryColor', label: 'Primary Color' },
            { field: 'secondaryColor', label: 'Secondary Color' },
            { field: 'accentColor', label: 'Accent Color' }
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={theme[field as keyof ThemeSetting] as string}
                  onChange={(e) => updateTheme(field as keyof ThemeSetting, e.target.value)}
                  className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme[field as keyof ThemeSetting] as string}
                  onChange={(e) => updateTheme(field as keyof ThemeSetting, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Typography</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
            <select
              value={theme.fontFamily}
              onChange={(e) => updateTheme('fontFamily', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
            <select
              value={theme.fontSize}
              onChange={(e) => updateTheme('fontSize', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      {/* Border & Animation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Border & Animation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
            <select
              value={theme.borderRadius}
              onChange={(e) => updateTheme('borderRadius', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="none">None (0px)</option>
              <option value="small">Small (4px)</option>
              <option value="medium">Medium (8px)</option>
              <option value="large">Large (16px)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Animation Level</label>
            <select
              value={theme.animationLevel}
              onChange={(e) => updateTheme('animationLevel', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="none">None</option>
              <option value="reduced">Reduced</option>
              <option value="full">Full</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
        <div className="p-6 bg-gray-50 rounded-lg" style={{ fontFamily: theme.fontFamily }}>
          <div className="space-y-4">
            <button
              className="px-6 py-3 text-white rounded-lg font-medium transition-all"
              style={{
                backgroundColor: theme.primaryColor,
                borderRadius: theme.borderRadius === 'none' ? '0' : theme.borderRadius === 'small' ? '4px' : theme.borderRadius === 'medium' ? '8px' : '16px'
              }}
            >
              Primary Button
            </button>
            <button
              className="px-6 py-3 text-white rounded-lg font-medium transition-all"
              style={{
                backgroundColor: theme.secondaryColor,
                borderRadius: theme.borderRadius === 'none' ? '0' : theme.borderRadius === 'small' ? '4px' : theme.borderRadius === 'medium' ? '8px' : '16px'
              }}
            >
              Secondary Button
            </button>
            <button
              className="px-6 py-3 text-white rounded-lg font-medium transition-all"
              style={{
                backgroundColor: theme.accentColor,
                borderRadius: theme.borderRadius === 'none' ? '0' : theme.borderRadius === 'small' ? '4px' : theme.borderRadius === 'medium' ? '8px' : '16px'
              }}
            >
              Accent Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


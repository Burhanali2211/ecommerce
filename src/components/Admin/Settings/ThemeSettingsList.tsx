/**
 * Theme Settings List Component
 * 
 * Manage website theme and appearance settings
 */

import React, { useState } from 'react';
import { Palette, Save, RotateCcw, Eye, Moon, Sun, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotification } from '../../../contexts/NotificationContext';
import { useTheme } from '../../../contexts/ThemeContext';

export const ThemeSettingsList: React.FC = () => {
  const { showNotification } = useNotification();
  const { preferences, updatePreferences, resetToDefaults } = useTheme();
  const [saving, setSaving] = useState(false);

  const [themeSettings, setThemeSettings] = useState({
    mode: preferences.mode || 'light',
    colorScheme: preferences.colorScheme || 'neutral',
    fontScale: preferences.fontScale || 'comfortable',
    borderRadius: preferences.borderRadius || 'medium',
    animationLevel: preferences.animationLevel || 'normal',
    highContrast: preferences.highContrast || false,
    reducedMotion: preferences.reducedMotion || false
  });

  const handleChange = (field: string, value: any) => {
    setThemeSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update theme preferences
      updatePreferences(themeSettings);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      showNotification({
        type: 'success',
        title: 'Theme Settings Saved',
        message: 'Your theme preferences have been updated successfully'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save theme settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    resetToDefaults();
    setThemeSettings({
      mode: 'light',
      colorScheme: 'neutral',
      fontScale: 'comfortable',
      borderRadius: 'medium',
      animationLevel: 'normal',
      highContrast: false,
      reducedMotion: false
    });

    showNotification({
      type: 'info',
      title: 'Theme Reset',
      message: 'Theme settings have been reset to defaults'
    });
  };

  const colorSchemes = [
    { id: 'neutral', name: 'Neutral', color: '#475569' },
    { id: 'warm', name: 'Warm', color: '#ea580c' },
    { id: 'cool', name: 'Cool', color: '#3b82f6' },
    { id: 'vibrant', name: 'Vibrant', color: '#a855f7' },
    { id: 'monochrome', name: 'Monochrome', color: '#6b7280' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <Palette className="h-4 sm:h-5 w-4 sm:w-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Theme Settings</h2>
            <p className="text-xs sm:text-sm text-gray-600 truncate">Customize the look and feel</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 flex items-center gap-1 sm:gap-2 min-h-[44px] sm:min-h-auto"
          >
            <RotateCcw className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Reset</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 flex items-center gap-1 sm:gap-2 min-h-[44px] sm:min-h-auto"
          >
            <Save className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
          </motion.button>
        </div>
      </div>

      {/* Theme Mode */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <Eye className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600 flex-shrink-0" />
          Theme Mode
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <button
            onClick={() => handleChange('mode', 'light')}
            className={`p-2 sm:p-4 rounded-lg border-2 transition-all min-h-[80px] sm:min-h-auto ${themeSettings.mode === 'light'
              ? 'border-purple-600 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
              }`}
          >
            <Sun className="h-5 sm:h-6 w-5 sm:w-6 mx-auto mb-1 sm:mb-2 text-yellow-500" />
            <div className="text-xs sm:text-sm font-medium text-gray-900">Light</div>
            <div className="text-xs text-gray-600 hidden sm:block">Bright theme</div>
          </button>
          <button
            onClick={() => handleChange('mode', 'dark')}
            className={`p-2 sm:p-4 rounded-lg border-2 transition-all min-h-[80px] sm:min-h-auto ${themeSettings.mode === 'dark'
              ? 'border-purple-600 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
              }`}
          >
            <Moon className="h-5 sm:h-6 w-5 sm:w-6 mx-auto mb-1 sm:mb-2 text-indigo-500" />
            <div className="text-xs sm:text-sm font-medium text-gray-900">Dark</div>
            <div className="text-xs text-gray-600 hidden sm:block">Dark theme</div>
          </button>
          <button
            onClick={() => handleChange('mode', 'system')}
            className={`p-2 sm:p-4 rounded-lg border-2 transition-all min-h-[80px] sm:min-h-auto ${themeSettings.mode === 'system'
              ? 'border-purple-600 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
              }`}
          >
            <Monitor className="h-5 sm:h-6 w-5 sm:w-6 mx-auto mb-1 sm:mb-2 text-gray-500" />
            <div className="text-xs sm:text-sm font-medium text-gray-900">System</div>
            <div className="text-xs text-gray-600 hidden sm:block">Auto detect</div>
          </button>
        </div>
      </div>

      {/* Color Scheme */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Primary Color Scheme</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => handleChange('colorScheme', scheme.id)}
              className={`p-2 sm:p-4 rounded-lg border-2 transition-all min-h-[80px] sm:min-h-auto ${themeSettings.colorScheme === scheme.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
                }`}
            >
              <div
                className="w-8 sm:w-12 h-8 sm:h-12 rounded-full mx-auto mb-1 sm:mb-2"
                style={{ backgroundColor: scheme.color }}
              />
              <div className="text-xs font-medium text-gray-900 truncate">{scheme.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Scale */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Font Size</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {['compact', 'comfortable', 'spacious'].map((size) => (
            <button
              key={size}
              onClick={() => handleChange('fontScale', size)}
              className={`p-2 sm:p-4 rounded-lg border-2 transition-all min-h-[80px] sm:min-h-auto ${themeSettings.fontScale === size
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
                }`}
            >
              <div className="text-xs sm:text-sm font-medium text-gray-900 capitalize">{size}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Border Radius</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {['none', 'small', 'medium', 'large'].map((radius) => (
            <button
              key={radius}
              onClick={() => handleChange('borderRadius', radius)}
              className={`p-2 sm:p-4 border-2 transition-all min-h-[80px] sm:min-h-auto ${themeSettings.borderRadius === radius
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
                }`}
              style={{
                borderRadius:
                  radius === 'none' ? '0' :
                    radius === 'small' ? '4px' :
                      radius === 'medium' ? '8px' : '16px'
              }}
            >
              <div className="text-xs sm:text-sm font-medium text-gray-900 capitalize">{radius}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Animation Level */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Animation Level</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {['none', 'reduced', 'normal', 'enhanced'].map((level) => (
            <button
              key={level}
              onClick={() => handleChange('animationLevel', level)}
              className={`p-2 sm:p-4 rounded-lg border-2 transition-all min-h-[80px] sm:min-h-auto ${themeSettings.animationLevel === level
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
                }`}
            >
              <div className="text-xs sm:text-sm font-medium text-gray-900 capitalize">{level}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Accessibility</h3>
        <div className="space-y-2 sm:space-y-4">
          <label className="flex items-center justify-between p-2 sm:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 active:bg-gray-200 gap-3 min-h-[44px] sm:min-h-auto">
            <div className="min-w-0">
              <div className="font-medium text-xs sm:text-sm text-gray-900">High Contrast</div>
              <div className="text-xs text-gray-600 hidden sm:block">Increase contrast for better visibility</div>
            </div>
            <input
              type="checkbox"
              checked={themeSettings.highContrast}
              onChange={(e) => handleChange('highContrast', e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0"
            />
          </label>
          <label className="flex items-center justify-between p-2 sm:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 active:bg-gray-200 gap-3 min-h-[44px] sm:min-h-auto">
            <div className="min-w-0">
              <div className="font-medium text-xs sm:text-sm text-gray-900">Reduced Motion</div>
              <div className="text-xs text-gray-600 hidden sm:block">Minimize animations and transitions</div>
            </div>
            <input
              type="checkbox"
              checked={themeSettings.reducedMotion}
              onChange={(e) => handleChange('reducedMotion', e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0"
            />
          </label>
        </div>
      </div>
    </div>
  );
};


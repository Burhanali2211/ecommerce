import React, { useState } from 'react';
import { Settings, Share2, Phone, Globe, Link as LinkIcon, Palette } from 'lucide-react';
import { SocialMediaList } from './SocialMediaList';
import { ContactInfoList } from './ContactInfoList';
import { SiteSettingsList } from './SiteSettingsList';
import { FooterLinksList } from './FooterLinksList';
import { ThemeSettingsList } from './ThemeSettingsList';

type TabType = 'site' | 'social' | 'contact' | 'footer' | 'theme';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'site',
    label: 'Site Settings',
    icon: <Settings className="h-5 w-5" />,
    description: 'General website configuration'
  },
  {
    id: 'theme',
    label: 'Theme',
    icon: <Palette className="h-5 w-5" />,
    description: 'Customize appearance'
  },
  {
    id: 'social',
    label: 'Social Media',
    icon: <Share2 className="h-5 w-5" />,
    description: 'Manage social media accounts'
  },
  {
    id: 'contact',
    label: 'Contact Info',
    icon: <Phone className="h-5 w-5" />,
    description: 'Business contact details'
  },
  {
    id: 'footer',
    label: 'Footer Links',
    icon: <LinkIcon className="h-5 w-5" />,
    description: 'Manage footer navigation'
  }
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('site');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'site':
        return <SiteSettingsList />;
      case 'theme':
        return <ThemeSettingsList />;
      case 'social':
        return <SocialMediaList />;
      case 'contact':
        return <ContactInfoList />;
      case 'footer':
        return <FooterLinksList />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Website Settings</h1>
            <p className="text-xs sm:text-sm text-gray-600">Manage your website configuration and content</p>
          </div>
        </div>
      </div>

      {/* Tabs - Improved Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Tab Headers - Scrollable on mobile */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex min-w-min sm:min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b-2 transition-all duration-200 whitespace-nowrap text-xs sm:text-sm min-h-[60px] sm:min-h-[72px] min-w-[80px] sm:min-w-0 ${activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-600 hover:text-purple-600 hover:bg-white/50 active:bg-white'
                    }`}
                >
                  <div className={`flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>
                    {tab.icon}
                  </div>
                  <div className="text-center sm:text-left">
                    <div className={`font-medium ${activeTab === tab.id ? 'font-semibold' : ''}`}>
                      {tab.label}
                    </div>
                    <div className="text-xs opacity-75 hidden lg:block">
                      {tab.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content with animation */}
        <div className="p-4 sm:p-6 animate-fadeIn">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};


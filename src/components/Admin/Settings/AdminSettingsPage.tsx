import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Settings, Globe, Palette, Share2, Phone, Link2, Shield,
  ChevronRight, Sparkles
} from 'lucide-react';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';
import { SiteSettingsList } from './SiteSettingsList';
import { ThemeSettings } from './ThemeSettings';
import { SocialMediaSettings } from './SocialMediaSettings';
import { ContactInfoSettings } from './ContactInfoSettings';
import { FooterLinksSettings } from './FooterLinksSettings';
import { PolicyPagesManager } from './PolicyPagesManager';
import { AdminDashboardSettings } from './AdminDashboardSettings';

const settingsNav = [
  { name: 'Site Settings', path: '/admin/settings/site', icon: Globe, description: 'General site configuration' },
  { name: 'Theme', path: '/admin/settings/theme', icon: Palette, description: 'Customize appearance' },
  { name: 'Dashboard', path: '/admin/settings/dashboard', icon: Sparkles, description: 'Admin dashboard customization' },
  { name: 'Social Media', path: '/admin/settings/social-media', icon: Share2, description: 'Social media links' },
  { name: 'Contact Info', path: '/admin/settings/contact', icon: Phone, description: 'Contact information' },
  { name: 'Footer Links', path: '/admin/settings/footer-links', icon: Link2, description: 'Footer navigation' },
  { name: 'Policy Pages', path: '/admin/settings/policy-pages', icon: Shield, description: 'Razorpay compliance pages' }
];

const SettingsOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsNav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-amber-400" />
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-amber-400 transition-colors" />
            </div>
            <h3 className="text-white font-semibold mt-4">{item.name}</h3>
            <p className="text-white/50 text-sm mt-1">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export const AdminSettingsPage: React.FC = () => {
  const location = useLocation();
  const isOverview = location.pathname === '/admin/settings' || location.pathname === '/admin/settings/';
  
  return (
    <AdminDashboardLayout 
      title="Settings" 
      subtitle={isOverview ? 'Configure your store settings' : undefined}
    >
      <Routes>
        <Route index element={<SettingsOverview />} />
        <Route path="site" element={<SiteSettingsList />} />
        <Route path="theme" element={<ThemeSettings />} />
        <Route path="dashboard" element={<AdminDashboardSettings />} />
        <Route path="social-media" element={<SocialMediaSettings />} />
        <Route path="contact" element={<ContactInfoSettings />} />
        <Route path="footer-links" element={<FooterLinksSettings />} />
        <Route path="policy-pages" element={<PolicyPagesManager />} />
      </Routes>
    </AdminDashboardLayout>
  );
};

export default AdminSettingsPage;


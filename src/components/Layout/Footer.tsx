import React from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
  ShieldCheck,
  Truck,
  CreditCard,
  Award,
  ArrowUpRight,
  Globe,
  Zap
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { motion } from 'framer-motion';
import { SiteLogo } from '../Common/SiteLogo';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const {
    getSiteSetting,
    settings: { footerLinks, socialMedia, contactInfo }
  } = useSettings();

  const siteName = getSiteSetting('site_name') || 'ZenMart';
  const copyrightText = getSiteSetting('copyright_text');

  const groupedFooterLinks = footerLinks.reduce((acc, link) => {
    if (!acc[link.section_name]) acc[link.section_name] = [];
    acc[link.section_name].push(link);
    return acc;
  }, {} as Record<string, typeof footerLinks>);

  const emailContact = contactInfo.find(c => c.contact_type === 'email' && c.is_primary);
  const phoneContact = contactInfo.find(c => c.contact_type === 'phone' && c.is_primary);
  const addressContact = contactInfo.find(c => c.contact_type === 'address' && c.is_primary);

  const trustSignals = [
    { icon: Truck, title: 'Fast Delivery', desc: 'Free over ₹999' },
    { icon: ShieldCheck, title: 'Authentic', desc: '100% Guaranteed' },
    { icon: CreditCard, title: 'Secure Pay', desc: 'Encrypted txn' },
    { icon: Award, title: 'Premium', desc: 'Quality Check' },
  ];

  return (
    <footer className="bg-white border-t border-gray-100 overflow-hidden">
      {/* Trust Signals Bar */}
      <div className="bg-gray-50/50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trustSignals.map((signal, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-purple-600">
                  <signal.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">{signal.title}</h4>
                  <p className="text-xs text-gray-400 font-medium">{signal.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16">
          {/* Brand & Newsletter Section */}
          <div className="lg:col-span-4 space-y-10">
            <Link to="/" className="inline-flex items-center gap-4 group">
              <SiteLogo size="xl" variant="dark" className="group-hover:scale-105 transition-transform duration-300 shadow-2xl" />
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
                  {siteName}<span className="text-purple-600">.</span>
                </h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">From Kashmir with Love</p>
              </div>
            </Link>

              <p className="text-gray-500 leading-relaxed max-w-sm font-medium">
                Premium Kashmiri spices, saffron, dry fruits and more - direct from Kashmir to your doorstep. Serving customers across India and internationally.
              </p>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Newsletter</h4>
              <div className="relative group max-w-sm">
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all font-medium"
                />
                <button className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white hover:bg-purple-600 transition-colors shadow-lg">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-medium italic">Join 10k+ subscribers for exclusive drops.</p>
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-12">
            {Object.entries(groupedFooterLinks).map(([sectionName, links], idx) => (
              <motion.div 
                key={sectionName}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-8">{sectionName}</h4>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.id}>
                      <Link
                        to={link.link_url}
                        className="text-gray-400 hover:text-purple-600 text-sm font-bold transition-colors inline-flex items-center gap-2 group/link"
                      >
                        <span className="group-hover/link:translate-x-1 transition-transform duration-300">{link.link_text}</span>
                        {link.opens_new_tab && <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-all" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {/* Support/Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="col-span-2 sm:col-span-1"
            >
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-8">Get In Touch</h4>
              <ul className="space-y-6">
                {emailContact && (
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><Mail className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Support</p>
                      <a href={`mailto:${emailContact.value}`} className="text-sm font-bold text-gray-900 hover:text-purple-600 transition-colors">{emailContact.value}</a>
                    </div>
                  </li>
                )}
                {phoneContact && (
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><Phone className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Call Us</p>
                      <a href={`tel:${phoneContact.value}`} className="text-sm font-bold text-gray-900 hover:text-purple-600 transition-colors">{phoneContact.value}</a>
                    </div>
                  </li>
                )}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Social & Bottom Bar */}
      <div className="bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            {/* Socials */}
            <div className="flex gap-4">
              {socialMedia.filter(s => s.is_active).map((social, index) => {
                const Icon = 
                  social.platform === 'facebook' ? Facebook :
                  social.platform === 'instagram' ? Instagram :
                  social.platform === 'twitter' ? Twitter :
                  social.platform === 'youtube' ? Youtube : Globe;

                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            {/* Copyright & Links */}
            <div className="text-center md:text-right space-y-4">
              <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">
                {copyrightText || `© ${currentYear} ${siteName} Global.`}
              </p>
              <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-2">
                {['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Shipping Policy'].map((text, i) => (
                  <Link 
                    key={i} 
                    to={`/${text.toLowerCase().replace(/ /g, '-')}`} 
                    className="text-[10px] font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    {text}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

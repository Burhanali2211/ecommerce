import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Heart, LogOut, Settings, Package, ChevronDown, Sparkles, MapPin, Globe, Headphones, Smartphone, Laptop, Shirt, Home as HomeIcon, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { SearchOverlay } from './SearchOverlay';
import { useSettings } from '../../contexts/SettingsContext';
import { useProducts } from '../../contexts/ProductContext';

import MobileNavigation from './MobileNavigation';
import { SiteLogo } from '../Common/SiteLogo';

interface HeaderProps {
  onAuthClick: () => void;
  onCartClick: () => void;
}

interface DropdownItem {
  name: string;
  href: string;
}

interface NavigationItem {
  name: string;
  href: string;
  hasDropdown?: boolean;
  dropdownItems?: DropdownItem[];
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick, onCartClick }) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { getSiteSetting } = useSettings();
  const { categories } = useProducts();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const categoriesDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const siteName = getSiteSetting('site_name');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}${selectedCategory !== 'All' ? `&category=${selectedCategory}` : ''}`);
      setSearchQuery('');
    }
  };

  // Use real categories from the database
    const navigationItems: NavigationItem[] = useMemo(() => {
      const items: NavigationItem[] = [
        { name: 'Home', href: '/' },
        {
          name: 'Shop',
          href: '/products',
          hasDropdown: categories.length > 0,
          dropdownItems: categories.length > 0 ? categories
            .filter(category => category.isActive !== false) // Only show active categories
            .map(category => ({
              name: category.name,
              href: `/products?category=${category.slug || category.id}`
            })) : undefined
        },
        { name: 'New Arrivals', href: '/new-arrivals' },
        { name: 'Offers', href: '/deals' },
        { name: 'About', href: '/about' },
      ];
      return items;
    }, [categories]);

  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  // Detect scroll position for floating header background
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }

    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change and escape key
  useEffect(() => {
    if (isUserMenuOpen) setIsUserMenuOpen(false);
    if (isCategoriesOpen) setIsCategoriesOpen(false);

    if (isSearchOpen) setIsSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsCategoriesOpen(false);

        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Check if we're on homepage to determine initial transparency
  const isHomePage = location.pathname === '/';
  
return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out bg-[#5C2E0C] shadow-lg">
          {/* Layer 1: Utility Bar - Hidden when scrolled */}
          <div aria-hidden={isScrolled} className={`bg-[#4A2409] text-white text-xs py-1 hidden md:block transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-0 py-0 opacity-0' : 'max-h-12 opacity-100'}`}>
              <div className="max-w-[1600px] mx-auto px-4 flex justify-between items-center font-medium">
                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-1.5 hover:text-amber-300 transition-colors">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Ship Worldwide from Kashmir</span>
                    </button>
                  <div className="h-3 w-[1px] bg-white/20" />
                  <div className="flex items-center space-x-4">
                    <Link to="/about" className="hover:text-amber-300">About Us</Link>
                    <Link to="/contact" className="hover:text-amber-300">Customer Service</Link>
                    <Link to="/deals" className="hover:text-amber-300 font-bold text-amber-400">Special Offers</Link>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-1 hover:text-amber-300">
                    <Globe className="h-3.5 w-3.5" />
                    <span>EN</span>
                  </button>
                  <Link to="/sell" className="hover:text-amber-300">Bulk Orders</Link>
                </div>
              </div>
          </div>

          {/* Layer 2: Main Search Bar Area - Always visible, compact when scrolled */}
          <div className={`transition-all duration-300 bg-[#5C2E0C] ${isScrolled ? 'py-1' : 'py-1.5'}`}>
            <div className="max-w-[1600px] mx-auto px-4 flex items-center gap-3 lg:gap-6 w-full">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-1.5 flex-shrink-0 group" onClick={() => window.scrollTo(0, 0)}>
                <SiteLogo size={isScrolled ? 'sm' : 'md'} />
                {siteName && (
                  <span className={`font-black tracking-tighter transition-all duration-300 text-white ${isScrolled ? 'text-base' : 'text-lg'}`}>
                    {siteName.split(' ').slice(0, 2).join(' ')}<span className="text-amber-400 font-normal">.</span>
                  </span>
                )}
              </Link>

              {/* Desktop Persistent Search Bar */}
              <div className="hidden md:flex flex-1 max-w-2xl">
                <form onSubmit={handleSearchSubmit} className="flex w-full group">
                  <div className="relative">
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className={`px-2 bg-amber-50 border-r border-amber-200 rounded-l-md text-xs font-medium text-gray-700 focus:outline-none hover:bg-amber-100 cursor-pointer appearance-none pr-7 transition-all duration-300 ${isScrolled ? 'h-8' : 'h-9'}`}
                    >
                      <option>All</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search spices, herbs, teas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`flex-1 px-3 text-sm bg-white border-none focus:ring-2 focus:ring-inset focus:ring-amber-500 outline-none text-gray-900 transition-all duration-300 ${isScrolled ? 'h-8' : 'h-9'}`}
                  />
                  <button 
                    type="submit"
                    className={`px-4 bg-amber-500 hover:bg-amber-600 rounded-r-md flex items-center justify-center transition-all duration-300 group-hover:shadow-md ${isScrolled ? 'h-8' : 'h-9'}`}
                  >
                    <Search className={`text-white transition-all duration-300 ${isScrolled ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  </button>
                </form>
              </div>

            {/* Action Bar - Right Aligned */}
            <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
              {/* Account Dropdown */}
              <div className="relative group" ref={userMenuRef}>
                <button
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                  aria-label={user ? `Account menu for ${user.name}` : 'Sign in'}
                  onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : navigate('/auth')}
                  className={`flex items-center gap-2 px-2 py-1 rounded hover:ring-1 hover:ring-white/20 transition-all text-white ${isScrolled ? 'scale-90' : ''}`}
                >
                  <User className="h-5 w-5" />
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="text-[9px] leading-tight font-medium opacity-80">Hello, {user?.name ? user.name.split(' ')[0] : 'sign in'}</span>
                    <div className="flex items-center space-x-0.5">
                      <span className="text-xs font-bold leading-tight">Account</span>
                      <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                    </div>
                  </div>
                </button>
                {isUserMenuOpen && user && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded shadow-2xl z-[60] py-4 text-gray-900">
                    <div className="px-4 pb-4 border-b border-gray-100">
                      <p className="font-bold text-sm">Your Account</p>
                      <div className="mt-2 space-y-2">
                        <Link to="/dashboard" className="block text-xs hover:text-purple-600 hover:underline">Manage Profile</Link>
                        <Link to="/orders" className="block text-xs hover:text-purple-600 hover:underline">Track Orders</Link>
                      </div>
                    </div>
                    <div className="px-4 pt-4">
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full text-center py-2 bg-gradient-to-b from-amber-300 to-amber-400 rounded text-xs font-medium shadow-sm active:from-amber-400 active:to-amber-500"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Returns & Orders */}
              <Link to="/orders" className={`hidden lg:flex flex-col items-start px-1.5 py-0.5 rounded hover:ring-1 hover:ring-white/20 transition-all text-white ${isScrolled ? 'scale-90' : ''}`}>
                <span className="text-[9px] leading-tight font-medium opacity-80">Returns</span>
                <span className="text-xs font-bold leading-tight">& Orders</span>
              </Link>

              {/* Cart */}
              <button
                onClick={onCartClick}
                aria-label="Open cart"
                className={`flex items-end space-x-0.5 px-2 py-1 rounded hover:ring-1 hover:ring-white/20 transition-all text-white relative group ${isScrolled ? 'scale-90' : ''}`}
              >
                <div className="relative">
                  <ShoppingCart className={`transition-all duration-300 ${isScrolled ? 'h-5 w-5' : 'h-6 w-6'}`} />
                  {itemCount > 0 && (
                    <span className={`absolute -top-1 left-1/2 -translate-x-1/2 bg-amber-500 text-[#131921] font-black flex items-center justify-center rounded-full ring-2 ring-[#131921] transition-all duration-300 ${isScrolled ? 'text-[8px] min-w-[14px] h-[14px]' : 'text-[9px] min-w-[16px] h-[16px]'}`}>
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold mb-0.5 hidden sm:block">Cart</span>
              </button>

              {/* Mobile Search + Menu Toggle */}
              <div className="flex items-center md:hidden">
                <button
                  aria-label="Open search"
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg mr-1"
                >
                  <Search className="h-5 w-5" />
                </button>
                <button
                  aria-label="Open menu"
                  onClick={() => setIsMenuOpen(true)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* Layer 3: Category/Mega Bar - Hidden when scrolled */}
          <div className={`bg-[#4A2409] text-white py-0.5 hidden md:block border-t border-white/5 transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-0 py-0 opacity-0' : 'max-h-12 opacity-100'}`}>
            <div className="max-w-[1600px] mx-auto px-4 flex items-center space-x-4 text-xs font-medium">
              <button 
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="flex items-center space-x-1 hover:ring-1 hover:ring-white/20 px-1.5 py-0.5 rounded"
              >
                <Menu className="h-4 w-4" />
                <span className="font-bold">All</span>
              </button>
              
              <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar">
                {navigationItems.slice(1).map((item) => (
                  <Link 
                    key={item.name} 
                    to={item.href} 
                    className={`hover:ring-1 hover:ring-white/20 px-1.5 py-0.5 rounded transition-all whitespace-nowrap ${
                      isActiveLink(item.href) ? 'text-amber-400 ring-1 ring-amber-400/30' : ''
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="ml-auto flex items-center space-x-4">
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-amber-400 animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  <span>Free Shipping on Orders Over ₹999!</span>
                </div>
              </div>
            </div>
          </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onCartClick={onCartClick}
      />

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Heart, LogOut, ChevronDown, X } from 'lucide-react';
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
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const shopDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const siteName = getSiteSetting('site_name') || 'Himalayan Spices';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchExpanded(false);
    }
  };

  const navigationItems: NavigationItem[] = useMemo(() => {
    const items: NavigationItem[] = [
      { name: 'Home', href: '/' },
      {
        name: 'Shop',
        href: '/products',
        hasDropdown: categories.length > 0,
        dropdownItems: categories.length > 0 ? categories
          .filter(category => category.isActive !== false)
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
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(event.target as Node)) {
        setIsShopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsShopDropdownOpen(false);
    setIsSearchExpanded(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsShopDropdownOpen(false);
        setIsSearchExpanded(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Main Header Row */}
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left: Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0 group"
              onClick={() => window.scrollTo(0, 0)}
            >
              <SiteLogo size="md" />
              <span className="font-semibold text-base sm:text-lg text-gray-900 tracking-tight">
                {siteName.split(' ').slice(0, 2).join(' ')}
              </span>
            </Link>

            {/* Center: Navigation (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => (
                <div key={item.name} className="relative" ref={item.hasDropdown ? shopDropdownRef : undefined}>
                  {item.hasDropdown ? (
                    <>
                      <button
                        onClick={() => setIsShopDropdownOpen(!isShopDropdownOpen)}
                        className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                          isActiveLink(item.href)
                            ? 'text-amber-700 bg-amber-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {item.name}
                        <ChevronDown className={`h-4 w-4 transition-transform ${isShopDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Shop Dropdown */}
                      {isShopDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                          <Link
                            to={item.href}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                            onClick={() => setIsShopDropdownOpen(false)}
                          >
                            All Products
                          </Link>
                          {item.dropdownItems?.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.name}
                              to={dropdownItem.href}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                              onClick={() => setIsShopDropdownOpen(false)}
                            >
                              {dropdownItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                        isActiveLink(item.href)
                          ? 'text-amber-700 bg-amber-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Desktop Search */}
              <div className="hidden md:flex items-center">
                {isSearchExpanded ? (
                  <form onSubmit={handleSearchSubmit} className="flex items-center">
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 pl-4 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchExpanded(false);
                          setSearchQuery('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsSearchExpanded(true)}
                    className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all hidden sm:flex"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : navigate('/auth')}
                  className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all hidden sm:flex"
                  aria-label={user ? 'Account menu' : 'Sign in'}
                >
                  <User className="h-5 w-5" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && user && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-3 z-50">
                    <div className="px-4 pb-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        My Orders
                      </Link>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={onCartClick}
                className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile: Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all md:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Mobile: Menu Button */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all lg:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Announcement Bar - Shows only when not scrolled */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isScrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'
            }`}
          >
            <div className="bg-amber-50 border-t border-amber-100">
              <p className="text-center text-xs sm:text-sm py-2 px-4 text-amber-800 font-medium">
                Free shipping on orders over ₹999 | Use code <span className="font-bold">SPICE10</span> for 10% off
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNavigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onCartClick={onCartClick}
      />

      {/* Mobile Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;

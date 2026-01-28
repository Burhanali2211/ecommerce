import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, Home, ShoppingBag, Sparkles, Tag, Info, User, ShoppingCart, Heart, 
  ChevronRight, LogOut, Package, Crown, Gift, Phone, Mail,
  Instagram, Facebook, Twitter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useSwipeGesture } from '../../hooks/useMobileGestures';
import { SiteLogo } from '../Common/SiteLogo';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onCartClick: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  hasDropdown?: boolean;
  dropdownItems?: {
    name: string;
    href: string;
  }[];
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  onCartClick
}) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navigationItems: NavigationItem[] = [
    { 
      name: 'Home', 
      href: '/', 
      icon: <Home className="h-5 w-5" />
    },
    {
      name: 'Shop All',
      href: '/products',
      icon: <ShoppingBag className="h-5 w-5" />,
      hasDropdown: true,
      dropdownItems: [
        { name: 'All Products', href: '/products' },
        { name: 'Oudh Attars', href: '/categories/oudh-attars' },
        { name: 'Floral Attars', href: '/categories/floral-attars' },
        { name: 'Musk Attars', href: '/categories/musk-attars' },
        { name: 'Amber Attars', href: '/categories/amber-attars' },
        { name: 'Sandalwood Attars', href: '/categories/sandalwood-attars' },
      ]
    },
    { 
      name: 'New Arrivals', 
      href: '/new-arrivals', 
      icon: <Sparkles className="h-5 w-5" />,
      badge: 'NEW',
      badgeColor: 'bg-emerald-500'
    },
    { 
      name: 'Special Offers', 
      href: '/deals', 
      icon: <Tag className="h-5 w-5" />,
      badge: 'SALE',
      badgeColor: 'bg-red-500'
    },
    { 
      name: 'About Us', 
      href: '/about', 
      icon: <Info className="h-5 w-5" />
    },
  ];

  const { bindGestures } = useSwipeGesture({
    onSwipeLeft: () => onClose(),
  });

  useEffect(() => {
    onClose();
    setActiveDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    if (navRef.current && isOpen) {
      bindGestures(navRef.current);
    }
  }, [isOpen, bindGestures]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  const toggleDropdown = (itemName: string) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden"
          onClick={onClose}
          aria-label="Close navigation menu"
        />
      )}

      <div
        ref={navRef}
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-[320px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out md:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5C2E0C] to-[#8B4513] px-5 py-4 flex items-center justify-between">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <SiteLogo size="sm" />
            <span className="text-white font-bold text-lg tracking-tight">
              Attar<span className="text-amber-300">.</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="px-5 py-4 bg-gradient-to-b from-amber-50 to-white border-b border-amber-100">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}&backgroundColor=f59e0b`}
                  alt={user.name}
                  className="h-14 w-14 rounded-full border-2 border-amber-400 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-amber-700 font-medium">{user.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Gift className="h-3 w-3 text-amber-600" />
                  <span className="text-[10px] text-amber-600 font-semibold">Premium Member</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <User className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Welcome!</p>
                <button
                  onClick={() => {
                    navigate('/auth');
                    onClose();
                  }}
                  className="mt-1 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  Sign In / Register
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                onCartClick();
                onClose();
              }}
              className="flex flex-col items-center justify-center p-3 bg-gradient-to-b from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50 hover:shadow-md transition-all group"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-amber-700 group-hover:scale-110 transition-transform" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-gray-700 mt-1.5">Cart</span>
            </button>

            <Link
              to="/wishlist"
              onClick={onClose}
              className="flex flex-col items-center justify-center p-3 bg-gradient-to-b from-pink-50 to-pink-100/50 rounded-xl border border-pink-200/50 hover:shadow-md transition-all group"
            >
              <div className="relative">
                <Heart className="h-6 w-6 text-pink-600 group-hover:scale-110 transition-transform" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-gray-700 mt-1.5">Wishlist</span>
            </Link>

            <Link
              to="/orders"
              onClick={onClose}
              className="flex flex-col items-center justify-center p-3 bg-gradient-to-b from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 hover:shadow-md transition-all group"
            >
              <Package className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-gray-700 mt-1.5">Orders</span>
            </Link>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto">
          <nav className="py-2">
            <p className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Browse
            </p>
            
            {navigationItems.map((item) => (
              <div key={item.name}>
                {item.hasDropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 transition-all ${
                        isActiveLink(item.href)
                          ? 'bg-amber-50 border-l-4 border-amber-500'
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`${isActiveLink(item.href) ? 'text-amber-600' : 'text-gray-500'}`}>
                          {item.icon}
                        </span>
                        <span className={`font-semibold ${isActiveLink(item.href) ? 'text-amber-700' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className={`${item.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                          activeDropdown === item.name ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    <div
                      className={`bg-gray-50 overflow-hidden transition-all duration-200 ${
                        activeDropdown === item.name ? 'max-h-96' : 'max-h-0'
                      }`}
                    >
                      {item.dropdownItems?.map((dropdownItem, index) => (
                        <Link
                          key={`${item.name}-${index}`}
                          to={dropdownItem.href}
                          onClick={onClose}
                          className={`block pl-14 pr-5 py-3 text-sm border-l-4 transition-all ${
                            isActiveLink(dropdownItem.href)
                              ? 'text-amber-700 bg-amber-50 border-amber-400 font-semibold'
                              : 'text-gray-600 hover:bg-gray-100 border-transparent hover:text-gray-900'
                          }`}
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-5 py-3.5 transition-all ${
                      isActiveLink(item.href)
                        ? 'bg-amber-50 border-l-4 border-amber-500'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <span className={`${isActiveLink(item.href) ? 'text-amber-600' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>
                    <span className={`font-semibold ${isActiveLink(item.href) ? 'text-amber-700' : 'text-gray-800'}`}>
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className={`${item.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}

            {user && (
              <>
                <div className="my-2 mx-5 border-t border-gray-100" />
                <p className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  My Account
                </p>
                
                <Link
                  to="/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 border-l-4 border-transparent transition-all"
                >
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="font-semibold text-gray-800">My Profile</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-50 border-l-4 border-transparent transition-all text-left"
                >
                  <LogOut className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-red-600">Sign Out</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="h-3.5 w-3.5" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Mail className="h-3.5 w-3.5" />
              <span>help@attar.com</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <a href="#" className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all">
              <Instagram className="h-4 w-4 text-pink-600" />
            </a>
            <a href="#" className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all">
              <Facebook className="h-4 w-4 text-blue-600" />
            </a>
            <a href="#" className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all">
              <Twitter className="h-4 w-4 text-sky-500" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, ChevronDown, LogOut, Leaf } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useProducts } from '../../contexts/ProductContext';
import { SearchOverlay } from './SearchOverlay';

interface HeaderProps {
  onAuthClick: () => void;
  onCartClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick, onCartClick }) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { categories } = useProducts();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const shopDropdownRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsShopDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(e.target as Node)) setIsShopDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 4);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const categoryItems = useMemo(() => categories.filter(c => c.isActive !== false), [categories]);
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${isScrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>

        {/* ROW 1: Logo · Search · Icons */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center gap-3 h-14">

          {/* Logo wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0"
            onClick={() => window.scrollTo(0, 0)}
          >
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <span className="block text-[13px] font-black text-gray-900 tracking-tight">Aligarh</span>
              <span className="block text-[10px] font-semibold text-gray-400 tracking-widest uppercase">Attars</span>
            </div>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 mx-4">
            <div className="relative flex w-full max-w-xl">
              <input
                type="text"
                placeholder="Search spices, herbs, teas, gifts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-gray-300 transition-all placeholder-gray-400"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-3.5 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Action icons */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Wishlist — desktop only */}
            <Link
              to="/wishlist"
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all hidden sm:flex"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-gray-900 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                  {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                </span>
              )}
            </Link>

            {/* User — desktop only */}
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : navigate('/auth')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                aria-label={user ? 'My account' : 'Sign in'}
              >
                <User className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                <span className="text-xs font-medium hidden lg:block">
                  {user ? (user.name?.split(' ')[0] || 'Account') : 'Sign in'}
                </span>
              </button>

              {isUserMenuOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 pb-2 mb-1 border-b border-gray-100">
                    <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900" onClick={() => setIsUserMenuOpen(false)}>
                    <User className="h-4 w-4" /> My Profile
                  </Link>
                  <Link to="/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900" onClick={() => setIsUserMenuOpen(false)}>
                    <ShoppingCart className="h-4 w-4" /> My Orders
                  </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-gray-900 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE ROW 2: Search bar */}
        <div className="md:hidden px-4 pb-2.5">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex">
              <input
                type="text"
                placeholder="Search spices, herbs, teas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-gray-300 transition-all placeholder-gray-400"
              />
              <button type="submit" className="absolute right-0 top-0 bottom-0 px-3.5 text-gray-500 hover:text-gray-800 transition-colors">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* DESKTOP ROW 2: Nav bar */}
        <div className="hidden md:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex items-center h-9 gap-1 text-sm">
              <Link to="/" className={`px-3 h-full flex items-center font-medium border-b-2 transition-colors ${isActive('/') ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'}`}>
                Home
              </Link>
              <div className="relative h-full flex items-center" ref={shopDropdownRef}>
                <button
                  onClick={() => setIsShopDropdownOpen(!isShopDropdownOpen)}
                  className={`flex items-center gap-1 px-3 h-full font-medium border-b-2 transition-colors ${isActive('/products') ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'}`}
                >
                  Shop <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isShopDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isShopDropdownOpen && (
                  <div className="absolute top-full left-0 w-52 bg-white shadow-xl border border-gray-100 rounded-xl py-2 z-50 mt-0.5">
                    <Link to="/products" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium" onClick={() => setIsShopDropdownOpen(false)}>All Products</Link>
                    <div className="border-t border-gray-100 my-1" />
                    {categoryItems.slice(0, 8).map(cat => (
                      <Link key={cat.id} to={`/products?category=${cat.slug || cat.id}`} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900" onClick={() => setIsShopDropdownOpen(false)}>
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link to="/new-arrivals" className={`px-3 h-full flex items-center font-medium border-b-2 transition-colors ${isActive('/new-arrivals') ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'}`}>
                New Arrivals
              </Link>
              <Link to="/deals" className={`px-3 h-full flex items-center font-medium border-b-2 transition-colors ${isActive('/deals') ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'}`}>
                Deals
              </Link>
              <Link to="/about" className={`px-3 h-full flex items-center font-medium border-b-2 transition-colors ${isActive('/about') ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'}`}>
                About
              </Link>
            </nav>
          </div>
        </div>

      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;

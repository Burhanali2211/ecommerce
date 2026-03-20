import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, ShoppingCart, Heart, User } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';

interface BottomNavProps {
  onCartClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = memo(({ onCartClick }) => {
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Home */}
      <Link
        to="/"
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors ${
          isActive('/') ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
        }`}
        aria-label="Home"
      >
        <Home className={`h-5 w-5 ${isActive('/') ? 'fill-gray-900 stroke-gray-900' : ''}`} />
        <span className="text-[10px] font-medium leading-none">Home</span>
      </Link>

      {/* Shop */}
      <Link
        to="/products"
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors ${
          isActive('/products') ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
        }`}
        aria-label="Shop"
      >
        <Grid3X3 className={`h-5 w-5 ${isActive('/products') ? 'fill-gray-900 stroke-gray-900' : ''}`} />
        <span className="text-[10px] font-medium leading-none">Shop</span>
      </Link>

      {/* Cart — elevated center button */}
      <div className="flex-1 flex items-center justify-center relative">
        <button
          onClick={onCartClick}
          aria-label="Cart"
          className="relative -mt-5 w-14 h-14 bg-gray-900 hover:bg-gray-800 active:bg-black text-white rounded-full flex items-center justify-center shadow-lg shadow-gray-300 transition-colors"
        >
          <ShoppingCart className="h-6 w-6" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Wishlist */}
      <Link
        to="/wishlist"
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors ${
          isActive('/wishlist') ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
        }`}
        aria-label="Wishlist"
      >
        <div className="relative">
          <Heart className={`h-5 w-5 ${isActive('/wishlist') ? 'fill-gray-900 stroke-gray-900' : ''}`} />
          {wishlistItems.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
              {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium leading-none">Wishlist</span>
      </Link>

      {/* Account */}
      <Link
        to={user ? '/dashboard' : '/auth'}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors ${
          isActive('/dashboard') || isActive('/auth') ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
        }`}
        aria-label={user ? 'My account' : 'Sign in'}
      >
        <User className={`h-5 w-5 ${(isActive('/dashboard') || isActive('/auth')) ? 'fill-gray-900 stroke-gray-900' : ''}`} />
        <span className="text-[10px] font-medium leading-none truncate max-w-[52px]">
          {user ? (user.name?.split(' ')[0] || 'Account') : 'Sign in'}
        </span>
      </Link>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
export default BottomNav;

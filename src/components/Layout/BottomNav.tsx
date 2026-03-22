import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Store, ShoppingCart, Heart, User, LogIn } from 'lucide-react';
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

  const isHome = location.pathname === '/';

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const accountActive = isActive('/dashboard') || isActive('/auth');

  // Home page → Shop | Other pages → Cart (signed in) or Sign In (guest)
  const centerVariant: 'shop' | 'cart' | 'signin' =
    isHome ? 'shop' : user ? 'cart' : 'signin';

  const centerBtnClass =
    'relative -mt-6 w-[52px] h-[52px] bg-gray-900 text-white rounded-full flex flex-col items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.22)] active:scale-95 transition-transform duration-150 select-none flex-shrink-0';

  // Icon + label colour helpers — no fill prop (lucide icons are stroke-based; fill breaks them)
  const iconCls = (active: boolean) =>
    `h-[22px] w-[22px] transition-colors duration-150 ${active ? 'text-gray-900' : 'text-gray-400'}`;
  const labelCls = (active: boolean) =>
    `text-[9px] font-medium leading-none mt-0.5 transition-colors duration-150 ${active ? 'text-gray-900' : 'text-gray-400'}`;

  const tabCls =
    'flex-1 min-w-0 flex flex-col items-center justify-center gap-0 py-2 select-none';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 flex items-stretch h-[60px]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Bottom navigation"
    >

      {/* ── Home ── */}
      <Link to="/" aria-label="Home" className={tabCls}>
        <Home
          className={iconCls(isActive('/'))}
          strokeWidth={isActive('/') ? 2.5 : 1.8}
        />
        <span className={labelCls(isActive('/'))}>Home</span>
      </Link>

      {/* ── Categories ── */}
      <Link to="/categories" aria-label="Categories" className={tabCls}>
        <LayoutGrid
          className={iconCls(isActive('/categories'))}
          strokeWidth={isActive('/categories') ? 2.5 : 1.8}
        />
        <span className={labelCls(isActive('/categories'))}>Browse</span>
      </Link>

      {/* ── Center elevated button ── */}
      <div className="flex-1 flex items-center justify-center">

        {centerVariant === 'shop' && (
          <Link to="/products" aria-label="Shop" className={centerBtnClass}>
            <Store className="h-[22px] w-[22px]" strokeWidth={1.8} />
            <span className="text-[9px] font-semibold mt-0.5 leading-none">Shop</span>
          </Link>
        )}

        {centerVariant === 'cart' && (
          <button onClick={onCartClick} aria-label="Open cart" className={centerBtnClass}>
            <ShoppingCart className="h-[22px] w-[22px]" strokeWidth={1.8} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-[18px] w-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
            <span className="text-[9px] font-semibold mt-0.5 leading-none">Cart</span>
          </button>
        )}

        {centerVariant === 'signin' && (
          <Link to="/auth" aria-label="Sign in" className={centerBtnClass}>
            <LogIn className="h-[22px] w-[22px]" strokeWidth={1.8} />
            <span className="text-[9px] font-semibold mt-0.5 leading-none">Sign in</span>
          </Link>
        )}

      </div>

      {/* ── Wishlist ── */}
      <Link to="/wishlist" aria-label="Wishlist" className={tabCls}>
        <div className="relative">
          <Heart
            className={iconCls(isActive('/wishlist'))}
            strokeWidth={isActive('/wishlist') ? 2.5 : 1.8}
          />
          {wishlistItems.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-[15px] w-[15px] bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
              {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
            </span>
          )}
        </div>
        <span className={labelCls(isActive('/wishlist'))}>Wishlist</span>
      </Link>

      {/* ── Account ── */}
      <Link
        to={user ? '/dashboard' : '/auth'}
        aria-label={user ? 'My account' : 'Sign in'}
        className={tabCls}
      >
        <User
          className={iconCls(accountActive)}
          strokeWidth={accountActive ? 2.5 : 1.8}
        />
        <span className={`${labelCls(accountActive)} max-w-[42px] truncate`}>
          {user ? (user.name?.split(' ')[0] || 'Account') : 'Account'}
        </span>
      </Link>

    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
export default BottomNav;

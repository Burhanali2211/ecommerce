import React, { useMemo, useCallback, memo } from 'react';
import { Star, Heart, ShoppingCart, Check, Zap } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { Link } from 'react-router-dom';
import ProductImage from '../Common/ProductImage';
import { AddToCartButton } from './AddToCartButton';

interface ProductCardProps {
  product: Product;
  isListView?: boolean;
  onCompareToggle?: (id: string) => void;
  isComparing?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  isListView = false,
  onCompareToggle,
  isComparing = false
}) => {
  const { isInWishlist, addItem: addToWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();

  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlist(product);
  }, [addToWishlist, product]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  }, [addToCart, product]);

  const handleCompareClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCompareToggle) onCompareToggle(product.id);
  }, [onCompareToggle, product.id]);

  // Memoize derived category flags — no string ops on every render
  const { isTech, isFashion } = useMemo(() => {
    const catName = (product.categoryName || product.category || '').toLowerCase();
    return {
      isTech: catName.includes('electronics'),
      isFashion: catName.includes('fashion'),
    };
  }, [product.categoryName, product.category]);

  if (isListView) {
    return (
      <div className="group flex flex-row gap-3 sm:gap-6 p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-gray-100 hover:border-green-200 transition-all duration-300 shadow-sm hover:shadow-xl relative">
        {/* Image Section - Fixed width on all screens */}
        <div className="relative w-28 sm:w-40 md:w-52 lg:w-64 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
          <Link to={`/products/${product.id}`} className="block h-full">
            <ProductImage
              product={product}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 aspect-square"
              alt={product.name}
            />
          </Link>
        </div>
        
        {/* Content Section */}
        <div className="flex flex-col flex-1 min-w-0 justify-between py-0 sm:py-2">
          <div>
            {/* Category & Rating Row */}
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-green-50 text-green-800 truncate max-w-[80px] sm:max-w-none">
                {product.categoryName || product.category || 'Discovery'}
              </span>
              <div className="flex items-center text-amber-400 ml-auto flex-shrink-0">
                <Star className="h-3 sm:h-3.5 w-3 sm:w-3.5 fill-current" />
                <span className="text-xs sm:text-sm font-bold text-gray-700 ml-0.5 sm:ml-1">{product.rating || '4.5'}</span>
                <span className="text-[10px] sm:text-xs text-gray-400 ml-0.5 sm:ml-1 font-medium hidden sm:inline">(2.4k)</span>
              </div>
            </div>
            
            {/* Product Name */}
            <Link to={`/products/${product.id}`}>
              <h3 className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-green-800 transition-colors line-clamp-2 sm:line-clamp-1">
                {product.name}
              </h3>
            </Link>
            
            {/* Description - Hidden on very small screens */}
            <p className="hidden sm:block text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2 sm:mb-4 font-normal">
              {product.shortDescription || product.description}
            </p>
            
            {/* Trust Badges - Simplified on mobile */}
            <div className="hidden md:flex flex-wrap items-center gap-4 text-[11px] text-gray-500 font-medium">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-500" /> Free Returns</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Get it by <b>Tomorrow</b></span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-500" /> Cash on Delivery</span>
            </div>
          </div>

          {/* Price & Actions Row */}
          <div className="flex items-center justify-between mt-2 sm:mt-4 gap-2 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
              <span className="text-lg sm:text-2xl md:text-3xl font-black text-[#131921]">₹{product.price.toLocaleString('en-IN')}</span>
              {product.originalPrice && (
                <span className="text-[10px] sm:text-sm text-gray-400 line-through font-medium">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              )}
            </div>
            <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
              <button 
                onClick={handleWishlistToggle}
                className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all shrink-0 ${
                  isInWishlist(product.id) ? 'bg-red-50 text-red-500 border-red-100' : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100'
                }`}
              >
                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
              </button>
              <AddToCartButton 
                product={product} 
                className="h-7 sm:h-10 px-2.5 sm:px-4 text-[11px] sm:text-xs"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col h-full bg-white rounded-md sm:rounded-xl border border-gray-200 hover:border-green-400 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
      <Link to={`/products/${product.id}`} className="block relative aspect-[1/1] overflow-hidden bg-white">
        <ProductImage
          product={product}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
          alt={product.name}
        />

      </Link>

      <div className="p-2 sm:p-3.5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
            isTech ? 'bg-blue-50 text-blue-600' : isFashion ? 'bg-pink-50 text-pink-600' : 'bg-green-50 text-green-700'
          }`}>
            {product.categoryName || product.category || 'Essentials'}
          </span>
          <div className="flex items-center text-amber-400 ml-auto">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-[10px] font-black text-[#131921] ml-0.5">{product.rating || '4.5'}</span>
            <span className="text-[9px] text-gray-400 ml-0.5 font-bold">(124)</span>
          </div>
        </div>
        
        <Link to={`/products/${product.id}`} className="mb-1.5 sm:mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-2 text-xs sm:text-sm leading-tight hover:text-green-800 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span className="text-base sm:text-xl font-black text-[#131921]">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && (
              <span className="text-[11px] text-gray-400 line-through font-bold">₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
          
            <div className="flex items-center gap-1.5 sm:gap-2 pt-1 sm:pt-1.5 border-t border-gray-50">
               <AddToCartButton 
                 product={product} 
                 className="flex-1 min-w-0"
                 size="sm"
               />
               <button 
                 onClick={handleWishlistToggle}
                 className={`w-7 h-7 sm:w-8 sm:h-8 rounded border flex items-center justify-center transition-colors shrink-0 ${
                   isInWishlist(product.id) ? 'text-red-500 border-red-100 bg-red-50' : 'text-gray-400 border-gray-200 hover:text-red-500'
                 }`}
               >
                 <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
               </button>
            </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

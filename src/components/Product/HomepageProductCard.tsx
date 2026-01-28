import React, { useState } from 'react';
import { Star, Heart, ShoppingCart, Sparkles, Check } from 'lucide-react';
import { Product } from '../../types';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAddToCartWithAuth } from '../../hooks/useAddToCartWithAuth';
import { useAddToWishlistWithAuth } from '../../hooks/useAddToWishlistWithAuth';
import ProductImage from '../Common/ProductImage';
import { useCartButtonStyles } from '../../hooks/useCartButtonStyles';
import { useCartButtonState } from '../../hooks/useCartButtonState';
import { AddToCartButton } from './AddToCartButton';
import { MiniTrustIndicators, TrendingIndicator } from '../Trust';
import { Link } from 'react-router-dom';

interface HomepageProductCardProps {
  product: Product;
  index?: number;
}

/**
 * HomepageProductCard - Enhanced Premium Design for Homepage
 * Based on ProductCard from New Arrivals but with homepage-specific enhancements
 * Optimized for 2 cards per row on mobile devices
 */
export const HomepageProductCard: React.FC<HomepageProductCardProps> = ({ product, index = 0 }) => {
  const { isInWishlist } = useWishlist();
  const { handleAddToCart } = useAddToCartWithAuth();
  const { handleAddToWishlist } = useAddToWishlistWithAuth();
  const { cartButtonText, cartButtonStyle, cartButtonHoverStyle } = useCartButtonStyles();
  const { isInCart, justAdded, markAsJustAdded, buttonState } = useCartButtonState(product);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleAddToWishlist(product);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const getStockStatus = () => {
    if (product.stock === 0) return { text: 'Out of Stock', color: 'bg-red-500', textColor: 'text-red-600' };
    if (product.stock <= 5) return { text: 'Low Stock', color: 'bg-orange-500', textColor: 'text-orange-600' };
    return { text: 'In Stock', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const stockStatus = getStockStatus();

  return (
    <div
      className="product-card group flex flex-col bg-white shadow-md hover:shadow-xl transition-all duration-300 touch-manipulation h-full rounded-xl overflow-hidden border border-gray-100 hover:border-amber-200"
    >
      {/* Image Container - Enhanced for homepage */}
      <div className="relative overflow-hidden group/image bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
        <Link to={`/products/${product.id}`} className="block h-full">
          {/* Aspect ratio optimized for homepage - compact design */}
          <div className="aspect-[4/3] relative overflow-hidden">
            <ProductImage
              product={product}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              alt={product.name}
              size="medium"
            />

            {/* Image Navigation - Enhanced visibility */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                {product.images.map((_, index) => (
                  <button
                    key={`${product.id}-image-${index}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'bg-white shadow-lg scale-125'
                        : 'bg-white/70 hover:bg-white/90'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Enhanced Overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>

        {/* Discount Badge - Enhanced styling */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-lg text-xs px-2.5 py-1 rounded-md">
              {discount}% OFF
            </span>
          </div>
        )}

        {/* Featured Badge - Enhanced for homepage */}
        {product.featured && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 text-xs font-bold tracking-wide uppercase rounded-md shadow-lg">
              <Sparkles className="w-3 h-3" />
              <span>Featured</span>
            </div>
          </div>
        )}

        {/* Trending Badge - Alternative position if no discount */}
        {product.featured && !discount && (
          <div className="absolute top-3 left-3 z-10">
            <TrendingIndicator isHot={true} className="shadow-lg" />
          </div>
        )}

        {/* Wishlist Button - Always visible on homepage for better UX */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleWishlistToggle}
            className={`p-2.5 rounded-full shadow-lg border-2 transition-all duration-300 ${
              isInWishlist(product.id)
                ? 'bg-red-500 text-white border-red-500 scale-110'
                : 'bg-white/95 backdrop-blur-sm text-gray-600 hover:text-red-500 border-white/50 hover:border-red-200 hover:scale-110'
            } touch-manipulation`}
            aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Enhanced Add to Cart Button - Shows on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 via-black/60 to-transparent z-10">
          <AddToCartButton 
            product={product}
            className="w-full"
            size="sm"
          />
        </div>
      </div>

      {/* Product Information - Compact and organized */}
      <div className="flex flex-col flex-1 min-w-0 p-3 sm:p-4">
        {/* Category Tag - Compact */}
        {product.category && (
          <span className="inline-flex items-center w-fit text-[10px] sm:text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded mb-1.5 uppercase tracking-wide">
            {product.category}
          </span>
        )}

        {/* Product Name - Compact with proper line clamp */}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors duration-200 line-clamp-2 text-xs sm:text-sm leading-tight mb-1.5">
            {product.name}
          </h3>
        </Link>

        {/* Rating - Compact */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={`${product.id}-star-${i}`}
                className={`h-3 w-3 ${
                  i < Math.floor(product.rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] sm:text-xs text-blue-600 font-semibold">
            {product.rating}
          </span>
          {product.reviewCount && product.reviewCount > 0 && (
            <span className="text-[10px] text-gray-500 hidden sm:inline">
              ({product.reviewCount})
            </span>
          )}
        </div>

        {/* Price - Compact and prominent */}
        <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
          <span className="text-base sm:text-lg font-bold text-gray-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-xs text-gray-400 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
              {discount > 0 && (
                <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1 py-0.5 rounded">
                  {discount}% off
                </span>
              )}
            </>
          )}
        </div>

        {/* Stock Status - Compact */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className={`w-1.5 h-1.5 rounded-full ${stockStatus.color}`}></div>
          <span className={`text-[10px] sm:text-xs font-medium ${stockStatus.textColor}`}>
            {stockStatus.text}
          </span>
        </div>

        {/* Trust Indicators - Compact */}
        <div className="pt-2 border-t border-gray-100 mt-auto">
          <MiniTrustIndicators
            freeShipping={product.price >= 2000}
            className="justify-start scale-75 origin-left"
          />
        </div>
      </div>

      {/* Bottom accent line - Enhanced animation */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  );
};

export default HomepageProductCard;


import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, ShoppingCart, Clock } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCartButtonStyles } from '../../hooks/useCartButtonStyles';
import { AddToCartButton } from './AddToCartButton';
import ProductImage from '../Common/ProductImage';

interface LatestArrivalProductCardProps {
  product: Product;
  index?: number;
}

/**
 * LatestArrivalProductCard - Fresh, Modern Design
 * Emphasizes newness with clean aesthetics and subtle animations
 */
export const LatestArrivalProductCard: React.FC<LatestArrivalProductCardProps> = ({ product, index = 0 }) => {
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const { cartButtonStyle, cartButtonHoverStyle } = useCartButtonStyles();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToWishlist(product);
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  // Calculate days since product was added
  const getDaysAgo = () => {
    if (!product.createdAt) return null;
    const createdDate = new Date(product.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysAgo = getDaysAgo();
  const isVeryNew = daysAgo && daysAgo <= 7;

  const getTimeLabel = () => {
    if (!daysAgo) return null;
    if (daysAgo === 1) return 'Added today';
    if (daysAgo <= 7) return `${daysAgo} days ago`;
    if (daysAgo <= 14) return 'This week';
    if (daysAgo <= 30) return 'This month';
    return null;
  };

  const timeLabel = getTimeLabel();

  return (
    <Link to={`/products/${product.id}`} className="group block h-full">
      <article className="relative bg-white h-full flex flex-col overflow-hidden border border-gray-100 hover:border-purple-200 transition-all duration-300 rounded-xl shadow-sm hover:shadow-xl">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50">
          <ProductImage
            product={product}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt={product.name}
            size="medium"
            priority={index < 2 ? 'critical' : 'normal'}
          />

          {/* NEW Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-purple-600 text-white px-2.5 py-1 text-xs font-bold tracking-wide uppercase rounded">
            <Sparkles className={`w-3 h-3 ${isVeryNew ? 'animate-pulse' : ''}`} />
            <span>New</span>
          </div>

          {/* Time Badge - positioned below NEW badge or top-right if no room */}
          {timeLabel && (
            <div className="absolute top-12 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm text-gray-600 px-2 py-1 text-[10px] font-medium rounded shadow-sm">
              <Clock className="w-2.5 h-2.5" />
              <span>{timeLabel}</span>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2.5 rounded-full shadow-md transition-all duration-200 ${
              isInWishlist(product.id)
                ? 'bg-rose-500 text-white'
                : 'bg-white/95 text-gray-600 hover:text-rose-500 hover:bg-white'
            }`}
            aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>

            {/* Quick Add to Cart - Shows on Hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <AddToCartButton 
                product={product}
                className="w-full"
                size="sm"
              />
            </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col flex-grow p-4">
          {/* Category Tag */}
          {product.category && (
            <span className="inline-flex items-center w-fit text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded mb-2">
              {product.category}
            </span>
          )}

          {/* Product Name */}
          <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-2 border-t border-gray-100">
            <span className="text-lg md:text-xl font-bold text-gray-900">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <span className="text-sm text-gray-400 line-through">
                ₹{Number(product.originalPrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Description - Desktop only */}
          {product.description && (
            <p className="hidden lg:block text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Bottom accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </article>
    </Link>
  );
};

export default LatestArrivalProductCard;

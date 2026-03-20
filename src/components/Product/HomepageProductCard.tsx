import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Product } from '../../types';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAddToCartWithAuth } from '../../hooks/useAddToCartWithAuth';
import { useAddToWishlistWithAuth } from '../../hooks/useAddToWishlistWithAuth';
import { Link } from 'react-router-dom';
import { BuyNowButton } from './BuyNowButton';

interface HomepageProductCardProps {
  product: Product;
  index?: number;
}

export const HomepageProductCard: React.FC<HomepageProductCardProps> = ({ product, index = 0 }) => {
  const { isInWishlist } = useWishlist();
  const { handleAddToCart } = useAddToCartWithAuth();
  const { handleAddToWishlist } = useAddToWishlistWithAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleAddToWishlist(product);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleAddToCart(product, 1);
  };

  const images = product.images && product.images.length > 0 ? product.images : [''];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 h-full">

      {/* Image area */}
      <Link to={`/products/${product.id}`} className="block relative bg-gray-50">
        <div className="aspect-square overflow-hidden">
          <img
            src={images[currentImageIndex] || ''}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Best Seller badge — top left */}
        {product.featured && (
          <div className="absolute top-3 left-3">
            <span className="bg-white text-gray-800 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm border border-gray-100">
              Best Seller
            </span>
          </div>
        )}

        {/* Wishlist — top right */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center transition-transform duration-200 hover:scale-110 touch-manipulation"
          aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
          />
        </button>
      </Link>

      {/* Image dots — always reserve height so cards align */}
      <div className="flex items-center justify-center gap-1.5 h-6 bg-white">
        {hasMultipleImages && images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentImageIndex(i)}
            className={`rounded-full transition-all duration-200 cursor-pointer ${
              i === currentImageIndex ? 'w-2 h-2 bg-gray-800' : 'w-1.5 h-1.5 bg-gray-300'
            }`}
            aria-label={`Image ${i + 1}`}
          />
        ))}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-1">
        {/* Brand / category */}
        {product.category && (
          <span className="text-xs font-semibold text-green-600">{product.category}</span>
        )}

        {/* Product name */}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-gray-700 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-sm sm:text-base font-bold text-gray-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Buy Now button */}
        <BuyNowButton onClick={handleBuyNow} className="mt-3" />
      </div>
    </div>
  );
};

export default HomepageProductCard;

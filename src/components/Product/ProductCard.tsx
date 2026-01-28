import React, { useState } from 'react';
import { Star, Heart, ShoppingCart, Check, Eye, Package, ArrowUpRight, Zap, Flame } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductImage from '../Common/ProductImage';
import { useCartButtonState } from '../../hooks/useCartButtonState';
import { AddToCartButton } from './AddToCartButton';

interface ProductCardProps {
  product: Product;
  isListView?: boolean;
  onCompareToggle?: (id: string) => void;
  isComparing?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  isListView = false,
  onCompareToggle,
  isComparing = false
}) => {
  const { isInWishlist, addItem: addToWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { cartButtonState } = useCartButtonState(product);
  const [isHovered, setIsHovered] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlist(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCompareToggle) onCompareToggle(product.id);
  };

  // Category specific styles
  const isTech = product.categoryName?.toLowerCase().includes('electronics') || product.category?.toLowerCase().includes('electronics');
  const isFashion = product.categoryName?.toLowerCase().includes('fashion') || product.category?.toLowerCase().includes('fashion');

  if (isListView) {
    return (
      <div className="group flex flex-col md:flex-row gap-6 p-4 bg-white rounded-2xl border border-gray-100 hover:border-purple-200 transition-all duration-300 shadow-sm hover:shadow-xl relative">
        <div className="relative w-full md:w-64 aspect-[4/3] flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
          <Link to={`/products/${product.id}`} className="block h-full">
            <ProductImage
              product={product}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt={product.name}
            />
          </Link>
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-lg z-10">
              -{discount}%
            </span>
          )}
          
          {/* Comparison Checkbox */}
          <div className="absolute top-3 right-3 z-10">
            <label className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-2 py-1 rounded border border-gray-200 cursor-pointer shadow-sm hover:bg-white transition-colors">
              <input 
                type="checkbox" 
                checked={isComparing}
                onChange={() => onCompareToggle && onCompareToggle(product.id)}
                className="w-3 h-3 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-[10px] font-bold text-gray-700 uppercase">Compare</span>
            </label>
          </div>
        </div>
        
        <div className="flex flex-col flex-1 justify-between py-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                isTech ? 'bg-blue-50 text-blue-600' : isFashion ? 'bg-pink-50 text-pink-600' : 'bg-gray-50 text-gray-600'
              }`}>
                {product.categoryName || product.category || 'Discovery'}
              </span>
              <div className="flex items-center text-amber-400 ml-auto">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-sm font-bold text-gray-700 ml-1">{product.rating || '4.5'}</span>
                <span className="text-xs text-gray-400 ml-1 font-medium">(2.4k)</span>
              </div>
            </div>
            <Link to={`/products/${product.id}`}>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4 font-normal">
              {product.shortDescription || product.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 font-medium">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-500" /> Free Returns</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Get it by <b>Tomorrow</b></span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-500" /> Cash on Delivery</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#131921]">₹{product.price.toLocaleString('en-IN')}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through font-medium">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              )}
            </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleWishlistToggle}
                  className={`p-3 rounded-xl border transition-all ${
                    isInWishlist(product.id) ? 'bg-red-50 text-red-500 border-red-100' : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100'
                  }`}
                >
                  <Heart className="h-5 w-5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                </button>
                <AddToCartButton 
                  product={product} 
                  className="flex-1 md:flex-none h-12 px-8"
                  size="lg"
                />
              </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col h-full bg-white rounded-xl border border-gray-200 hover:border-amber-400 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden"
    >
      <Link to={`/products/${product.id}`} className="block relative aspect-[1/1] overflow-hidden bg-white">
        <ProductImage
          product={product}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
          alt={product.name}
        />
        
        {/* Compare Checkbox - Small & Clean */}
        <div className="absolute top-2 right-2 z-10">
           <button 
             onClick={handleCompareClick}
             className={`w-6 h-6 rounded border transition-all flex items-center justify-center ${
               isComparing ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white/80 border-gray-300 text-transparent'
             }`}
           >
             <Check className="w-4 h-4" />
           </button>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm uppercase">
              -{discount}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm uppercase flex items-center gap-1">
              <Flame className="w-3 h-3" /> Popular
            </span>
          )}
        </div>
      </Link>

      <div className="p-3.5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
            isTech ? 'bg-blue-50 text-blue-600' : isFashion ? 'bg-pink-50 text-pink-600' : 'bg-gray-50 text-gray-600'
          }`}>
            {product.categoryName || product.category || 'Essentials'}
          </span>
          <div className="flex items-center text-amber-400 ml-auto">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-[10px] font-black text-[#131921] ml-0.5">{product.rating || '4.5'}</span>
            <span className="text-[9px] text-gray-400 ml-0.5 font-bold">(124)</span>
          </div>
        </div>
        
        <Link to={`/products/${product.id}`} className="mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-2 text-sm leading-tight hover:text-purple-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-xl font-black text-[#131921]">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && (
              <span className="text-[11px] text-gray-400 line-through font-bold">₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
          
            <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
               <AddToCartButton 
                 product={product} 
                 className="flex-1"
                 size="sm"
               />
               <button 
                 onClick={handleWishlistToggle}
                 className={`w-9 h-9 rounded border flex items-center justify-center transition-colors ${
                   isInWishlist(product.id) ? 'text-red-500 border-red-100 bg-red-50' : 'text-gray-400 border-gray-200 hover:text-red-500'
                 }`}
               >
                 <Heart className="h-4 w-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
               </button>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

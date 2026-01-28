import React, { useState } from 'react';
import { Heart, ShoppingCart, Trash2, Share2, Sparkles, TrendingUp } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { ProductCard } from '../components/Product/ProductCard';
import { ProductDetails } from '../components/Product/ProductDetails';
import { Product } from '../types';
import { Link } from 'react-router-dom';

export const WishlistPage: React.FC = () => {
  const { items, clearWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { showInfo, showSuccess } = useNotification();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleAddAllToCart = () => {
    const inStockItems = items.filter(item => item.product.stock > 0);
    if (inStockItems.length === 0) {
      showInfo('No Items in Stock', 'None of your wishlist items are currently in stock.');
      return;
    }
    inStockItems.forEach(item => addToCart(item.product));
    showSuccess('Added to Cart', `${inStockItems.length} items added to your cart.`);
  };

  const handleClearWishlist = () => {
    if (items.length > 0) {
      clearWishlist();
      showInfo('Wishlist Cleared', 'All items have been removed from your wishlist.');
    }
  };

  const totalValue = items.reduce((sum, item) => sum + item.product.price, 0);
  const inStockCount = items.filter(item => item.product.stock > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <Heart className="h-10 w-10 md:h-12 md:w-12 fill-current" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                  My Wishlist
                </h1>
                <p className="text-white/90 text-lg">
                  {items.length} {items.length === 1 ? 'item' : 'items'} • ₹{totalValue.toLocaleString('en-IN')} total value
                </p>
                {items.length > 0 && (
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                      {inStockCount} in stock
                    </span>
                    {items.length - inStockCount > 0 && (
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                        {items.length - inStockCount} out of stock
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {items.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleAddAllToCart}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add All to Cart</span>
                </button>
                <button
                  onClick={handleClearWishlist}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200"
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
                <button className="p-3 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {items.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <div className="max-w-lg mx-auto">
              {/* Empty State Illustration */}
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-50"></div>
                </div>
                <div className="relative p-8 bg-white rounded-3xl shadow-xl w-32 h-32 mx-auto flex items-center justify-center">
                  <Heart className="h-16 w-16 text-gray-300" />
                </div>
              </div>

              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Your wishlist is empty
              </h3>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Save items you love by clicking the <Heart className="inline h-5 w-5 text-red-500 fill-current" /> icon on any product.
                They'll appear here for easy access later.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/products">
                  <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Discover Products</span>
                  </button>
                </Link>
                <Link to="/best-sellers">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-semibold hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>View Best Sellers</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{inStockCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{items.length - inStockCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">₹{totalValue.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div key={item.product.id} className="transform hover:scale-[1.02] transition-transform duration-200">
                  <ProductCard product={item.product} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default WishlistPage;

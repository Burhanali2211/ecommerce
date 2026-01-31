import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, TrendingUp, ArrowRight } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import ProductImage from '../Common/ProductImage';
import { Product } from '../../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { products } = useProducts();
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSuggestions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length > 1) {
      const searchTerm = query.toLowerCase();
      const filtered = products
        .filter(p => {
          if (p.name.toLowerCase().includes(searchTerm)) return true;
          if (p.description && p.description.toLowerCase().includes(searchTerm)) return true;
          if (p.shortDescription && p.shortDescription.toLowerCase().includes(searchTerm)) return true;
          if (p.category && p.category.toLowerCase().includes(searchTerm)) return true;
          if (p.sellerName && p.sellerName.toLowerCase().includes(searchTerm)) return true;
          if (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchTerm))) return true;
          if (p.sku && p.sku.toLowerCase().includes(searchTerm)) return true;
          return false;
        })
        .slice(0, 6);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query, products]);

  const trendingSearches = ['Saffron', 'Cardamom', 'Kashmiri Chili', 'Turmeric', 'Cinnamon', 'Black Pepper'];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="min-h-screen pt-20 pb-10 px-4 overflow-y-auto">
        <div 
          className="max-w-2xl mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-14 pr-14 py-4 text-lg bg-white rounded-2xl shadow-2xl border-0 focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Results */}
          <div className="mt-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {suggestions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                <div className="px-5 py-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Products
                  </p>
                </div>
                {suggestions.map(product => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    onClick={onClose}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                  >
                    <ProductImage
                      product={{ id: product.id, name: product.name, images: product.images }}
                      className="w-14 h-14 object-cover rounded-lg"
                      alt={product.name}
                      size="small"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate group-hover:text-amber-700 transition-colors">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                  </Link>
                ))}
                <Link
                  to={`/products?q=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-5 py-4 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  View all results for "{query}"
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : query.length > 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-gray-500">No products found for "{query}"</p>
                <Link
                  to="/products"
                  onClick={onClose}
                  className="inline-block mt-4 text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  Browse all products
                </Link>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Popular Searches
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Press ESC hint */}
          <p className="mt-4 text-center text-sm text-white/60">
            Press <kbd className="px-2 py-1 bg-white/10 rounded">ESC</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

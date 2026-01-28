import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, TrendingUp } from 'lucide-react';

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

  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    if (query.length > 1) {
      const searchTerm = query.toLowerCase();
      const filtered = products
        .filter(p => {
          // Search in product name
          if (p.name.toLowerCase().includes(searchTerm)) return true;

          // Search in description
          if (p.description && p.description.toLowerCase().includes(searchTerm)) return true;

          // Search in short description
          if (p.shortDescription && p.shortDescription.toLowerCase().includes(searchTerm)) return true;

          // Search in category name
          if (p.category && p.category.toLowerCase().includes(searchTerm)) return true;

          // Search in seller/brand name
          if (p.sellerName && p.sellerName.toLowerCase().includes(searchTerm)) return true;

          // Search in tags
          if (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchTerm))) return true;

          // Search in SKU
          if (p.sku && p.sku.toLowerCase().includes(searchTerm)) return true;

          return false;
        })
        .slice(0, 8); // Show more results (8 instead of 5)
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query, products]);

  const trendingSearches = ['Oudh Attar', 'Musk Perfume', 'Rose Attar', 'Sandalwood', 'Amber Fragrance', 'Floral Attar'];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl animate-fade-in"
          onClick={onClose}
        >
          <div className="max-w-3xl mx-auto mt-24 px-6" onClick={(e) => e.stopPropagation()}>
            <div
              className="animate-slide-in-up"
            >
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-purple-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for attars, perfumes, brands..."
                  className="w-full pl-16 pr-6 py-6 text-lg rounded-3xl shadow-2xl border-2 border-purple-200/50 bg-white/95 backdrop-blur-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-200/30 transition-all duration-300 font-medium tracking-wide placeholder:text-neutral-400"
                  autoFocus
                />
                {/* Luxury close button */}
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all duration-200 hover:scale-110 active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              className="mt-6 card-luxury p-6 shadow-2xl animate-slide-in-up animation-delay-100"
            >
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold px-2 text-neutral-600 uppercase tracking-wide">Product Suggestions</h3>
                  {suggestions.map(product => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      onClick={onClose}
                      className="flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-neutral-50 hover:shadow-md luxury-hover-lift"
                    >
                      <ProductImage
                        product={{ id: product.id, name: product.name, images: product.images }}
                        className="w-14 h-14 object-cover rounded-lg shadow-sm"
                        alt={product.name}
                        size="small"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-900">{product.name}</p>
                        <p className="text-lg font-bold text-neutral-700">₹{product.price.toLocaleString('en-IN')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold flex items-center text-neutral-600 uppercase tracking-wide">
                    <TrendingUp className="h-4 w-4 mr-2" />Trending Searches
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {trendingSearches.map(term => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-5 py-3 rounded-full transition-all duration-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-900 hover:text-white font-medium shadow-sm hover:shadow-md"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full transition-colors text-gray-300 hover:text-white hover:bg-black/20"
          >
            <X className="h-8 w-8" />
          </button>
        </div>
      )}
    </>
  );
};

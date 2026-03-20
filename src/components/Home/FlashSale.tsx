import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';

import { useProducts } from '../../contexts/ProductContext';

// Isolated timer — only this tiny component re-renders every second
const FlashSaleTimer: React.FC = memo(() => {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) return prev;
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1 bg-gray-900 text-white rounded px-2 py-1 font-mono text-sm">
      {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
    </div>
  );
});
FlashSaleTimer.displayName = 'FlashSaleTimer';

export const FlashSale: React.FC = memo(() => {
  const { products } = useProducts();

  // Memoized — only recomputes when products array changes, not every second
  const flashSaleProducts = useMemo(
    () => products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 6),
    [products]
  );

  if (flashSaleProducts.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-1.5">
              <Zap className="h-5 w-5 text-green-700 fill-green-700" />
              Flash Sale
            </span>
            <FlashSaleTimer />
          </div>
          <Link to="/deals" className="text-sm font-medium text-green-700 hover:text-green-900 flex items-center gap-1">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          {flashSaleProducts.map((product) => {
            return (
              <div key={product.id} className="bg-white p-2 sm:p-3 rounded-lg border border-gray-100 hover:shadow-lg transition-shadow">
                <Link to={`/products/${product.id}`} className="block relative aspect-square mb-3 overflow-hidden rounded">
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                <div className="space-y-1">
                  <Link to={`/products/${product.id}`} className="block text-sm font-medium text-gray-900 line-clamp-2 hover:text-green-800 leading-tight">
                    {product.name}
                  </Link>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-base font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

FlashSale.displayName = 'FlashSale';

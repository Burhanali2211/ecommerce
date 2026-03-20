import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';

// Timer — isolated so only it re-renders every second
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

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1">
      {[pad(timeLeft.hours), pad(timeLeft.minutes), pad(timeLeft.seconds)].map((unit, i) => (
        <React.Fragment key={i}>
          <span className="w-8 h-8 flex items-center justify-center bg-gray-900 text-white font-mono text-xs font-bold rounded-md">
            {unit}
          </span>
          {i < 2 && <span className="text-gray-400 font-bold text-xs">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
});
FlashSaleTimer.displayName = 'FlashSaleTimer';

export const FlashSale: React.FC = memo(() => {
  const { products } = useProducts();

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
            <span className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-1.5 tracking-tight">
              <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              FLASH SALE
            </span>
            <FlashSaleTimer />
          </div>
          <Link
            to="/deals"
            className="text-xs font-semibold text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors tracking-wide uppercase"
          >
            All deals <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Product grid — 2 cols mobile, 3 tablet, 6 desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {flashSaleProducts.map(product => {
            const shortName = product.name.split(' ').slice(0, 4).join(' ');

            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group block bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
              >
                {/* Image — wider than tall (4:3) so cards don't tower */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                  <img
                    src={product.images?.[0] || ''}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />

                  {/* Price tag — top right, Gen Z label style */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-lg leading-none tracking-tight shadow">
                      ₹{product.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Name only — single line, clean */}
                <div className="px-2.5 py-2">
                  <p className="text-gray-900 text-xs sm:text-sm font-semibold leading-snug line-clamp-1 tracking-tight">
                    {shortName}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
});

FlashSale.displayName = 'FlashSale';

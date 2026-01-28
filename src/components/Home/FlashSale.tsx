import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Zap, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { ProductCard } from '../Product/ProductCard';

export const FlashSale: React.FC = () => {
  const { products } = useProducts();
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 30
  });

  // Get products with high discounts for the flash sale
  const flashSaleProducts = products
    .filter(p => p.discountPrice && p.discountPrice < p.price)
    .slice(0, 6);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (flashSaleProducts.length === 0) return null;

  return (
    <section className="py-8 bg-gray-50 border-y border-gray-200">
      <div className="max-w-[1600px] mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-500 fill-amber-500" />
              <h2 className="text-2xl font-black tracking-tight text-[#131921]">FLASH SALE</h2>
            </div>
            
            {/* Timer */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ending in:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'H', value: timeLeft.hours },
                  { label: 'M', value: timeLeft.minutes },
                  { label: 'S', value: timeLeft.seconds }
                ].map((unit, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="bg-[#131921] text-white w-10 h-10 rounded flex items-center justify-center font-mono text-xl font-bold">
                      {unit.value.toString().padStart(2, '0')}
                    </div>
                    {idx < 2 && <span className="mx-1 text-xl font-bold text-[#131921]">:</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <Link to="/deals" className="flex items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700 hover:underline">
            See all deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Product Carousel (Simplified to Grid for now) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {flashSaleProducts.map((product) => (
            <div key={product.id} className="bg-white p-3 rounded-lg border border-gray-100 hover:shadow-lg transition-shadow">
              <Link to={`/products/${product.slug || product.id}`} className="block relative aspect-square mb-3 overflow-hidden rounded">
                <img 
                  src={product.imageUrl || 'https://via.placeholder.com/300'} 
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                  -{Math.round(((product.price - product.discountPrice!) / product.price) * 100)}%
                </div>
              </Link>
              
              <div className="space-y-1">
                <Link to={`/products/${product.slug || product.id}`} className="block text-sm font-medium text-gray-900 line-clamp-1 hover:text-purple-600">
                  {product.name}
                </Link>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-[#131921]">₹{product.discountPrice?.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                </div>
                
                {/* Stock Progress Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                    <span>{Math.floor(Math.random() * 40) + 60}% Claimed</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

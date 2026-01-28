import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, TrendingUp, ShoppingBag, ChevronRight } from 'lucide-react';
import { Category } from '../../types';

interface BentoGridProps {
  categories: Category[];
  loading?: boolean;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ categories, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 h-[600px] animate-pulse">
        <div className="md:col-span-3 md:row-span-2 bg-gray-100 rounded-xl" />
        <div className="bg-gray-100 rounded-xl" />
        <div className="bg-gray-100 rounded-xl" />
        <div className="md:col-span-2 bg-gray-100 rounded-xl" />
        <div className="bg-gray-100 rounded-xl" />
        <div className="bg-gray-100 rounded-xl" />
      </div>
    );
  }

  // Enhanced mapping for 6-column density
  const featuredCat = categories[0];
  const secondaryCats = categories.slice(1, 7);

    return (
      <div className="grid grid-cols-2 md:grid-cols-6 md:grid-rows-2 gap-3 min-h-[500px]">
        {/* 1. Main Featured Tile (Large - spans 3 cols, 2 rows) */}
        {featuredCat && (
          <Link
            to={`/products?category=${featuredCat.id}`}
            className="group relative col-span-2 md:col-span-3 md:row-span-2 overflow-hidden rounded-xl bg-[#f8f9fa] border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <img
              src={featuredCat.imageUrl || (featuredCat as any).image_url || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800'}
              alt={featuredCat.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-4 left-4">
               <div className="bg-amber-400 text-[#131921] text-[10px] font-black px-2 py-1 rounded shadow-sm">
                  TOP CATEGORY
               </div>
            </div>
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-1 drop-shadow-md">{featuredCat.name}</h3>
              <p className="text-gray-100 text-sm mb-4 line-clamp-2 max-w-xs drop-shadow-sm">{featuredCat.description}</p>
              <div className="inline-flex items-center gap-2 bg-white text-[#131921] px-4 py-2 rounded-lg text-sm font-bold shadow-lg group/btn">
                <span>Shop All</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </div>
            </div>
          </Link>
        )}

        {/* 2. Top right - Small Tile 1 */}
        {secondaryCats[0] && (
          <Link
            to={`/products?category=${secondaryCats[0].id}`}
            className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md"
          >
            <img
              src={secondaryCats[0].imageUrl || (secondaryCats[0] as any).image_url || 'https://images.unsplash.com/photo-1445205170230-053b83e26ec7?w=800'}
              alt={secondaryCats[0].name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-3 left-3">
              <h3 className="text-sm font-bold text-white drop-shadow-md">{secondaryCats[0].name}</h3>
            </div>
          </Link>
        )}

        {/* 3. Top right - Small Tile 2 */}
        {secondaryCats[1] && (
          <Link
            to={`/products?category=${secondaryCats[1].id}`}
            className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md"
          >
            <img
              src={secondaryCats[1].imageUrl || (secondaryCats[1] as any).image_url || 'https://images.unsplash.com/photo-1581781870027-04212e231e96?w=800'}
              alt={secondaryCats[1].name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-3 left-3">
              <h3 className="text-sm font-bold text-white drop-shadow-md">{secondaryCats[1].name}</h3>
            </div>
          </Link>
        )}

        {/* 4. Top right - Small Tile 3 (Spice Blends goes here) */}
        {secondaryCats[2] && (
          <Link
            to={`/products?category=${secondaryCats[2].id}`}
            className="group relative overflow-hidden rounded-xl bg-[#f0f2f2] hover:bg-[#e3e6e6] transition-colors"
          >
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-white shadow-sm">
                 <img src={secondaryCats[2].imageUrl || (secondaryCats[2] as any).image_url} alt="" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 leading-tight">{secondaryCats[2].name}</h3>
            </div>
          </Link>
        )}

        {/* 5. Bottom right - Wide Tile (spans 2 cols) */}
        {secondaryCats[3] && (
          <Link
            to={`/products?category=${secondaryCats[3].id}`}
            className="group relative col-span-2 overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md"
          >
            <img
              src={secondaryCats[3].imageUrl || (secondaryCats[3] as any).image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800'}
              alt={secondaryCats[3].name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
            <div className="absolute inset-0 p-5 flex flex-col justify-center">
              <h3 className="text-xl font-black text-white mb-1">{secondaryCats[3].name}</h3>
              <span className="text-amber-400 text-xs font-bold">New Arrivals &rsaquo;</span>
            </div>
          </Link>
        )}

        {/* 6. Bottom right - Small Tile */}
        {secondaryCats[4] && (
          <Link
            to={`/products?category=${secondaryCats[4].id}`}
            className="group relative overflow-hidden rounded-xl bg-[#f0f2f2] hover:bg-[#e3e6e6] transition-colors"
          >
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-white shadow-sm">
                 <img src={secondaryCats[4].imageUrl || (secondaryCats[4] as any).image_url} alt="" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 leading-tight">{secondaryCats[4].name}</h3>
            </div>
          </Link>
        )}
      </div>
    );
};

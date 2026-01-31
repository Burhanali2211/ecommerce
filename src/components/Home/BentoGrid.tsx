import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, TrendingUp, ShoppingBag, ChevronRight, Package } from 'lucide-react';
import { Category } from '../../types';
import { getSafeImageUrl, isValidImageUrl } from '../../utils/imageUrlUtils';

interface BentoGridProps {
  categories: Category[];
  loading?: boolean;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ categories, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 animate-pulse">
        <div className="col-span-1 sm:col-span-2 md:col-span-3 md:row-span-2 bg-gray-100 rounded-xl h-[280px] sm:h-[320px] md:h-auto md:min-h-[400px]" />
        <div className="bg-gray-100 rounded-xl h-[140px] sm:h-[150px] md:h-auto" />
        <div className="bg-gray-100 rounded-xl h-[140px] sm:h-[150px] md:h-auto" />
        <div className="bg-gray-100 rounded-xl h-[140px] sm:h-[150px] md:h-auto" />
        <div className="col-span-1 sm:col-span-2 bg-gray-100 rounded-xl h-[140px] sm:h-[150px] md:h-auto" />
        <div className="bg-gray-100 rounded-xl h-[140px] sm:h-[150px] md:h-auto" />
      </div>
    );
  }

  // Enhanced mapping for 6-column density
  const featuredCat = categories[0];
  const secondaryCats = categories.slice(1, 7);

  // Helper to get safe category image URL
  const getCatImage = (cat: Category, fallback: string) => {
    const rawUrl = cat.imageUrl || (cat as any).image_url;
    return getSafeImageUrl(rawUrl, fallback);
  };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 md:grid-rows-2 gap-3 md:gap-4">
        {/* 1. Main Featured Tile (Large - spans full width on mobile, 3 cols & 2 rows on desktop) */}
        {featuredCat && (
          <Link
            to={`/products?category=${featuredCat.id}`}
            className="group relative col-span-1 sm:col-span-2 md:col-span-3 md:row-span-2 overflow-hidden rounded-xl bg-[#f8f9fa] border border-gray-100 shadow-sm hover:shadow-md transition-all min-h-[280px] sm:min-h-[320px] md:min-h-[400px]"
          >
            <img
              src={getCatImage(featuredCat, 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800')}
              alt={featuredCat.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
               <div className="bg-amber-400 text-[#131921] text-[10px] font-black px-2 py-1 rounded shadow-sm">
                  TOP CATEGORY
               </div>
            </div>
            <div className="absolute bottom-0 left-0 p-4 sm:p-6 w-full">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 drop-shadow-md">{featuredCat.name}</h3>
              <p className="text-gray-100 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 max-w-xs drop-shadow-sm">{featuredCat.description}</p>
              <div className="inline-flex items-center gap-2 bg-white text-[#131921] px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold shadow-lg group/btn">
                <span>Shop All</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover/btn:translate-x-1" />
              </div>
            </div>
          </Link>
        )}

        {/* 2. Top right - Small Tile 1 */}
        {secondaryCats[0] && (
          <Link
            to={`/products?category=${secondaryCats[0].id}`}
            className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md min-h-[140px] sm:min-h-[150px] md:min-h-0"
          >
            <img
              src={getCatImage(secondaryCats[0], 'https://images.unsplash.com/photo-1445205170230-053b83e26ec7?w=800')}
              alt={secondaryCats[0].name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1445205170230-053b83e26ec7?w=800'; }}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
              <h3 className="text-xs sm:text-sm font-bold text-white drop-shadow-md">{secondaryCats[0].name}</h3>
            </div>
          </Link>
        )}

        {/* 3. Top right - Small Tile 2 */}
        {secondaryCats[1] && (
          <Link
            to={`/products?category=${secondaryCats[1].id}`}
            className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md min-h-[140px] sm:min-h-[150px] md:min-h-0"
          >
            <img
              src={getCatImage(secondaryCats[1], 'https://images.unsplash.com/photo-1581781870027-04212e231e96?w=800')}
              alt={secondaryCats[1].name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581781870027-04212e231e96?w=800'; }}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
              <h3 className="text-xs sm:text-sm font-bold text-white drop-shadow-md">{secondaryCats[1].name}</h3>
            </div>
          </Link>
        )}

        {/* 4. Top right - Small Tile 3 (Spice Blends goes here) */}
        {secondaryCats[2] && (
          <Link
            to={`/products?category=${secondaryCats[2].id}`}
            className="group relative overflow-hidden rounded-xl bg-[#f0f2f2] hover:bg-[#e3e6e6] transition-colors min-h-[140px] sm:min-h-[150px] md:min-h-0"
          >
            <div className="p-3 sm:p-4 flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden mb-2 border-2 border-white shadow-sm bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center">
                 {isValidImageUrl(getCatImage(secondaryCats[2], '')) ? (
                   <img src={getCatImage(secondaryCats[2], '')} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                 ) : (
                   <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                 )}
              </div>
              <h3 className="text-xs font-bold text-gray-900 leading-tight">{secondaryCats[2].name}</h3>
            </div>
          </Link>
        )}

        {/* 5. Bottom right - Wide Tile (spans 2 cols on sm+) */}
        {secondaryCats[3] && (
          <Link
            to={`/products?category=${secondaryCats[3].id}`}
            className="group relative col-span-1 sm:col-span-2 overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md min-h-[140px] sm:min-h-[150px] md:min-h-0"
          >
            <img
              src={getCatImage(secondaryCats[3], 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800')}
              alt={secondaryCats[3].name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
            <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-center">
              <h3 className="text-lg sm:text-xl font-black text-white mb-1">{secondaryCats[3].name}</h3>
              <span className="text-amber-400 text-xs font-bold">New Arrivals &rsaquo;</span>
            </div>
          </Link>
        )}

        {/* 6. Bottom right - Small Tile */}
        {secondaryCats[4] && (
          <Link
            to={`/products?category=${secondaryCats[4].id}`}
            className="group relative overflow-hidden rounded-xl bg-[#f0f2f2] hover:bg-[#e3e6e6] transition-colors min-h-[140px] sm:min-h-[150px] md:min-h-0"
          >
            <div className="p-3 sm:p-4 flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden mb-2 border-2 border-white shadow-sm bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center">
                 {isValidImageUrl(getCatImage(secondaryCats[4], '')) ? (
                   <img src={getCatImage(secondaryCats[4], '')} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                 ) : (
                   <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                 )}
              </div>
              <h3 className="text-xs font-bold text-gray-900 leading-tight">{secondaryCats[4].name}</h3>
            </div>
          </Link>
        )}
      </div>
    );
};

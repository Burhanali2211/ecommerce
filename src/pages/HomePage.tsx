import React, { Suspense, lazy, memo, useMemo } from 'react';
import { Hero } from '@/components/Home/Hero';
import { CategoryChips } from '@/components/Home/CategoryChips';
import { FlashSale } from '@/components/Home/FlashSale';
import { BestSellers } from '@/components/Home/BestSellers';
import { useProducts } from '@/contexts/ProductContext';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';

const FeaturedProducts = lazy(() => import('@/components/Home/FeaturedProducts'));
const LatestArrivals = lazy(() => import('@/components/Home/LatestArrivals'));

const SectionLoader = memo(() => (
  <div className="py-6 bg-white">
    <div className="max-w-7xl mx-auto px-4"><LoadingSpinner /></div>
  </div>
));
SectionLoader.displayName = 'SectionLoader';

/* ─── Deal Tiles: Bento layout ─── */
const BENTO_TILES = [
  {
    to: '/deals',
    img: '/images/perfumes/eid-banner.jpg',
    overlay: 'bg-gradient-to-r from-black/70 via-black/30 to-transparent',
    tag: 'Festive Offer',
    title: 'Eid Collection',
    sub: 'Pure attars, curated for the season',
    wide: true,
  },
  {
    to: '/products?category=rose',
    img: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=600&q=75',
    overlay: 'bg-gradient-to-t from-black/70 via-black/20 to-transparent',
    tag: 'Bestseller',
    title: 'Rose Attar',
    sub: 'Rosa Damascena',
    wide: false,
  },
  {
    to: '/products?category=oud',
    img: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=75',
    overlay: 'bg-gradient-to-t from-black/70 via-black/20 to-transparent',
    tag: 'New Arrival',
    title: 'Oud & Musk',
    sub: 'Deep, woody, lasting',
    wide: false,
  },
  {
    to: '/products',
    img: '/images/perfumes/perfume-banner.jpg',
    overlay: 'bg-gradient-to-r from-black/70 via-black/30 to-transparent',
    tag: 'Curated',
    title: 'Gift Sets',
    sub: 'Thoughtfully packed for loved ones',
    wide: true,
  },
];

const DealTiles: React.FC = memo(() => (
  <section className="bg-white border-t border-gray-100 pt-2.5 pb-3">
    {/* Bento grid: 2-col mobile → 3-col desktop, same px as category chips */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 px-3 sm:px-4">
      {BENTO_TILES.map((tile) => (
        <Link
          key={tile.title}
          to={tile.to}
          className={`group relative overflow-hidden rounded-xl h-[140px] sm:h-[180px] md:h-[210px] ${tile.wide ? 'col-span-2 md:col-span-2' : 'col-span-1'}`}
        >
          <img
            src={tile.img}
            alt={tile.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className={`absolute inset-0 ${tile.overlay}`} />
          <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest text-white/60 uppercase mb-0.5">
              {tile.tag}
            </span>
            <p className="text-white font-bold text-sm sm:text-lg leading-tight">{tile.title}</p>
            <p className="text-white/70 text-[10px] sm:text-xs mt-0.5 leading-snug">{tile.sub}</p>
          </div>
        </Link>
      ))}
    </div>
  </section>
));
DealTiles.displayName = 'DealTiles';

/* ─── Price-Filter Strips ─── */
const PRICE_FILTERS = [
  { label: 'Under ₹299', link: '/products?maxPrice=299', bg: 'bg-green-50 border-green-200 text-green-800' },
  { label: 'Under ₹499', link: '/products?maxPrice=499', bg: 'bg-teal-50 border-teal-200 text-teal-800' },
  { label: 'Under ₹999', link: '/products?maxPrice=999', bg: 'bg-blue-50 border-blue-200 text-blue-800' },
  { label: '₹999–₹1999', link: '/products?minPrice=999&maxPrice=1999', bg: 'bg-violet-50 border-violet-200 text-violet-800' },
  { label: '₹2000+', link: '/products?minPrice=2000', bg: 'bg-slate-50 border-slate-200 text-slate-800' },
];

const ShopByPrice: React.FC = memo(() => (
  <section className="py-5 sm:py-6 bg-white border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4">
        <span className="text-base sm:text-lg font-bold text-gray-900">Shop by Price</span>
      </div>
      {/* Horizontal scrollable price chips */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {PRICE_FILTERS.map(({ label, link, bg }) => (
          <Link
            key={label}
            to={link}
            className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm font-semibold transition-all hover:scale-[1.02] ${bg}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  </section>
));
ShopByPrice.displayName = 'ShopByPrice';

/* ─── Mini Promo Banner ─── */
const PromoBanner: React.FC = memo(() => (
  <div className="mx-4 sm:mx-6 lg:mx-8 my-2 max-w-7xl xl:mx-auto">
    <Link
      to="/deals"
      className="flex items-center justify-between bg-black/80 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 group"
    >
      <div>
        <p className="text-white font-black text-sm sm:text-base">🎉 Limited-Time Offer</p>
        <p className="text-green-100 text-xs sm:text-sm">Free shipping on all orders above ₹999</p>
      </div>
      <div className="flex items-center gap-1 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full group-hover:bg-white/30 transition-colors">
        Shop <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  </div>
));
PromoBanner.displayName = 'PromoBanner';

/* ─── Trust Signals ─── */
const TRUST_ITEMS = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7-day hassle-free' },
  { icon: ShieldCheck, title: '100% Authentic', desc: 'Certified products' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here for you' },
];

const TrustBar: React.FC = memo(() => (
  <section className="bg-white border-t border-gray-100 pt-4 pb-0">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-2.5">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
              <Icon className="h-4 w-4 text-green-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{title}</p>
              <p className="text-[10px] text-gray-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
));
TrustBar.displayName = 'TrustBar';

/* ─── Main Page ─── */
export default function HomePage() {
  const { categories, loading: categoriesLoading } = useProducts();

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 1. Banner Carousel */}
      <Hero />

      {/* 2. Category Chips */}
      <CategoryChips categories={categories} loading={categoriesLoading && categories.length === 0} />

      {/* 3. Deal Tiles — Bento layout */}
      <DealTiles />

      {/* 4. Flash Sale */}
      <div className="mt-1.5">
        <FlashSale />
      </div>

      {/* 5. Featured Products — 2×2 mobile / 4-col desktop */}
      <div className="mt-1.5">
        <Suspense fallback={<SectionLoader />}>
          <FeaturedProducts />
        </Suspense>
      </div>

      {/* 6. Mini promo banner strip */}
      <PromoBanner />

      {/* 7. Best Sellers — horizontal scroll */}
      <BestSellers />

      {/* 8. New Arrivals — horizontal scroll */}
      <div className="mt-1.5">
        <Suspense fallback={<SectionLoader />}>
          <LatestArrivals />
        </Suspense>
      </div>

      {/* 9. CTA Banner */}
      <section className="mt-1.5 bg-green-800 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h2 className="text-white text-xl sm:text-2xl font-bold mb-1">50,000+ Happy Customers</h2>
            <p className="text-green-100 text-sm">Premium Himalayan spices delivered to your doorstep</p>
          </div>
          <Link
            to="/products"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-green-800 hover:bg-green-50 font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 10. Trust Signals */}
      <TrustBar />

    </div>
  );
}

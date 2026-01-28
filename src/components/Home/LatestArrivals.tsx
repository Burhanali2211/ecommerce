import React, { useEffect, memo, useRef, useState } from 'react';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { ProductGridSkeleton } from '../Common/ProductCardSkeleton';
import { LatestArrivalProductCard } from '../Product/LatestArrivalProductCard';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LatestArrivals Component
 * High-density, professional marketplace showcase
 * Staggered animations and premium interactivity
 */
export const LatestArrivals: React.FC = memo(() => {
  const { latestProducts, latestLoading, fetchLatestProducts } = useProducts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetchLatestProducts(8); // Fetch more for a denser feel
  }, [fetchLatestProducts]);

  const checkScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [latestProducts]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollTo({
      left: direction === 'left' ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-black text-[10px] tracking-[0.2em] uppercase">Just Dropped</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-[0.9]"
            >
              The New <span className="text-purple-600">Standard.</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-xl"
            >
              Discover the latest additions to our curated collection. Every piece is a testament to quality and style.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-6"
          >
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-sm font-bold text-gray-900">Updated Daily</span>
              <span className="text-xs text-gray-400">8 new items today</span>
            </div>
            <Link
              to="/products?sort=latest"
              className="group flex items-center gap-4 bg-white border-2 border-gray-900 px-6 py-3 rounded-full hover:bg-gray-900 hover:text-white transition-all duration-300"
            >
              <span className="font-black uppercase tracking-widest text-xs text-inherit">Browse All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Products Display */}
        {latestLoading ? (
          <ProductGridSkeleton count={4} variant="latest" />
        ) : latestProducts.length > 0 ? (
          <div className="relative group/container">
            {/* Navigation Arrows - Desktop */}
            <AnimatePresence>
              {canScrollLeft && (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={() => scroll('left')}
                  className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 items-center justify-center bg-white shadow-2xl rounded-full border border-gray-100 hover:bg-gray-900 hover:text-white transition-all duration-300"
                  aria-label="Previous products"
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
              )}
              {canScrollRight && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => scroll('right')}
                  className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 items-center justify-center bg-white shadow-2xl rounded-full border border-gray-100 hover:bg-gray-900 hover:text-white transition-all duration-300"
                  aria-label="Next products"
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Products Row */}
            <div 
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth"
            >
              {latestProducts.map((product, index) => (
                <motion.div 
                  key={product.id} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex-shrink-0 w-[300px] md:w-[350px]"
                >
                  <LatestArrivalProductCard product={product} index={index} />
                </motion.div>
              ))}
              
              {/* View More Card */}
              <Link 
                to="/products?sort=latest"
                className="flex-shrink-0 w-[300px] md:w-[350px] bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 group hover:border-purple-600 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-all duration-300">
                  <Plus className="w-8 h-8" />
                </div>
                <span className="font-bold text-gray-900">View All Arrivals</span>
              </Link>
            </div>

            {/* Pagination Line */}
            <div className="hidden md:block w-full h-[2px] bg-gray-100 mt-12 overflow-hidden">
              <motion.div 
                className="h-full bg-purple-600 w-1/4"
                initial={{ x: "-100%" }}
                whileInView={{ x: "0%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "circOut" }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-50 rounded-full mb-8">
              <Sparkles className="h-10 w-10 text-purple-600" />
            </div>
            <p className="text-gray-900 text-2xl font-black mb-3 tracking-tight">Stay Tuned!</p>
            <p className="text-gray-500 text-lg">Fresh arrivals are currently in quality control.</p>
          </div>
        )}
      </div>
    </section>
  );
});

LatestArrivals.displayName = 'LatestArrivals';

export default LatestArrivals;

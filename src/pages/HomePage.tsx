import React, { Suspense, lazy, memo } from 'react';
import { Hero } from '@/components/Home/Hero';
import { BentoGrid } from '@/components/Home/BentoGrid';
import { FlashSale } from '@/components/Home/FlashSale';
import { useProducts } from '@/contexts/ProductContext';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Sparkles, Phone, Zap, Star, ShieldCheck, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

// Lazy load non-critical components for better performance
const FeaturedProducts = lazy(() => import('@/components/Home/FeaturedProducts'));
const LovedByThousands = lazy(() => import('@/components/Home/LovedByThousands'));
const LatestArrivals = lazy(() => import('@/components/Home/LatestArrivals'));

// Loading fallback component
const SectionLoader = memo(({ bgColor = 'bg-white' }: { bgColor?: string }) => (
  <div className={`py-16 md:py-24 ${bgColor}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <LoadingSpinner />
    </div>
  </div>
));

SectionLoader.displayName = 'SectionLoader';

export default function HomePage() {
  const { categories, loading: categoriesLoading } = useProducts();

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Hero />

      {/* Flash Sale Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
      >
        <FlashSale />
      </motion.div>

      {/* Categories Bento Grid Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-20 md:py-32 bg-white relative overflow-hidden border-t border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 mb-6 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-xs font-black tracking-[0.2em] uppercase">
                  <Zap className="w-4 h-4" />
                  <span>Our Collections</span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-[0.9]">
                  Browse by
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 ml-4">Category.</span>
                </h2>
                <p className="text-gray-500 text-lg md:text-xl max-w-xl leading-relaxed">
                  Discover premium Himalayan spices, aromatic herbs, exotic teas, and organic products sourced from mountain farmers.
                </p>
              </div>
              
              <Link
                to="/categories"
                className="hidden lg:inline-flex items-center gap-4 bg-amber-700 text-white px-8 py-4 rounded-full font-bold hover:bg-amber-800 transition-all duration-300 group"
              >
                <span className="uppercase tracking-widest text-xs">All Categories</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          
          <BentoGrid categories={categories} loading={categoriesLoading && categories.length === 0} />
          
          {/* Mobile CTA */}
          <div className="mt-12 text-center lg:hidden">
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full font-bold w-full justify-center"
            >
              View All Categories
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Featured Products Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
      >
        <Suspense fallback={<SectionLoader bgColor="bg-white" />}>
          <FeaturedProducts />
        </Suspense>
      </motion.div>

      {/* Why Choose Us Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
      >
        <Suspense fallback={<SectionLoader bgColor="bg-white" />}>
          <LovedByThousands />
        </Suspense>
      </motion.div>

      {/* Latest Arrivals Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
      >
        <Suspense fallback={<SectionLoader bgColor="bg-white" />}>
          <LatestArrivals />
        </Suspense>
      </motion.div>

      {/* Premium CTA Section - Massive Upgrade */}
      <section className="py-24 md:py-40 relative overflow-hidden bg-gray-900">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-white text-xs font-bold tracking-[0.2em] uppercase">Premium Experience</span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-[0.85] tracking-tighter">
                Quality for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Every Need.</span>
              </h2>
              
              <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-12 leading-relaxed">
                Join over 50,000 satisfied customers who have upgraded their lifestyle with ZenMart's premium curated collections.
              </p>
              
              <div className="flex flex-wrap gap-6 mb-16">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Authenticity</p>
                    <p className="text-gray-500 text-xs text-nowrap">100% Guaranteed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Express</p>
                    <p className="text-gray-500 text-xs text-nowrap">24h Delivery</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Phone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Support</p>
                    <p className="text-gray-500 text-xs text-nowrap">Priority 24/7</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-4 bg-white text-gray-900 px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  Start Shopping
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 text-white px-10 py-5 rounded-full font-bold border border-white/20 hover:bg-white/5 transition-all"
                >
                  Our Story
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 rounded-[60px] p-12 overflow-hidden group">
                {/* Floating Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/40 transition-colors" />
                
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-purple-600 flex items-center justify-center shadow-xl">
                      <Star className="w-8 h-8 text-white fill-white" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white">4.9/5 Rating</h4>
                      <p className="text-gray-400">Average customer satisfaction</p>
                    </div>
                  </div>
                  
                  <div className="h-px bg-white/10 w-full" />
                  
                  <div className="flex -space-x-4">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-14 h-14 rounded-full border-4 border-gray-900 bg-gray-800 flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                      </div>
                    ))}
                    <div className="w-14 h-14 rounded-full border-4 border-gray-900 bg-purple-600 flex items-center justify-center text-white font-bold">
                      +10k
                    </div>
                  </div>
                  
                  <p className="text-white text-xl font-medium leading-relaxed italic">
                    "ZenMart has completely changed how I shop. The quality is unmatched and delivery is lightning fast!"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Verified ZenMart Customer</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-[70px] blur-2xl -z-0" />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

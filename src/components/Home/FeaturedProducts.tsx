import React, { useEffect, memo } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { ProductGridSkeleton } from '../Common/ProductCardSkeleton';
import { HomepageProductCard } from '../Product/HomepageProductCard';
import { Link } from 'react-router-dom';

/**
 * FeaturedProducts Component
 * Premium showcase section with enhanced grid layout
 * 2 cards per row on mobile, 4 on desktop
 */
export const FeaturedProducts: React.FC = memo(() => {
    const { featuredProducts, featuredLoading, fetchFeaturedProducts } = useProducts();

    useEffect(() => {
        fetchFeaturedProducts(4);
    }, [fetchFeaturedProducts]);

    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-white via-amber-50/30 to-white relative overflow-hidden">
            {/* Subtle decorative elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-100/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Section Header - Editorial Style */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
                    <div className="max-w-xl">
                        {/* Elegant label */}
                        <div className="inline-flex items-center gap-2 mb-4">
                            <span className="w-8 h-px bg-amber-500" />
                            <span className="text-amber-700 font-medium text-sm tracking-widest uppercase">
                                Curated Selection
                            </span>
                        </div>
                        
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                            Featured
                            <span className="block text-amber-600">Products</span>
                        </h2>
                        
                        <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                            Handpicked treasures from our collection — quality items selected just for you.
                        </p>
                    </div>
                    
                    {/* Desktop CTA */}
                    <div className="hidden lg:block">
                        <Link
                            to="/products?featured=true"
                            className="group inline-flex items-center gap-3 text-gray-900 font-semibold hover:text-amber-700 transition-colors"
                        >
                            <span className="text-base">View All Featured</span>
                            <span className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-900 group-hover:border-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Products Display */}
                {featuredLoading ? (
                    <ProductGridSkeleton count={4} variant="featured" />
                ) : featuredProducts.length > 0 ? (
                    <div className="relative">
                        {/* Products Grid - 2 per row on mobile, 4 on desktop */}
                        <div 
                            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6"
                        >
                            {featuredProducts.map((product, index) => (
                                <div 
                                    key={product.id} 
                                    className="w-full animate-fadeInUp"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <HomepageProductCard product={product} index={index} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
                            <Star className="h-10 w-10 text-amber-600" />
                        </div>
                        <p className="text-gray-900 text-xl font-semibold mb-2">No featured products yet</p>
                        <p className="text-gray-500">Check back soon for our curated picks!</p>
                    </div>
                )}

                {/* Mobile CTA */}
                <div className="mt-10 text-center lg:hidden">
                    <Link
                        to="/products?featured=true"
                        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        View All Featured
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
});

FeaturedProducts.displayName = 'FeaturedProducts';

export default FeaturedProducts;

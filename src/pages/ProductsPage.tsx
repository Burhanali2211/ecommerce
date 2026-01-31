import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import {
    Search, Grid3X3, LayoutList, Star, Heart, ShoppingCart, 
    ChevronDown, ChevronUp, X, SlidersHorizontal, Home, 
    Sparkles, TrendingUp, Percent, Package, ArrowUpDown, 
    Eye, Check, Flame, Clock, Filter, RotateCcw, 
    ChevronLeft, ChevronRight, Zap, Droplet, Wind, Sun, Info, ArrowRight
} from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { ProductCard } from '../components/Product/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterState {
    category: string;
    search: string;
    priceRange: [number, number];
    rating: number;
    brand: string;
    discount: number;
    availability: string;
    sortBy: string;
}

const ProductsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { slug } = useParams<{ slug?: string }>();
    const { products, categories, loading, fetchProducts, pagination } = useProducts();
    const navigate = useNavigate();

    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [comparingIds, setComparingIds] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [expandedFilters, setExpandedFilters] = useState({
        category: false,
        price: false,
        rating: false,
        discount: false,
        availability: false
    });

    // Filter State
    const [filters, setFilters] = useState<FilterState>({
        category: '',
        search: searchParams.get('q') || '',
        priceRange: [0, 100000],
        rating: 0,
        brand: '',
        discount: 0,
        availability: 'all',
        sortBy: 'newest'
    });

    useEffect(() => {
        const categoryParam = searchParams.get('category') || slug || '';
        if (categories.length > 0 && categoryParam) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryParam);
            if (isUUID) {
                setFilters(prev => ({ ...prev, category: categoryParam }));
            } else {
                const category = categories.find(c => c.slug === categoryParam);
                if (category) setFilters(prev => ({ ...prev, category: category.id }));
            }
        }
    }, [categories, searchParams, slug]);

    const filteredProducts = useMemo(() => {
        let filtered = [...products];
        
        if (filters.search) {
            const term = filters.search.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
        }
        
        if (filters.category) filtered = filtered.filter(p => p.categoryId === filters.category);
        
        if (filters.rating > 0) filtered = filtered.filter(p => (p.rating || 4.5) >= filters.rating);
        
        if (filters.discount > 0) {
            filtered = filtered.filter(p => {
                if (!p.originalPrice) return false;
                const d = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
                return d >= filters.discount;
            });
        }
        
        if (filters.availability === 'in-stock') filtered = filtered.filter(p => p.stock > 0);

        filtered = filtered.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);
        
        return filtered;
    }, [products, filters]);

    const sortedProducts = useMemo(() => {
        const sorted = [...filteredProducts];
        switch (filters.sortBy) {
            case 'price-low-high': return sorted.sort((a, b) => a.price - b.price);
            case 'price-high-low': return sorted.sort((a, b) => b.price - a.price);
            case 'rating': return sorted.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
            default: return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    }, [filteredProducts, filters.sortBy]);

    const handleFilterChange = (key: keyof FilterState, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const toggleCompare = (id: string) => {
        setComparingIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(0, 4)
        );
    };

    return (
        <div className="min-h-screen bg-[#f7f8f8]">
            {/* Marketplace Top Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1600px] mx-auto px-4 py-4 md:py-8">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                      <Link to="/" className="hover:text-[#131921]">Home</Link>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-[#131921]">All Products</span>
                   </div>
                   
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#131921]">Marketplace Collection</h1>
                        <p className="text-sm text-gray-500 mt-1">Found {sortedProducts.length} results</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <div className="relative flex-1 md:w-64">
                             <input 
                                type="text"
                                placeholder="Filter within results..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                             />
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                         </div>
                         <div className="flex border border-gray-200 rounded-lg overflow-hidden h-10">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`px-3 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-[#131921] text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`px-3 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-[#131921] text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                            >
                                <LayoutList className="h-4 w-4" />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
                {/* Mobile Filter Toggle */}
                <div className="lg:hidden">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-900">Filters</span>
                            {(filters.category || filters.rating > 0 || filters.discount > 0 || filters.availability !== 'all') && (
                                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    Active
                                </span>
                            )}
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Faceted Sidebar - Hidden on mobile unless open */}
                <aside className={`w-full lg:w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
                    <div className="lg:sticky lg:top-28 space-y-4 bg-white lg:bg-transparent rounded-xl lg:rounded-none p-4 lg:p-0 border border-gray-200 lg:border-0 mt-4 lg:mt-0">
                        <div className="flex items-center justify-between">
                           <h2 className="text-xs font-black text-[#131921] uppercase tracking-widest">Filters</h2>
                           <div className="flex items-center gap-3">
                               <button 
                                  onClick={() => setFilters({ category: '', search: '', priceRange: [0, 100000], rating: 0, brand: '', discount: 0, availability: 'all', sortBy: 'newest' })}
                                  className="text-[10px] font-bold text-amber-600 hover:underline"
                               >
                                  Clear All
                               </button>
                               <button 
                                  onClick={() => setIsFilterOpen(false)}
                                  className="lg:hidden p-1 hover:bg-gray-100 rounded"
                               >
                                  <X className="h-4 w-4 text-gray-500" />
                               </button>
                           </div>
                        </div>

                        <FilterSection 
                            title="Category" 
                            expanded={expandedFilters.category}
                            onToggle={() => setExpandedFilters(p => ({ ...p, category: !p.category }))}
                        >
                            <div className="space-y-1.5 pt-3">
                                <button 
                                    onClick={() => handleFilterChange('category', '')}
                                    className={`flex items-center w-full text-xs py-1 transition-colors ${!filters.category ? 'text-[#131921] font-black' : 'text-gray-500 hover:text-[#131921]'}`}
                                >
                                    All Categories
                                </button>
                                {categories.map(c => (
                                    <button 
                                        key={c.id}
                                        onClick={() => handleFilterChange('category', c.id)}
                                        className={`flex items-center justify-between w-full text-xs py-1 transition-colors ${filters.category === c.id ? 'text-[#131921] font-black' : 'text-gray-500 hover:text-[#131921]'}`}
                                    >
                                        <span className="truncate">{c.name}</span>
                                        <span className="text-[10px] opacity-40 ml-2">{c.productCount}</span>
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        <FilterSection 
                            title="Avg. Customer Rating" 
                            expanded={expandedFilters.rating}
                            onToggle={() => setExpandedFilters(p => ({ ...p, rating: !p.rating }))}
                        >
                            <div className="space-y-2 pt-3">
                                {[4, 3, 2, 1].map(stars => (
                                    <button 
                                        key={stars}
                                        onClick={() => handleFilterChange('rating', filters.rating === stars ? 0 : stars)}
                                        className={`flex items-center gap-1.5 w-full text-xs transition-colors ${filters.rating === stars ? 'text-[#131921] font-black' : 'text-gray-500 hover:text-[#131921]'}`}
                                    >
                                        <div className="flex items-center text-amber-400">
                                           {Array.from({ length: 5 }).map((_, i) => (
                                              <Star key={i} className={`h-3 w-3 ${i < stars ? 'fill-current' : 'text-gray-200'}`} />
                                           ))}
                                        </div>
                                        <span>& Up</span>
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        <FilterSection 
                            title="Price" 
                            expanded={expandedFilters.price}
                            onToggle={() => setExpandedFilters(p => ({ ...p, price: !p.price }))}
                        >
                            <div className="space-y-4 pt-4 px-1">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100000" 
                                    step="500"
                                    value={filters.priceRange[1]}
                                    onChange={(e) => handleFilterChange('priceRange', [0, parseInt(e.target.value)])}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#131921]"
                                />
                                <div className="flex justify-between text-[10px] font-black text-gray-600">
                                    <span>₹0</span>
                                    <span>₹{filters.priceRange[1].toLocaleString()}</span>
                                </div>
                                <div className="flex gap-2">
                                   <div className="relative flex-1">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                                      <input type="number" readOnly value={filters.priceRange[0]} className="w-full h-8 pl-5 pr-1 bg-gray-50 border border-gray-200 rounded text-xs outline-none" />
                                   </div>
                                   <div className="relative flex-1">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                                      <input type="number" readOnly value={filters.priceRange[1]} className="w-full h-8 pl-5 pr-1 bg-gray-50 border border-gray-200 rounded text-xs outline-none" />
                                   </div>
                                </div>
                            </div>
                        </FilterSection>

                        <FilterSection 
                            title="Discount" 
                            expanded={expandedFilters.discount}
                            onToggle={() => setExpandedFilters(p => ({ ...p, discount: !p.discount }))}
                        >
                            <div className="space-y-2 pt-3">
                                {[10, 25, 35, 50].map(d => (
                                    <button 
                                        key={d}
                                        onClick={() => handleFilterChange('discount', filters.discount === d ? 0 : d)}
                                        className={`flex items-center w-full text-xs transition-colors ${filters.discount === d ? 'text-[#131921] font-black' : 'text-gray-500 hover:text-[#131921]'}`}
                                    >
                                        {d}% Off or more
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        <FilterSection 
                            title="Availability" 
                            expanded={expandedFilters.availability}
                            onToggle={() => setExpandedFilters(p => ({ ...p, availability: !p.availability }))}
                        >
                            <div className="space-y-2 pt-3">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                       type="checkbox" 
                                       checked={filters.availability === 'in-stock'}
                                       onChange={(e) => handleFilterChange('availability', e.target.checked ? 'in-stock' : 'all')}
                                       className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500" 
                                    />
                                    <span className="text-xs text-gray-600 group-hover:text-[#131921]">Exclude Out of Stock</span>
                                </label>
                            </div>
                        </FilterSection>
                    </div>
                </aside>

                {/* Main Product Area */}
                <main className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                           <span className="bg-amber-100 text-[#131921] px-2 py-0.5 rounded">ZenMart Best Sellers</span>
                           <span>Featured Brands</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort:</span>
                            <select 
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="h-9 bg-white border border-gray-200 rounded-lg text-xs font-bold px-3 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                            >
                                <option value="newest">Newest Arrivals</option>
                                <option value="price-low-high">Price: Low to High</option>
                                <option value="price-high-low">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/4] bg-white border border-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : sortedProducts.length === 0 ? (
                        <div className="py-32 text-center bg-white rounded-2xl border border-gray-200">
                            <Wind className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-[#131921] mb-2">No results for this selection</h3>
                            <p className="text-sm text-gray-500">Try adjusting your filters or search term.</p>
                            <button 
                               onClick={() => setFilters({ category: '', search: '', priceRange: [0, 100000], rating: 0, brand: '', discount: 0, availability: 'all', sortBy: 'newest' })}
                               className="mt-6 px-6 py-2 bg-[#131921] text-white rounded-lg text-sm font-bold hover:bg-black transition-colors"
                            >
                               Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                            {sortedProducts.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: (index % 6) * 0.05 }}
                                >
                                    <ProductCard 
                                        product={product} 
                                        isListView={viewMode === 'list'} 
                                        onCompareToggle={toggleCompare}
                                        isComparing={comparingIds.includes(product.id)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-12 flex justify-center items-center gap-2">
                            <button 
                                onClick={() => { fetchProducts(pagination.page - 1); window.scrollTo(0,0); }}
                                disabled={pagination.page === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="flex gap-2">
                                {Array.from({ length: pagination.pages }).map((_, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => { fetchProducts(i + 1); window.scrollTo(0,0); }}
                                        className={`w-10 h-10 rounded-lg text-sm font-black transition-all ${pagination.page === i + 1 ? 'bg-[#131921] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => { fetchProducts(pagination.page + 1); window.scrollTo(0,0); }}
                                disabled={pagination.page === pagination.pages}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Floating Comparison Bar */}
            <AnimatePresence>
                {comparingIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-2xl"
                    >
                        <div className="bg-[#131921] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
                                {comparingIds.map(id => {
                                    const p = products.find(prod => prod.id === id);
                                    return (
                                        <div key={id} className="relative flex-shrink-0 group">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 border border-white/20">
                                                <img src={p?.imageUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <button 
                                                onClick={() => toggleCompare(id)}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                                {Array.from({ length: Math.max(0, 4 - comparingIds.length) }).map((_, i) => (
                                    <div key={i} className="w-12 h-12 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-white/20">
                                        <Info className="h-4 w-4" />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-black">{comparingIds.length} Products Selected</p>
                                    <p className="text-[10px] text-gray-400">Up to 4 items</p>
                                </div>
                                <button 
                                    onClick={() => navigate(`/compare?ids=${comparingIds.join(',')}`)}
                                    disabled={comparingIds.length < 2}
                                    className="bg-amber-400 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-400 text-[#131921] px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                                >
                                    Compare Now <ArrowRight className="h-4 w-4" />
                                </button>
                                <button 
                                   onClick={() => setComparingIds([])}
                                   className="p-2 text-gray-400 hover:text-white"
                                >
                                   <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FilterSection: React.FC<{ title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, expanded, onToggle, children }) => (
    <div className="border-b border-gray-200 pb-6 mb-6 last:border-0">
        <button onClick={onToggle} className="flex items-center justify-between w-full group">
            <span className="text-sm font-black text-[#131921] group-hover:text-amber-600 transition-colors uppercase tracking-tight">{title}</span>
            <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-500 ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
            {expanded && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="overflow-hidden"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

export default ProductsPage;

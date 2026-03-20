import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
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
        category: true,
        price: true,
        rating: true,
        discount: false,
        availability: false
    });

    // Separate price slider state so dragging doesn't trigger full re-filter on every pixel
    const [priceSliderValue, setPriceSliderValue] = useState(100000);
    const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
        };
    }, []);

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

    // Debounced fetch — instant for category changes, 400ms delay for search typing
    useEffect(() => {
        const delay = filters.search ? 400 : 0;
        const timer = setTimeout(() => {
            fetchProducts(1, 20, {
                categoryId: filters.category || undefined,
                search: filters.search || undefined
            });
        }, delay);
        return () => clearTimeout(timer);
    }, [filters.category, filters.search, fetchProducts]);

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
            <div className="max-w-[1600px] mx-auto px-4 pt-3 pb-0 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">

                {/* Sidebar Filters */}
                <aside className={`w-full lg:w-60 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
                    <div className="lg:sticky lg:top-28 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-4 lg:mt-0">

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4 text-gray-700" />
                                <h2 className="text-sm font-bold text-gray-900">Filters</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setFilters({ category: '', search: '', priceRange: [0, 100000], rating: 0, brand: '', discount: 0, availability: 'all', sortBy: 'newest' });
                                        setPriceSliderValue(100000);
                                    }}
                                    className="text-[11px] font-semibold text-red-500 hover:text-red-600 cursor-pointer transition-colors"
                                >
                                    Clear all
                                </button>
                                <button onClick={() => setIsFilterOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-100 cursor-pointer">
                                    <X className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Category */}
                        <FilterSection
                            title="Category"
                            expanded={expandedFilters.category}
                            onToggle={() => setExpandedFilters(p => ({ ...p, category: !p.category }))}
                        >
                            <div className="pt-1 pb-2">
                                {[{ id: '', name: 'All Categories' }, ...categories].map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleFilterChange('category', c.id)}
                                        className={`flex items-center justify-between w-full px-4 py-2 text-sm cursor-pointer transition-colors rounded-none hover:bg-gray-50 ${
                                            filters.category === c.id
                                                ? 'text-gray-900 font-semibold bg-gray-50'
                                                : 'text-gray-500'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors ${
                                                filters.category === c.id ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                                            }`} />
                                            <span className="truncate">{c.name}</span>
                                        </div>
                                        {'productCount' in c && c.productCount != null && (
                                            <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">{(c as any).productCount}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        {/* Price */}
                        <FilterSection
                            title="Price Range"
                            expanded={expandedFilters.price}
                            onToggle={() => setExpandedFilters(p => ({ ...p, price: !p.price }))}
                        >
                            <div className="px-4 pb-4 pt-2 space-y-3">
                                <div className="flex justify-between text-xs font-semibold text-gray-700">
                                    <span>₹0</span>
                                    <span className="text-gray-900">₹{priceSliderValue.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100000"
                                    step="500"
                                    value={priceSliderValue}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setPriceSliderValue(val);
                                        if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
                                        priceDebounceRef.current = setTimeout(() => {
                                            handleFilterChange('priceRange', [0, val]);
                                        }, 300);
                                    }}
                                    className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
                                />
                                {/* Quick price chips */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {[299, 499, 999, 2000].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => {
                                                setPriceSliderValue(p);
                                                handleFilterChange('priceRange', [0, p]);
                                            }}
                                            className={`text-[11px] px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                                                priceSliderValue === p
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            Under ₹{p.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FilterSection>

                        {/* Rating */}
                        <FilterSection
                            title="Customer Rating"
                            expanded={expandedFilters.rating}
                            onToggle={() => setExpandedFilters(p => ({ ...p, rating: !p.rating }))}
                        >
                            <div className="pt-1 pb-2">
                                {[4, 3, 2, 1].map(stars => (
                                    <button
                                        key={stars}
                                        onClick={() => handleFilterChange('rating', filters.rating === stars ? 0 : stars)}
                                        className={`flex items-center gap-2.5 w-full px-4 py-2 cursor-pointer transition-colors hover:bg-gray-50 ${
                                            filters.rating === stars ? 'bg-gray-50' : ''
                                        }`}
                                    >
                                        <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors ${
                                            filters.rating === stars ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                                        }`} />
                                        <div className="flex items-center gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`h-3.5 w-3.5 ${i < stars ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-500">& Up</span>
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        {/* Discount */}
                        <FilterSection
                            title="Discount"
                            expanded={expandedFilters.discount}
                            onToggle={() => setExpandedFilters(p => ({ ...p, discount: !p.discount }))}
                        >
                            <div className="pt-1 pb-2">
                                {[10, 25, 35, 50].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => handleFilterChange('discount', filters.discount === d ? 0 : d)}
                                        className={`flex items-center gap-2.5 w-full px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-gray-50 ${
                                            filters.discount === d ? 'bg-gray-50' : ''
                                        }`}
                                    >
                                        <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors ${
                                            filters.discount === d ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                                        }`} />
                                        <span className={`text-sm ${filters.discount === d ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                            {d}% or more
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        {/* Availability */}
                        <FilterSection
                            title="Availability"
                            expanded={expandedFilters.availability}
                            onToggle={() => setExpandedFilters(p => ({ ...p, availability: !p.availability }))}
                        >
                            <div className="px-4 pb-4 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => handleFilterChange('availability', filters.availability === 'in-stock' ? 'all' : 'in-stock')}
                                        className={`w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 relative ${
                                            filters.availability === 'in-stock' ? 'bg-gray-900' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                                            filters.availability === 'in-stock' ? 'left-4' : 'left-0.5'
                                        }`} />
                                    </div>
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">In stock only</span>
                                </label>
                            </div>
                        </FilterSection>
                    </div>
                </aside>

                {/* Main Product Area */}
                <main className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        {/* Filter icon */}
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors ${isFilterOpen ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Filter</span>
                            {(filters.category || filters.rating > 0 || filters.discount > 0 || filters.availability !== 'all') && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            )}
                        </button>

                        {/* Result count */}
                        <span className="text-xs text-gray-400 flex-1">{sortedProducts.length} products</span>

                        {/* Sort */}
                        <select
                            value={filters.sortBy}
                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            className="h-8 bg-white border border-gray-200 rounded-lg text-xs font-medium px-2.5 focus:outline-none cursor-pointer text-gray-700"
                        >
                            <option value="newest">Newest</option>
                            <option value="price-low-high">Price ↑</option>
                            <option value="price-high-low">Price ↓</option>
                            <option value="rating">Top Rated</option>
                        </select>

                        {/* Grid / List toggle */}
                        <div className="flex border border-gray-200 rounded-lg overflow-hidden h-8">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-2.5 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                            >
                                <Grid3X3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-2.5 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                            >
                                <LayoutList className="h-3.5 w-3.5" />
                            </button>
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
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4" : "space-y-3 sm:space-y-4"}>
                            {sortedProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isListView={viewMode === 'list'}
                                    onCompareToggle={toggleCompare}
                                    isComparing={comparingIds.includes(product.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-12 flex justify-center items-center gap-2">
                            <button 
                                onClick={() => { fetchProducts(pagination.page - 1, 20, { categoryId: filters.category || undefined, search: filters.search || undefined }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={pagination.page === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="flex gap-2">
                                {Array.from({ length: pagination.pages }).map((_, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => { fetchProducts(i + 1, 20, { categoryId: filters.category || undefined, search: filters.search || undefined }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className={`w-10 h-10 rounded-lg text-sm font-black transition-all ${pagination.page === i + 1 ? 'bg-[#131921] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => { fetchProducts(pagination.page + 1, 20, { categoryId: filters.category || undefined, search: filters.search || undefined }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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

const FilterSection: React.FC<{ title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }> = memo(({ title, expanded, onToggle, children }) => (
    <div className="border-t border-gray-100">
        <button
            onClick={onToggle}
            className="flex items-center justify-between w-full px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        >
            <span className="text-sm font-semibold text-gray-800">{title}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence initial={false}>
            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
));
FilterSection.displayName = 'FilterSection';

export default ProductsPage;

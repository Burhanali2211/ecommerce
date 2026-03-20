import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Product, ProductContextType, Category, Review } from '../types';
import { supabase, db } from '../lib/supabase';
import { useNotification } from './NotificationContext';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Module-level cache (survives SPA navigation, resets on full page reload) ───
// TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

function cacheClear(pattern: string) {
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(pattern))
      .forEach(k => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}

const CACHE_KEYS = {
  products: (page: number, filters: string) => `pc_products_${page}_${filters}`,
  featured: 'pc_featured',
  latest:   'pc_latest',
  bestSellers: 'pc_bestsellers',
  categories: 'pc_categories',
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ── State initialised from cache immediately — zero loading flash ──
  const [products, setProducts]           = useState<Product[]>(cacheGet<Product[]>(CACHE_KEYS.featured) ? [] : []);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(cacheGet<Product[]>(CACHE_KEYS.featured) || []);
  const [bestSellers, setBestSellers]     = useState<Product[]>(cacheGet<Product[]>(CACHE_KEYS.bestSellers) || []);
  const [latestProducts, setLatestProducts] = useState<Product[]>(cacheGet<Product[]>(CACHE_KEYS.latest) || []);
  const [categories, setCategories]       = useState<Category[]>(cacheGet<Category[]>(CACHE_KEYS.categories) || []);
  const [loading, setLoading]             = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(featuredProducts.length === 0);
  const [bestSellersLoading, setBestSellersLoading] = useState(bestSellers.length === 0);
  const [latestLoading, setLatestLoading] = useState(latestProducts.length === 0);
  const [pagination, setPagination]       = useState<PaginationState>({ page: 1, limit: 20, total: 0, pages: 0 });
  const { showError } = useNotification();

  // Track whether initial homepage fetch has been kicked off
  const initFetched = useRef(false);

  const mapDbProductToAppProduct = useCallback((dbProduct: any): Product => {
    const images = Array.isArray(dbProduct.images) ? dbProduct.images
      : dbProduct.image_url ? [dbProduct.image_url]
      : [];
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      slug: dbProduct.slug,
      description: dbProduct.description || '',
      shortDescription: dbProduct.short_description,
      price: dbProduct.price,
      originalPrice: dbProduct.original_price,
      categoryId: dbProduct.category_id,
      images,
      stock: dbProduct.stock ?? 0,
      minStockLevel: dbProduct.min_stock_level,
      sku: dbProduct.sku,
      weight: dbProduct.weight,
      dimensions: dbProduct.dimensions,
      rating: dbProduct.rating || 0,
      reviewCount: dbProduct.review_count || 0,
      reviews: [],
      sellerId: dbProduct.seller_id,
      sellerName: dbProduct.seller_name || 'Himalayan Spices',
      tags: dbProduct.tags || [],
      specifications: dbProduct.specifications || {},
      featured: dbProduct.is_featured || false,
      showOnHomepage: dbProduct.show_on_homepage || false,
      isActive: dbProduct.is_active,
      metaTitle: dbProduct.meta_title,
      metaDescription: dbProduct.meta_description,
      createdAt: dbProduct.created_at ? new Date(dbProduct.created_at) : new Date(0),
      updatedAt: dbProduct.updated_at ? new Date(dbProduct.updated_at) : undefined,
    };
  }, []);

  const mapDbCategoryToAppCategory = useCallback((dbCategory: any): Category => ({
    id: dbCategory.id,
    name: dbCategory.name,
    slug: dbCategory.slug,
    description: dbCategory.description,
    imageUrl: dbCategory.image_url || '',
    parentId: dbCategory.parent_id,
    isActive: dbCategory.is_active,
    sortOrder: dbCategory.sort_order,
    productCount: dbCategory.product_count || 0,
    createdAt: dbCategory.created_at ? new Date(dbCategory.created_at) : undefined,
    updatedAt: dbCategory.updated_at ? new Date(dbCategory.updated_at) : undefined,
  }), []);

  const fetchCategories = useCallback(async (background = false) => {
    const cached = cacheGet<Category[]>(CACHE_KEYS.categories);
    if (cached && background) { setCategories(cached); return; }
    try {
      const data = await db.getCategories();
      const mapped = data.map(mapDbCategoryToAppCategory);
      setCategories(mapped);
      cacheSet(CACHE_KEYS.categories, mapped);
    } catch (error) {
      showError('Failed to load categories', error instanceof Error ? error.message : undefined);
    }
  }, [showError, mapDbCategoryToAppCategory]);

  const fetchProducts = useCallback(async (page: number = 1, limit: number = 20, filters?: any) => {
    const filterKey = JSON.stringify(filters || {});
    const cacheKey = CACHE_KEYS.products(page, filterKey);

    // For default (page 1, no filters) serve cache instantly then background-refresh
    const isDefault = page === 1 && (!filters || Object.keys(filters).length === 0);
    const cached = isDefault ? cacheGet<{ products: Product[]; pagination: PaginationState }>(cacheKey) : null;

    if (cached) {
      setProducts(cached.products);
      setPagination(cached.pagination);
      // Background refresh — update silently
      (async () => {
        try {
          const response = await db.getProducts({ page, limit, ...filters });
          const mapped = response.data.map(mapDbProductToAppProduct);
          setProducts(mapped);
          setPagination(response.pagination);
          cacheSet(cacheKey, { products: mapped, pagination: response.pagination });
        } catch { /* silent */ }
      })();
      return;
    }

    try {
      setLoading(true);
      const response = await db.getProducts({ page, limit, ...filters });
      const mapped = response.data.map(mapDbProductToAppProduct);
      setProducts(mapped);
      setPagination(response.pagination);
      if (isDefault) cacheSet(cacheKey, { products: mapped, pagination: response.pagination });
    } catch (error) {
      showError('Failed to load products', error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [showError, mapDbProductToAppProduct]);

  const fetchFeaturedProducts = useCallback(async (limit: number = 8) => {
    const cached = cacheGet<Product[]>(CACHE_KEYS.featured);
    if (cached) {
      setFeaturedProducts(cached);
      setFeaturedLoading(false);
      // Silent background refresh
      (async () => {
        try {
          const data = await db.getFeaturedProducts(limit);
          const mapped = data.map(mapDbProductToAppProduct);
          setFeaturedProducts(mapped);
          cacheSet(CACHE_KEYS.featured, mapped);
        } catch { /* silent */ }
      })();
      return;
    }
    try {
      setFeaturedLoading(true);
      const data = await db.getFeaturedProducts(limit);
      const mapped = data.map(mapDbProductToAppProduct);
      setFeaturedProducts(mapped);
      cacheSet(CACHE_KEYS.featured, mapped);
    } catch (error) {
      showError('Failed to load featured products', error instanceof Error ? error.message : undefined);
    } finally {
      setFeaturedLoading(false);
    }
  }, [showError, mapDbProductToAppProduct]);

  const fetchBestSellers = useCallback(async (limit: number = 8) => {
    const cached = cacheGet<Product[]>(CACHE_KEYS.bestSellers);
    if (cached) {
      setBestSellers(cached);
      setBestSellersLoading(false);
      (async () => {
        try {
          const response = await db.getProducts({ bestSellers: true, limit });
          const mapped = response.data.map(mapDbProductToAppProduct);
          setBestSellers(mapped);
          cacheSet(CACHE_KEYS.bestSellers, mapped);
        } catch { /* silent */ }
      })();
      return;
    }
    try {
      setBestSellersLoading(true);
      const response = await db.getProducts({ bestSellers: true, limit });
      const mapped = response.data.map(mapDbProductToAppProduct);
      setBestSellers(mapped);
      cacheSet(CACHE_KEYS.bestSellers, mapped);
    } catch (error) {
      showError('Failed to load best sellers', error instanceof Error ? error.message : undefined);
    } finally {
      setBestSellersLoading(false);
    }
  }, [showError, mapDbProductToAppProduct]);

  const fetchLatestProducts = useCallback(async (limit: number = 8) => {
    const cached = cacheGet<Product[]>(CACHE_KEYS.latest);
    if (cached) {
      setLatestProducts(cached);
      setLatestLoading(false);
      (async () => {
        try {
          const data = await db.getLatestProducts(limit);
          const mapped = data.map(mapDbProductToAppProduct);
          setLatestProducts(mapped);
          cacheSet(CACHE_KEYS.latest, mapped);
        } catch { /* silent */ }
      })();
      return;
    }
    try {
      setLatestLoading(true);
      const data = await db.getLatestProducts(limit);
      const mapped = data.map(mapDbProductToAppProduct);
      setLatestProducts(mapped);
      cacheSet(CACHE_KEYS.latest, mapped);
    } catch (error) {
      showError('Failed to load latest products', error instanceof Error ? error.message : undefined);
    } finally {
      setLatestLoading(false);
    }
  }, [showError, mapDbProductToAppProduct]);

  const fetchReviewsForProduct = useCallback(async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      showError('Failed to load reviews', error instanceof Error ? error.message : undefined);
      return [];
    }
  }, [showError]);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: product.name, description: product.description, price: product.price,
          category_id: product.categoryId, images: product.images, stock: product.stock,
          seller_id: product.sellerId, is_featured: product.featured, show_on_homepage: product.showOnHomepage
        }])
        .select()
        .single();
      if (error) throw error;
      cacheClear('pc_products_');
      await fetchProducts(1);
      return mapDbProductToAppProduct(data);
    } catch (error) {
      showError('Failed to create product', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [showError, fetchProducts, mapDbProductToAppProduct]);

  const submitReview = useCallback(async (review: Omit<Review, 'id' | 'createdAt' | 'profiles'>) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .insert([{ product_id: review.productId, user_id: review.userId, rating: review.rating, comment: review.comment, title: review.title }]);
      if (error) throw error;
    } catch (error) {
      showError('Failed to submit review', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [showError]);

  const getProductById = useCallback(async (id: string) => {
    try {
      const data = await db.getProduct(id);
      return data ? mapDbProductToAppProduct(data) : null;
    } catch (error) {
      showError('Failed to load product', error instanceof Error ? error.message : undefined);
      return null;
    }
  }, [showError, mapDbProductToAppProduct]);

  const searchProducts = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const response = await db.getProducts({ search: query, limit: 50 });
      setProducts(response.data.map(mapDbProductToAppProduct));
      setPagination(response.pagination);
    } catch (error) {
      showError('Search failed', error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [showError, mapDbProductToAppProduct]);

  const filterByCategory = useCallback(async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await db.getProducts({ categoryId, limit: 50 });
      setProducts(response.data.map(mapDbProductToAppProduct));
      setPagination(response.pagination);
    } catch (error) {
      showError('Filter failed', error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [showError, mapDbProductToAppProduct]);

  const createProduct = useCallback(async (data: Partial<Product>) => addProduct(data as any), [addProduct]);

  const updateProduct = useCallback(async (product: Product) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ name: product.name, description: product.description, price: product.price, category_id: product.categoryId, images: product.images, stock: product.stock, is_featured: product.featured, show_on_homepage: product.showOnHomepage })
        .eq('id', product.id)
        .select()
        .single();
      if (error) throw error;
      cacheClear('pc_products_');
      sessionStorage.removeItem(CACHE_KEYS.featured);
      sessionStorage.removeItem(CACHE_KEYS.latest);
      await fetchProducts(pagination?.page || 1);
      return mapDbProductToAppProduct(data);
    } catch (error) {
      showError('Failed to update product', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [showError, fetchProducts, pagination, mapDbProductToAppProduct]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      cacheClear('pc_');
      await fetchProducts(pagination?.page || 1);
    } catch (error) {
      showError('Failed to delete product', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [showError, fetchProducts, pagination]);

  const createCategory = useCallback(async (data: Partial<Category>) => {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .insert([{ name: data.name, slug: data.slug, description: data.description, image_url: data.imageUrl, parent_id: data.parentId, is_active: data.isActive, sort_order: data.sortOrder }])
        .select()
        .single();
      if (error) throw error;
      sessionStorage.removeItem(CACHE_KEYS.categories);
      await fetchCategories();
      return mapDbCategoryToAppCategory(category);
    } catch (error) {
      showError('Failed to create category', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [showError, fetchCategories, mapDbCategoryToAppCategory]);

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .update({ name: data.name, slug: data.slug, description: data.description, image_url: data.imageUrl, parent_id: data.parentId, is_active: data.isActive, sort_order: data.sortOrder })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      sessionStorage.removeItem(CACHE_KEYS.categories);
      await fetchCategories();
      return mapDbCategoryToAppCategory(category);
    } catch (error) {
      showError('Failed to update category', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [showError, fetchCategories, mapDbCategoryToAppCategory]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      sessionStorage.removeItem(CACHE_KEYS.categories);
      await fetchCategories();
    } catch (error) {
      showError('Failed to delete category', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [showError, fetchCategories]);

  const nextPage     = useCallback(() => { if (pagination?.page < pagination?.pages) fetchProducts(pagination.page + 1); }, [pagination, fetchProducts]);
  const previousPage = useCallback(() => { if (pagination?.page > 1) fetchProducts(pagination.page - 1); }, [pagination, fetchProducts]);
  const goToPage     = useCallback((page: number) => { if (page >= 1 && page <= pagination?.pages) fetchProducts(page); }, [pagination, fetchProducts]);

  // ── Initial data load — fire once, all parallel ──
  // Components that call fetchXxx again will get instant cache hits
  useEffect(() => {
    if (initFetched.current) return;
    initFetched.current = true;
    // All 5 run in parallel — fastest possible startup
    Promise.all([
      fetchCategories(),
      fetchProducts(1),
      fetchFeaturedProducts(8),
      fetchLatestProducts(8),
      fetchBestSellers(8),
    ]);
    // Reset on unmount so that if the provider remounts (React StrictMode double-invoke
    // or HMR) a fresh fetch is allowed instead of leaving state empty with no retry.
    return () => { initFetched.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: ProductContextType = {
    products, featuredProducts, bestSellers, latestProducts, categories,
    loading, featuredLoading, bestSellersLoading, latestLoading, pagination,
    fetchProducts, fetchFeaturedProducts, fetchBestSellers, fetchLatestProducts,
    fetchReviewsForProduct, fetchCategories,
    addProduct, submitReview, getProductById, searchProducts, filterByCategory,
    createProduct, updateProduct, deleteProduct,
    createCategory, updateCategory, deleteCategory,
    nextPage, previousPage, goToPage
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

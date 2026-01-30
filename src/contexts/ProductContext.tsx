import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Product, ProductContextType, Category, Review } from '../types';
import { supabase, db } from '../lib/supabase';
import { useError } from './ErrorContext';

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

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [bestSellersLoading, setBestSellersLoading] = useState(false);
  const [latestLoading, setLatestLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const { setError } = useError();

  const mapDbProductToAppProduct = (dbProduct: any): Product => ({
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    description: dbProduct.description,
    shortDescription: dbProduct.short_description,
    price: dbProduct.price,
    originalPrice: dbProduct.original_price,
    categoryId: dbProduct.category_id,
    images: dbProduct.images || [],
    stock: dbProduct.stock,
    minStockLevel: dbProduct.min_stock_level,
    sku: dbProduct.sku,
    weight: dbProduct.weight,
    dimensions: dbProduct.dimensions,
    rating: dbProduct.rating || 0,
    reviewCount: dbProduct.review_count || 0,
    reviews: [], // Reviews fetched separately if needed
    sellerId: dbProduct.seller_id,
    sellerName: dbProduct.seller_name || 'Himalayan Spices',
    tags: dbProduct.tags || [],
    specifications: dbProduct.specifications || {},
    featured: dbProduct.is_featured || false,
    showOnHomepage: dbProduct.show_on_homepage || false,
    isActive: dbProduct.is_active,
    metaTitle: dbProduct.meta_title,
    metaDescription: dbProduct.meta_description,
    createdAt: new Date(dbProduct.created_at),
    updatedAt: dbProduct.updated_at ? new Date(dbProduct.updated_at) : undefined,
  });

  const mapDbCategoryToAppCategory = (dbCategory: any): Category => ({
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
  });

  const fetchCategories = useCallback(async () => {
    try {
      const data = await db.getCategories();
      setCategories(data.map(mapDbCategoryToAppCategory));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch categories');
    }
  }, [setError]);

  const fetchProducts = useCallback(async (page: number = 1, limit: number = 20, filters?: any) => {
    try {
      setLoading(true);
      const response = await db.getProducts({
        page,
        limit,
        ...filters
      });

      setProducts(response.data.map(mapDbProductToAppProduct));
      setPagination(response.pagination);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [setError]);

  const fetchFeaturedProducts = useCallback(async (limit: number = 10) => {
    try {
      setFeaturedLoading(true);
      const data = await db.getFeaturedProducts(limit);
      setFeaturedProducts(data.map(mapDbProductToAppProduct));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch featured products');
    } finally {
      setFeaturedLoading(false);
    }
  }, [setError]);

  const fetchBestSellers = useCallback(async (limit: number = 8) => {
    try {
      setBestSellersLoading(true);
      const response = await db.getProducts({
        bestSellers: true,
        limit
      });
      setBestSellers(response.data.map(mapDbProductToAppProduct));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch best sellers');
    } finally {
      setBestSellersLoading(false);
    }
  }, [setError]);

  const fetchLatestProducts = useCallback(async (limit: number = 8) => {
    try {
      setLatestLoading(true);
      const data = await db.getLatestProducts(limit);
      setLatestProducts(data.map(mapDbProductToAppProduct));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch latest products');
    } finally {
      setLatestLoading(false);
    }
  }, [setError]);

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
      setError(error instanceof Error ? error.message : 'Failed to fetch reviews');
      return [];
    }
  }, [setError]);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: product.name,
          description: product.description,
          price: product.price,
          category_id: product.categoryId,
          images: product.images,
          stock: product.stock,
          seller_id: product.sellerId,
          is_featured: product.featured,
          show_on_homepage: product.showOnHomepage
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchProducts(1);
      return mapDbProductToAppProduct(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create product');
      throw error;
    }
  }, [setError, fetchProducts]);

  const submitReview = useCallback(async (review: Omit<Review, 'id' | 'createdAt' | 'profiles'>) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .insert([{
          product_id: review.productId,
          user_id: review.userId,
          rating: review.rating,
          comment: review.comment,
          title: review.title
        }]);

      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit review');
      throw error;
    }
  }, [setError]);

  const getProductById = useCallback(async (id: string) => {
    try {
      const data = await db.getProduct(id);
      return mapDbProductToAppProduct(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch product');
      return null;
    }
  }, [setError]);

  const searchProducts = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const response = await db.getProducts({
        search: query,
        limit: 50
      });
      setProducts(response.data.map(mapDbProductToAppProduct));
      setPagination(response.pagination);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [setError]);

  const filterByCategory = useCallback(async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await db.getProducts({
        categoryId,
        limit: 50
      });
      setProducts(response.data.map(mapDbProductToAppProduct));
      setPagination(response.pagination);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Filter failed');
    } finally {
      setLoading(false);
    }
  }, [setError]);

  const createProduct = useCallback(async (data: Partial<Product>) => {
    return addProduct(data as any);
  }, [addProduct]);

  const updateProduct = useCallback(async (product: Product) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: product.name,
          description: product.description,
          price: product.price,
          category_id: product.categoryId,
          images: product.images,
          stock: product.stock,
          is_featured: product.featured,
          show_on_homepage: product.showOnHomepage
        })
        .eq('id', product.id)
        .select()
        .single();

      if (error) throw error;
      await fetchProducts(pagination?.page || 1);
      return mapDbProductToAppProduct(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update product');
      throw error;
    }
  }, [setError, fetchProducts, pagination]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts(pagination?.page || 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete product');
      throw error;
    }
  }, [setError, fetchProducts, pagination]);

  const createCategory = useCallback(async (data: Partial<Category>) => {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .insert([{
          name: data.name,
          slug: data.slug,
          description: data.description,
          image_url: data.imageUrl,
          parent_id: data.parentId,
          is_active: data.isActive,
          sort_order: data.sortOrder
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchCategories();
      return mapDbCategoryToAppCategory(category);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create category');
      throw error;
    }
  }, [setError, fetchCategories]);

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          slug: data.slug,
          description: data.description,
          image_url: data.imageUrl,
          parent_id: data.parentId,
          is_active: data.isActive,
          sort_order: data.sortOrder
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchCategories();
      return mapDbCategoryToAppCategory(category);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update category');
      throw error;
    }
  }, [setError, fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCategories();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete category');
      throw error;
    }
  }, [setError, fetchCategories]);

  const nextPage = useCallback(() => {
    if (pagination && pagination.page < pagination.pages) {
      fetchProducts(pagination.page + 1);
    }
  }, [pagination, fetchProducts]);

  const previousPage = useCallback(() => {
    if (pagination && pagination.page > 1) {
      fetchProducts(pagination.page - 1);
    }
  }, [pagination, fetchProducts]);

  const goToPage = useCallback((page: number) => {
    if (pagination && page >= 1 && page <= pagination.pages) {
      fetchProducts(page);
    }
  }, [pagination, fetchProducts]);

  // Initial data loading
  useEffect(() => {
    fetchCategories();
    fetchProducts(1);
    fetchFeaturedProducts(8);
    fetchLatestProducts(8);
    fetchBestSellers(8);
  }, []);

  const value: ProductContextType = {
    products,
    featuredProducts,
    bestSellers,
    latestProducts,
    categories,
    loading,
    featuredLoading,
    bestSellersLoading,
    latestLoading,
    pagination,
    fetchProducts,
    fetchFeaturedProducts,
    fetchBestSellers,
    fetchLatestProducts,
    fetchReviewsForProduct,
    fetchCategories,
    addProduct,
    submitReview,
    getProductById,
    searchProducts,
    filterByCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    nextPage,
    previousPage,
    goToPage
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Product, ProductContextType, Category, Review } from '../types';
import { apiClient } from '../lib/apiClient';
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

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch initial products on mount
  useEffect(() => {
    fetchProducts(1);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch categories');
    }
  }, [setError]);

  const fetchProducts = useCallback(async (page: number = 1, limit: number = 20, filters?: any) => {
    try {
      setLoading(true);
      const response = await apiClient.getProducts({
        page,
        limit,
        ...filters
      });

      setProducts(response.data || []);
      setPagination(response.pagination || {
        page: page,
        limit: limit,
        total: 0,
        pages: 0
      });
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
      const response = await apiClient.getProducts({
        featured: true,
        showOnHomepage: true,
        limit
      });
      setFeaturedProducts(response.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch featured products');
    } finally {
      setFeaturedLoading(false);
    }
  }, [setError]);

  const fetchBestSellers = useCallback(async (limit: number = 8) => {
    try {
      setBestSellersLoading(true);
      const response = await apiClient.getProducts({
        bestSellers: true,
        limit
      });
      setBestSellers(response.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch best sellers');
    } finally {
      setBestSellersLoading(false);
    }
  }, [setError]);

  const fetchLatestProducts = useCallback(async (limit: number = 8) => {
    try {
      setLatestLoading(true);
      const response = await apiClient.getProducts({
        latest: true,
        showOnHomepage: true,
        limit
      });
      setLatestProducts(response.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch latest products');
    } finally {
      setLatestLoading(false);
    }
  }, [setError]);

  const fetchReviewsForProduct = useCallback(async (productId: string) => {
    try {
      // For now, we'll return an empty array since reviews are included in the product data
      // In a more complex implementation, this might fetch reviews separately
      return [];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch reviews');
      return [];
    }
  }, [setError]);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount'>) => {
    try {
      const response = await apiClient.createProduct(product);
      // Refresh products list
      await fetchProducts(1);
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create product');
      throw error;
    }
  }, [setError, fetchProducts]);

  const submitReview = useCallback(async (review: Omit<Review, 'id' | 'createdAt' | 'profiles'>) => {
    try {
      // For now, we'll just log this as reviews would typically be handled separately
      // In a real implementation, this would call an API endpoint to submit the review
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit review');
      throw error;
    }
  }, [setError]);

  const getProductById = useCallback(async (id: string) => {
    try {
      return await apiClient.getProduct(id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch product');
      return null;
    }
  }, [setError]);

  const searchProducts = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const response = await apiClient.getProducts({
        search: query,
        limit: 50
      });
      setProducts(response.data || []);
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
      const response = await apiClient.getProducts({
        categoryId,
        limit: 50
      });
      setProducts(response.data || []);
      setPagination(response.pagination);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Filter failed');
    } finally {
      setLoading(false);
    }
  }, [setError]);

  const createProduct = useCallback(async (data: Partial<Product>) => {
    try {
      const response = await apiClient.createProduct(data);
      // Refresh products list
      await fetchProducts(1);
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create product');
      throw error;
    }
  }, [setError, fetchProducts]);

  const updateProduct = useCallback(async (product: Product) => {
    try {
      const response = await apiClient.updateProduct(product.id, product);
      // Refresh products list
      await fetchProducts(pagination?.page || 1);
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update product');
      throw error;
    }
  }, [setError, fetchProducts, pagination]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await apiClient.deleteProduct(id);
      // Refresh products list
      await fetchProducts(pagination?.page || 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete product');
      throw error;
    }
  }, [setError, fetchProducts, pagination]);

  const createCategory = useCallback(async (data: Partial<Category>) => {
    try {
      const response = await apiClient.createCategory(data);
      // Refresh categories
      await fetchCategories();
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create category');
      throw error;
    }
  }, [setError, fetchCategories]);

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    try {
      const response = await apiClient.updateCategory(id, data);
      // Refresh categories
      await fetchCategories();
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update category');
      throw error;
    }
  }, [setError, fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await apiClient.deleteCategory(id);
      // Refresh categories
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


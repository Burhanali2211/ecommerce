import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product, WishlistItem, WishlistContextType } from '../types';
import { apiClient } from '../lib/apiClient';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.get('/wishlist');
      const wishlistItems = response.data.map((item: any) => ({
        id: item.id,
        product: {
          id: item.product_id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          shortDescription: item.short_description,
          price: Number(item.price),
          originalPrice: item.original_price ? Number(item.original_price) : undefined,
          images: item.images,
          stock: Number(item.stock),
          rating: Number(item.rating),
          reviewCount: Number(item.review_count),
          isFeatured: item.is_featured,
          categoryId: item.category_id,
          category: item.category_name,
          createdAt: item.created_at
        },
        addedAt: new Date(item.created_at)
      }));
      setItems(wishlistItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch wishlist items. Please try again later.'
      });
    }
    setLoading(false);
  }, [user, showNotification]);



  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addItem = async (product: Product) => {
    if (!user) {
      showNotification({
        type: 'info',
        title: 'Authentication Required',
        message: 'Please log in or create an account to add items to your wishlist.'
      });
      return;
    }

    // Check if already in wishlist - if so, remove it (toggle behavior)
    const alreadyInWishlist = isInWishlist(product.id);

    if (alreadyInWishlist) {
      await removeItem(product.id);
      // Don't show notification here - removeItem will handle it
    } else {
      try {
        await apiClient.post('/wishlist', { productId: product.id });
        await fetchWishlist();
        showNotification({ type: 'success', title: 'Added to Wishlist', message: `${product.name} added to your wishlist.` });
      } catch (error: any) {
        console.error('Error adding to wishlist:', error);
        if (error.response?.status === 409) {
          showNotification({ type: 'info', title: 'Already in Wishlist', message: `${product.name} is already in your wishlist.` });
        } else {
          showNotification({ type: 'error', title: 'Error', message: 'Failed to add item to wishlist. Please try again later.' });
        }
      }
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;

    try {
      await apiClient.delete(`/wishlist/${productId}`);
      await fetchWishlist();
      showNotification({ type: 'info', title: 'Removed from Wishlist', message: 'Item removed from your wishlist.' });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to remove item from wishlist. Please try again later.' });
    }
  };

  const isInWishlist = (productId: string) => items.some(item => item.product.id === productId);

  const clearWishlist = async () => {
    if (!user) return;

    try {
      await apiClient.delete('/wishlist');
      setItems([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to clear wishlist. Please try again later.' });
    }
  };

  const value: WishlistContextType = {
    items,
    addItem,
    removeItem,
    isInWishlist,
    clearWishlist,
    loading
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
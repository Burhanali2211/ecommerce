import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product, WishlistItem, WishlistContextType } from '../types';
import { supabase } from '../lib/supabase';
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
      const { data, error } = await supabase
        .from('wishlist')
        .select('*, products(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const wishlistItems = (data || []).map((item: any) => ({
        id: item.id,
        product: {
          id: item.products.id,
          name: item.products.name,
          slug: item.products.slug,
          description: item.products.description,
          shortDescription: item.products.short_description,
          price: Number(item.products.price),
          originalPrice: item.products.original_price ? Number(item.products.original_price) : undefined,
          images: item.products.images || [],
          stock: Number(item.products.stock),
          rating: Number(item.products.rating || 0),
          reviewCount: Number(item.products.review_count || 0),
          featured: item.products.is_featured,
          categoryId: item.products.category_id,
          createdAt: new Date(item.products.created_at)
        },
        productId: item.product_id,
        createdAt: new Date(item.created_at)
      }));
      setItems(wishlistItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch wishlist items.'
      });
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addItem = async (product: Product) => {
    if (!user) {
      showNotification({
        type: 'info',
        title: 'Authentication Required',
        message: 'Please log in to add items to your wishlist.'
      });
      return;
    }

    const alreadyInWishlist = isInWishlist(product.id);

    if (alreadyInWishlist) {
      await removeItem(product.id);
    } else {
      try {
        const { error } = await supabase
          .from('wishlist')
          .insert([{ user_id: user.id, product_id: product.id }]);

        if (error) throw error;
        
        await fetchWishlist();
        showNotification({ type: 'success', title: 'Added to Wishlist', message: `${product.name} added to your wishlist.` });
      } catch (error: any) {
        console.error('Error adding to wishlist:', error);
        showNotification({ type: 'error', title: 'Error', message: 'Failed to add item to wishlist.' });
      }
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      
      await fetchWishlist();
      showNotification({ type: 'info', title: 'Removed', message: 'Item removed from your wishlist.' });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to remove item.' });
    }
  };

  const isInWishlist = (productId: string) => items.some(item => item.product.id === productId);

  const clearWishlist = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setItems([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to clear wishlist.' });
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

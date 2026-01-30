import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CartItem, CartContextType, Product } from '../types';
import { supabase, db } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);

  const mapDbCartItemToAppCartItem = (dbItem: any): CartItem => ({
    id: dbItem.id,
    product: {
      id: dbItem.products.id,
      name: dbItem.products.name,
      price: dbItem.products.price,
      images: dbItem.products.images || [],
      description: dbItem.products.description,
      categoryId: dbItem.products.category_id,
      sellerId: dbItem.products.seller_id,
      stock: dbItem.products.stock,
      rating: dbItem.products.rating || 0,
      reviewCount: dbItem.products.review_count || 0,
      featured: dbItem.products.is_featured || false,
      showOnHomepage: dbItem.products.show_on_homepage || false,
      reviews: [],
      tags: dbItem.products.tags || [],
      sellerName: dbItem.products.seller_name || 'Himalayan Spices',
      createdAt: new Date(dbItem.products.created_at)
    },
    productId: dbItem.product_id,
    variantId: dbItem.variant_id,
    quantity: dbItem.quantity,
    unitPrice: dbItem.unit_price,
    totalPrice: dbItem.total_price,
    createdAt: new Date(dbItem.created_at),
    updatedAt: dbItem.updated_at ? new Date(dbItem.updated_at) : undefined,
  });

  const loadGuestCart = useCallback(() => {
    try {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setGuestCart(parsedCart);
        return parsedCart;
      }
    } catch (error) {
      console.error('Error loading guest cart:', error);
    }
    return [];
  }, []);

  const saveGuestCart = useCallback((cartItems: CartItem[]) => {
    try {
      localStorage.setItem('guestCart', JSON.stringify(cartItems));
      setGuestCart(cartItems);
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const data = await db.getCart(user.id);
        setItems(data.map(mapDbCartItemToAppCartItem));
      } else {
        const guestItems = loadGuestCart();
        setItems(guestItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to load cart' });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, loadGuestCart, showNotification]);

  const mergeGuestCartWithUserCart = useCallback(async () => {
    if (user && guestCart.length > 0) {
      try {
        for (const item of guestCart) {
          await db.addToCart(user.id, item.product.id, item.quantity);
        }
        localStorage.removeItem('guestCart');
        setGuestCart([]);
        await fetchCart();
      } catch (error) {
        console.error('Error merging cart:', error);
      }
    }
  }, [user, guestCart, fetchCart]);

  useEffect(() => {
    if (user) {
      mergeGuestCartWithUserCart();
    } else {
      loadGuestCart();
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = useCallback(async (product: Product, quantity: number = 1, variantId?: string) => {
    try {
      if (user) {
        await db.addToCart(user.id, product.id, quantity);
        await fetchCart();
      } else {
        const existingItemIndex = guestCart.findIndex(
          item => item.product.id === product.id && item.variantId === variantId
        );

        let updatedCart: CartItem[];
        if (existingItemIndex >= 0) {
          updatedCart = guestCart.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          const newItem: CartItem = {
            id: `guest-${Date.now()}`,
            product,
            productId: product.id,
            quantity,
            variantId,
          };
          updatedCart = [...guestCart, newItem];
        }

        saveGuestCart(updatedCart);
        setItems(updatedCart);
      }
      showNotification({ type: 'success', title: 'Added to Cart', message: `${product.name} added to cart.` });
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to add to cart' });
    }
  }, [user, guestCart, fetchCart, saveGuestCart, showNotification]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      if (user) {
        if (!itemId.startsWith('guest-')) {
          await db.updateCartItem(itemId, quantity);
          await fetchCart();
        }
      } else {
        const updatedCart = guestCart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        saveGuestCart(updatedCart);
        setItems(updatedCart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to update quantity' });
    }
  }, [user, guestCart, fetchCart, saveGuestCart, showNotification]);

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      if (user && !itemId.startsWith('guest-')) {
        await db.removeFromCart(itemId);
        await fetchCart();
      } else {
        const updatedCart = guestCart.filter(item => item.id !== itemId);
        saveGuestCart(updatedCart);
        setItems(updatedCart);
      }
      showNotification({ type: 'info', title: 'Removed', message: 'Item removed from cart.' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to remove from cart' });
    }
  }, [user, guestCart, fetchCart, saveGuestCart, showNotification]);

  const clearCart = useCallback(async () => {
    try {
      if (user) {
        await db.clearCart(user.id);
      }
      localStorage.removeItem('guestCart');
      setItems([]);
      setGuestCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to clear cart' });
    }
  }, [user, showNotification]);

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback(async (product: Product, quantity: number = 1, variantId?: string) => {
    await addToCart(product, quantity, variantId);
  }, [addToCart]);

  const removeItem = useCallback(async (productId: string, variantId?: string) => {
    const itemToRemove = items.find(item =>
      item.product.id === productId &&
      (variantId ? item.variantId === variantId : !item.variantId)
    );
    if (itemToRemove && itemToRemove.id) {
      await removeFromCart(itemToRemove.id);
    }
  }, [items, removeFromCart]);

  const updateItemQuantity = useCallback(async (productId: string, quantity: number, variantId?: string) => {
    const itemToUpdate = items.find(item =>
      item.product.id === productId &&
      (variantId ? item.variantId === variantId : !item.variantId)
    );
    if (itemToUpdate && itemToUpdate.id) {
      await updateQuantity(itemToUpdate.id, quantity);
    }
  }, [items, updateQuantity]);

  const value: CartContextType = {
    items,
    loading,
    total: subtotal,
    itemCount,
    addItem,
    updateQuantity: updateItemQuantity,
    removeItem,
    removeFromCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

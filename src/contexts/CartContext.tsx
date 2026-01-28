import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CartItem, CartContextType, Product } from '../types';
import { apiClient } from '../lib/apiClient';
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

  // Load guest cart from localStorage
  const loadGuestCart = useCallback(() => {
    try {
    const savedCart = localStorage.getItem('guestCart');
    if (savedCart) {
      let parsedCart = JSON.parse(savedCart);
      
      // Sanitize cart items: remove 'sample-' prefix from product IDs
      let sanitized = false;
      parsedCart = parsedCart.map((item: CartItem) => {
        if (item.product && item.product.id && item.product.id.startsWith('sample-')) {
          sanitized = true;
          return {
            ...item,
            product: {
              ...item.product,
              id: item.product.id.replace('sample-', '')
            }
          };
        }
        return item;
      });

      if (sanitized) {
        localStorage.setItem('guestCart', JSON.stringify(parsedCart));
      }
      
      setGuestCart(parsedCart);
      return parsedCart;
    }
    } catch (error) {
      // Silently fail
    }
    return [];
  }, []);

  // Save guest cart to localStorage
  const saveGuestCart = useCallback((cartItems: CartItem[]) => {
    try {
      localStorage.setItem('guestCart', JSON.stringify(cartItems));
      setGuestCart(cartItems);
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Merge guest cart with user cart when user logs in
  const mergeGuestCartWithUserCart = useCallback(async () => {
    if (user && guestCart.length > 0) {
      try {
        for (const item of guestCart) {
          await apiClient.addToCart(item.product.id, item.quantity, item.variantId);
        }
        localStorage.removeItem('guestCart');
        setGuestCart([]);
        await fetchCart();
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }, [user, guestCart]);

  // Fetch cart from API or localStorage
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const response = await apiClient.getCart();

        // Handle both response formats: { items: [...] } and { data: { items: [...] } }
        const cartItems = response.items || response.data?.items || response.data || [];

        setItems(cartItems);
      } else {
        const guestItems = loadGuestCart();
        setItems(guestItems);
      }
    } catch (error) {
      console.error('🛒 Error fetching cart:', error);
      if (user) {
        // If API fails for authenticated user, show error
        showNotification({ type: 'error', title: 'Error', message: 'Failed to load cart' });
      }
      // Set empty cart on error
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, loadGuestCart, showNotification]);

  // Load cart on mount and when user changes
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

  // Add item to cart
  const addToCart = useCallback(async (product: any, quantity: number = 1, variantId?: string) => {
    try {
      if (user) {
        await apiClient.addToCart(product.id, quantity, variantId);
        await fetchCart();
        showNotification({ type: 'success', title: 'Added to Cart', message: `${product.name} has been added to your cart.` });
      } else {
        // Check if item already exists in guest cart
        const existingItemIndex = guestCart.findIndex(
          item => item.product.id === product.id && item.variantId === variantId
        );

        let updatedCart: CartItem[];
        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          updatedCart = guestCart.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Add new item with a unique ID
          const newItem: CartItem = {
            id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            product,
            quantity,
            ...(variantId && { variantId }), // Only include variantId if it's provided
          };
          updatedCart = [...guestCart, newItem];
        }

        saveGuestCart(updatedCart);
        setItems(updatedCart);
        showNotification({ type: 'success', title: 'Added to Cart', message: `${product.name} has been added to your cart.` });
      }
    } catch (error: any) {
      // Handle insufficient stock error with better messaging
      if (error?.code === 'INSUFFICIENT_STOCK' || error?.message?.includes('stock') || error?.response?.data?.code === 'INSUFFICIENT_STOCK') {
        const errorMessage = error?.response?.data?.message || error?.message || 'Insufficient stock';
        // Extract stock information if available
        const stockMatch = errorMessage.match(/Available:\s*(\d+)/i);
        const requestedMatch = errorMessage.match(/Requested:\s*(\d+)/i);
        
        let message = 'Sorry, we don\'t have enough stock for this item.';
        if (stockMatch && requestedMatch) {
          const available = parseInt(stockMatch[1]);
          const requested = parseInt(requestedMatch[1]);
          message = `Only ${available} item${available !== 1 ? 's' : ''} available in stock. You requested ${requested}. Please reduce the quantity.`;
        } else if (stockMatch) {
          const available = parseInt(stockMatch[1]);
          message = `Only ${available} item${available !== 1 ? 's' : ''} available in stock.`;
        }
        
        showNotification({ 
          type: 'error', 
          title: 'Insufficient Stock', 
          message,
          duration: 6000
        });
      } else {
        showNotification({ type: 'error', title: 'Error', message: 'Failed to add to cart. Please try again.' });
      }
    }
  }, [user, guestCart, fetchCart, saveGuestCart, showNotification]);

  // Update cart item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      if (user) {
        await apiClient.updateCartItem(itemId, quantity);
        await fetchCart();
      } else {
        const updatedCart = guestCart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        saveGuestCart(updatedCart);
        setItems(updatedCart);
      }
    } catch (error: any) {
      // Handle insufficient stock error with better messaging
      if (error?.code === 'INSUFFICIENT_STOCK' || error?.message?.includes('stock') || error?.response?.data?.code === 'INSUFFICIENT_STOCK') {
        const errorMessage = error?.response?.data?.message || error?.message || 'Insufficient stock';
        const stockMatch = errorMessage.match(/Available:\s*(\d+)/i);
        const requestedMatch = errorMessage.match(/Requested:\s*(\d+)/i);
        
        let message = 'Sorry, we don\'t have enough stock for this item.';
        if (stockMatch && requestedMatch) {
          const available = parseInt(stockMatch[1]);
          const requested = parseInt(requestedMatch[1]);
          message = `Only ${available} item${available !== 1 ? 's' : ''} available. You requested ${requested}. Please reduce the quantity.`;
        } else if (stockMatch) {
          const available = parseInt(stockMatch[1]);
          message = `Only ${available} item${available !== 1 ? 's' : ''} available in stock.`;
        }
        
        showNotification({ 
          type: 'error', 
          title: 'Insufficient Stock', 
          message,
          duration: 6000
        });
      } else {
        showNotification({ type: 'error', title: 'Error', message: 'Failed to update cart. Please try again.' });
      }
    }
  }, [user, guestCart, fetchCart, saveGuestCart, showNotification]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      if (user) {
        await apiClient.removeFromCart(itemId);
        await fetchCart();
      } else {
        const updatedCart = guestCart.filter(item => item.id !== itemId);
        saveGuestCart(updatedCart);
        setItems(updatedCart);
      }
      showNotification({ type: 'info', title: 'Removed from Cart', message: 'Item removed from your cart.' });
    } catch (error) {
      showNotification({ type: 'error', title: 'Error', message: 'Failed to remove from cart' });
    }
  }, [user, guestCart, fetchCart, saveGuestCart, showNotification]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      if (user) {
        await apiClient.clearCart();
      }
      localStorage.removeItem('guestCart');
      setItems([]);
      setGuestCart([]);
      showNotification({ type: 'success', title: 'Cart Cleared', message: 'Cart cleared successfully.' });
    } catch (error) {
      showNotification({ type: 'error', title: 'Error', message: 'Failed to clear cart' });
    }
  }, [user, showNotification]);

  // Calculate totals with null checks and type conversion
  const subtotal = items.reduce((sum, item) => {
    if (item.product && item.product.price !== undefined && item.product.price !== null) {
      // Convert price to number in case it's a string from the API
      const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
      const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;

      if (!isNaN(price) && !isNaN(quantity)) {
        const itemTotal = price * quantity;
        return sum + itemTotal;
      }
    }
    console.warn('🛒 Item missing product or price:', item);
    return sum;
  }, 0);
  const itemCount = items.reduce((sum, item) => {
    const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
    return sum + (isNaN(quantity) ? 0 : quantity);
  }, 0);


  // Wrapper functions to match type definitions
  const addItem = useCallback(async (product: Product, quantity: number = 1, variantId?: string) => {
    await addToCart(product, quantity, variantId);
  }, [addToCart]);

  const removeItem = useCallback(async (productId: string, variantId?: string) => {
    // Find the cart item by productId and variantId
    const itemToRemove = items.find(item =>
      item.product.id === productId &&
      (variantId ? item.variantId === variantId : !item.variantId)
    );
    if (itemToRemove && itemToRemove.id) {
      await removeFromCart(itemToRemove.id);
    }
  }, [items, removeFromCart]);

  const updateItemQuantity = useCallback(async (productId: string, quantity: number, variantId?: string) => {
    // Find the cart item by productId and variantId
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
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Order, CartItem, Address, OrderContextType } from '../types';
import { apiClient } from '../lib/apiClient';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.getOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load orders. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // Initial fetch
  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  const createOrder = async (
    items: CartItem[],
    shippingAddress: Address,
    paymentMethod: string,
    total: number,
    razorpay_order_id?: string
  ): Promise<string | null> => {
    if (!user) {
      showNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to place an order'
      });
      return null;
    }

    setLoading(true);

    try {
      // Transform cart items to order items format
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        productId: item.product.id, // Include both for compatibility
        quantity: item.quantity,
        price: item.product.price,
        variantId: item.variantId
      }));


      const response = await apiClient.createOrder({
        items: orderItems,
        shippingAddress,
        billingAddress: shippingAddress, // For now, use shipping address as billing
        paymentMethod,
        total,
        razorpay_order_id
      });

      if (response.data?.id) {
        // Refresh orders list to include the new order
        await fetchUserOrders();
        showNotification({
          type: 'success',
          title: 'Order Placed Successfully!',
          message: 'Your order has been saved and will appear in your order history.',
          duration: 5000
        });
        return response.data.id;
      } else {
        showNotification({
          type: 'error',
          title: 'Order Failed',
          message: 'Failed to create order. Please try again.'
        });
        return null;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showNotification({
        type: 'error',
        title: 'Order Failed',
        message: 'An unexpected error occurred. Please try again.'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      await apiClient.updateOrderStatus(orderId, status);
      await fetchUserOrders();
      showNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Order status updated to ${status}`
      });
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update order status. Please try again later.'
      });
      return false;
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const response = await apiClient.getOrder(orderId);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching order:', error);
      // Check local orders as fallback
      const localOrder = orders.find(order => order.id === orderId);
      if (localOrder) return localOrder;

      return null;
    }
  };

  const getUserOrders = async (userId?: string): Promise<Order[]> => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return [];

    try {
      const response = await apiClient.getOrders();
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  };

  const value: OrderContextType = {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    getOrderById,
    getUserOrders
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
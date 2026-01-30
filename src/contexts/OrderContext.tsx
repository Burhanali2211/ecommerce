import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Order, CartItem, Address, OrderContextType, OrderItem } from '../types';
import { supabase, db } from '../lib/supabase';
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

  const mapDbOrderToAppOrder = (dbOrder: any): Order => ({
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    userId: dbOrder.user_id,
    items: (dbOrder.order_items || []).map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      productSnapshot: item.product_snapshot,
      createdAt: new Date(item.created_at),
      product: item.products ? {
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        images: item.products.images || [],
      } : undefined
    })),
    total: dbOrder.total_amount,
    subtotal: dbOrder.subtotal,
    taxAmount: dbOrder.tax_amount,
    shippingAmount: dbOrder.shipping_amount,
    discountAmount: dbOrder.discount_amount,
    status: dbOrder.status,
    paymentStatus: dbOrder.payment_status,
    paymentMethod: dbOrder.payment_method,
    paymentId: dbOrder.payment_id,
    currency: dbOrder.currency || 'INR',
    shippingAddress: dbOrder.shipping_address,
    billingAddress: dbOrder.billing_address,
    notes: dbOrder.notes,
    trackingNumber: dbOrder.tracking_number,
    shippedAt: dbOrder.shipped_at ? new Date(dbOrder.shipped_at) : undefined,
    deliveredAt: dbOrder.delivered_at ? new Date(dbOrder.delivered_at) : undefined,
    createdAt: new Date(dbOrder.created_at),
    updatedAt: dbOrder.updated_at ? new Date(dbOrder.updated_at) : undefined,
  });

  const fetchUserOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data.map(mapDbOrderToAppOrder));
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
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Calculate subtotal, tax, etc.
      const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shippingAmount = total > 1000 ? 0 : 50; // Simple logic
      const taxAmount = subtotal * 0.18; // 18% GST example

      // 1. Create order record
      const orderData = {
        user_id: user.id,
        order_number: orderNumber,
        total_amount: total,
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        status: 'pending',
        payment_status: 'pending',
        payment_method: paymentMethod,
        razorpay_order_id: razorpay_order_id,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_snapshot: item.product
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Clear cart if order created successfully
      await db.clearCart(user.id);

      await fetchUserOrders();
      showNotification({
        type: 'success',
        title: 'Order Placed!',
        message: `Order ${orderNumber} created successfully.`
      });

      return order.id;
    } catch (error) {
      console.error('Error creating order:', error);
      showNotification({
        type: 'error',
        title: 'Order Failed',
        message: 'Failed to create order. Please try again.'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      await fetchUserOrders();
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      return mapDbOrderToAppOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      return orders.find(o => o.id === orderId) || null;
    }
  };

  const getUserOrders = async (userId?: string): Promise<Order[]> => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return [];

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(mapDbOrderToAppOrder);
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

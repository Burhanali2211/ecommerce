import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, Package, Truck, Printer, Loader2, AlertCircle, CheckCircle,
  DollarSign, User, MapPin, Calendar, CreditCard, Edit, Save, X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';
import { ConfirmModal } from '../../Common/Modal';
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  getPaymentMethodConfig,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  getNextPossibleStatuses,
  OrderStatus
} from '../../../utils/orderStatusUtils';

interface OrderDetailsProps {
  orderId: string;
  onClose: () => void;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_status: string;
  payment_method: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  payment_method_details?: any;
  subtotal: string;
  tax_amount: string;
  shipping_amount: string;
  discount_amount: string;
  total_amount: string;
  shipping_address: any;
  billing_address: any;
  tracking_number: string;
  created_at: string;
  items: OrderItem[];
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { data: orderRow, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      if (!orderRow) {
        setOrder(null);
        return;
      }
      const { data: items } = await supabase
        .from('order_items')
        .select('*, products(name, images)')
        .eq('order_id', orderId);
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', orderRow.user_id)
        .single();
      const orderData: OrderData = {
        id: orderRow.id,
        order_number: orderRow.order_number || orderRow.id,
        customer_name: profile?.full_name || 'Guest',
        customer_email: profile?.email || '',
        status: orderRow.status,
        payment_status: orderRow.payment_status || 'pending',
        payment_method: orderRow.payment_method || 'cod',
        razorpay_payment_id: orderRow.razorpay_payment_id,
        razorpay_order_id: orderRow.razorpay_order_id,
        payment_method_details: orderRow.payment_method_details,
        subtotal: orderRow.subtotal != null ? String(orderRow.subtotal) : '0',
        tax_amount: orderRow.tax_amount != null ? String(orderRow.tax_amount) : '0',
        shipping_amount: orderRow.shipping_amount != null ? String(orderRow.shipping_amount) : '0',
        discount_amount: orderRow.discount_amount != null ? String(orderRow.discount_amount) : '0',
        total_amount: orderRow.total_amount != null ? String(orderRow.total_amount) : '0',
        shipping_address: orderRow.shipping_address || {},
        billing_address: orderRow.billing_address || {},
        tracking_number: orderRow.tracking_number || '',
        created_at: orderRow.created_at,
        items: (items || []).map((i: any) => ({
          id: i.id,
          product_id: i.product_id,
          product_name: i.products?.name || 'Product',
          product_image: Array.isArray(i.products?.images) ? i.products.images[0] : '',
          quantity: i.quantity,
          unit_price: String(i.unit_price || 0),
          total_price: String((i.quantity || 0) * parseFloat(i.unit_price || '0'))
        }))
      };
      setOrder(orderData);
      setNewStatus(orderData.status);
      setNewPaymentStatus(orderData.payment_status);
      setTrackingNumber(orderData.tracking_number || '');
    } catch (error: any) {
      showError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order || newStatus === order.status) {
      setShowStatusModal(false);
      return;
    }

    try {
      setUpdating(true);
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      showSuccess('Order status updated successfully');
      setShowStatusModal(false);
      fetchOrderDetails();
    } catch (error: any) {
      showError(error.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!order || newPaymentStatus === order.payment_status) return;

    try {
      setUpdating(true);
      const { error } = await supabase.from('orders').update({ payment_status: newPaymentStatus }).eq('id', orderId);
      if (error) throw error;
      showSuccess('Payment status updated successfully');
      await fetchOrderDetails();
    } catch (error: any) {
      showError(error.message || 'Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!order) return;
    
    // Allow empty tracking number (to clear it)
    const trimmedTracking = trackingNumber.trim();
    
    if (trimmedTracking === (order.tracking_number || '')) return;

    try {
      setUpdating(true);
      const { error } = await supabase.from('orders').update({ tracking_number: trimmedTracking || null }).eq('id', orderId);
      if (error) throw error;
      showSuccess(trimmedTracking ? 'Tracking number updated successfully' : 'Tracking number cleared');
      await fetchOrderDetails();
    } catch (error: any) {
      showError(error.message || 'Failed to update tracking number');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (order) {
      window.print();
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'processing': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'confirmed': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'refunded': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'refunded': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const renderStatusBadge = (status: string, isPayment: boolean = false) => {
    const config = isPayment ? getPaymentStatusConfig(status) : getOrderStatusConfig(status);
    const Icon = config.icon;
    const colorClasses = isPayment ? getPaymentStatusColor(status) : getStatusColor(status);

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClasses}`}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  const renderPaymentMethod = (method: string) => {
    const config = getPaymentMethodConfig(method);
    const Icon = config.icon;

    return (
      <div className="inline-flex items-center gap-2">
        <Icon className="h-5 w-5 text-white/60" />
        <span className="text-sm font-medium text-white">{config.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60 mb-4">Order not found</p>
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{order.order_number}</h1>
              {renderStatusBadge(order.status, false)}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Calendar className="h-4 w-4" />
              <span>
                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handlePrintInvoice}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-all hover:scale-105"
        >
          <Printer className="h-5 w-5" />
          <span>Print Invoice</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-amber-400" />
            <p className="text-xs text-white/60 uppercase">Total Amount</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(order.total_amount)}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-blue-400" />
            <p className="text-xs text-white/60 uppercase">Items</p>
          </div>
          <p className="text-2xl font-bold text-white">{order.items.length}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            <p className="text-xs text-white/60 uppercase">Payment</p>
          </div>
          <div className="mt-1">{renderStatusBadge(order.payment_status, true)}</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-5 w-5 text-purple-400" />
            <p className="text-xs text-white/60 uppercase">Tracking</p>
          </div>
          <p className="text-sm font-medium text-white mt-1">
            {order.tracking_number || 'Not assigned'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items - Main Focus */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Order Items</h2>
                    <p className="text-sm text-white/60">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {order.items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                    <img
                      src={item.product_image || '/placeholder.png'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base text-white mb-2">{item.product_name}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">Quantity:</span>
                        <span className="font-medium text-white">{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">Unit Price:</span>
                        <span className="font-medium text-white">{formatCurrency(item.unit_price)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-amber-400">{formatCurrency(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="p-5 border-t border-white/10 bg-white/5">
              <h3 className="text-base font-semibold text-white mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Subtotal</span>
                  <span className="font-medium text-white">{formatCurrency(order.subtotal)}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Discount</span>
                    <span className="font-medium text-emerald-400">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Tax</span>
                  <span className="font-medium text-white">{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Shipping</span>
                  <span className="font-medium text-white">{formatCurrency(order.shipping_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-white/10">
                  <span className="text-white">Total Amount</span>
                  <span className="text-amber-400">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Customer Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/60 mb-1">Name</p>
                <p className="font-medium text-white">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Email</p>
                <p className="font-medium text-white break-all">{order.customer_email}</p>
              </div>
              {order.shipping_address && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-white/60" />
                    <p className="text-xs text-white/60">Shipping Address</p>
                  </div>
                  <div className="pl-6 text-sm text-white">
                    <p>{order.shipping_address.street_address}</p>
                    <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                    <p>{order.shipping_address.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Payment Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/60 mb-1">Payment Status</p>
                <div className="mt-1">{renderStatusBadge(order.payment_status, true)}</div>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Payment Method</p>
                <p className="font-medium text-white">{order.payment_method || 'N/A'}</p>
              </div>
              {order.payment_status === 'paid' && (
                <>
                  <div>
                    <p className="text-xs text-white/60 mb-1">Amount Paid</p>
                    <p className="font-semibold text-lg text-emerald-400">{formatCurrency(order.total_amount)}</p>
                  </div>
                  {order.razorpay_payment_id && (
                    <div>
                      <p className="text-xs text-white/60 mb-1">Razorpay Payment ID</p>
                      <p className="font-mono text-sm text-white break-all bg-white/5 px-2 py-1 rounded border border-white/10">
                        {order.razorpay_payment_id}
                      </p>
                    </div>
                  )}
                  {order.razorpay_order_id && (
                    <div>
                      <p className="text-xs text-white/60 mb-1">Razorpay Order ID</p>
                      <p className="font-mono text-sm text-white break-all bg-white/5 px-2 py-1 rounded border border-white/10">
                        {order.razorpay_order_id}
                      </p>
                    </div>
                  )}
                  {order.payment_method_details && (
                    <div>
                      <p className="text-xs text-white/60 mb-2">Payment Details</p>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2">
                        {order.payment_method_details.method && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">Method:</span>
                            <span className="text-white font-medium capitalize">{order.payment_method_details.method}</span>
                          </div>
                        )}
                        {order.payment_method_details.card && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">Card:</span>
                            <span className="text-white font-medium">
                              {order.payment_method_details.card.last4 ? 
                                `****${order.payment_method_details.card.last4} (${order.payment_method_details.card.network || 'Card'})` : 
                                'Card Payment'
                              }
                            </span>
                          </div>
                        )}
                        {order.payment_method_details.vpa && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">UPI ID:</span>
                            <span className="text-white font-medium">{order.payment_method_details.vpa}</span>
                          </div>
                        )}
                        {order.payment_method_details.bank && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">Bank:</span>
                            <span className="text-white font-medium">{order.payment_method_details.bank}</span>
                          </div>
                        )}
                        {order.payment_method_details.wallet && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">Wallet:</span>
                            <span className="text-white font-medium">{order.payment_method_details.wallet}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Manage Order Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Edit className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Manage Order</h2>
            </div>
            <div className="space-y-5">
              {/* Order Status Update */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Order Status
                </label>
                <p className="text-xs text-white/60 mb-3">
                  Current: <span className="font-medium text-white">{getOrderStatusConfig(order.status).label}</span>
                </p>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white transition-all appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1em 1em',
                    paddingRight: '2.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => (
                    <option 
                      key={key} 
                      value={key}
                      style={{
                        backgroundColor: '#1f2937',
                        color: '#ffffff'
                      }}
                    >
                      {config.label}
                    </option>
                  ))}
                </select>
                {newStatus !== order.status && (
                  <button
                    onClick={() => setShowStatusModal(true)}
                    disabled={updating}
                    className="mt-3 w-full px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update Status
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="border-t border-white/10 pt-5">
                {/* Payment Status Update */}
                <label className="block text-sm font-medium text-white mb-2">
                  Payment Status
                </label>
                <p className="text-xs text-white/60 mb-3">
                  Current: <span className="font-medium text-white">{getPaymentStatusConfig(order.payment_status).label}</span>
                </p>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white transition-all disabled:opacity-50 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1em 1em',
                    paddingRight: '2.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => (
                    <option 
                      key={key} 
                      value={key}
                      style={{
                        backgroundColor: '#1f2937',
                        color: '#ffffff'
                      }}
                    >
                      {config.label}
                    </option>
                  ))}
                </select>
                {newPaymentStatus !== order.payment_status && (
                  <button
                    onClick={handleUpdatePaymentStatus}
                    disabled={updating}
                    className="mt-3 w-full px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update Payment Status
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="border-t border-white/10 pt-5">
                {/* Tracking Number */}
                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Tracking Number
                </label>
                <p className="text-xs text-white/60 mb-3">
                  {order.tracking_number ? (
                    <>Current: <span className="font-medium text-white">{order.tracking_number}</span></>
                  ) : (
                    'No tracking number assigned'
                  )}
                </p>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number (optional)"
                  disabled={updating}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white placeholder-white/40 transition-all disabled:opacity-50"
                />
                {trackingNumber.trim() !== (order.tracking_number || '').trim() && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={handleUpdateTracking}
                      disabled={updating}
                      className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {trackingNumber.trim() ? 'Update Tracking' : 'Clear Tracking'}
                        </>
                      )}
                    </button>
                    {!trackingNumber.trim() && order.tracking_number && (
                      <p className="text-xs text-white/60 text-center">
                        Leave empty to clear tracking number
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method Info */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Payment Method</h3>
            <div className="flex items-center gap-2">
              {renderPaymentMethod(order.payment_method)}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Confirmation Modal */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleUpdateStatus}
        title="Update Order Status"
        message={`Are you sure you want to change the order status from "${getOrderStatusConfig(order.status).label}" to "${getOrderStatusConfig(newStatus).label}"?`}
        confirmText="Update"
        variant="warning"
        loading={updating}
      />
    </div>
  );
};

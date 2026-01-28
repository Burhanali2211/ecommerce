import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Package, Truck, CheckCircle, Clock, MapPin, 
  CreditCard, ArrowLeft, Loader2, AlertCircle,
  Calendar, Phone, Mail, Copy, Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';
import { getOrderStatusConfig, getPaymentStatusConfig } from '@/utils/orderStatusUtils';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    images: string[];
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface TrackingEvent {
  id: string;
  status: string;
  message: string | null;
  location: string | null;
  createdAt: string;
  date: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: any;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  created_at: string;
  items: OrderItem[];
  trackingHistory: TrackingEvent[];
}

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/orders/${orderId}`);
      
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError('Order not found');
      }
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const copyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      showNotification({
        type: 'success',
        title: 'Copied!',
        message: 'Order number copied to clipboard'
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'confirmed':
      case 'processing':
        return <Package className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    const config = getOrderStatusConfig(status);
    return {
      bg: config.bgColor,
      text: config.color,
      border: config.borderColor
    };
  };

  const getPaymentStatusColor = (status: string) => {
    const config = getPaymentStatusConfig(status);
    return {
      bg: config.bgColor,
      text: config.color,
      border: config.borderColor
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/orders')}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(order.status);
  const paymentStatusColor = getPaymentStatusConfig(order.paymentStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Tracking</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Order Number:</span>
                  <button
                    onClick={copyOrderNumber}
                    className="flex items-center gap-2 font-mono font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <span>#{order.orderNumber}</span>
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  Placed on {formatDate(order.created_at)}
                </span>
              </div>
            </div>
            <Link
              to="/dashboard/orders"
              className="px-6 py-2 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View All Orders
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Order Status</h2>
                <div className={`px-4 py-2 rounded-xl border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="font-semibold capitalize">{order.status}</span>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="relative">
                {order.trackingHistory && order.trackingHistory.length > 0 ? (
                  <div className="space-y-6">
                    {order.trackingHistory.map((event, index) => {
                      const isLast = index === order.trackingHistory.length - 1;
                      const eventStatusColor = getStatusColor(event.status);
                      
                      return (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${eventStatusColor.bg} ${eventStatusColor.text} border-2 ${eventStatusColor.border} shadow-lg`}>
                              {getStatusIcon(event.status)}
                            </div>
                            {!isLast && (
                              <div className={`w-0.5 h-16 ${eventStatusColor.bg} mt-2`} />
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 capitalize">{event.status}</h3>
                              <span className="text-sm text-gray-500">{formatDate(event.createdAt)}</span>
                            </div>
                            {event.message && (
                              <p className="text-gray-600 mb-1">{event.message}</p>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No tracking updates yet</p>
                    <p className="text-sm text-gray-400 mt-2">Tracking information will appear here once your order is processed</p>
                  </div>
                )}
              </div>

              {/* Tracking Number */}
              {order.trackingNumber && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                      <p className="font-mono font-semibold text-gray-900">{order.trackingNumber}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.trackingNumber!);
                        showNotification({
                          type: 'success',
                          title: 'Copied!',
                          message: 'Tracking number copied to clipboard'
                        });
                      }}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                      <img
                        src={item.product.images?.[0] || '/placeholder.png'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Quantity: {item.quantity}</span>
                        <span>•</span>
                        <span>Price: {formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (GST)</span>
                    <span>{formatCurrency(order.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{order.shippingAmount > 0 ? formatCurrency(order.shippingAmount) : 'FREE'}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-indigo-600 text-lg">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{order.paymentMethod || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${paymentStatusColor.bg} ${paymentStatusColor.text} ${paymentStatusColor.border}`}>
                    <span className="font-semibold capitalize">{order.paymentStatus}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
                <div className="space-y-2 text-gray-600">
                  <p className="font-medium text-gray-900">{order.shippingAddress.fullName || order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.streetAddress || order.shippingAddress.street}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode || order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{order.shippingAddress.phone}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;


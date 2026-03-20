import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Package, Truck, CheckCircle, Clock, MapPin,
  CreditCard, ArrowLeft, Loader2, AlertCircle,
  Copy, Check, XCircle, ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/contexts/NotificationContext';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface TrackingEvent {
  id: string;
  status: string;
  message: string | null;
  location: string | null;
  created_at: string;
}

interface OrderData {
  id: string;
  order_number: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_address: any;
  tracking_number: string | null;
  created_at: string;
  items: OrderItem[];
  trackingEvents: TrackingEvent[];
}

// The canonical order journey - always show all steps
const JOURNEY_STEPS = [
  { key: 'pending',    label: 'Order Placed',  icon: ShoppingBag },
  { key: 'confirmed',  label: 'Confirmed',     icon: CheckCircle },
  { key: 'processing', label: 'Packing',       icon: Package },
  { key: 'shipped',    label: 'Shipped',       icon: Truck },
  { key: 'delivered',  label: 'Delivered',     icon: CheckCircle },
] as const;

// Map status to journey index (which steps are completed/active)
const STATUS_ORDER: Record<string, number> = {
  pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4,
};

const fmt = (n: number) =>
  `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: orderRow, error: ordErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (ordErr) throw ordErr;

      const [itemsRes, trackingRes] = await Promise.all([
        supabase.from('order_items').select('*, products(name, images)').eq('order_id', orderId),
        supabase.from('order_tracking').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
      ]);

      setOrder({
        id: orderRow.id,
        order_number: orderRow.order_number || orderRow.id.slice(0, 8).toUpperCase(),
        total_amount: Number(orderRow.total_amount),
        subtotal: Number(orderRow.subtotal || 0),
        tax_amount: Number(orderRow.tax_amount || 0),
        shipping_amount: Number(orderRow.shipping_amount || 0),
        discount_amount: Number(orderRow.discount_amount || 0),
        status: orderRow.status,
        payment_status: orderRow.payment_status,
        payment_method: orderRow.payment_method,
        shipping_address: orderRow.shipping_address || {},
        tracking_number: orderRow.tracking_number || null,
        created_at: orderRow.created_at,
        items: (itemsRes.data || []).map((i: any) => ({
          id: i.id,
          product_name: i.products?.name || 'Product',
          product_image: Array.isArray(i.products?.images) ? i.products.images[0] : '',
          quantity: i.quantity,
          unit_price: Number(i.unit_price || 0),
          total_price: Number(i.quantity) * Number(i.unit_price || 0),
        })),
        trackingEvents: trackingRes.data || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, type: 'order' | 'tracking') => {
    navigator.clipboard.writeText(text);
    if (type === 'order') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedTracking(true);
      showNotification({ type: 'success', title: 'Copied!', message: 'Tracking number copied' });
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard/orders')}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currentStepIdx = isCancelled ? -1 : (STATUS_ORDER[order.status] ?? 0);
  const addr = order.shipping_address;
  const addrLine = [
    addr?.streetAddress || addr?.street_address || addr?.street,
    addr?.city && addr?.state ? `${addr.city}, ${addr.state}` : addr?.city || addr?.state,
    addr?.postalCode || addr?.postal_code || addr?.zipCode,
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Order Tracking</h1>
            <button
              onClick={() => copyText(order.order_number, 'order')}
              className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 transition-colors"
            >
              <span className="font-mono">#{order.order_number}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <Link
            to="/dashboard/orders"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            All Orders
          </Link>
        </div>

        {/* Visual progress stepper */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-5"
        >
          {isCancelled ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
              <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-700">Order Cancelled</p>
                <p className="text-sm text-red-500">This order has been cancelled.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5">
                Order Progress
              </p>

              {/* Step bubbles + connector */}
              <div className="relative flex items-start justify-between">
                {/* Background connector line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100" />

                {/* Completed connector (dynamic width) */}
                {currentStepIdx > 0 && (
                  <div
                    className="absolute top-5 left-5 h-0.5 bg-purple-500 transition-all duration-500"
                    style={{ width: `calc(${(currentStepIdx / (JOURNEY_STEPS.length - 1)) * 100}% - 40px)` }}
                  />
                )}

                {JOURNEY_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx < currentStepIdx;
                  const isActive = idx === currentStepIdx;

                  return (
                    <div key={step.key} className="relative flex flex-col items-center" style={{ width: `${100 / JOURNEY_STEPS.length}%` }}>
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all
                        ${isCompleted ? 'bg-purple-600 border-purple-600 shadow-md shadow-purple-200' :
                          isActive   ? 'bg-purple-100 border-purple-500 shadow-md shadow-purple-100' :
                                       'bg-white border-gray-200'}
                      `}>
                        <Icon className={`w-4 h-4 ${
                          isCompleted ? 'text-white' :
                          isActive    ? 'text-purple-600' :
                                        'text-gray-300'
                        }`} />
                      </div>
                      <p className={`text-xs mt-2 text-center leading-tight ${
                        isCompleted || isActive ? 'text-gray-700 font-medium' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {isActive && (
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tracking number if available */}
              {order.tracking_number && (
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Tracking Number</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">{order.tracking_number}</p>
                  </div>
                  <button
                    onClick={() => copyText(order.tracking_number!, 'tracking')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    {copiedTracking ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                </div>
              )}
            </>
          )}

          {/* Tracking events timeline */}
          {order.trackingEvents.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Updates</p>
              {[...order.trackingEvents].reverse().map((event, idx) => {
                const isFirst = idx === 0;
                return (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${isFirst ? 'bg-purple-500' : 'bg-gray-300'}`} />
                      {idx < order.trackingEvents.length - 1 && (
                        <div className="w-px flex-1 bg-gray-100 mt-1" style={{ minHeight: 24 }} />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-gray-900 capitalize">{event.status}</p>
                      {event.message && <p className="text-xs text-gray-500 mt-0.5">{event.message}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        {event.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(event.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Order items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
            <Package className="w-4 h-4 text-purple-600" />
            <h2 className="font-semibold text-gray-900">
              {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{fmt(item.unit_price)} × {item.quantity}</p>
                </div>
                <p className="font-semibold text-sm text-gray-900 flex-shrink-0">{fmt(item.total_price)}</p>
              </div>
            ))}
          </div>

          {/* Price summary */}
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
            </div>
            {order.tax_amount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>GST (18%)</span><span>{fmt(order.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span>{order.shipping_amount > 0 ? fmt(order.shipping_amount) : 'FREE'}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span><span>−{fmt(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total</span>
              <span className="text-purple-600">{fmt(order.total_amount)}</span>
            </div>
          </div>
        </motion.div>

        {/* Sidebar info: payment + address */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Payment */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <h2 className="font-semibold text-gray-900 text-sm">Payment</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-900">{order.payment_method || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-semibold capitalize ${
                  order.payment_status === 'paid' ? 'text-green-600' :
                  order.payment_status === 'refunded' ? 'text-blue-600' :
                  order.payment_status === 'failed' ? 'text-red-600' :
                  'text-amber-600'
                }`}>
                  {order.payment_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Placed on</span>
                <span className="text-gray-700 text-xs">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Shipping address */}
          {addrLine && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-purple-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Delivering to</h2>
              </div>
              <div className="text-sm text-gray-700 space-y-0.5">
                {(addr?.fullName || addr?.full_name || addr?.name) && (
                  <p className="font-medium text-gray-900">{addr.fullName || addr.full_name || addr.name}</p>
                )}
                <p className="text-gray-500">{addrLine}</p>
                {(addr?.phone || addr?.phoneNumber) && (
                  <p className="text-gray-500">{addr.phone || addr.phoneNumber}</p>
                )}
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
};

export default OrderTrackingPage;

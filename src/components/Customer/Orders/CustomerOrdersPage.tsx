import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Calendar,
  MapPin,
  Phone,
  XCircle,
  Eye
} from 'lucide-react';
import { CustomerDashboardLayout } from '../Layout/CustomerDashboardLayout';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface OrderItem {
  id: string;
  product?: {
    id: string;
    name: string;
    images?: string[];
  };
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  order_number?: string;
  status: string;
  total_amount?: number;
  total?: number;
  subtotal?: number;
  shipping_amount?: number;
  tax_amount?: number;
  created_at: string;
  items?: OrderItem[];
  shipping_address?: {
    fullName?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
  };
}

export const CustomerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingOrderDetails, setLoadingOrderDetails] = useState<string | null>(null);
  const { showError } = useNotification();

  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch order details when expanding
  useEffect(() => {
    if (expandedOrderId) {
      fetchOrderDetails(expandedOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedOrderId]);

  const fetchOrderDetails = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    // Only fetch if order doesn't have items
    if (order && (!order.items || order.items.length === 0)) {
      setLoadingOrderDetails(orderId);
      try {
        const response = await apiClient.getOrder(orderId);
        if (response.data) {
          setOrders(prevOrders =>
            prevOrders.map(o => o.id === orderId ? { ...o, ...response.data } : o)
          );
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error);
      } finally {
        setLoadingOrderDetails(null);
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await apiClient.getOrders();
      // Handle different response structures
      const ordersData = response.data || response || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      showError('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { id: 'all', name: 'All Orders', count: orders.length },
    { id: 'pending', name: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { id: 'processing', name: 'Processing', count: orders.filter(o => o.status === 'processing').length },
    { id: 'shipped', name: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
    { id: 'delivered', name: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
    { id: 'cancelled', name: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesFilter = activeFilter === 'all' || order.status === activeFilter;
    const matchesSearch = searchQuery === '' || 
      (order.order_number || order.id).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <CustomerDashboardLayout title="My Orders" subtitle="Track and manage your orders">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-32" />
                <div className="h-6 bg-gray-200 rounded w-24" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-48" />
            </div>
          ))}
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout title="My Orders" subtitle="Track and manage your orders">
      <div className="space-y-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.name}
                  {filter.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeFilter === filter.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try a different search term' : "You haven't placed any orders yet"}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(order.created_at)}
                          </span>
                          <span>{order.items?.length || 0} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(order.total_amount || order.total || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-gray-500">{formatTime(order.created_at)}</p>
                      </div>
                      <div className={`p-2 rounded-lg transition-colors ${
                        expandedOrderId === order.id ? 'bg-purple-100' : 'hover:bg-gray-100'
                      }`}>
                        {expandedOrderId === order.id ? (
                          <ChevronUp className="w-5 h-5 text-purple-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details (Expandable) */}
                {expandedOrderId === order.id && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    <div className="p-5 grid lg:grid-cols-2 gap-6">
                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Order Items</h4>
                        <div className="space-y-3">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl">
                                {item.product?.images?.[0] ? (
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    className="w-14 h-14 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {item.product?.name || 'Product'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Qty: {item.quantity} × ₹{(item.unit_price || 0).toLocaleString('en-IN')}
                                  </p>
                                </div>
                                {item.product?.id && (
                                  <Link
                                    to={`/products/${item.product.id}`}
                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Eye className="w-5 h-5" />
                                  </Link>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No items found</p>
                          )}
                        </div>
                      </div>

                      {/* Order Summary & Shipping */}
                      <div className="space-y-4">
                        {/* Shipping Address */}
                        {order.shipping_address && (
                          <div className="bg-white p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              Shipping Address
                            </h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p className="font-medium text-gray-900">
                                {order.shipping_address.fullName}
                              </p>
                              <p>{order.shipping_address.streetAddress}</p>
                              <p>
                                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}
                              </p>
                              {order.shipping_address.phone && (
                                <p className="flex items-center gap-1 mt-2">
                                  <Phone className="w-3 h-3" />
                                  {order.shipping_address.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Order Summary */}
                        <div className="bg-white p-4 rounded-xl">
                          <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Subtotal</span>
                              <span className="text-gray-900">
                                ₹{(order.subtotal || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Shipping</span>
                              <span className="text-gray-900">
                                ₹{(order.shipping_amount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Tax</span>
                              <span className="text-gray-900">
                                ₹{(order.tax_amount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-100">
                              <span className="font-semibold text-gray-900">Total</span>
                              <span className="font-bold text-gray-900">
                                ₹{(order.total_amount || order.total || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
};

export default CustomerOrdersPage;

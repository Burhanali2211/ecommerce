import React, { useEffect, useState } from 'react';
import { 
  Search, Eye, Filter, X, ShoppingCart, DollarSign, Clock, 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Package, Truck, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight,
  BarChart3, RefreshCw
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { OrderDetails } from './OrderDetails';
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  getPaymentMethodConfig,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  OrderStatus,
  PaymentStatus
} from '../../../utils/orderStatusUtils';

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: string;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  item_count?: number;
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  ordersToday: number;
  revenueToday: number;
  avgOrderValue: number;
  statusBreakdown: Record<string, number>;
}

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const pageSize = 10;

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, paymentStatusFilter]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const [dashboardResponse, ordersResponse] = await Promise.all([
        apiClient.get('/admin/analytics/dashboard'),
        apiClient.get('/admin/orders?limit=100')
      ]);
      
      if (dashboardResponse.success && dashboardResponse.data) {
        const metrics = dashboardResponse.data.metrics;
        
        // Calculate status breakdown from recent orders
        const statusBreakdown: Record<string, number> = {};
        if (ordersResponse.success && ordersResponse.data) {
          ordersResponse.data.forEach((order: Order) => {
            statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
          });
        }

        // Calculate average order value from recent paid orders
        const paidOrders = ordersResponse.success && ordersResponse.data 
          ? ordersResponse.data.filter((o: Order) => o.payment_status === 'paid')
          : [];
        const totalPaidAmount = paidOrders.reduce((sum: number, o: Order) => 
          sum + parseFloat(o.total_amount || '0'), 0);
        const avgOrderValue = paidOrders.length > 0 ? totalPaidAmount / paidOrders.length : 0;

        setStats({
          totalOrders: metrics.totalOrders || 0,
          totalRevenue: metrics.totalRevenue || 0,
          pendingOrders: metrics.pendingOrders || 0,
          ordersToday: metrics.ordersToday || 0,
          revenueToday: metrics.revenueToday || 0,
          avgOrderValue,
          statusBreakdown
        });
      }
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(paymentStatusFilter && { paymentStatus: paymentStatusFilter })
      });

      const response = await apiClient.get(`/admin/orders?${params}`);

      if (response.success) {
        setOrders(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to load orders'
      });
    } finally {
      setLoading(false);
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
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${colorClasses}`}>
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">{config.label}</span>
      </div>
    );
  };

  const renderPaymentMethod = (method: string) => {
    const config = getPaymentMethodConfig(method);
    const Icon = config.icon;

    return (
      <div className="inline-flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-white/60 flex-shrink-0" />
        <span className="text-xs text-white/80 truncate">{config.label}</span>
      </div>
    );
  };


  if (selectedOrderId) {
    return (
      <OrderDetails
        orderId={selectedOrderId}
        onClose={() => {
          setSelectedOrderId(null);
          fetchOrders();
          fetchStats();
        }}
      />
    );
  }

  const hasActiveFilters = searchTerm || statusFilter || paymentStatusFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Orders</h1>
              <p className="text-sm text-white/60 mt-0.5">Manage and track all customer orders</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            fetchOrders();
            fetchStats();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-all hover:scale-105 active:scale-95"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats List - Horizontal Design */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {/* Total Orders */}
          <div className="p-6 hover:bg-white/5 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                  <ShoppingCart className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Total Orders</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {statsLoading ? (
                      <span className="inline-block w-16 h-7 bg-white/10 rounded animate-pulse" />
                    ) : (
                      stats?.totalOrders || 0
                    )}
                  </p>
                </div>
              </div>
            </div>
            {stats && stats.ordersToday > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="font-medium">{stats.ordersToday} today</span>
                </div>
              </div>
            )}
          </div>

          {/* Total Revenue */}
          <div className="p-6 hover:bg-white/5 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {statsLoading ? (
                      <span className="inline-block w-24 h-7 bg-white/10 rounded animate-pulse" />
                    ) : (
                      stats ? formatCurrency(stats.totalRevenue) : '₹0'
                    )}
                  </p>
                </div>
              </div>
            </div>
            {stats && stats.revenueToday > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="font-medium">{formatCurrency(stats.revenueToday)} today</span>
                </div>
              </div>
            )}
          </div>

          {/* Pending Orders */}
          <div className="p-6 hover:bg-white/5 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Pending Orders</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {statsLoading ? (
                      <span className="inline-block w-16 h-7 bg-white/10 rounded animate-pulse" />
                    ) : (
                      stats?.pendingOrders || 0
                    )}
                  </p>
                </div>
              </div>
            </div>
            {stats && stats.pendingOrders > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30">
                  <AlertCircle className="w-3 h-3" />
                  <span className="font-medium">Needs attention</span>
                </div>
              </div>
            )}
          </div>

          {/* Avg Order Value */}
          <div className="p-6 hover:bg-white/5 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Avg Order Value</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {statsLoading ? (
                      <span className="inline-block w-24 h-7 bg-white/10 rounded animate-pulse" />
                    ) : (
                      stats ? formatCurrency(stats.avgOrderValue) : '₹0'
                    )}
                  </p>
                </div>
              </div>
            </div>
            {stats && stats.avgOrderValue > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-medium">Per order</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Status Distribution */}
      {stats && stats.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Order Status Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => {
              const config = getOrderStatusConfig(status);
              const Icon = config.icon;
              const colorClasses = getStatusColor(status);
              
              return (
                <div key={status} className={`${colorClasses} rounded-xl p-3 border`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{config.label}</span>
                  </div>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-white/60" />
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPaymentStatusFilter('');
                setCurrentPage(1);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white placeholder-white/40 transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white transition-all"
          >
            <option value="" className="bg-gray-900">All Order Status</option>
            {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key} className="bg-gray-900">{config.label}</option>
            ))}
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white transition-all"
          >
            <option value="" className="bg-gray-900">All Payment Status</option>
            {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key} className="bg-gray-900">{config.label}</option>
            ))}
          </select>

          <div className="flex items-center justify-end sm:justify-start">
            <span className="text-sm text-white/60">
              {totalItems > 0 ? `${totalItems} order${totalItems !== 1 ? 's' : ''}` : 'No orders'}
            </span>
          </div>
        </div>
      </div>

      {/* Orders List - Responsive Design */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No orders found</p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet Card View */}
            <div className="block lg:hidden divide-y divide-white/10">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-base text-white truncate">{order.order_number}</p>
                        {renderStatusBadge(order.status, false)}
                      </div>
                      <p className="text-xs text-white/60 mb-2">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-amber-400 mb-1">
                        {formatCurrency(order.total_amount)}
                      </p>
                      {order.item_count && (
                        <p className="text-xs text-white/60">{order.item_count} item{order.item_count !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-white/60 mb-1">Customer</p>
                      <p className="text-sm font-medium text-white truncate">{order.customer_name}</p>
                      <p className="text-xs text-white/60 truncate">{order.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 mb-1">Payment</p>
                      <div className="mb-1">{renderPaymentMethod(order.payment_method)}</div>
                      {renderStatusBadge(order.payment_status, true)}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderId(order.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg font-medium transition-colors border border-amber-500/30"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
                <style>{`
                  .scrollbar-thin::-webkit-scrollbar {
                    height: 8px;
                  }
                  .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .scrollbar-thin::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                  }
                  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.3);
                  }
                `}</style>
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="text-left text-white/60 text-sm font-medium p-3 whitespace-nowrap">Order #</th>
                      <th className="text-left text-white/60 text-sm font-medium p-3 whitespace-nowrap">Date & Time</th>
                      <th className="text-left text-white/60 text-sm font-medium p-3 whitespace-nowrap min-w-[200px]">Customer</th>
                      <th className="text-right text-white/60 text-sm font-medium p-3 whitespace-nowrap">Amount</th>
                      <th className="text-left text-white/60 text-sm font-medium p-3 whitespace-nowrap">Items</th>
                      <th className="text-left text-white/60 text-sm font-medium p-3 whitespace-nowrap">Order Status</th>
                      <th className="text-left text-white/60 text-sm font-medium p-3 whitespace-nowrap">Payment Method</th>
                      <th className="text-left text-white/60 text-sm font-medium p-3 whitespace-nowrap">Payment Status</th>
                      <th className="text-center text-white/60 text-sm font-medium p-3 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <p className="font-semibold text-sm text-white whitespace-nowrap">{order.order_number}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-xs text-white/60 whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-white/60 whitespace-nowrap">
                            {new Date(order.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </td>
                        <td className="p-3 min-w-[200px]">
                          <p className="font-medium text-sm text-white truncate">{order.customer_name || 'N/A'}</p>
                          <p className="text-xs text-white/60 truncate">{order.customer_email || 'N/A'}</p>
                        </td>
                        <td className="p-3 text-right">
                          <p className="font-semibold text-sm text-amber-400 whitespace-nowrap">
                            {formatCurrency(order.total_amount)}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="text-sm text-white/80 whitespace-nowrap">
                            {order.item_count || 0} {order.item_count === 1 ? 'item' : 'items'}
                          </p>
                        </td>
                        <td className="p-3">
                          {renderStatusBadge(order.status, false)}
                        </td>
                        <td className="p-3">
                          {renderPaymentMethod(order.payment_method)}
                        </td>
                        <td className="p-3">
                          {renderStatusBadge(order.payment_status, true)}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedOrderId(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-amber-400 hover:bg-amber-500/20 active:bg-amber-500/30 rounded-lg transition-all hover:scale-105 whitespace-nowrap"
                            title="View Details"
                            aria-label="View order details"
                          >
                            <Eye className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs font-medium">View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-white/60">
              Showing{' '}
              <span className="font-medium text-white">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-white">
                {Math.min(currentPage * pageSize, totalItems)}
              </span>{' '}
              of <span className="font-medium text-white">{totalItems}</span> orders
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white/60 hover:text-white"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-amber-500 text-white'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-white/40">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white/60 hover:text-white"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
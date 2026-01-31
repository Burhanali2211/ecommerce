import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Star,
  Zap,
  Target,
  Award,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';

interface DashboardMetrics {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  newUsersToday: number;
  ordersToday: number;
  revenueToday: number;
}

interface TopProduct {
  id: string;
  name: string;
  price: string;
  images: string[];
  stock: number;
  total_sold: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total_amount: string;
  status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  min_stock_level: number;
  price: string;
  images: string[];
}

export const AdminDashboardHome: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  const { showError } = useNotification();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const [
        { count: totalUsers },
        { count: newUsersToday },
        { count: totalProducts },
        { count: totalOrders },
        { count: pendingOrders },
        ordersRes,
        profilesRes,
        productsAllRes,
        lowStockRes
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('id, order_number, total_amount, status, created_at, user_id').order('created_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('id, full_name, email'),
        supabase.from('products').select('id, name, price, images, stock, min_stock_level'),
        supabase.from('products').select('id, name, price, images, stock, min_stock_level').lte('stock', 20).limit(10)
      ]);

      const orders = ordersRes.data || [];
      const profiles = profilesRes.data || [];
      const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
      const ordersToday = orders.filter((o: any) => o.created_at >= todayIso).length;
      const revenueToday = orders
        .filter((o: any) => o.created_at >= todayIso && (o.status === 'delivered' || o.status === 'shipped'))
        .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);
      const allOrdersForRevenue = await supabase.from('orders').select('total_amount, status').in('status', ['delivered', 'shipped']);
      const totalRevenue = (allOrdersForRevenue.data || []).reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);
      const lowStockProductsCount = (productsAllRes.data || []).filter((p: any) => (p.min_stock_level != null ? p.stock <= p.min_stock_level : p.stock <= 20)).length;

      setMetrics({
        totalUsers: totalUsers ?? 0,
        totalProducts: totalProducts ?? 0,
        totalOrders: totalOrders ?? 0,
        totalRevenue,
        pendingOrders: pendingOrders ?? 0,
        lowStockProducts: lowStockProductsCount,
        newUsersToday: newUsersToday ?? 0,
        ordersToday,
        revenueToday
      });

      setRecentOrders(orders.map((o: any) => ({
        id: o.id,
        order_number: o.order_number || o.id,
        total_amount: o.total_amount,
        status: o.status,
        created_at: o.created_at,
        customer_name: profileMap[o.user_id]?.full_name || 'Guest',
        customer_email: profileMap[o.user_id]?.email || ''
      })));

      const lowStockList = (lowStockRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        min_stock_level: p.min_stock_level ?? 20,
        price: String(p.price),
        images: p.images || []
      }));
      setLowStockProducts(lowStockList);

      const orderItemsRes = await supabase.from('order_items').select('product_id, quantity').limit(500);
      const orderItems = orderItemsRes.data || [];
      const soldByProduct: Record<string, number> = {};
      orderItems.forEach((oi: any) => {
        soldByProduct[oi.product_id] = (soldByProduct[oi.product_id] || 0) + (oi.quantity || 0);
      });
      const productIds = Object.entries(soldByProduct).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
      if (productIds.length > 0) {
        const topProdsRes = await supabase.from('products').select('id, name, price, images, stock').in('id', productIds);
        const topProds = (topProdsRes.data || []).map((p: any) => ({
          ...p,
          total_sold: String(soldByProduct[p.id] || 0)
        })).sort((a, b) => parseInt(b.total_sold, 10) - parseInt(a.total_sold, 10));
        setTopProducts(topProds);
      } else {
        const fallback = (productsAllRes.data || []).slice(0, 5).map((p: any) => ({ ...p, total_sold: '0' }));
        setTopProducts(fallback);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'processing': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminDashboardLayout title="Dashboard" subtitle="Welcome back, Admin!">
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 animate-pulse border border-white/10">
                <div className="h-4 bg-white/10 rounded w-20 mb-3" />
                <div className="h-8 bg-white/10 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const statCards = metrics ? [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      change: metrics.revenueToday > 0 ? `+${formatCurrency(metrics.revenueToday)} today` : 'No sales today',
      trend: metrics.revenueToday > 0 ? 'up' : 'neutral',
      icon: DollarSign,
      color: 'amber',
      bgGradient: 'from-amber-500/20 to-orange-500/20',
      iconBg: 'bg-amber-500/30'
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders.toString(),
      change: `${metrics.ordersToday} orders today`,
      trend: metrics.ordersToday > 0 ? 'up' : 'neutral',
      icon: ShoppingCart,
      color: 'blue',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      iconBg: 'bg-blue-500/30'
    },
    {
      title: 'Total Products',
      value: metrics.totalProducts.toString(),
      change: metrics.lowStockProducts > 0 ? `${metrics.lowStockProducts} low stock` : 'All stocked',
      trend: metrics.lowStockProducts > 0 ? 'down' : 'up',
      icon: Package,
      color: 'purple',
      bgGradient: 'from-purple-500/20 to-indigo-500/20',
      iconBg: 'bg-purple-500/30'
    },
    {
      title: 'Total Users',
      value: metrics.totalUsers.toString(),
      change: `${metrics.newUsersToday} new today`,
      trend: metrics.newUsersToday > 0 ? 'up' : 'neutral',
      icon: Users,
      color: 'emerald',
      bgGradient: 'from-emerald-500/20 to-teal-500/20',
      iconBg: 'bg-emerald-500/30'
    }
  ] : [];

  return (
    <AdminDashboardLayout title="Dashboard" subtitle="Welcome back! Here's your store overview.">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 lg:p-8">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-white">
                  Admin Control Center 🎯
                </h2>
                <p className="text-orange-100">Manage your entire store from here</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link
                to="/admin/products"
                className="inline-flex items-center gap-2 bg-white text-orange-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
              >
                <Package className="w-5 h-5" />
                Add Product
              </Link>
              <Link
                to="/admin/orders"
                className="inline-flex items-center gap-2 bg-white/20 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <ShoppingCart className="w-5 h-5" />
                View Orders
              </Link>
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center gap-2 bg-white/20 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Data
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-orange-600/30 rounded-full translate-y-1/2 blur-2xl" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-${stat.color}-500/30 transition-all group`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                {stat.trend !== 'neutral' && (
                  <span className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm font-medium mb-1">{stat.title}</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</p>
              <p className={`text-xs mt-2 ${stat.trend === 'down' ? 'text-red-400' : 'text-white/50'}`}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        {/* Alerts Section */}
        {metrics && (metrics.pendingOrders > 0 || metrics.lowStockProducts > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.pendingOrders > 0 && (
              <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl p-4 border border-orange-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/30 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{metrics.pendingOrders} Pending Orders</h4>
                    <p className="text-orange-200 text-sm">Need your attention</p>
                  </div>
                </div>
                <Link
                  to="/admin/orders?status=pending"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Review
                </Link>
              </div>
            )}
            {metrics.lowStockProducts > 0 && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl p-4 border border-red-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/30 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{metrics.lowStockProducts} Low Stock Items</h4>
                    <p className="text-red-200 text-sm">Need to restock</p>
                  </div>
                </div>
                <Link
                  to="/admin/products"
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Manage
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Charts and Activity Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
              <Link
                to="/admin/orders"
                className="text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="divide-y divide-white/10">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-white/10">
                        <ShoppingCart className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          #{order.order_number}
                        </p>
                        <p className="text-sm text-white/60">
                          {order.customer_name || order.customer_email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(order.status)}`}>
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">No orders yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Performance Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-sm">Orders Today</span>
                    <span className="text-white font-semibold">{metrics?.ordersToday || 0}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                      style={{ width: `${Math.min((metrics?.ordersToday || 0) * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-sm">New Users Today</span>
                    <span className="text-white font-semibold">{metrics?.newUsersToday || 0}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                      style={{ width: `${Math.min((metrics?.newUsersToday || 0) * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-sm">Revenue Today</span>
                    <span className="text-white font-semibold">{formatCurrency(metrics?.revenueToday || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Top Products</h3>
                <Link to="/admin/products" className="text-amber-400 text-sm hover:text-amber-300">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {topProducts.slice(0, 3).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg overflow-hidden flex items-center justify-center text-amber-400 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{product.name}</p>
                      <p className="text-white/50 text-xs">{product.total_sold} sold</p>
                    </div>
                    <p className="text-amber-400 text-sm font-semibold">{formatCurrency(product.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Products */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/30 overflow-hidden">
            <div className="p-5 border-b border-red-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Low Stock Alert</h3>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden flex items-center justify-center">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{product.name}</p>
                      <p className="text-red-400 text-sm font-semibold">
                        Only {product.stock} left (Min: {product.min_stock_level})
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboardHome;


import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Eye, Users, ArrowUpRight, ArrowDownRight, Calendar, Download, Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface AnalyticsMetrics {
  totalRevenue: { value: number; change: number; trend: 'up' | 'down' };
  totalOrders: { value: number; change: number; trend: 'up' | 'down' };
  pageViews: { value: number; change: number; trend: 'up' | 'down' };
  conversionRate: { value: number; change: number; trend: 'up' | 'down' };
  avgOrderValue: { value: number; change: number; trend: 'up' | 'down' };
  newUsers: { value: number; change: number; trend: 'up' | 'down' };
}

interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  growth: number;
  price?: string;
  images?: string[];
}

interface RevenueTrend {
  date: string;
  revenue: number;
  orders: number;
}

interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

interface AnalyticsData {
  metrics: AnalyticsMetrics;
  topProducts: TopProduct[];
  revenueTrend: RevenueTrend[];
  trafficSources: TrafficSource[];
}

export const AdminAnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days' | 'year'>('30days');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const { showError } = useNotification();

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/analytics/overview?period=${selectedPeriod}`);
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        showError('Failed to load analytics data');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-IN');
  };

  const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  };

  const formatMetricValue = (label: string, value: number): string => {
    switch (label) {
      case 'Total Revenue':
      case 'Avg Order Value':
        return formatCurrency(value);
      case 'Conversion Rate':
        return `${value.toFixed(2)}%`;
      default:
        return formatNumber(value);
    }
  };

  const metricsConfig = data ? [
    { 
      label: 'Total Revenue', 
      value: data.metrics.totalRevenue.value, 
      change: data.metrics.totalRevenue.change, 
      trend: data.metrics.totalRevenue.trend, 
      icon: DollarSign, 
      color: 'amber' 
    },
    { 
      label: 'Total Orders', 
      value: data.metrics.totalOrders.value, 
      change: data.metrics.totalOrders.change, 
      trend: data.metrics.totalOrders.trend, 
      icon: ShoppingCart, 
      color: 'blue' 
    },
    { 
      label: 'Page Views', 
      value: data.metrics.pageViews.value, 
      change: data.metrics.pageViews.change, 
      trend: data.metrics.pageViews.trend, 
      icon: Eye, 
      color: 'purple' 
    },
    { 
      label: 'Conversion Rate', 
      value: data.metrics.conversionRate.value, 
      change: data.metrics.conversionRate.change, 
      trend: data.metrics.conversionRate.trend, 
      icon: TrendingUp, 
      color: 'emerald' 
    },
    { 
      label: 'Avg Order Value', 
      value: data.metrics.avgOrderValue.value, 
      change: data.metrics.avgOrderValue.change, 
      trend: data.metrics.avgOrderValue.trend, 
      icon: BarChart3, 
      color: 'cyan' 
    },
    { 
      label: 'New Users', 
      value: data.metrics.newUsers.value, 
      change: data.metrics.newUsers.change, 
      trend: data.metrics.newUsers.trend, 
      icon: Users, 
      color: 'indigo' 
    }
  ] : [];

  // Format chart data for Recharts
  const formatChartData = () => {
    if (!data || !data.revenueTrend || data.revenueTrend.length === 0) {
      return [];
    }

    return data.revenueTrend.map((point) => {
      const date = new Date(point.date);
      let dateLabel = '';
      
      if (selectedPeriod === 'year') {
        dateLabel = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      } else if (selectedPeriod === '90days') {
        dateLabel = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      } else if (selectedPeriod === '30days') {
        dateLabel = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      } else {
        dateLabel = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      }

      return {
        date: dateLabel,
        revenue: Math.round(point.revenue),
        orders: point.orders,
        formattedRevenue: formatCurrency(point.revenue)
      };
    });
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-semibold text-gray-800 mb-2">{payload[0].payload.date}</p>
          <p className="text-sm text-amber-600 font-medium">
            Revenue: {payload[0].payload.formattedRevenue}
          </p>
          <p className="text-sm text-blue-600 font-medium">
            Orders: {payload[0].payload.orders}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label formatter for Y-axis
  const formatYAxisLabel = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value}`;
  };

  const handleExport = () => {
    if (!data) return;
    
    // Create CSV content
    const csvRows = [
      ['Metric', 'Value', 'Change'],
      ['Total Revenue', formatCurrency(data.metrics.totalRevenue.value), formatPercentage(data.metrics.totalRevenue.change)],
      ['Total Orders', data.metrics.totalOrders.value.toString(), formatPercentage(data.metrics.totalOrders.change)],
      ['Page Views', data.metrics.pageViews.value.toString(), formatPercentage(data.metrics.pageViews.change)],
      ['Conversion Rate', `${data.metrics.conversionRate.value.toFixed(2)}%`, formatPercentage(data.metrics.conversionRate.change)],
      ['Avg Order Value', formatCurrency(data.metrics.avgOrderValue.value), formatPercentage(data.metrics.avgOrderValue.change)],
      ['New Users', data.metrics.newUsers.value.toString(), formatPercentage(data.metrics.newUsers.change)],
      [],
      ['Top Products', 'Revenue', 'Orders', 'Growth'],
      ...data.topProducts.map(p => [
        p.name,
        formatCurrency(p.revenue),
        p.orders.toString(),
        `${formatPercentage(p.growth)}`
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminDashboardLayout title="Analytics" subtitle="Track your store performance">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60">Loading analytics data...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (!data) {
    return (
      <AdminDashboardLayout title="Analytics" subtitle="Track your store performance">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No analytics data available</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const chartData = formatChartData();

  return (
    <AdminDashboardLayout title="Analytics" subtitle="Track your store performance">
      <div className="space-y-6">
        {/* Period Selector & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
            {[
              { key: '7days', label: '7 Days' },
              { key: '30days', label: '30 Days' },
              { key: '90days', label: '90 Days' },
              { key: 'year', label: 'Year' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period.key
                    ? 'bg-amber-500 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {metricsConfig.map((metric) => (
            <div
              key={metric.label}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 bg-${metric.color}-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <metric.icon className={`w-6 h-6 text-${metric.color}-400`} />
                </div>
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {metric.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {formatPercentage(metric.change)}
                </span>
              </div>
              <p className="text-white/60 text-sm font-medium mb-1">{metric.label}</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">
                {formatMetricValue(metric.label, metric.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: 'rgba(255,255,255,0.6)' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: 'rgba(255,255,255,0.6)' }}
                    tickFormatter={formatYAxisLabel}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">No revenue data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Traffic Sources */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Traffic Sources</h3>
            <div className="space-y-4">
              {data.trafficSources && data.trafficSources.length > 0 ? (
                data.trafficSources.map((source) => (
                  <div key={source.source}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80">{source.source}</span>
                      <span className="text-white font-medium">{formatNumber(source.visits)}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/40 text-center py-8">No traffic data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Top Performing Products</h3>
            {data.topProducts && data.topProducts.length > 0 && (
              <span className="text-sm text-white/60">
                Showing top {data.topProducts.length} products
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            {data.topProducts && data.topProducts.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left text-white/60 text-sm font-medium p-4">#</th>
                    <th className="text-left text-white/60 text-sm font-medium p-4">Product</th>
                    <th className="text-right text-white/60 text-sm font-medium p-4">Revenue</th>
                    <th className="text-right text-white/60 text-sm font-medium p-4">Orders</th>
                    <th className="text-right text-white/60 text-sm font-medium p-4">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.topProducts.map((product, index) => (
                    <tr key={product.id || index} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white/60">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.images && product.images.length > 0 && (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-white font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-amber-400 font-semibold">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="p-4 text-right text-white">{product.orders}</td>
                      <td className="p-4 text-right">
                        <span className={`flex items-center justify-end gap-1 ${
                          product.growth >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {product.growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {Math.abs(product.growth).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-white/40">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No product data available for this period</p>
                <p className="text-sm mt-2">Products will appear here once orders are placed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminAnalyticsPage;

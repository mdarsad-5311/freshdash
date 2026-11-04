import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Layers,
  Users,
  ShoppingBag,
  IndianRupee,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { DashboardMetrics } from '../types/dashboard';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { getOrderStatusBadge, getPaymentStatusBadge } from '../components/common/Badge';
import { getErrorMessage } from '../services/api';

const STATUS_COLORS: Record<string, string> = {
  delivered: '#16a34a',
  out_for_delivery: '#22c55e',
  shipped: '#0ea5e9',
  processing: '#8b5cf6',
  confirmed: '#a855f7',
  placed: '#f59e0b',
  pending: '#eab308',
  cancelled: '#ef4444',
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading real-time store metrics..." className="py-24" />;
  }

  if (error || !metrics) {
    return (
      <div className="space-y-4">
        <Alert
          type="error"
          title="Failed to Load Dashboard Metrics"
          message={error || 'Could not retrieve statistics from backend.'}
        />
        <button
          onClick={() => fetchMetrics(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // Format charts data
  const statusChartData = Object.entries(metrics.orders_by_status || {}).map(([status, count]) => ({
    name: status.replace(/_/g, ' ').toUpperCase(),
    rawStatus: status,
    count,
  }));

  const bestSellersChartData = (metrics.best_selling_products || []).map((item) => ({
    name: item.product_name,
    units: item.total_units_sold,
    revenue: typeof item.total_revenue === 'number' ? item.total_revenue : parseFloat(item.total_revenue as string) || 0,
  }));

  const pendingCount = (metrics.orders_by_status?.placed || 0) + (metrics.orders_by_status?.pending || 0);

  return (
    <div className="space-y-8">
      {/* Top Banner with Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Store Performance Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time analytics computed directly from the live database
          </p>
        </div>
        <button
          onClick={() => fetchMetrics(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Revenue"
          value={`₹${parseFloat(metrics.total_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`Today: ₹${parseFloat(metrics.today_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={IndianRupee}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 border-emerald-100"
          trend={{ value: 'Real Sales', isPositive: true, label: 'excl. cancellations' }}
        />

        <StatCard
          title="Total Orders"
          value={metrics.total_orders}
          subtitle={`${metrics.today_orders_count} placed today`}
          icon={ShoppingBag}
          iconColor="text-sky-600"
          iconBg="bg-sky-50 border-sky-100"
          onClick={() => navigate('/orders')}
        />

        <StatCard
          title="Pending Fulfillment"
          value={pendingCount}
          subtitle="Orders waiting for dispatch"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 border-amber-100"
          onClick={() => navigate('/orders?status=placed')}
        />

        <StatCard
          title="Registered Customers"
          value={metrics.total_customers}
          subtitle="Verified consumer accounts"
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-50 border-purple-100"
          onClick={() => navigate('/customers')}
        />
      </div>

      {/* Second Row KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Total Products"
          value={metrics.total_products}
          subtitle={`${metrics.active_products} currently available to customers`}
          icon={Package}
          iconColor="text-brand-600"
          iconBg="bg-brand-50 border-brand-100"
          onClick={() => navigate('/products')}
        />

        <StatCard
          title="Produce Categories"
          value={metrics.total_categories}
          subtitle="Vegetables, fruits, herbs & staples"
          icon={Layers}
          iconColor="text-teal-600"
          iconBg="bg-teal-50 border-teal-100"
          onClick={() => navigate('/categories')}
        />

        <StatCard
          title="Stock Alerts"
          value={metrics.low_stock_count + metrics.out_of_stock_count}
          subtitle={`${metrics.low_stock_count} low stock, ${metrics.out_of_stock_count} out of stock`}
          icon={AlertTriangle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50 border-rose-100"
          onClick={() => navigate('/inventory?filter=low_stock')}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Produce Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bestselling Produce</h3>
              <p className="text-xs text-slate-500">Units sold across completed orders</p>
            </div>
            <Flame className="w-5 h-5 text-amber-500" />
          </div>

          {bestSellersChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No sales data recorded yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellersChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip
                    formatter={(val: number) => [`${val} units sold`, 'Volume']}
                    contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Bar dataKey="units" fill="#16a34a" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Order Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Order Status Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of all registered customer orders</p>
            </div>
            <TrendingUp className="w-5 h-5 text-sky-500" />
          </div>

          {statusChartData.length === 0 || statusChartData.every((d) => d.count === 0) ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No orders placed yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData.filter((d) => d.count > 0)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {statusChartData.map((entry) => (
                      <Cell
                        key={entry.rawStatus}
                        fill={STATUS_COLORS[entry.rawStatus] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
              <p className="text-xs text-slate-500">Latest orders placed on FreshDash</p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.recent_orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  metrics.recent_orders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => navigate('/orders')}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        #{ord.order_number}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{ord.customer_name}</p>
                        <p className="text-[11px] text-slate-400">{ord.customer_email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{ord.items_count} items</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{parseFloat(ord.grand_total).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">{getOrderStatusBadge(ord.status)}</td>
                      <td className="px-5 py-3.5">{getPaymentStatusBadge(ord.payment_status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Stock Alerts List (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Stock Alerts</h3>
              <p className="text-xs text-slate-500">Critical produce inventory</p>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-96">
            {metrics.low_stock_products.length === 0 && metrics.out_of_stock_products.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                All produce inventory is sufficiently stocked.
              </p>
            ) : (
              <>
                {metrics.out_of_stock_products.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-500">{p.category_name} • {p.weight}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                      Out of Stock
                    </span>
                  </div>
                ))}

                {metrics.low_stock_products.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-500">{p.category_name} • {p.weight}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {p.stock} left
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


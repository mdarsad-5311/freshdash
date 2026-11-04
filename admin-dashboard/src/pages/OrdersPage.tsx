import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ShoppingBag,
  RefreshCw,
  Eye,
  Truck,
  MapPin,
  Clock,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import {
  AdminOrderDetail,
  AdminOrderListItem,
  OrderFilterParams,
  OrderStatus,
  PaymentStatus,
} from '../types/order';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { Modal } from '../components/common/Modal';
import { getOrderStatusBadge, getPaymentStatusBadge } from '../components/common/Badge';
import { getErrorMessage } from '../services/api';

const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals state
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<AdminOrderDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Status Update state
  const [updatingOrder, setUpdatingOrder] = useState<AdminOrderListItem | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('confirmed');
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>('pending');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: OrderFilterParams = {
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        payment_status: paymentStatusFilter || undefined,
        payment_method: paymentMethodFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };

      const res = await orderService.getOrders(params);
      if (Array.isArray(res)) {
        setOrders(res);
      } else if (res && 'results' in res) {
        setOrders(res.results);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentStatusFilter, paymentMethodFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openOrderDetails = async (orderNumber: string) => {
    try {
      setSelectedOrderNumber(orderNumber);
      setDetailsLoading(true);
      const data = await orderService.getOrder(orderNumber);
      setOrderDetails(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDetailsLoading(false);
    }
  };

  const openStatusModal = (ord: AdminOrderListItem) => {
    setUpdatingOrder(ord);
    setNewStatus(ord.status);
    setNewPaymentStatus(ord.payment_status as PaymentStatus);
  };

  const handleUpdateStatus = async () => {
    if (!updatingOrder) return;
    try {
      setIsUpdating(true);
      const res = await orderService.updateOrderStatus(updatingOrder.order_number, {
        status: newStatus,
        payment_status: newPaymentStatus,
      });
      setSuccessMessage(res.message);
      setUpdatingOrder(null);
      await fetchOrders();
      if (orderDetails && orderDetails.order_number === updatingOrder.order_number) {
        setOrderDetails(res.order);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Customer Orders ({orders.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process orders, track fulfillment states, review customer addresses and update payment statuses
          </p>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search box */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer, email..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white text-slate-700"
            >
              <option value="">All Fulfillment Statuses</option>
              {ORDER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status filter */}
          <div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white text-slate-700"
            >
              <option value="">All Payment Statuses</option>
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-slate-700"
              title="Date From"
            />
          </div>

          {/* Date to */}
          <div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-slate-700"
              title="Date To"
            />
          </div>
        </div>

        {/* Clear Filters Helper */}
        {(search || statusFilter || paymentStatusFilter || paymentMethodFilter || dateFrom || dateTo) && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Filters applied</span>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPaymentStatusFilter('');
                setPaymentMethodFilter('');
                setDateFrom('');
                setDateTo('');
              }}
              className="font-bold text-brand-600 hover:text-brand-700"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner size="md" label="Loading customer orders..." className="py-16" />
        ) : orders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No orders found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No orders matched your active filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Grand Total</th>
                  <th className="px-5 py-3.5">Fulfillment Status</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Order Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order Number */}
                    <td className="px-5 py-3.5 font-bold text-slate-900 font-mono text-sm">
                      #{ord.order_number}
                    </td>

                    {/* Customer Info */}
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{ord.customer_name}</p>
                      <p className="text-[11px] text-slate-400">{ord.customer_email}</p>
                    </td>

                    {/* Items */}
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {ord.items_count} produce item(s)
                    </td>

                    {/* Grand Total */}
                    <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                      ₹{parseFloat(ord.grand_total).toFixed(2)}
                      {ord.coupon_code && (
                        <span className="block text-[10px] text-emerald-600 font-semibold">
                          coupon: {ord.coupon_code}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openStatusModal(ord)}
                        className="hover:opacity-85 transition-opacity"
                        title="Click to update fulfillment status"
                      >
                        {getOrderStatusBadge(ord.status)}
                      </button>
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        {getPaymentStatusBadge(ord.payment_status)}
                        <p className="text-[10px] text-slate-400 font-semibold">{ord.payment_method}</p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                      {new Date(ord.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openOrderDetails(ord.order_number)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="View complete order details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openStatusModal(ord)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Update fulfillment status"
                      >
                        <Truck className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={Boolean(selectedOrderNumber)}
        onClose={() => {
          setSelectedOrderNumber(null);
          setOrderDetails(null);
        }}
        title={`Order #${orderDetails?.order_number || selectedOrderNumber}`}
        description="Comprehensive customer invoice, fulfillment status, and items breakdown"
        maxWidth="2xl"
      >
        {detailsLoading || !orderDetails ? (
          <LoadingSpinner size="md" label="Loading order details..." className="py-12" />
        ) : (
          <div className="space-y-6">
            {/* Header Status Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Status:</span>
                {getOrderStatusBadge(orderDetails.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Payment:</span>
                {getPaymentStatusBadge(orderDetails.payment_status)}
                <span className="text-xs font-semibold text-slate-600">({orderDetails.payment_method})</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(orderDetails.created_at).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Customer & Address Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Customer Details
                </h4>
                <p className="text-sm font-bold text-slate-900">{orderDetails.customer.full_name}</p>
                <p className="text-xs text-slate-600">{orderDetails.customer.email}</p>
                {orderDetails.customer.phone_number && (
                  <p className="text-xs text-slate-600">Phone: {orderDetails.customer.phone_number}</p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Delivery Address</span>
                </h4>
                {orderDetails.delivery_address_snapshot ? (
                  <>
                    <p className="text-xs font-bold text-slate-800">
                      {orderDetails.delivery_address_snapshot.name || 'Delivery Destination'}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {orderDetails.delivery_address_snapshot.line}
                    </p>
                    <p className="text-xs text-slate-600">
                      {orderDetails.delivery_address_snapshot.area}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">No address recorded.</p>
                )}
              </div>
            </div>

            {/* Ordered Items List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Order Items ({orderDetails.items.length})
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Produce Product</th>
                      <th className="px-4 py-2.5 text-center">Pack</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orderDetails.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-bold text-slate-800">
                          {item.product_name}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {item.weight}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              item.large ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.large ? 'Double Pack' : 'Regular'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600">
                          ₹{parseFloat(item.unit_price as string).toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          ₹{parseFloat(item.total_price as string).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Billing Summary Breakdown */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-1.5 text-xs max-w-sm ml-auto">
              <div className="flex justify-between text-slate-600">
                <span>Produce Subtotal:</span>
                <span className="font-semibold text-slate-800">
                  ₹{parseFloat(orderDetails.item_total).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge:</span>
                <span className="font-semibold text-slate-800">
                  {parseFloat(orderDetails.delivery_fee) === 0 ? 'FREE' : `₹${parseFloat(orderDetails.delivery_fee).toFixed(2)}`}
                </span>
              </div>
              {parseFloat(orderDetails.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({orderDetails.coupon_code}):</span>
                  <span>-₹{parseFloat(orderDetails.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Paid:</span>
                <span className="text-brand-700">
                  ₹{parseFloat(orderDetails.grand_total).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedOrderNumber(null);
                  setOrderDetails(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const currentOrd = orders.find((o) => o.order_number === orderDetails.order_number);
                  if (currentOrd) openStatusModal(currentOrd);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Update Status</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Confirmation Modal */}
      <Modal
        isOpen={Boolean(updatingOrder)}
        onClose={() => setUpdatingOrder(null)}
        title={`Update Status — Order #${updatingOrder?.order_number}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Updating the fulfillment status informs the customer and triggers automatic stock synchronization upon cancellation.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fulfillment Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white font-semibold text-slate-800"
            >
              {ORDER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Status
            </label>
            <select
              value={newPaymentStatus}
              onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white font-semibold text-slate-800"
            >
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {newStatus === 'cancelled' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <strong>Notice:</strong> Cancelling this order will automatically restore reserved product stock in the database.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => setUpdatingOrder(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Confirm Status Update'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

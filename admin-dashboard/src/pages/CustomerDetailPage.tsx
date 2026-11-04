import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingBag,
  UserCheck,
  UserX,
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { AdminCustomerDetail } from '../types/customer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { Badge, getOrderStatusBadge, getPaymentStatusBadge } from '../components/common/Badge';
import { getErrorMessage } from '../services/api';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    customerService
      .getCustomer(parseInt(id, 10))
      .then(setCustomer)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    try {
      const res = await customerService.toggleStatus(customer.id);
      setCustomer({ ...customer, is_active: res.is_active });
      setActionSuccess(res.message);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading customer profile..." className="py-24" />;
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Alert type="error" message={error || 'Customer not found.'} />
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>
      </div>
    );
  }

  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.username;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              customer.is_active
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {customer.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            <span>{customer.is_active ? 'Block Account' : 'Reactivate Account'}</span>
          </button>
        </div>
      </div>

      {actionSuccess && <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess(null)} />}

      {/* Customer Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center font-bold text-brand-700 text-xl shadow-sm">
              {fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
                <Badge variant={customer.is_active ? 'success' : 'danger'} dot>
                  {customer.is_active ? 'Active' : 'Blocked'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">@{customer.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lifetime Orders</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{customer.orders_count}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Spent</p>
              <p className="text-lg font-bold text-emerald-600 mt-0.5">
                ₹{parseFloat(customer.total_spent as string || '0').toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Row */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{customer.phone_number || 'No phone recorded'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Member since{' '}
              {new Date(customer.date_joined).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Address Book & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Address Book Card (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Saved Delivery Addresses</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">{customer.addresses?.length || 0}</span>
          </div>

          <div className="space-y-3">
            {!customer.addresses || customer.addresses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No delivery addresses saved by customer.
              </p>
            ) : (
              customer.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{addr.name}</span>
                    {addr.is_default && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-100 text-brand-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed">{addr.line}</p>
                  <p className="text-slate-500 font-medium">{addr.area}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order History Table Card (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-sky-600" />
              <span>Customer Order History</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {customer.recent_orders?.length || 0} orders
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!customer.recent_orders || customer.recent_orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No orders placed by this customer yet.
                    </td>
                  </tr>
                ) : (
                  customer.recent_orders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => navigate('/orders')}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-900">
                        #{ord.order_number}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{ord.items_count} items</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{parseFloat(ord.grand_total).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">{getOrderStatusBadge(ord.status)}</td>
                      <td className="px-5 py-3.5">{getPaymentStatusBadge(ord.payment_status)}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        {new Date(ord.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

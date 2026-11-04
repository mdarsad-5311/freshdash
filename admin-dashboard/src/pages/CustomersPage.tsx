import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  RefreshCw,
  Eye,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { AdminCustomer, CustomerFilterParams } from '../types/customer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { getErrorMessage } from '../services/api';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Role Change Modal
  const [roleChangeCustomer, setRoleChangeCustomer] = useState<AdminCustomer | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'customer'>('customer');
  const [roleUpdating, setRoleUpdating] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: CustomerFilterParams = {
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        is_active: activeFilter || undefined,
      };

      const res = await customerService.getCustomers(params);
      if (Array.isArray(res)) {
        setCustomers(res);
      } else if (res && 'results' in res) {
        setCustomers(res.results);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, activeFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleToggleStatus = async (cust: AdminCustomer) => {
    try {
      const res = await customerService.toggleStatus(cust.id);
      setCustomers((prev) =>
        prev.map((c) => (c.id === cust.id ? { ...c, is_active: res.is_active } : c))
      );
      setSuccessMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeCustomer) return;
    try {
      setRoleUpdating(true);
      const res = await customerService.changeRole(roleChangeCustomer.id, selectedRole);
      setSuccessMessage(res.message);
      setRoleChangeCustomer(null);
      await fetchCustomers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRoleUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Customer Directory ({customers.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered customer accounts, lifetime spending, order volumes, and account access
          </p>
        </div>
        <button
          onClick={() => fetchCustomers()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          <span>Refresh Customers</span>
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or username..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white text-slate-700"
          >
            <option value="">All Account Roles</option>
            <option value="customer">Consumer Customers</option>
            <option value="manager">Store Managers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white text-slate-700"
          >
            <option value="">All Account Statuses</option>
            <option value="true">Active Accounts</option>
            <option value="false">Blocked / Deactivated</option>
          </select>
        </div>
      </div>

      {/* Customers Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner size="md" label="Loading customer directory..." className="py-16" />
        ) : customers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No customers found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No customer records match your active search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Orders</th>
                  <th className="px-5 py-3.5">Total Spent</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.username;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Username */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{fullName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">@{c.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="px-5 py-3.5">
                        <p className="text-slate-800 font-medium">{c.email}</p>
                        <p className="text-[11px] text-slate-400">
                          {c.phone_number || 'No phone recorded'}
                        </p>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.role === 'admin'
                              ? 'bg-rose-100 text-rose-800'
                              : c.role === 'manager'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.role || 'customer'}
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {c.orders_count} orders
                      </td>

                      {/* Total Spent */}
                      <td className="px-5 py-3.5 font-bold text-emerald-700">
                        ₹{parseFloat(c.total_spent as string || '0').toFixed(2)}
                      </td>

                      {/* Active Status */}
                      <td className="px-5 py-3.5">
                        <Badge variant={c.is_active ? 'success' : 'danger'} dot>
                          {c.is_active ? 'Active' : 'Blocked'}
                        </Badge>
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                        {new Date(c.date_joined).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => navigate(`/customers/${c.id}`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="View customer profile & orders"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setRoleChangeCustomer(c);
                            setSelectedRole((c.role as any) || 'customer');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Change user administrative role"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            c.is_active
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={c.is_active ? 'Block customer account' : 'Reactivate customer account'}
                        >
                          {c.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      <Modal
        isOpen={Boolean(roleChangeCustomer)}
        onClose={() => setRoleChangeCustomer(null)}
        title={`Change Role: ${roleChangeCustomer?.username}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Select the access privileges for this user. Assigning Admin or Manager grants access to the dashboard.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white font-semibold text-slate-800"
            >
              <option value="customer">Consumer Customer (No Dashboard Access)</option>
              <option value="manager">Store Manager (Operational Access)</option>
              <option value="admin">Store Administrator (Full Access)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              onClick={() => setRoleChangeCustomer(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleRoleChange}
              disabled={roleUpdating}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-50"
            >
              {roleUpdating ? 'Saving...' : 'Update Role'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

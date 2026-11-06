import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Boxes,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Save,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { categoryService } from '../services/categoryService';
import { InventoryItem } from '../types/inventory';
import { AdminCategory } from '../types/category';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { Modal } from '../components/common/Modal';
import { getStockBadge } from '../components/common/Badge';
import { getErrorMessage } from '../services/api';

const ORDERING_OPTIONS = [
  { value: 'stock', label: 'Stock: Low to High' },
  { value: '-stock', label: 'Stock: High to Low' },
  { value: 'name', label: 'Produce Name: A to Z' },
  { value: '-name', label: 'Produce Name: Z to A' },
  { value: 'category', label: 'Category: A to Z' },
  { value: '-category', label: 'Category: Z to A' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
];

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [totalCatalogCount, setTotalCatalogCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Sorting
  const [filterType, setFilterType] = useState<'low_stock' | 'out_of_stock' | 'in_stock' | ''>('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ordering, setOrdering] = useState('stock');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Single Adjust Modal
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustStockVal, setAdjustStockVal] = useState<number>(0);
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustMode, setAdjustMode] = useState<'delta' | 'absolute'>('delta');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Batch Adjustment State (stores delta edits map { [productId]: deltaNumber })
  const [batchDeltas, setBatchDeltas] = useState<Record<string, number>>({});
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Ref to prevent stale responses from overwriting newer ones
  const reqIdRef = useRef(0);

  // Fetch categories on mount
  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  // 300ms Debounce search input and reset page to 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchInventory = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryService.getInventory({
        filter: filterType || undefined,
        category: selectedCategory || undefined,
        search: debouncedSearch || undefined,
        ordering: ordering || undefined,
        page: currentPage,
        page_size: pageSize,
      });

      // Discard response if a newer request was dispatched
      if (reqId !== reqIdRef.current) return;

      setItems(res.inventory || []);
      setTotalCount(res.count ?? res.total_items ?? 0);
      setTotalCatalogCount(res.total_items ?? res.count ?? 0);
      setTotalPages(res.total_pages || 1);
      setLowStockCount(res.low_stock_count ?? 0);
      setOutOfStockCount(res.out_of_stock_count ?? 0);
      if (res.page_size) setPageSize(res.page_size);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setError(getErrorMessage(err));
    } finally {
      if (reqId === reqIdRef.current) {
        setLoading(false);
      }
    }
  }, [filterType, selectedCategory, debouncedSearch, ordering, currentPage, pageSize]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handlers that reset page to 1
  const handleFilterTypeChange = (type: 'low_stock' | 'out_of_stock' | 'in_stock' | '') => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleOrderingChange = (ord: string) => {
    setOrdering(ord);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterType('');
    setSelectedCategory('');
    setSearch('');
    setDebouncedSearch('');
    setOrdering('stock');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(filterType || selectedCategory || search || ordering !== 'stock');

  const handleSingleAdjust = async () => {
    if (!adjustItem) return;
    try {
      setIsAdjusting(true);
      setError(null);
      const payload =
        adjustMode === 'delta'
          ? { product_id: adjustItem.id, adjustment: adjustDelta }
          : { product_id: adjustItem.id, stock: Math.max(0, adjustStockVal) };

      const res = await inventoryService.adjustStock(payload);
      setSuccessMessage(res.message);
      setAdjustItem(null);
      await fetchInventory();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleBatchDeltaChange = (productId: string, delta: number) => {
    setBatchDeltas((prev) => {
      const copy = { ...prev };
      if (delta === 0) {
        delete copy[productId];
      } else {
        copy[productId] = delta;
      }
      return copy;
    });
  };

  const handleSaveBatch = async () => {
    const entries = Object.entries(batchDeltas);
    if (entries.length === 0) return;

    try {
      setBatchSubmitting(true);
      setError(null);
      const adjustments = entries.map(([productId, delta]) => ({
        product_id: productId,
        adjustment: delta,
      }));

      const res = await inventoryService.batchAdjust({ adjustments });
      setSuccessMessage(res.message);
      setBatchDeltas({});
      await fetchInventory();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBatchSubmitting(false);
    }
  };

  const pendingBatchCount = Object.keys(batchDeltas).length;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Oversight
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time stock units, restock low produce, and run batch adjustments
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingBatchCount > 0 && (
            <button
              onClick={handleSaveBatch}
              disabled={batchSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs tracking-wide shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {batchSubmitting ? 'Saving...' : `Save ${pendingBatchCount} Pending Change(s)`}
              </span>
            </button>
          )}

          <button
            onClick={() => fetchInventory()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
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

      {/* Overview Metric Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => handleFilterTypeChange('')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterType === ''
              ? 'bg-white border-brand-500 ring-2 ring-brand-500/10 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">All Catalog Stock</span>
            <Boxes className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalCatalogCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Produce items in catalog</p>
        </button>

        <button
          onClick={() => handleFilterTypeChange('low_stock')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterType === 'low_stock'
              ? 'bg-white border-amber-500 ring-2 ring-amber-500/10 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Low Stock Warnings</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-2">{lowStockCount}</p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Threshold: 1 to 10 units left</p>
        </button>

        <button
          onClick={() => handleFilterTypeChange('out_of_stock')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterType === 'out_of_stock'
              ? 'bg-white border-rose-500 ring-2 ring-rose-500/10 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Out of Stock</span>
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-700 mt-2">{outOfStockCount}</p>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Zero units remaining</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search produce product name or ID..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="min-w-[160px]">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="relative min-w-[180px]">
            <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={ordering}
              onChange={(e) => handleOrderingChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white text-slate-700 font-semibold"
            >
              {ORDERING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 whitespace-nowrap px-2 py-1"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading && items.length === 0 ? (
          <LoadingSpinner size="md" label="Loading inventory overview..." className="py-16" />
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No items found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No produce inventory matched your current filter and search criteria.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Produce Product</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Current Stock</th>
                  <th className="px-5 py-3.5">Stock Status</th>
                  <th className="px-5 py-3.5">Quick Batch Adjust</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => {
                  const pendingDelta = batchDeltas[it.id] || 0;
                  const previewStock = Math.max(0, it.stock + pendingDelta);

                  return (
                    <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {it.image ? (
                            <img
                              src={it.image}
                              alt={it.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                              {it.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{it.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {it.weight} • {it.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {it.category_name}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{it.price}
                      </td>

                      {/* Current Stock */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-extrabold text-slate-900">
                          {it.stock} units
                        </span>
                        {pendingDelta !== 0 && (
                          <span
                            className={`block text-[11px] font-bold ${
                              pendingDelta > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {pendingDelta > 0 ? `+${pendingDelta}` : pendingDelta} (Preview: {previewStock})
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {getStockBadge(it.is_available, it.stock)}
                      </td>

                      {/* Quick Stepper for Batch Adjust */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleBatchDeltaChange(it.id, pendingDelta - 10)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                            title="Subtract 10"
                          >
                            -10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchDeltaChange(it.id, pendingDelta - 1)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                            title="Subtract 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span
                            className={`min-w-8 text-center font-bold font-mono text-xs ${
                              pendingDelta !== 0 ? 'text-brand-600 font-extrabold' : 'text-slate-400'
                            }`}
                          >
                            {pendingDelta > 0 ? `+${pendingDelta}` : pendingDelta}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleBatchDeltaChange(it.id, pendingDelta + 1)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                            title="Add 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchDeltaChange(it.id, pendingDelta + 10)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                            title="Add 10"
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setAdjustItem(it);
                            setAdjustStockVal(it.stock);
                            setAdjustDelta(10);
                            setAdjustMode('delta');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Controls */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-white border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-800">{startItem}</strong>–<strong className="text-slate-800">{endItem}</strong> of{' '}
              <strong className="text-slate-800">{totalCount}</strong> produce items
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 && (
                          <span className="px-1 text-slate-400 select-none">…</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          disabled={loading}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            currentPage === p
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single Stock Adjust Modal */}
      <Modal
        isOpen={Boolean(adjustItem)}
        onClose={() => setAdjustItem(null)}
        title={`Adjust Stock: ${adjustItem?.name}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Current in-stock inventory: <strong className="text-slate-900">{adjustItem?.stock} units</strong>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdjustMode('delta')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                adjustMode === 'delta'
                  ? 'bg-brand-50 border-brand-200 text-brand-700'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Delta (+ / -)
            </button>
            <button
              type="button"
              onClick={() => setAdjustMode('absolute')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                adjustMode === 'absolute'
                  ? 'bg-brand-50 border-brand-200 text-brand-700'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Exact Absolute Units
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {adjustMode === 'delta' ? 'Stock Adjustment (e.g. +50 or -15)' : 'New Total Stock Units'}
            </label>
            <input
              type="number"
              value={adjustMode === 'delta' ? adjustDelta : adjustStockVal}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                if (adjustMode === 'delta') setAdjustDelta(val);
                else setAdjustStockVal(val);
              }}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              onClick={() => setAdjustItem(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSingleAdjust}
              disabled={isAdjusting}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-50"
            >
              {isAdjusting ? 'Updating...' : 'Save Adjustment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

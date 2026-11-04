import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Boxes,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { AdminProduct, ProductFormData } from '../types/product';
import { AdminCategory } from '../types/category';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { Modal } from '../components/common/Modal';
import { getStockBadge } from '../components/common/Badge';
import { getErrorMessage } from '../services/api';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatus, setStockStatus] = useState<'low_stock' | 'out_of_stock' | 'in_stock' | ''>('');
  const [availability, setAvailability] = useState('');
  const [ordering, setOrdering] = useState('-created_at');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<AdminProduct | null>(null);

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
    id: '',
    name: '',
    weight: '500 g',
    price: '',
    original: '',
    category: '',
    popular: false,
    organic: false,
    description: '',
    stock: 50,
    is_available: true,
    image: null,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Stock Adjust State
  const [adjustValue, setAdjustValue] = useState<number>(0);
  const [adjustMode, setAdjustMode] = useState<'delta' | 'absolute'>('delta');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productService.getProducts({
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        stock_status: stockStatus || undefined,
        is_available: availability || undefined,
        ordering,
      });

      if (Array.isArray(res)) {
        setProducts(res);
      } else if (res && 'results' in res) {
        setProducts(res.results);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, stockStatus, availability, ordering]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormError(null);
    setFormData({
      id: '',
      name: '',
      weight: '500 g',
      price: '',
      original: '',
      category: categories[0]?.id || '',
      popular: false,
      organic: false,
      description: '',
      stock: 50,
      is_available: true,
      image: null,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (p: AdminProduct) => {
    setEditingProduct(p);
    setFormError(null);
    setFormData({
      id: p.id,
      name: p.name,
      weight: p.weight,
      price: p.price,
      original: p.original,
      category: p.category,
      popular: p.popular,
      organic: p.organic,
      description: p.description || '',
      stock: p.stock,
      is_available: p.is_available,
      image: null,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.price || !formData.category) {
      setFormError('Please fill in product name, price, and select a category.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
        setSuccessMessage(`Product "${formData.name}" updated successfully.`);
      } else {
        await productService.createProduct(formData);
        setSuccessMessage(`Product "${formData.name}" created successfully.`);
      }
      setIsFormOpen(false);
      await fetchProducts();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await productService.deleteProduct(deletingProduct.id);
      setSuccessMessage(`Product "${deletingProduct.name}" deleted successfully.`);
      setDeletingProduct(null);
      await fetchProducts();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleToggleStatus = async (p: AdminProduct) => {
    try {
      const res = await productService.toggleStatus(p.id);
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_available: res.is_available } : item))
      );
      setSuccessMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAdjustStock = async () => {
    if (!stockAdjustProduct) return;
    try {
      setAdjustSubmitting(true);
      const payload =
        adjustMode === 'delta'
          ? { adjustment: adjustValue }
          : { stock: Math.max(0, adjustValue) };
      const res = await productService.adjustStock(stockAdjustProduct.id, payload);
      setSuccessMessage(res.message);
      setStockAdjustProduct(null);
      setAdjustValue(0);
      await fetchProducts();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setAdjustSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Produce Products ({products.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage catalog produce items, pricing, inventory stocks and discounts
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-xs tracking-wide shadow-sm shadow-brand-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
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

      {/* Search & Filters Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or description..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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

          {/* Stock status filter */}
          <div>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white text-slate-700"
            >
              <option value="">All Stock Levels</option>
              <option value="in_stock">In Stock (&gt;10)</option>
              <option value="low_stock">Low Stock (1-10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Availability filter */}
          <div>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white text-slate-700"
            >
              <option value="">All Availability</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Ordering bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort By:</span>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="font-bold text-slate-700 bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="-created_at">Recently Added</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="stock">Stock: Low to High</option>
              <option value="-stock">Stock: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>

          <button
            onClick={() => fetchProducts()}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner size="md" label="Loading product catalog..." className="py-16" />
        ) : products.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No produce products match your active search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Produce Item</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Price / MRP</th>
                  <th className="px-5 py-3.5">Stock</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Produce Name & Image */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0 font-bold">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                          <p className="text-slate-400 text-[11px]">
                            {p.weight} • <span className="font-mono text-slate-500">{p.id}</span>
                          </p>
                          {p.organic && (
                            <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                              Organic
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {p.category_name || p.category}
                      </span>
                    </td>

                    {/* Price & Discount */}
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 text-sm">₹{p.price}</p>
                      {parseFloat(p.original) > parseFloat(p.price) && (
                        <p className="text-[11px] text-slate-400">
                          <span className="line-through">₹{p.original}</span>{' '}
                          <span className="text-emerald-600 font-bold">
                            {p.discount_percentage}% off
                          </span>
                        </p>
                      )}
                    </td>

                    {/* Stock & Quick Adjust */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {getStockBadge(p.is_available, p.stock)}
                        <button
                          onClick={() => {
                            setStockAdjustProduct(p);
                            setAdjustValue(p.stock);
                            setAdjustMode('delta');
                          }}
                          title="Quick adjust stock"
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Availability Toggle */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          p.is_available
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {p.is_available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{p.is_available ? 'Available' : 'Hidden'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(p)}
                        title="Edit product"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingProduct(p)}
                        title="Delete product"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? `Edit ${editingProduct.name}` : 'Add New Produce Product'}
        description="Configure produce product details, pricing, categories, and stock"
        maxWidth="xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && <Alert type="error" message={formError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Fresh Red Tomatoes"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product ID / Slug (Optional)
              </label>
              <input
                type="text"
                value={formData.id || ''}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                disabled={Boolean(editingProduct)}
                placeholder="e.g. tomato (auto-slugified if blank)"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white"
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weight / Unit *</label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="e.g. 500 g or 1 kg or 6 pcs"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock Units *</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Discounted Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g. 40.00"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Original MRP Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.original}
                onChange={(e) => setFormData({ ...formData, original: e.target.value })}
                placeholder="e.g. 50.00"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Fresh farm produce, naturally grown..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Upload Product Image</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData({ ...formData, image: file });
                  }}
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700">Available to customers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.popular}
                  onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700">Bestseller Shelf</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.organic}
                  onChange={(e) => setFormData({ ...formData, organic: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700">Organic Produce</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        title="Delete Product"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-900">{deletingProduct?.name}</strong>? This action
            cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              onClick={() => setDeletingProduct(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              Delete Product
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Stock Adjust Modal */}
      <Modal
        isOpen={Boolean(stockAdjustProduct)}
        onClose={() => setStockAdjustProduct(null)}
        title={`Adjust Stock for ${stockAdjustProduct?.name}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Current stock: <strong className="text-slate-900">{stockAdjustProduct?.stock} units</strong>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAdjustMode('delta');
                setAdjustValue(10);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                adjustMode === 'delta'
                  ? 'bg-brand-50 border-brand-200 text-brand-700'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Adjust by Delta (+ / -)
            </button>
            <button
              type="button"
              onClick={() => {
                setAdjustMode('absolute');
                setAdjustValue(stockAdjustProduct?.stock || 0);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                adjustMode === 'absolute'
                  ? 'bg-brand-50 border-brand-200 text-brand-700'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Set Absolute Value
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {adjustMode === 'delta' ? 'Stock Adjustment (e.g. +25 or -10)' : 'Exact Stock Units'}
            </label>
            <input
              type="number"
              value={adjustValue}
              onChange={(e) => setAdjustValue(parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setStockAdjustProduct(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleAdjustStock}
              disabled={adjustSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-50"
            >
              {adjustSubmitting ? 'Updating...' : 'Confirm Adjustment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Layers,
  AlertCircle,
  Package,
  Search,
  X,
  RefreshCw,
} from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { AdminCategory, CategoryFormData } from '../types/category';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { getErrorMessage } from '../services/api';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ordering, setOrdering] = useState('name');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<AdminCategory | null>(null);

  // Form State
  const [formData, setFormData] = useState<CategoryFormData>({
    id: '',
    name: '',
    tint: '#EEF4E8',
    is_active: true,
    image: null,
    remove_image: false,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeImageIntent, setRemoveImageIntent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await categoryService.getCategories({
        search: debouncedSearch || undefined,
        is_active: statusFilter || undefined,
        ordering,
      });
      setCategories(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, ordering]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateModal = () => {
    // Revoke previous blob if any
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setEditingCategory(null);
    setExistingImageUrl(null);
    setRemoveImageIntent(false);
    setFormError(null);
    setImagePreview(null);
    setFormData({
      id: '',
      name: '',
      tint: '#EEF4E8',
      is_active: true,
      image: null,
      remove_image: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsFormOpen(true);
  };

  const openEditModal = (c: AdminCategory) => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setEditingCategory(c);
    setExistingImageUrl(c.image || null);
    setRemoveImageIntent(false);
    setFormError(null);
    setImagePreview(c.image || null);
    setFormData({
      id: c.id,
      name: c.name,
      tint: c.tint || '#EEF4E8',
      is_active: c.is_active,
      image: null,
      remove_image: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setFormData((prev) => ({ ...prev, image: file, remove_image: false }));
      setRemoveImageIntent(false);
      const newUrl = URL.createObjectURL(file);
      setImagePreview(newUrl);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // If user currently has a newly selected file (formData.image is File)
    if (formData.image instanceof File) {
      // Revert newly selected file; do NOT delete existing server image
      setFormData((prev) => ({ ...prev, image: null, remove_image: false }));
      if (existingImageUrl) {
        setImagePreview(existingImageUrl);
        setRemoveImageIntent(false);
      } else {
        setImagePreview(null);
        setRemoveImageIntent(false);
      }
    } else {
      // User is explicitly removing the existing server image
      setImagePreview(null);
      setRemoveImageIntent(true);
      setFormData((prev) => ({ ...prev, image: null, remove_image: true }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          ...formData,
          remove_image: removeImageIntent,
        });
        setSuccessMessage(`Category "${formData.name}" updated successfully.`);
      } else {
        await categoryService.createCategory(formData);
        setSuccessMessage(`Category "${formData.name}" created successfully.`);
      }
      setIsFormOpen(false);
      await fetchCategories();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await categoryService.deleteCategory(deletingCategory.id);
      setSuccessMessage(`Category "${deletingCategory.name}" deleted successfully.`);
      setDeletingCategory(null);
      await fetchCategories();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeletingCategory(null);
    }
  };

  const handleToggleStatus = async (c: AdminCategory) => {
    try {
      const res = await categoryService.toggleStatus(c.id);
      setCategories((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, is_active: res.is_active } : item))
      );
      setSuccessMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Produce Categories ({categories.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize produce categories, card backgrounds, and catalog visibility
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-xs tracking-wide shadow-sm shadow-brand-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by category name or slug..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          {/* Ordering filter */}
          <div>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white text-slate-700 font-semibold"
            >
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
              <option value="-created_at">Recently Added</option>
              <option value="created_at">Oldest</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Refresh */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-500">
            Showing <strong className="text-slate-800">{categories.length}</strong> categories
            {debouncedSearch && (
              <span>
                {' '}matching "<strong className="text-slate-800">{debouncedSearch}</strong>"
              </span>
            )}
            {statusFilter === 'true' && ' • Active only'}
            {statusFilter === 'false' && ' • Inactive only'}
          </span>

          <button
            onClick={() => fetchCategories()}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Categories Cards Grid */}
      {loading ? (
        <LoadingSpinner size="md" label="Loading produce categories..." className="py-16" />
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {debouncedSearch || statusFilter ? 'No matching categories' : 'No categories found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {debouncedSearch || statusFilter
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Add Category" above to create your first produce category.'}
          </p>
          {(debouncedSearch || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="mt-4 px-4 py-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-slate-800 text-sm shadow-sm"
                        style={{ backgroundColor: c.tint || '#EEF4E8' }}
                      >
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {c.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">slug: {c.id}</p>
                    </div>
                  </div>

                  <Badge variant={c.is_active ? 'success' : 'neutral'} dot>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>
                    <strong className="text-slate-800">{c.products_count}</strong> products in this category
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(c)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    c.is_active
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-brand-600 bg-brand-50 hover:bg-brand-100'
                  }`}
                >
                  {c.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{c.is_active ? 'Hide in Store' : 'Activate in Store'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    title="Edit category"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingCategory(c)}
                    title="Delete category"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && <Alert type="error" message={formError} />}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Exotic Fruits"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Slug ID (Optional)
            </label>
            <input
              type="text"
              value={formData.id || ''}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={Boolean(editingCategory)}
              placeholder="e.g. exotic-fruits (auto-generated if left blank)"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Card Background Tint Color (Hex)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.tint || '#EEF4E8'}
                onChange={(e) => setFormData({ ...formData, tint: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={formData.tint || '#EEF4E8'}
                onChange={(e) => setFormData({ ...formData, tint: e.target.value })}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />

            {/* Image Preview Area */}
            {imagePreview && (
              <div className="mt-3 flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <img
                  src={imagePreview}
                  alt="Category preview"
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-white shadow-sm shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700">
                    {formData.image instanceof File ? 'New Image Selected' : 'Current Category Image'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {formData.image instanceof File ? formData.image.name : 'Saved on server'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-all"
                >
                  {formData.image instanceof File && existingImageUrl ? 'Revert to Current' : 'Remove Image'}
                </button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-700">Category Active in Store</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
              {formSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        title="Delete Category"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete category{' '}
            <strong className="text-slate-900">{deletingCategory?.name}</strong>?
          </p>

          {deletingCategory && deletingCategory.products_count > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                This category contains <strong>{deletingCategory.products_count} product(s)</strong>.
                The backend protects against deleting categories with products. You must reassign or delete the products first.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              onClick={() => setDeletingCategory(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Layers,
  AlertCircle,
  Package,
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
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await categoryService.getCategories();
      setCategories(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormError(null);
    setFormData({
      id: '',
      name: '',
      tint: '#EEF4E8',
      is_active: true,
      image: null,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (c: AdminCategory) => {
    setEditingCategory(c);
    setFormError(null);
    setFormData({
      id: c.id,
      name: c.name,
      tint: c.tint || '#EEF4E8',
      is_active: c.is_active,
      image: null,
    });
    setIsFormOpen(true);
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
        await categoryService.updateCategory(editingCategory.id, formData);
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

      {/* Categories Cards Grid */}
      {loading ? (
        <LoadingSpinner size="md" label="Loading produce categories..." className="py-16" />
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No categories found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click "Add Category" above to create your first produce category.
          </p>
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
        title={editingCategory ? `Edit Category ${editingCategory.name}` : 'Add New Category'}
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
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setFormData({ ...formData, image: file });
              }}
              className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
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

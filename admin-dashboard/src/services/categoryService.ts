import { api } from './api';
import { AdminCategory, CategoryFilterParams, CategoryFormData } from '../types/category';

export interface PaginatedCategoriesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminCategory[];
}

export const categoryService = {
  /**
   * Fetch all categories with optional search, status filtering, and ordering.
   */
  async getCategories(params?: CategoryFilterParams): Promise<AdminCategory[]> {
    const response = await api.get<PaginatedCategoriesResponse | AdminCategory[]>('/categories/', {
      params,
    });
    const data = response.data;
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      return data.results;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  },

  /**
   * Fetch single category.
   */
  async getCategory(id: string): Promise<AdminCategory> {
    const response = await api.get<AdminCategory>(`/categories/${encodeURIComponent(id)}/`);
    return response.data;
  },

  /**
   * Create a new category.
   * Supports multipart FormData for image upload.
   */
  async createCategory(data: CategoryFormData): Promise<AdminCategory> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.id) formData.append('id', data.id);
    if (data.tint) formData.append('tint', data.tint);
    if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));
    if (data.image) formData.append('image', data.image);

    const response = await api.post<AdminCategory>('/categories/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Update category.
   */
  async updateCategory(id: string, data: Partial<CategoryFormData>): Promise<AdminCategory> {
    const formData = new FormData();
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.tint !== undefined) formData.append('tint', data.tint);
    if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));
    if (data.image) {
      formData.append('image', data.image);
    } else if (data.remove_image) {
      formData.append('remove_image', 'true');
    }

    const response = await api.patch<AdminCategory>(`/categories/${encodeURIComponent(id)}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Delete category.
   */
  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/categories/${encodeURIComponent(id)}/`);
    return response.data || { success: true, message: 'Category deleted successfully.' };
  },

  /**
   * Toggle category active status.
   */
  async toggleStatus(id: string): Promise<{ success: boolean; is_active: boolean; message: string; category: AdminCategory }> {
    const response = await api.post(`/categories/${encodeURIComponent(id)}/toggle-status/`);
    return response.data;
  },
};


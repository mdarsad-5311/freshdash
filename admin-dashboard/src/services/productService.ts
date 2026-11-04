import { api } from './api';
import { AdminProduct, ProductFilterParams, ProductFormData } from '../types/product';

export interface PaginatedProductsResponse {
  count: number;
  total_pages?: number;
  current_page?: number;
  next: string | null;
  previous: string | null;
  results: AdminProduct[];
}

export const productService = {
  /**
   * Fetch products with optional filtering, sorting, and pagination.
   */
  async getProducts(params?: ProductFilterParams): Promise<PaginatedProductsResponse | AdminProduct[]> {
    const response = await api.get<PaginatedProductsResponse | AdminProduct[]>('/products/', {
      params,
    });
    return response.data;
  },

  /**
   * Get single product details by id.
   */
  async getProduct(id: string): Promise<AdminProduct> {
    const response = await api.get<AdminProduct>(`/products/${encodeURIComponent(id)}/`);
    return response.data;
  },

  /**
   * Create a new produce product.
   * Handles multipart FormData for image uploads.
   */
  async createProduct(data: ProductFormData): Promise<AdminProduct> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('weight', data.weight);
    formData.append('price', String(data.price));
    formData.append('original', String(data.original));
    formData.append('category', data.category);
    formData.append('stock', String(data.stock));

    if (data.id) formData.append('id', data.id);
    if (data.description) formData.append('description', data.description);
    if (data.popular !== undefined) formData.append('popular', String(data.popular));
    if (data.organic !== undefined) formData.append('organic', String(data.organic));
    if (data.is_available !== undefined) formData.append('is_available', String(data.is_available));
    if (data.image) formData.append('image', data.image);

    const response = await api.post<AdminProduct>('/products/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Update existing product.
   */
  async updateProduct(id: string, data: Partial<ProductFormData>): Promise<AdminProduct> {
    const formData = new FormData();
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.weight !== undefined) formData.append('weight', data.weight);
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.original !== undefined) formData.append('original', String(data.original));
    if (data.category !== undefined) formData.append('category', data.category);
    if (data.stock !== undefined) formData.append('stock', String(data.stock));
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.popular !== undefined) formData.append('popular', String(data.popular));
    if (data.organic !== undefined) formData.append('organic', String(data.organic));
    if (data.is_available !== undefined) formData.append('is_available', String(data.is_available));
    if (data.image) formData.append('image', data.image);

    const response = await api.patch<AdminProduct>(`/products/${encodeURIComponent(id)}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Delete product by id.
   */
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${encodeURIComponent(id)}/`);
  },

  /**
   * Toggle product availability (in-stock / out-of-stock).
   */
  async toggleStatus(id: string): Promise<{ success: boolean; is_available: boolean; message: string; product: AdminProduct }> {
    const response = await api.post(`/products/${encodeURIComponent(id)}/toggle-status/`);
    return response.data;
  },

  /**
   * Adjust product stock units directly.
   */
  async adjustStock(
    id: string,
    payload: { stock?: number; adjustment?: number }
  ): Promise<{ success: boolean; message: string; product: AdminProduct }> {
    const response = await api.post(`/products/${encodeURIComponent(id)}/adjust-stock/`, payload);
    return response.data;
  },
};


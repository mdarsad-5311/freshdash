import { api, normalizeApiError } from './api';
import { API_ENDPOINTS } from '../constants/config';
import {
  Category,
  Product,
  RawCategoryResponse,
  RawProductResponse,
  ProductQueryParams,
  transformCategory,
  transformProduct,
} from '../types/product';
import { PaginatedResponse } from '../types/api';

export interface CategoryQueryParams {
  page?: number;
  page_size?: number;
}

export const categoryService = {
  /**
   * Fetch paginated categories from the backend.
   */
  async getCategories(params?: CategoryQueryParams): Promise<PaginatedResponse<Category>> {
    try {
      const response = await api.get<PaginatedResponse<RawCategoryResponse> | RawCategoryResponse[]>(
        API_ENDPOINTS.CATEGORIES,
        { params }
      );

      const data = response.data;

      // Handle standard DRF paginated response
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return {
          count: data.count,
          total_pages: data.total_pages,
          current_page: data.current_page,
          page_size: data.page_size,
          next: data.next,
          previous: data.previous,
          results: data.results.map(transformCategory),
        };
      }

      // Handle raw array response fallback
      if (Array.isArray(data)) {
        const transformed = data.map(transformCategory);
        return {
          count: transformed.length,
          total_pages: 1,
          current_page: 1,
          page_size: transformed.length,
          next: null,
          previous: null,
          results: transformed,
        };
      }

      return {
        count: 0,
        total_pages: 0,
        current_page: 1,
        page_size: 20,
        next: null,
        previous: null,
        results: [],
      };
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Fetch all active categories as a flat array for easy screen rendering.
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      // By default backend page_size is 20, our categories table has 9
      const response = await this.getCategories({ page_size: 50 });
      return response.results;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Fetch single category details by id.
   */
  async getCategory(id: string): Promise<Category> {
    try {
      const response = await api.get<RawCategoryResponse>(`${API_ENDPOINTS.CATEGORIES}${id}/`);
      return transformCategory(response.data);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Fetch produce products belonging to a specific category.
   */
  async getCategoryProducts(
    categoryId: string,
    params?: ProductQueryParams
  ): Promise<PaginatedResponse<Product>> {
    try {
      const response = await api.get<PaginatedResponse<RawProductResponse> | RawProductResponse[]>(
        `${API_ENDPOINTS.CATEGORIES}${categoryId}/products/`,
        { params }
      );

      const data = response.data;

      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return {
          count: data.count,
          total_pages: data.total_pages,
          current_page: data.current_page,
          page_size: data.page_size,
          next: data.next,
          previous: data.previous,
          results: data.results.map(transformProduct),
        };
      }

      if (Array.isArray(data)) {
        const transformed = data.map(transformProduct);
        return {
          count: transformed.length,
          total_pages: 1,
          current_page: 1,
          page_size: transformed.length,
          next: null,
          previous: null,
          results: transformed,
        };
      }

      return {
        count: 0,
        total_pages: 0,
        current_page: 1,
        page_size: 20,
        next: null,
        previous: null,
        results: [],
      };
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};


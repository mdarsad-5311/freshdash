import { api, normalizeApiError } from './api';
import { API_ENDPOINTS } from '../constants/config';
import {
  Product,
  RawProductResponse,
  ProductQueryParams,
  transformProduct,
} from '../types/product';
import { PaginatedResponse } from '../types/api';

export const productService = {
  /**
   * Fetch paginated list of produce products with optional filtering, search, and sorting.
   */
  async getProducts(params?: ProductQueryParams): Promise<PaginatedResponse<Product>> {
    try {
      const response = await api.get<PaginatedResponse<RawProductResponse> | RawProductResponse[]>(
        API_ENDPOINTS.PRODUCTS,
        { params }
      );

      const data = response.data;

      // Standard DRF paginated response
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

      // Fallback for non-paginated array responses
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

  /**
   * Fetch single product details by id.
   */
  async getProduct(id: string): Promise<Product> {
    try {
      const response = await api.get<RawProductResponse>(`${API_ENDPOINTS.PRODUCTS}${id}/`);
      return transformProduct(response.data);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Fetch products belonging to a category or category tab ('all', 'vegetables', 'fruits', etc.).
   */
  async getProductsByCategory(
    category: string,
    params?: Omit<ProductQueryParams, 'category'>
  ): Promise<PaginatedResponse<Product>> {
    return this.getProducts({
      ...params,
      category,
    });
  },

  /**
   * Search produce products by query string.
   */
  async searchProducts(
    search: string,
    params?: Omit<ProductQueryParams, 'search'>
  ): Promise<PaginatedResponse<Product>> {
    return this.getProducts({
      ...params,
      search,
    });
  },

  /**
   * Fetch everyday bestselling produce.
   */
  async getBestsellers(): Promise<Product[]> {
    try {
      const response = await api.get<RawProductResponse[] | PaginatedResponse<RawProductResponse>>(
        `${API_ENDPOINTS.PRODUCTS}bestsellers/`
      );

      const data = response.data;
      if (Array.isArray(data)) {
        return data.map(transformProduct);
      }
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results.map(transformProduct);
      }
      return [];
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Fetch seasonal produce picks (e.g. Alphonso mangoes).
   */
  async getSeasonal(): Promise<Product[]> {
    try {
      const response = await api.get<RawProductResponse[] | PaginatedResponse<RawProductResponse>>(
        `${API_ENDPOINTS.PRODUCTS}seasonal/`
      );

      const data = response.data;
      if (Array.isArray(data)) {
        return data.map(transformProduct);
      }
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results.map(transformProduct);
      }
      return [];
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Fetch complementary produce recommendations for the product detail screen.
   */
  async getPairsWellWith(id: string): Promise<Product[]> {
    try {
      const response = await api.get<RawProductResponse[] | PaginatedResponse<RawProductResponse>>(
        `${API_ENDPOINTS.PRODUCTS}${id}/pairs-well-with/`
      );

      const data = response.data;
      if (Array.isArray(data)) {
        return data.map(transformProduct);
      }
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results.map(transformProduct);
      }
      return [];
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};


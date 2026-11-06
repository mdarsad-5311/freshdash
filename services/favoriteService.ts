import { api, normalizeApiError } from './api';
import { API_ENDPOINTS } from '../constants/config';
import { Product, transformProduct } from '../types/product';
import {
  RawFavoriteItem,
  RawToggleFavoriteResponse,
  ToggleFavoriteResult,
} from '../types/favorite';
import { PaginatedResponse } from '../types/api';

export const favoriteService = {
  /**
   * Fetch all saved favorite products for the currently authenticated user.
   */
  async getFavorites(): Promise<Product[]> {
    try {
      const response = await api.get<PaginatedResponse<RawFavoriteItem> | RawFavoriteItem[]>(
        API_ENDPOINTS.FAVORITES
      );

      const data = response.data;

      // Standard DRF paginated response
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results
          .filter((item) => item && item.product)
          .map((item) => transformProduct(item.product));
      }

      // Flat array fallback
      if (Array.isArray(data)) {
        return data
          .filter((item) => item && item.product)
          .map((item) => transformProduct(item.product));
      }

      return [];
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Toggle favorite state for a given product ID on the backend.
   * Returns whether the product is now favorited.
   */
  async toggleFavorite(productId: string): Promise<ToggleFavoriteResult> {
    try {
      const response = await api.post<RawToggleFavoriteResponse>(
        `${API_ENDPOINTS.FAVORITES}toggle/`,
        { product_id: productId }
      );

      return {
        success: Boolean(response.data.success),
        productId: response.data.product_id,
        isFavourite: Boolean(response.data.is_favourite),
        message: response.data.message || '',
      };
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};


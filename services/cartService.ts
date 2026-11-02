import { api, normalizeApiError } from './api';
import { API_ENDPOINTS } from '../constants/config';
import {
  BackendCartSummary,
  CartMutationResponse,
  CouponApplyResult,
  RawBackendCartSummary,
  RawCartMutationResponse,
  RawCouponApplyResult,
  transformCartItem,
  transformCartSummary,
} from '../types/cart';

export const cartService = {
  /**
   * Fetch user's current shopping basket and bill summary.
   */
  async getCart(): Promise<BackendCartSummary> {
    try {
      const response = await api.get<RawBackendCartSummary>(API_ENDPOINTS.CART);
      return transformCartSummary(response.data);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Add produce product to cart with optional quantity and double-pack sizing.
   */
  async addToCart(
    productId: string,
    quantity = 1,
    large = false
  ): Promise<CartMutationResponse> {
    try {
      const response = await api.post<RawCartMutationResponse>(API_ENDPOINTS.CART, {
        product_id: productId,
        quantity,
        large,
      });

      return {
        success: response.data.success,
        message: response.data.message,
        item: response.data.item ? transformCartItem(response.data.item) : null,
        summary: transformCartSummary(response.data.summary),
      };
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Update cart item quantity either by delta (+1 / -1) or explicit quantity.
   * Key can be numeric ID or composite key (e.g. 'tomato:regular').
   */
  async updateQuantity(
    keyOrId: string | number,
    update: { delta?: number; quantity?: number }
  ): Promise<CartMutationResponse> {
    try {
      const response = await api.patch<RawCartMutationResponse>(
        `${API_ENDPOINTS.CART}${encodeURIComponent(String(keyOrId))}/`,
        update
      );

      return {
        success: response.data.success,
        message: response.data.message,
        item: response.data.item ? transformCartItem(response.data.item) : null,
        summary: transformCartSummary(response.data.summary),
      };
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Remove item completely from basket.
   */
  async removeFromCart(keyOrId: string | number): Promise<BackendCartSummary> {
    try {
      const response = await api.delete<{ success: boolean; message: string; summary: RawBackendCartSummary }>(
        `${API_ENDPOINTS.CART}${encodeURIComponent(String(keyOrId))}/`
      );

      return transformCartSummary(response.data.summary);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Clear all items in user's basket.
   */
  async clearCart(): Promise<BackendCartSummary> {
    try {
      const response = await api.post<{ success: boolean; message: string; summary: RawBackendCartSummary }>(
        `${API_ENDPOINTS.CART}clear/`
      );

      return transformCartSummary(response.data.summary);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Validate and apply promo coupon code to current item total.
   */
  async applyCoupon(code: string, itemTotal: number): Promise<CouponApplyResult> {
    try {
      const response = await api.post<RawCouponApplyResult>(`${API_ENDPOINTS.COUPONS}apply/`, {
        code,
        item_total: itemTotal.toFixed(2),
      });

      const data = response.data;
      const parseNum = (v: string | number | undefined) =>
        typeof v === 'string' ? parseFloat(v) : Number(v) || 0;

      return {
        valid: Boolean(data.valid),
        code: data.code,
        discount: parseNum(data.discount),
        itemTotal: parseNum(data.item_total),
        deliveryFee: parseNum(data.delivery_fee),
        finalTotal: parseNum(data.final_total),
        message: data.message,
      };
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};


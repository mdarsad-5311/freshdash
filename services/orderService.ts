import { api, normalizeApiError } from './api';
import { API_ENDPOINTS } from '../constants/config';
import {
  Order,
  RawOrder,
  CreateOrderPayload,
  CreateOrderResponse,
  OrderStatus,
  transformOrder,
} from '../types/order';
import { PaginatedResponse } from '../types/api';

export const orderService = {
  /**
   * Place a new order from current cart items.
   */
  async createOrder(payload: CreateOrderPayload = {}): Promise<Order> {
    try {
      const response = await api.post<CreateOrderResponse>(
        API_ENDPOINTS.ORDERS,
        payload
      );

      const data = response.data;
      if (data && data.order) {
        return transformOrder(data.order);
      }
      throw new Error(data?.message || 'Failed to place order.');
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Fetch paginated list of user's orders.
   */
  async getOrders(params?: {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Order>> {
    try {
      const response = await api.get<PaginatedResponse<RawOrder> | RawOrder[]>(
        API_ENDPOINTS.ORDERS,
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
          results: data.results.map(transformOrder),
        };
      }

      if (Array.isArray(data)) {
        const transformed = data.map(transformOrder);
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
   * Fetch flat list of all user orders.
   */
  async getAllOrders(): Promise<Order[]> {
    try {
      const response = await this.getOrders({ page_size: 50 });
      return response.results;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Retrieve single order details by order_number or numeric id.
   */
  async getOrder(orderNumberOrId: string | number): Promise<Order> {
    try {
      const response = await api.get<RawOrder>(
        `${API_ENDPOINTS.ORDERS}${encodeURIComponent(String(orderNumberOrId))}/`
      );
      return transformOrder(response.data);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Fetch latest status for a given order.
   */
  async getOrderStatus(orderNumberOrId: string | number): Promise<OrderStatus> {
    const order = await this.getOrder(orderNumberOrId);
    return order.status;
  },

  /**
   * Attempt to cancel an order if cancellation is supported by the server.
   */
  async cancelOrder(orderNumberOrId: string | number): Promise<Order> {
    try {
      const response = await api.post<{ success: boolean; message: string; order: RawOrder }>(
        `${API_ENDPOINTS.ORDERS}${encodeURIComponent(String(orderNumberOrId))}/cancel/`
      );
      return transformOrder(response.data.order);
    } catch (error: any) {
      const normalized = normalizeApiError(error);
      if (normalized.statusCode === 404 || normalized.statusCode === 405) {
        throw new Error('Order cancellation is not supported for this order.');
      }
      throw normalized;
    }
  },
};


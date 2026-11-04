import { api } from './api';
import {
  AdminOrderDetail,
  AdminOrderListItem,
  OrderFilterParams,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../types/order';

export interface PaginatedOrdersResponse {
  count: number;
  total_pages?: number;
  current_page?: number;
  next: string | null;
  previous: string | null;
  results: AdminOrderListItem[];
}

export const orderService = {
  /**
   * Fetch orders with status, date, payment and search filters.
   */
  async getOrders(params?: OrderFilterParams): Promise<PaginatedOrdersResponse | AdminOrderListItem[]> {
    const response = await api.get<PaginatedOrdersResponse | AdminOrderListItem[]>('/orders/', {
      params,
    });
    return response.data;
  },

  /**
   * Get single order detail with all line items and customer information.
   */
  async getOrder(orderNumberOrId: string | number): Promise<AdminOrderDetail> {
    const response = await api.get<AdminOrderDetail>(`/orders/${encodeURIComponent(String(orderNumberOrId))}/`);
    return response.data;
  },

  /**
   * Update fulfillment status, payment status, or payment method.
   * Synchronizes inventory automatically if cancelled.
   */
  async updateOrderStatus(
    orderNumberOrId: string | number,
    payload: {
      status?: OrderStatus;
      payment_status?: PaymentStatus;
      payment_method?: PaymentMethod;
    }
  ): Promise<{ success: boolean; message: string; order: AdminOrderDetail }> {
    const response = await api.patch(
      `/orders/${encodeURIComponent(String(orderNumberOrId))}/`,
      payload
    );
    return response.data;
  },
};


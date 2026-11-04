import { api } from './api';
import {
  AdminCustomer,
  AdminCustomerDetail,
  CustomerFilterParams,
} from '../types/customer';

export interface PaginatedCustomersResponse {
  count: number;
  total_pages?: number;
  current_page?: number;
  next: string | null;
  previous: string | null;
  results: AdminCustomer[];
}

export const customerService = {
  /**
   * Fetch registered customers list with lifetime spend and order metrics.
   */
  async getCustomers(params?: CustomerFilterParams): Promise<PaginatedCustomersResponse | AdminCustomer[]> {
    const response = await api.get<PaginatedCustomersResponse | AdminCustomer[]>('/customers/', {
      params,
    });
    return response.data;
  },

  /**
   * Get complete customer profile including address book and order history.
   */
  async getCustomer(id: number): Promise<AdminCustomerDetail> {
    const response = await api.get<AdminCustomerDetail>(`/customers/${id}/`);
    return response.data;
  },

  /**
   * Toggle customer active/blocked status.
   */
  async toggleStatus(id: number): Promise<{ success: boolean; is_active: boolean; message: string; customer: AdminCustomer }> {
    const response = await api.post(`/customers/${id}/toggle-status/`);
    return response.data;
  },

  /**
   * Change user administrative role (admin, manager, customer).
   */
  async changeRole(
    id: number,
    role: 'admin' | 'manager' | 'customer'
  ): Promise<{ success: boolean; role: string; message: string; customer: AdminCustomer }> {
    const response = await api.post(`/customers/${id}/change-role/`, { role });
    return response.data;
  },
};


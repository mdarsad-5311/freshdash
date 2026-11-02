import { api, normalizeApiError } from './api';
import { API_ENDPOINTS } from '../constants/config';
import { Address, CreateAddressPayload, UpdateAddressPayload } from '../types/order';
import { PaginatedResponse } from '../types/api';

export const addressService = {
  /**
   * Fetch all saved delivery addresses for the authenticated user.
   */
  async getAddresses(): Promise<Address[]> {
    try {
      const response = await api.get<PaginatedResponse<Address> | Address[]>(
        API_ENDPOINTS.ADDRESSES
      );

      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Fetch single address by ID.
   */
  async getAddress(id: number): Promise<Address> {
    try {
      const response = await api.get<Address>(`${API_ENDPOINTS.ADDRESSES}${id}/`);
      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Add a new delivery address for user.
   */
  async createAddress(payload: CreateAddressPayload): Promise<Address> {
    try {
      const response = await api.post<Address>(API_ENDPOINTS.ADDRESSES, payload);
      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Update an existing delivery address.
   */
  async updateAddress(id: number, payload: UpdateAddressPayload): Promise<Address> {
    try {
      const response = await api.patch<Address>(`${API_ENDPOINTS.ADDRESSES}${id}/`, payload);
      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Delete an existing address by ID.
   */
  async deleteAddress(id: number): Promise<void> {
    try {
      await api.delete(`${API_ENDPOINTS.ADDRESSES}${id}/`);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Set an address as the default delivery destination.
   */
  async setDefaultAddress(id: number): Promise<Address> {
    try {
      const response = await api.post<{ success: boolean; message: string; address: Address }>(
        `${API_ENDPOINTS.ADDRESSES}${id}/set-default/`
      );
      return response.data.address;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};


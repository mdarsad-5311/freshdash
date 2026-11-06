import { api } from './api';
import {
  BatchStockAdjustPayload,
  InventoryFilterParams,
  InventoryListResponse,
  StockAdjustmentPayload,
} from '../types/inventory';
import { AdminProduct } from '../types/product';

export const inventoryService = {
  /**
   * Fetch inventory items, low stock warnings, out of stock counts, with pagination, sorting and filters.
   */
  async getInventory(params?: InventoryFilterParams): Promise<InventoryListResponse> {
    const response = await api.get<InventoryListResponse>('/inventory/', {
      params,
    });
    return response.data;
  },

  /**
   * Adjust single product inventory.
   */
  async adjustStock(payload: StockAdjustmentPayload): Promise<{ success: boolean; message: string; product: AdminProduct }> {
    const response = await api.post('/inventory/adjust/', payload);
    return response.data;
  },

  /**
   * Batch adjust multiple product stocks simultaneously in an atomic transaction.
   */
  async batchAdjust(payload: BatchStockAdjustPayload): Promise<{
    success: boolean;
    message: string;
    updated_count: number;
    products: AdminProduct[];
  }> {
    const response = await api.post('/inventory/batch-adjust/', payload);
    return response.data;
  },
};

export interface InventoryItem {
  id: string;
  name: string;
  weight: string;
  category_id: string;
  category_name: string;
  price: string;
  stock: number;
  is_available: boolean;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  image: string | null;
}

export interface InventoryListResponse {
  success: boolean;
  count: number;
  total_items: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  low_stock_count: number;
  out_of_stock_count: number;
  inventory: InventoryItem[];
  results?: InventoryItem[];
}

export interface InventoryFilterParams {
  filter?: 'low_stock' | 'out_of_stock' | 'in_stock' | '';
  search?: string;
  category?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface StockAdjustmentPayload {
  product_id: string;
  stock?: number;
  adjustment?: number;
}

export interface BatchStockAdjustPayload {
  adjustments: StockAdjustmentPayload[];
}

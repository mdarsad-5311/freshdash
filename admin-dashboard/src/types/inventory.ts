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
  total_items: number;
  low_stock_count: number;
  out_of_stock_count: number;
  inventory: InventoryItem[];
}

export interface StockAdjustmentPayload {
  product_id: string;
  stock?: number;
  adjustment?: number;
}

export interface BatchStockAdjustPayload {
  adjustments: StockAdjustmentPayload[];
}


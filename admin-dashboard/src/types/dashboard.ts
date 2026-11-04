import { AdminOrderListItem } from './order';
import { AdminProduct } from './product';

export interface BestSellingProduct {
  product_id: string;
  product_name: string;
  total_units_sold: number;
  total_revenue: string | number;
}

export interface DashboardMetrics {
  total_products: number;
  active_products: number;
  total_categories: number;
  total_customers: number;
  total_orders: number;
  today_orders_count: number;
  today_revenue: string;
  total_revenue: string;
  orders_by_status: Record<string, number>;
  orders_by_payment_status: Record<string, number>;
  low_stock_count: number;
  out_of_stock_count: number;
  recent_orders: AdminOrderListItem[];
  best_selling_products: BestSellingProduct[];
  low_stock_products: AdminProduct[];
  out_of_stock_products: AdminProduct[];
}

export interface DashboardResponse {
  success: boolean;
  analytics: DashboardMetrics;
}


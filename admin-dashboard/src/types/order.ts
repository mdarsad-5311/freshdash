export type OrderStatus =
  | 'pending'
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'COD' | 'UPI' | 'Card' | 'NetBanking' | 'Wallet';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface AdminOrderItem {
  id: number;
  product: string | null;
  product_name: string;
  weight: string;
  quantity: number;
  large: boolean;
  unit_price: string | number;
  total_price: string | number;
}

export interface AdminOrderListItem {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  customer_username: string;
  customer_name: string;
  customer_email: string;
  items_count: number;
  item_total: string;
  delivery_fee: string;
  discount_amount: string;
  grand_total: string;
  coupon_code: string;
  created_at: string;
  updated_at: string;
}

export interface AdminOrderDetailCustomer {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone_number: string;
}

export interface AdminAddressSnapshot {
  name?: string;
  line?: string;
  area?: string;
}

export interface AdminOrderDetail {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  customer: AdminOrderDetailCustomer;
  delivery_address: any | null;
  delivery_address_snapshot: AdminAddressSnapshot;
  items: AdminOrderItem[];
  item_total: string;
  delivery_fee: string;
  discount_amount: string;
  grand_total: string;
  coupon_code: string;
  created_at: string;
  updated_at: string;
}

export interface OrderFilterParams {
  status?: string;
  payment_status?: string;
  payment_method?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}


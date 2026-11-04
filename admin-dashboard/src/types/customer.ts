import { AdminOrderListItem } from './order';

export interface CustomerAddress {
  id: number;
  name: string;
  line: string;
  area: string;
  is_default: boolean;
  created_at: string;
}

export interface AdminCustomer {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: 'admin' | 'manager' | 'customer' | string;
  is_active: boolean;
  is_staff: boolean;
  orders_count: number;
  total_spent: string | number;
  date_joined: string;
  last_login: string | null;
}

export interface AdminCustomerDetail extends AdminCustomer {
  addresses: CustomerAddress[];
  recent_orders: AdminOrderListItem[];
}

export interface CustomerFilterParams {
  role?: string;
  is_active?: boolean | string;
  search?: string;
  page?: number;
}


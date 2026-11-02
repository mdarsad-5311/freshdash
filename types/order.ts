/**
 * TypeScript types and models for Orders, Order Items, and Delivery Addresses.
 */

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Address {
  id: number;
  name: 'Home' | 'Work' | 'Other' | string;
  line: string;
  area: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAddressPayload {
  name: string;
  line: string;
  area: string;
  is_default?: boolean;
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>;

export interface AddressSnapshot {
  name?: string;
  line?: string;
  area?: string;
}

export interface OrderItem {
  id: number;
  product: string | null;
  product_name: string;
  weight: string;
  quantity: number;
  large: boolean;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  delivery_address?: Address | null;
  delivery_address_snapshot: AddressSnapshot;
  item_total: number;
  delivery_fee: number;
  discount_amount: number;
  grand_total: number;
  coupon_code: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface RawOrderItem {
  id: number;
  product?: string | null;
  product_name: string;
  weight: string;
  quantity: number;
  large: boolean;
  unit_price: string | number;
  total_price: string | number;
}

export interface RawOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  delivery_address?: Address | null;
  delivery_address_snapshot?: AddressSnapshot;
  item_total: string | number;
  delivery_fee: string | number;
  discount_amount: string | number;
  grand_total: string | number;
  coupon_code?: string;
  items: RawOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderPayload {
  delivery_address_id?: number | null;
  coupon_code?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: RawOrder;
}

function parseNum(val: string | number | undefined, fallback = 0): number {
  if (val === undefined || val === null) return fallback;
  const num = typeof val === 'string' ? parseFloat(val) : Number(val);
  return Number.isNaN(num) ? fallback : num;
}

export function transformOrderItem(raw: RawOrderItem): OrderItem {
  return {
    id: raw.id,
    product: raw.product || null,
    product_name: raw.product_name,
    weight: raw.weight,
    quantity: raw.quantity,
    large: Boolean(raw.large),
    unit_price: parseNum(raw.unit_price),
    total_price: parseNum(raw.total_price),
  };
}

export function transformOrder(raw: RawOrder): Order {
  return {
    id: raw.id,
    order_number: raw.order_number,
    status: raw.status,
    delivery_address: raw.delivery_address || null,
    delivery_address_snapshot: raw.delivery_address_snapshot || {},
    item_total: parseNum(raw.item_total),
    delivery_fee: parseNum(raw.delivery_fee),
    discount_amount: parseNum(raw.discount_amount),
    grand_total: parseNum(raw.grand_total),
    coupon_code: raw.coupon_code || '',
    items: Array.isArray(raw.items) ? raw.items.map(transformOrderItem) : [],
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}


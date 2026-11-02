import { Product, RawProductResponse, transformProduct } from './product';

/**
 * Frontend cart item stored in Zustand state.
 */
export interface CartItem {
  key: string;
  productId: string;
  quantity: number;
  large: boolean;
  product?: Product;
  unitPrice?: number;
  unitOriginal?: number;
  totalPrice?: number;
  totalSavings?: number;
}

/**
 * Backend normalized cart item.
 */
export interface BackendCartItem {
  id: number;
  key: string;
  productId: string;
  product: Product;
  quantity: number;
  large: boolean;
  unitPrice: number;
  unitOriginal: number;
  totalPrice: number;
  totalSavings: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Backend raw cart item response.
 */
export interface RawBackendCartItem {
  id: number;
  key: string;
  product_id?: string;
  product: RawProductResponse;
  quantity: number;
  large: boolean;
  unit_price: string | number;
  unit_original: string | number;
  total_price: string | number;
  total_savings: string | number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Backend normalized cart summary.
 */
export interface BackendCartSummary {
  items: BackendCartItem[];
  totalItems: number;
  itemTotal: number;
  savingsTotal: number;
  freeDeliveryThreshold: number;
  deliveryFee: number;
  grandTotal: number;
}

/**
 * Backend raw cart summary response.
 */
export interface RawBackendCartSummary {
  items: RawBackendCartItem[];
  total_items: number;
  item_total: string | number;
  savings_total: string | number;
  free_delivery_threshold: string | number;
  delivery_fee: string | number;
  grand_total: string | number;
}

/**
 * Response when adding or updating cart items.
 */
export interface CartMutationResponse {
  success: boolean;
  message: string;
  item?: BackendCartItem | null;
  summary: BackendCartSummary;
}

export interface RawCartMutationResponse {
  success: boolean;
  message: string;
  item?: RawBackendCartItem | null;
  summary: RawBackendCartSummary;
}

/**
 * Coupon validation result shape.
 */
export interface CouponApplyResult {
  valid: boolean;
  code: string;
  discount: number;
  itemTotal: number;
  deliveryFee: number;
  finalTotal: number;
  message?: string;
}

export interface RawCouponApplyResult {
  valid: boolean;
  code: string;
  discount: string | number;
  item_total: string | number;
  delivery_fee: string | number;
  final_total: string | number;
  message?: string;
}

function parseNum(val: string | number | undefined, fallback = 0): number {
  if (val === undefined || val === null) return fallback;
  const num = typeof val === 'string' ? parseFloat(val) : Number(val);
  return Number.isNaN(num) ? fallback : num;
}

/**
 * Normalizes backend raw cart item.
 */
export function transformCartItem(raw: RawBackendCartItem): BackendCartItem {
  return {
    id: raw.id,
    key: raw.key,
    productId: raw.product?.id || raw.product_id || '',
    product: transformProduct(raw.product),
    quantity: raw.quantity,
    large: Boolean(raw.large),
    unitPrice: parseNum(raw.unit_price),
    unitOriginal: parseNum(raw.unit_original),
    totalPrice: parseNum(raw.total_price),
    totalSavings: parseNum(raw.total_savings),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Normalizes backend raw cart summary.
 */
export function transformCartSummary(raw: RawBackendCartSummary): BackendCartSummary {
  const items = Array.isArray(raw.items) ? raw.items.map(transformCartItem) : [];
  return {
    items,
    totalItems: raw.total_items ?? items.reduce((sum, item) => sum + item.quantity, 0),
    itemTotal: parseNum(raw.item_total),
    savingsTotal: parseNum(raw.savings_total),
    freeDeliveryThreshold: parseNum(raw.free_delivery_threshold, 199),
    deliveryFee: parseNum(raw.delivery_fee, 20),
    grandTotal: parseNum(raw.grand_total),
  };
}


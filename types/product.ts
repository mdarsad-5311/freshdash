/**
 * Product and Category type definitions and API response models.
 */

export interface Product {
  id: string;
  name: string;
  weight: string;
  price: number;
  original: number;
  photo: number;
  category: string;
  category_name?: string;
  popular?: boolean;
  organic?: boolean;
  description: string;
  discount_percentage?: number;
  is_available?: boolean;
}

export interface Category {
  id: string;
  name: string;
  photo: number;
  tint: string;
  is_active?: boolean;
  products_count?: number;
}

/**
 * Backend DRF raw serialized product payload shape.
 */
export interface RawProductResponse {
  id: string;
  name: string;
  weight: string;
  price: string | number;
  original: string | number;
  discount_percentage?: number;
  photo: number;
  category: string;
  category_name?: string;
  popular?: boolean;
  organic?: boolean;
  description: string;
  is_available?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Backend DRF raw serialized category payload shape.
 */
export interface RawCategoryResponse {
  id: string;
  name: string;
  photo: number;
  tint: string;
  is_active?: boolean;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Supported query parameters for the /api/v1/products/ endpoint.
 */
export interface ProductQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  popular?: boolean;
  organic?: boolean;
  offers?: boolean;
  featured?: 'vegetables' | 'fruits';
  min_price?: number;
  max_price?: number;
  ordering?: string;
}

/**
 * Helper to safely transform backend product data into frontend Product model.
 * Normalizes string-based decimal prices from Django DRF into numbers.
 */
export function transformProduct(raw: RawProductResponse): Product {
  const priceNum = typeof raw.price === 'string' ? parseFloat(raw.price) : Number(raw.price);
  const originalNum =
    typeof raw.original === 'string' ? parseFloat(raw.original) : Number(raw.original);

  return {
    id: raw.id,
    name: raw.name,
    weight: raw.weight,
    price: Number.isNaN(priceNum) ? 0 : priceNum,
    original: Number.isNaN(originalNum) ? 0 : originalNum,
    photo: typeof raw.photo === 'number' ? raw.photo : 0,
    category: raw.category,
    category_name: raw.category_name,
    popular: Boolean(raw.popular),
    organic: Boolean(raw.organic),
    description: raw.description || '',
    discount_percentage:
      typeof raw.discount_percentage === 'number'
        ? raw.discount_percentage
        : originalNum > 0 && originalNum > priceNum
        ? Math.round(100 * (1 - priceNum / originalNum))
        : 0,
    is_available: raw.is_available !== false,
  };
}

/**
 * Helper to safely transform backend category data into frontend Category model.
 */
export function transformCategory(raw: RawCategoryResponse): Category {
  return {
    id: raw.id,
    name: raw.name,
    photo: typeof raw.photo === 'number' ? raw.photo : 0,
    tint: raw.tint || '#EEF4E8',
    is_active: raw.is_active !== false,
    products_count: typeof raw.products_count === 'number' ? raw.products_count : 0,
  };
}


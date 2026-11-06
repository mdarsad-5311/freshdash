import { Product, RawProductResponse, transformProduct } from './product';

/**
 * Frontend normalized Favorite item.
 */
export interface FavoriteItem {
  id: number;
  product: Product;
  createdAt?: string;
}

/**
 * Backend DRF raw serialized Favorite item.
 */
export interface RawFavoriteItem {
  id: number;
  product: RawProductResponse;
  created_at?: string;
}

/**
 * Toggle favorite action result.
 */
export interface ToggleFavoriteResult {
  success: boolean;
  productId: string;
  isFavourite: boolean;
  message: string;
}

/**
 * Raw backend toggle response.
 */
export interface RawToggleFavoriteResponse {
  success: boolean;
  product_id: string;
  is_favourite: boolean;
  message: string;
}

/**
 * Transform raw backend favorite item into frontend FavoriteItem.
 */
export function transformFavoriteItem(raw: RawFavoriteItem): FavoriteItem {
  return {
    id: raw.id,
    product: transformProduct(raw.product),
    createdAt: raw.created_at,
  };
}


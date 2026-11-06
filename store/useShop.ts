import { create } from 'zustand';
import { haptics } from '../utils/haptics';
import { CartItem, BackendCartSummary } from '../types/cart';
import { Product } from '../types/product';
import { cartService } from '../services/cartService';
import { favoriteService } from '../services/favoriteService';
import { secureStorage } from '../services/secureStorage';

export type { CartItem };
export type DeliveryAddress = 'Home' | 'Work' | string;

export interface ShopState {
  cart: CartItem[];
  summary: BackendCartSummary | null;
  isLoadingCart: boolean;
  cartError: string | null;

  favourites: string[];
  favouriteProducts: Product[];
  isLoadingFavourites: boolean;
  favouriteError: string | null;

  address: DeliveryAddress;
  walkthroughStep: number | null;

  // Actions
  nextWalkthroughStep: () => void;
  dismissWalkthrough: () => void;
  setAddress: (address: DeliveryAddress) => void;
  syncCartWithBackend: () => Promise<void>;
  resetCart: () => void;
  add: (productId: string, quantity?: number, large?: boolean) => Promise<void>;
  change: (key: string, delta: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // Favorite Actions
  syncFavouritesWithBackend: () => Promise<void>;
  resetFavourites: () => void;
  toggleFavourite: (productId: string, productObj?: Product) => Promise<void>;
}

export const getCartItemKey = (productId: string, isLarge: boolean) =>
  `${productId}:${isLarge ? 'large' : 'regular'}`;

const pendingFavoriteRequests = new Set<string>();

export const useShop = create<ShopState>((set, get) => ({
  cart: [],
  summary: null,
  isLoadingCart: false,
  cartError: null,

  favourites: [],
  favouriteProducts: [],
  isLoadingFavourites: false,
  favouriteError: null,

  address: 'Home',
  walkthroughStep: 0,

  nextWalkthroughStep: () => {
    set((state) => ({
      walkthroughStep: state.walkthroughStep === 0 ? 1 : state.walkthroughStep === 1 ? 2 : null,
    }));
    haptics.selection();
  },

  dismissWalkthrough: () => {
    set({ walkthroughStep: null });
  },

  setAddress: (address) => {
    set({ address });
    haptics.selection();
  },

  /**
   * Clears cart state immediately (e.g. on logout or user switch).
   */
  resetCart: () => {
    set({
      cart: [],
      summary: null,
      cartError: null,
      isLoadingCart: false,
    });
  },

  /**
   * Fetches the user's authoritative basket from the Django backend.
   */
  syncCartWithBackend: async () => {
    try {
      const token = await secureStorage.getAccessToken();
      if (!token) return;

      set({ isLoadingCart: true, cartError: null });
      const summary = await cartService.getCart();

      const syncedCart: CartItem[] = summary.items.map((item) => ({
        key: item.key,
        productId: item.productId,
        quantity: item.quantity,
        large: item.large,
        product: item.product,
        unitPrice: item.unitPrice,
        unitOriginal: item.unitOriginal,
        totalPrice: item.totalPrice,
        totalSavings: item.totalSavings,
      }));

      set({
        cart: syncedCart,
        summary,
        isLoadingCart: false,
        cartError: null,
      });
    } catch (err: any) {
      set({
        isLoadingCart: false,
        cartError: err?.message || 'Failed to sync cart',
      });
    }
  },

  /**
   * Adds product to cart. Optimistically updates UI, then syncs with backend.
   */
  add: async (productId, quantity = 1, large = false) => {
    const key = getCartItemKey(productId, large);
    const previousCart = get().cart;
    const previousSummary = get().summary;

    // Optimistic local update
    const existing = previousCart.find((item) => item.key === key);
    const updatedCart = existing
      ? previousCart.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + quantity } : item
        )
      : [...previousCart, { key, productId, quantity, large }];

    set({ cart: updatedCart, cartError: null });
    haptics.success();

    try {
      const token = await secureStorage.getAccessToken();
      if (token) {
        const res = await cartService.addToCart(productId, quantity, large);
        const serverSummary = res.summary;
        const serverCart: CartItem[] = serverSummary.items.map((item) => ({
          key: item.key,
          productId: item.productId,
          quantity: item.quantity,
          large: item.large,
          product: item.product,
          unitPrice: item.unitPrice,
          unitOriginal: item.unitOriginal,
          totalPrice: item.totalPrice,
          totalSavings: item.totalSavings,
        }));

        set({ cart: serverCart, summary: serverSummary });
      }
    } catch (err: any) {
      // Safe rollback on API error
      set({
        cart: previousCart,
        summary: previousSummary,
        cartError: err?.message || 'Failed to add item to basket',
      });
      haptics.selection();
    }
  },

  /**
   * Increments or decrements item quantity.
   */
  change: async (key, delta) => {
    const previousCart = get().cart;
    const previousSummary = get().summary;

    // Optimistic local update
    const updatedCart = previousCart
      .map((item) => (item.key === key ? { ...item, quantity: item.quantity + delta } : item))
      .filter((item) => item.quantity > 0);

    set({ cart: updatedCart, cartError: null });
    haptics.selection();

    try {
      const token = await secureStorage.getAccessToken();
      if (token) {
        const res = await cartService.updateQuantity(key, { delta });
        const serverSummary = res.summary;
        const serverCart: CartItem[] = serverSummary.items.map((item) => ({
          key: item.key,
          productId: item.productId,
          quantity: item.quantity,
          large: item.large,
          product: item.product,
          unitPrice: item.unitPrice,
          unitOriginal: item.unitOriginal,
          totalPrice: item.totalPrice,
          totalSavings: item.totalSavings,
        }));

        set({ cart: serverCart, summary: serverSummary });
      }
    } catch (err: any) {
      // Safe rollback
      set({
        cart: previousCart,
        summary: previousSummary,
        cartError: err?.message || 'Failed to update item quantity',
      });
    }
  },

  /**
   * Removes item from cart.
   */
  remove: async (key) => {
    const previousCart = get().cart;
    const previousSummary = get().summary;

    // Optimistic local update
    const updatedCart = previousCart.filter((item) => item.key !== key);
    set({ cart: updatedCart, cartError: null });
    haptics.success();

    try {
      const token = await secureStorage.getAccessToken();
      if (token) {
        const serverSummary = await cartService.removeFromCart(key);
        const serverCart: CartItem[] = serverSummary.items.map((item) => ({
          key: item.key,
          productId: item.productId,
          quantity: item.quantity,
          large: item.large,
          product: item.product,
          unitPrice: item.unitPrice,
          unitOriginal: item.unitOriginal,
          totalPrice: item.totalPrice,
          totalSavings: item.totalSavings,
        }));

        set({ cart: serverCart, summary: serverSummary });
      }
    } catch (err: any) {
      // Safe rollback
      set({
        cart: previousCart,
        summary: previousSummary,
        cartError: err?.message || 'Failed to remove item',
      });
    }
  },

  /**
   * Clears the entire cart.
   */
  clearCart: async () => {
    const previousCart = get().cart;
    const previousSummary = get().summary;

    set({ cart: [], summary: null, cartError: null });
    haptics.success();

    try {
      const token = await secureStorage.getAccessToken();
      if (token) {
        const serverSummary = await cartService.clearCart();
        set({ cart: [], summary: serverSummary });
      }
    } catch (err: any) {
      set({
        cart: previousCart,
        summary: previousSummary,
        cartError: err?.message || 'Failed to clear basket',
      });
    }
  },

  /**
   * Syncs user favorites from the backend.
   */
  syncFavouritesWithBackend: async () => {
    try {
      const token = await secureStorage.getAccessToken();
      if (!token) return;

      set({ isLoadingFavourites: true, favouriteError: null });
      const prods = await favoriteService.getFavorites();
      const ids = Array.from(new Set(prods.map((p) => p.id)));

      set({
        favourites: ids,
        favouriteProducts: prods,
        isLoadingFavourites: false,
        favouriteError: null,
      });
    } catch (err: any) {
      set({
        isLoadingFavourites: false,
        favouriteError: err?.message || 'Failed to sync favourites',
      });
    }
  },

  /**
   * Clears user favorite state (e.g. on logout).
   */
  resetFavourites: () => {
    set({
      favourites: [],
      favouriteProducts: [],
      isLoadingFavourites: false,
      favouriteError: null,
    });
  },

  /**
   * Toggles product in favorites.
   * Optimistically updates UI, then synchronizes with backend if authenticated.
   */
  toggleFavourite: async (productId: string, productObj?: Product) => {
    if (pendingFavoriteRequests.has(productId)) {
      return;
    }

    const previousFavourites = get().favourites;
    const previousProducts = get().favouriteProducts;
    const isFav = previousFavourites.includes(productId);

    // Optimistic local update
    const updatedFavourites = isFav
      ? previousFavourites.filter((id) => id !== productId)
      : [...previousFavourites, productId];

    let updatedProducts = previousProducts;
    if (isFav) {
      updatedProducts = previousProducts.filter((p) => p.id !== productId);
    } else if (productObj) {
      if (!previousProducts.some((p) => p.id === productId)) {
        updatedProducts = [...previousProducts, productObj];
      }
    }

    set({
      favourites: updatedFavourites,
      favouriteProducts: updatedProducts,
      favouriteError: null,
    });
    haptics.selection();

    try {
      const token = await secureStorage.getAccessToken();
      if (token) {
        pendingFavoriteRequests.add(productId);
        try {
          const res = await favoriteService.toggleFavorite(productId);

          // Reconcile state based on backend response
          set((state) => {
            const hasId = state.favourites.includes(productId);
            if (res.isFavourite && !hasId) {
              return { favourites: [...state.favourites, productId] };
            }
            if (!res.isFavourite && hasId) {
              return {
                favourites: state.favourites.filter((id) => id !== productId),
                favouriteProducts: state.favouriteProducts.filter((p) => p.id !== productId),
              };
            }
            return state;
          });
        } finally {
          pendingFavoriteRequests.delete(productId);
        }
      }
    } catch (err: any) {
      // Safe rollback on API error
      set({
        favourites: previousFavourites,
        favouriteProducts: previousProducts,
        favouriteError: err?.message || 'Failed to update favourite status',
      });
    }
  },
}));

// Backward compatibility exports
export const selection = haptics.selection;
export const success = haptics.success;

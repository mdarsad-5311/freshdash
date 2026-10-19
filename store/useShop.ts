import { create } from 'zustand';
import { haptics } from '../utils/haptics';

export interface CartItem {
  key: string;
  productId: string;
  quantity: number;
  large: boolean;
}

export type DeliveryAddress = 'Home' | 'Work';

export interface ShopState {
  cart: CartItem[];
  favourites: string[];
  address: DeliveryAddress;
  walkthroughStep: number | null;

  // Actions
  nextWalkthroughStep: () => void;
  dismissWalkthrough: () => void;
  setAddress: (address: DeliveryAddress) => void;
  add: (productId: string, quantity?: number, large?: boolean) => void;
  change: (key: string, delta: number) => void;
  remove: (key: string) => void;
  toggleFavourite: (productId: string) => void;
}

export const getCartItemKey = (productId: string, isLarge: boolean) =>
  `${productId}:${isLarge ? 'large' : 'regular'}`;

export const useShop = create<ShopState>((set) => ({
  cart: [
    { key: 'tomato:regular', productId: 'tomato', quantity: 1, large: false },
    { key: 'banana:regular', productId: 'banana', quantity: 1, large: false },
    { key: 'broccoli:regular', productId: 'broccoli', quantity: 1, large: false },
  ],
  favourites: [],
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

  add: (productId, quantity = 1, large = false) => {
    const key = getCartItemKey(productId, large);
    set((state) => {
      const existing = state.cart.find((item) => item.key === key);
      const updatedCart = existing
        ? state.cart.map((item) =>
            item.key === key ? { ...item, quantity: item.quantity + quantity } : item
          )
        : [...state.cart, { key, productId, quantity, large }];

      return { cart: updatedCart };
    });
    haptics.success();
  },

  change: (key, delta) => {
    set((state) => ({
      cart: state.cart
        .map((item) => (item.key === key ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    }));
    haptics.selection();
  },

  remove: (key) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.key !== key),
    }));
    haptics.success();
  },

  toggleFavourite: (productId) => {
    set((state) => {
      const isFav = state.favourites.includes(productId);
      return {
        favourites: isFav
          ? state.favourites.filter((id) => id !== productId)
          : [...state.favourites, productId],
      };
    });
    haptics.selection();
  },
}));

// Backward compatibility exports
export const selection = haptics.selection;
export const success = haptics.success;

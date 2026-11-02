import { cartService } from '../../services/cartService';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/config';
import { RawBackendCartSummary, RawCartMutationResponse } from '../../types/cart';

const mockRawSummary: RawBackendCartSummary = {
  items: [
    {
      id: 1,
      key: 'tomato:regular',
      product_id: 'tomato',
      product: {
        id: 'tomato',
        name: 'Fresh Tomatoes',
        weight: '500 g',
        price: '28.00',
        original: '36.00',
        discount_percentage: 22,
        category: 'vegetables',
        category_name: 'Vegetables',
        photo: 0,
        popular: true,
        description: 'Juicy red tomatoes.',
        is_available: true,
      },
      quantity: 2,
      large: false,
      unit_price: '28.00',
      unit_original: '36.00',
      total_price: '56.00',
      total_savings: '16.00',
    },
  ],
  total_items: 2,
  item_total: '56.00',
  savings_total: '16.00',
  free_delivery_threshold: '100.00',
  delivery_fee: '25.00',
  grand_total: '81.00',
};

describe('cartService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('fetches and transforms cart summary correctly', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: mockRawSummary,
      });

      const summary = await cartService.getCart();

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.CART);
      expect(summary.totalItems).toBe(2);
      expect(summary.itemTotal).toBe(56);
      expect(summary.grandTotal).toBe(81);
      expect(summary.items[0].key).toBe('tomato:regular');
      expect(summary.items[0].product.name).toBe('Fresh Tomatoes');
    });
  });

  describe('addToCart', () => {
    it('adds product with payload and transforms mutation response', async () => {
      const mockMutation: RawCartMutationResponse = {
        success: true,
        message: 'Item added',
        item: mockRawSummary.items[0],
        summary: mockRawSummary,
      };

      const apiPostSpy = jest.spyOn(api, 'post').mockResolvedValueOnce({
        data: mockMutation,
      });

      const result = await cartService.addToCart('tomato', 2, false);

      expect(apiPostSpy).toHaveBeenCalledWith(API_ENDPOINTS.CART, {
        product_id: 'tomato',
        quantity: 2,
        large: false,
      });
      expect(result.success).toBe(true);
      expect(result.item?.productId).toBe('tomato');
      expect(result.summary.itemTotal).toBe(56);
    });
  });

  describe('updateQuantity', () => {
    it('patches cart item quantity and transforms summary', async () => {
      const mockMutation: RawCartMutationResponse = {
        success: true,
        message: 'Quantity updated',
        item: { ...mockRawSummary.items[0], quantity: 3, total_price: '84.00' },
        summary: { ...mockRawSummary, total_items: 3, item_total: '84.00', grand_total: '109.00' },
      };

      const apiPatchSpy = jest.spyOn(api, 'patch').mockResolvedValueOnce({
        data: mockMutation,
      });

      const result = await cartService.updateQuantity('tomato:regular', { delta: 1 });

      expect(apiPatchSpy).toHaveBeenCalledWith(`${API_ENDPOINTS.CART}tomato%3Aregular/`, {
        delta: 1,
      });
      expect(result.success).toBe(true);
      expect(result.summary.itemTotal).toBe(84);
    });
  });

  describe('removeFromCart & clearCart', () => {
    it('deletes cart item and transforms updated summary', async () => {
      const emptySummary: RawBackendCartSummary = {
        items: [],
        total_items: 0,
        item_total: '0.00',
        savings_total: '0.00',
        free_delivery_threshold: '100.00',
        delivery_fee: '0.00',
        grand_total: '0.00',
      };

      jest.spyOn(api, 'delete').mockResolvedValueOnce({
        data: { success: true, message: 'Removed', summary: emptySummary },
      });

      const summary = await cartService.removeFromCart('tomato:regular');

      expect(api.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.CART}tomato%3Aregular/`);
      expect(summary.totalItems).toBe(0);
      expect(summary.items.length).toBe(0);
    });

    it('clears cart and returns empty summary', async () => {
      const emptySummary: RawBackendCartSummary = {
        items: [],
        total_items: 0,
        item_total: '0.00',
        savings_total: '0.00',
        free_delivery_threshold: '100.00',
        delivery_fee: '0.00',
        grand_total: '0.00',
      };

      jest.spyOn(api, 'post').mockResolvedValueOnce({
        data: { success: true, message: 'Cart cleared', summary: emptySummary },
      });

      const summary = await cartService.clearCart();

      expect(api.post).toHaveBeenCalledWith(`${API_ENDPOINTS.CART}clear/`);
      expect(summary.totalItems).toBe(0);
    });
  });

  describe('applyCoupon', () => {
    it('sends coupon code and item total, transforming numbers correctly', async () => {
      jest.spyOn(api, 'post').mockResolvedValueOnce({
        data: {
          valid: true,
          code: 'FRESH50',
          discount: '50.00',
          item_total: '200.00',
          delivery_fee: '0.00',
          final_total: '150.00',
          message: 'Coupon applied successfully!',
        },
      });

      const result = await cartService.applyCoupon('FRESH50', 200);

      expect(api.post).toHaveBeenCalledWith(`${API_ENDPOINTS.COUPONS}apply/`, {
        code: 'FRESH50',
        item_total: '200.00',
      });
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(50);
      expect(result.finalTotal).toBe(150);
    });
  });
});

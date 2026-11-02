import { orderService } from '../../services/orderService';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/config';
import { RawOrder } from '../../types/order';

const mockRawOrder: RawOrder = {
  id: 10,
  order_number: 'FD-2026-0001',
  status: 'confirmed',
  delivery_address: {
    id: 1,
    name: 'Home',
    line: 'Flat 402, Sunshine Apts',
    area: 'Indiranagar',
  },
  delivery_address_snapshot: {
    name: 'Home',
    line: 'Flat 402, Sunshine Apts',
    area: 'Indiranagar',
  },
  item_total: '120.00',
  delivery_fee: '0.00',
  discount_amount: '20.00',
  grand_total: '100.00',
  coupon_code: 'FRESH20',
  items: [
    {
      id: 1,
      product: 'tomato',
      product_name: 'Fresh Tomatoes',
      weight: '500 g',
      quantity: 2,
      large: false,
      unit_price: '60.00',
      total_price: '120.00',
    },
  ],
  created_at: '2026-10-31T10:00:00Z',
  updated_at: '2026-10-31T10:00:00Z',
};

describe('orderService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('creates an order from cart and returns transformed order', async () => {
      const apiPostSpy = jest.spyOn(api, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Order created',
          order: mockRawOrder,
        },
      });

      const order = await orderService.createOrder({
        delivery_address_id: 1,
        coupon_code: 'FRESH20',
      });

      expect(apiPostSpy).toHaveBeenCalledWith(API_ENDPOINTS.ORDERS, {
        delivery_address_id: 1,
        coupon_code: 'FRESH20',
      });
      expect(order.order_number).toBe('FD-2026-0001');
      expect(order.status).toBe('confirmed');
      expect(order.grand_total).toBe(100);
      expect(order.items.length).toBe(1);
    });

    it('rejects if order object is missing in response', async () => {
      jest.spyOn(api, 'post').mockResolvedValueOnce({
        data: {
          success: false,
          message: 'Cart is empty',
        },
      });

      await expect(orderService.createOrder()).rejects.toMatchObject({
        message: 'Cart is empty',
      });
    });
  });

  describe('getOrders & getAllOrders', () => {
    it('retrieves paginated orders correctly', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: {
          count: 1,
          total_pages: 1,
          current_page: 1,
          page_size: 20,
          next: null,
          previous: null,
          results: [mockRawOrder],
        },
      });

      const paginated = await orderService.getOrders({ page: 1 });

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.ORDERS, {
        params: { page: 1 },
      });
      expect(paginated.count).toBe(1);
      expect(paginated.results[0].order_number).toBe('FD-2026-0001');
    });

    it('handles flat array of orders', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: [mockRawOrder],
      });

      const paginated = await orderService.getOrders();

      expect(paginated.count).toBe(1);
      expect(paginated.results[0].id).toBe(10);
    });

    it('getAllOrders calls getOrders with page_size: 50', async () => {
      const getSpy = jest.spyOn(orderService, 'getOrders').mockResolvedValueOnce({
        count: 1,
        total_pages: 1,
        current_page: 1,
        page_size: 50,
        next: null,
        previous: null,
        results: [orderService as any],
      });

      await orderService.getAllOrders();

      expect(getSpy).toHaveBeenCalledWith({ page_size: 50 });
    });
  });

  describe('getOrder & getOrderStatus', () => {
    it('retrieves single order by order number or id', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: mockRawOrder,
      });

      const order = await orderService.getOrder('FD-2026-0001');

      expect(api.get).toHaveBeenCalledWith(`${API_ENDPOINTS.ORDERS}FD-2026-0001/`);
      expect(order.order_number).toBe('FD-2026-0001');
      expect(order.item_total).toBe(120);
    });

    it('getOrderStatus fetches order and returns only status string', async () => {
      jest.spyOn(orderService, 'getOrder').mockResolvedValueOnce({
        id: 10,
        order_number: 'FD-2026-0001',
        status: 'out_for_delivery',
        delivery_address_snapshot: {},
        item_total: 100,
        delivery_fee: 0,
        discount_amount: 0,
        grand_total: 100,
        coupon_code: '',
        items: [],
        created_at: '',
        updated_at: '',
      });

      const status = await orderService.getOrderStatus('FD-2026-0001');

      expect(status).toBe('out_for_delivery');
    });
  });

  describe('cancelOrder', () => {
    it('cancels order when server endpoint succeeds', async () => {
      jest.spyOn(api, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Order cancelled',
          order: { ...mockRawOrder, status: 'cancelled' },
        },
      });

      const order = await orderService.cancelOrder('FD-2026-0001');

      expect(api.post).toHaveBeenCalledWith(`${API_ENDPOINTS.ORDERS}FD-2026-0001/cancel/`);
      expect(order.status).toBe('cancelled');
    });

    it('handles unsupported cancellation (404/405) with clear message', async () => {
      const notFoundError: any = new Error('Not Found');
      notFoundError.isAxiosError = true;
      notFoundError.response = { status: 404, data: {} };

      jest.spyOn(api, 'post').mockRejectedValueOnce(notFoundError);

      await expect(orderService.cancelOrder('FD-2026-0001')).rejects.toThrow(
        'Order cancellation is not supported for this order.'
      );
    });
  });
});

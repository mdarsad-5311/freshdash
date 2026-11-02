import { productService } from '../../services/productService';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/config';
import { RawProductResponse } from '../../types/product';

const mockRawProduct: RawProductResponse = {
  id: 'fresh-tomatoes',
  name: 'Fresh Tomatoes',
  weight: '500 g',
  price: '28.00',
  original: '36.00',
  discount_percentage: 22,
  category: 'vegetables',
  category_name: 'Vegetables',
  photo: 0,
  popular: true,
  description: 'Juicy organic red tomatoes.',
  is_available: true,
};

describe('productService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('fetches and transforms DRF paginated product list', async () => {
      const mockPaginated = {
        count: 1,
        total_pages: 1,
        current_page: 1,
        page_size: 20,
        next: null,
        previous: null,
        results: [mockRawProduct],
      };

      const apiGetSpy = jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: mockPaginated,
      });

      const result = await productService.getProducts({ page: 1, category: 'vegetables' });

      expect(apiGetSpy).toHaveBeenCalledWith(API_ENDPOINTS.PRODUCTS, {
        params: { page: 1, category: 'vegetables' },
      });
      expect(result.count).toBe(1);
      expect(result.results[0].id).toBe('fresh-tomatoes');
      expect(result.results[0].name).toBe('Fresh Tomatoes');
      expect(result.results[0].price).toBe(28);
      expect(result.results[0].original).toBe(36);
    });

    it('handles fallback flat array responses properly', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: [mockRawProduct],
      });

      const result = await productService.getProducts();

      expect(result.count).toBe(1);
      expect(result.results[0].id).toBe('fresh-tomatoes');
    });

    it('returns empty results when response data is undefined or unexpected', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: null,
      });

      const result = await productService.getProducts();

      expect(result.count).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('getProduct', () => {
    it('fetches and transforms single product by ID', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: mockRawProduct,
      });

      const product = await productService.getProduct('fresh-tomatoes');

      expect(api.get).toHaveBeenCalledWith(`${API_ENDPOINTS.PRODUCTS}fresh-tomatoes/`);
      expect(product.id).toBe('fresh-tomatoes');
      expect(product.name).toBe('Fresh Tomatoes');
      expect(product.price).toBe(28);
    });
  });

  describe('getProductsByCategory & searchProducts', () => {
    it('passes category filter correctly', async () => {
      const getSpy = jest.spyOn(productService, 'getProducts').mockResolvedValueOnce({
        count: 0,
        total_pages: 0,
        current_page: 1,
        page_size: 20,
        next: null,
        previous: null,
        results: [],
      });

      await productService.getProductsByCategory('fruits');

      expect(getSpy).toHaveBeenCalledWith({ category: 'fruits' });
    });

    it('passes search term correctly', async () => {
      const getSpy = jest.spyOn(productService, 'getProducts').mockResolvedValueOnce({
        count: 0,
        total_pages: 0,
        current_page: 1,
        page_size: 20,
        next: null,
        previous: null,
        results: [],
      });

      await productService.searchProducts('spinach');

      expect(getSpy).toHaveBeenCalledWith({ search: 'spinach' });
    });
  });

  describe('Special collections: bestsellers, seasonal, pairsWellWith', () => {
    it('fetches bestsellers list', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: [mockRawProduct],
      });

      const items = await productService.getBestsellers();

      expect(api.get).toHaveBeenCalledWith(`${API_ENDPOINTS.PRODUCTS}bestsellers/`);
      expect(items.length).toBe(1);
      expect(items[0].id).toBe('fresh-tomatoes');
    });

    it('fetches seasonal produce list', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: [mockRawProduct],
      });

      const items = await productService.getSeasonal();

      expect(api.get).toHaveBeenCalledWith(`${API_ENDPOINTS.PRODUCTS}seasonal/`);
      expect(items.length).toBe(1);
    });

    it('fetches recommendations for pairsWellWith', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: [mockRawProduct],
      });

      const items = await productService.getPairsWellWith('fresh-tomatoes');

      expect(api.get).toHaveBeenCalledWith(`${API_ENDPOINTS.PRODUCTS}fresh-tomatoes/pairs-well-with/`);
      expect(items.length).toBe(1);
    });
  });
});

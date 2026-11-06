import { favoriteService } from '../../services/favoriteService';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/config';
import { RawFavoriteItem } from '../../types/favorite';

const mockRawFavorites: RawFavoriteItem[] = [
  {
    id: 1,
    product: {
      id: 'tomato',
      name: 'Farm Fresh Tomatoes',
      weight: '500 g',
      price: '32.00',
      original: '40.00',
      photo: 0,
      category: 'vegetables',
      category_name: 'Vegetables',
      popular: true,
      organic: false,
      description: 'Plump red tomatoes.',
      stock: 45,
      image: '/media/products/tomato.png',
      is_available: true,
    },
    created_at: '2026-11-05T10:00:00Z',
  },
  {
    id: 2,
    product: {
      id: 'banana',
      name: 'Robusta Banana',
      weight: '1 kg',
      price: '55.00',
      original: '65.00',
      photo: 1,
      category: 'fruits',
      category_name: 'Fruits',
      popular: true,
      organic: true,
      description: 'Naturally ripened bananas.',
      stock: 30,
      image: null,
      is_available: true,
    },
    created_at: '2026-11-05T10:30:00Z',
  },
];

describe('favoriteService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('fetches and transforms DRF paginated favorites', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: {
          count: 2,
          total_pages: 1,
          current_page: 1,
          page_size: 20,
          next: null,
          previous: null,
          results: mockRawFavorites,
        },
      });

      const favorites = await favoriteService.getFavorites();

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.FAVORITES);
      expect(favorites).toHaveLength(2);
      expect(favorites[0].id).toBe('tomato');
      expect(favorites[0].price).toBe(32);
      expect(favorites[0].image).toBe('/media/products/tomato.png');
      expect(favorites[1].id).toBe('banana');
      expect(favorites[1].price).toBe(55);
      expect(favorites[1].image).toBeNull();
    });

    it('handles flat array responses gracefully', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: mockRawFavorites,
      });

      const favorites = await favoriteService.getFavorites();

      expect(favorites).toHaveLength(2);
      expect(favorites[0].name).toBe('Farm Fresh Tomatoes');
    });

    it('returns empty array on unexpected payload', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: null,
      });

      const favorites = await favoriteService.getFavorites();
      expect(favorites).toEqual([]);
    });

    it('normalizes and throws API errors', async () => {
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { detail: 'Authentication credentials were not provided.' },
        },
      };
      jest.spyOn(api, 'get').mockRejectedValueOnce(errorResponse);

      await expect(favoriteService.getFavorites()).rejects.toMatchObject({
        statusCode: 401,
        isAuthError: true,
      });
    });
  });

  describe('toggleFavorite', () => {
    it('sends toggle request and returns parsed result when favoriting', async () => {
      jest.spyOn(api, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          product_id: 'tomato',
          is_favourite: true,
          message: 'Saved Tomato to favourites.',
        },
      });

      const result = await favoriteService.toggleFavorite('tomato');

      expect(api.post).toHaveBeenCalledWith(`${API_ENDPOINTS.FAVORITES}toggle/`, {
        product_id: 'tomato',
      });
      expect(result.success).toBe(true);
      expect(result.productId).toBe('tomato');
      expect(result.isFavourite).toBe(true);
      expect(result.message).toBe('Saved Tomato to favourites.');
    });

    it('returns parsed result when unfavoriting', async () => {
      jest.spyOn(api, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          product_id: 'tomato',
          is_favourite: false,
          message: 'Removed Tomato from favourites.',
        },
      });

      const result = await favoriteService.toggleFavorite('tomato');

      expect(result.isFavourite).toBe(false);
      expect(result.message).toBe('Removed Tomato from favourites.');
    });

    it('normalizes and throws on toggle failure', async () => {
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { detail: 'Not found.' },
        },
      };
      jest.spyOn(api, 'post').mockRejectedValueOnce(errorResponse);

      await expect(favoriteService.toggleFavorite('unknown_prod')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});


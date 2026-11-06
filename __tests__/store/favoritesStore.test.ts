import { useShop } from '../../store/useShop';
import { favoriteService } from '../../services/favoriteService';
import { secureStorage } from '../../services/secureStorage';
import { Product } from '../../types/product';

const sampleProduct: Product = {
  id: 'tomato',
  name: 'Farm Tomato',
  weight: '500 g',
  price: 32,
  original: 40,
  photo: 0,
  category: 'vegetables',
  popular: true,
  description: 'Farm fresh.',
};

const sampleBanana: Product = {
  id: 'banana',
  name: 'Robusta Banana',
  weight: '1 kg',
  price: 55,
  original: 65,
  photo: 1,
  category: 'fruits',
  popular: true,
  description: 'Sweet bananas.',
};

describe('useShop favorites integration', () => {
  beforeEach(() => {
    useShop.setState({
      favourites: [],
      favouriteProducts: [],
      isLoadingFavourites: false,
      favouriteError: null,
    });
    jest.clearAllMocks();
  });

  describe('syncFavouritesWithBackend', () => {
    it('fetches and sets favourites and favouriteProducts when authenticated', async () => {
      jest.spyOn(secureStorage, 'getAccessToken').mockResolvedValueOnce('fake-token');
      jest
        .spyOn(favoriteService, 'getFavorites')
        .mockResolvedValueOnce([sampleProduct, sampleBanana]);

      await useShop.getState().syncFavouritesWithBackend();

      const state = useShop.getState();
      expect(state.favourites).toEqual(['tomato', 'banana']);
      expect(state.favouriteProducts).toHaveLength(2);
      expect(state.favouriteProducts[0].name).toBe('Farm Tomato');
      expect(state.isLoadingFavourites).toBe(false);
      expect(state.favouriteError).toBeNull();
    });

    it('does nothing when user is unauthenticated', async () => {
      jest.spyOn(secureStorage, 'getAccessToken').mockResolvedValueOnce(null);
      const getFavSpy = jest.spyOn(favoriteService, 'getFavorites');

      await useShop.getState().syncFavouritesWithBackend();

      expect(getFavSpy).not.toHaveBeenCalled();
      expect(useShop.getState().favourites).toEqual([]);
    });

    it('sets favouriteError when backend call fails', async () => {
      jest.spyOn(secureStorage, 'getAccessToken').mockResolvedValueOnce('fake-token');
      jest
        .spyOn(favoriteService, 'getFavorites')
        .mockRejectedValueOnce(new Error('Network error'));

      await useShop.getState().syncFavouritesWithBackend();

      const state = useShop.getState();
      expect(state.isLoadingFavourites).toBe(false);
      expect(state.favouriteError).toBe('Network error');
    });
  });

  describe('toggleFavourite', () => {
    it('updates local state in memory when unauthenticated', async () => {
      jest.spyOn(secureStorage, 'getAccessToken').mockResolvedValue('fake-null-auth' as any);
      // Explicitly return null for unauthenticated
      jest.spyOn(secureStorage, 'getAccessToken').mockResolvedValueOnce(null);
      const toggleSpy = jest.spyOn(favoriteService, 'toggleFavorite');

      await useShop.getState().toggleFavourite('tomato', sampleProduct);

      expect(useShop.getState().favourites).toContain('tomato');
      expect(useShop.getState().favouriteProducts).toContainEqual(sampleProduct);
      expect(toggleSpy).not.toHaveBeenCalled();

      // Toggle off
      jest.spyOn(secureStorage, 'getAccessToken').mockResolvedValueOnce(null);
      await useShop.getState().toggleFavourite('tomato');

      expect(useShop.getState().favourites).not.toContain('tomato');
      expect(useShop.getState().favouriteProducts).toHaveLength(0);
    });

    it('optimistically updates and syncs with backend when authenticated', async () => {
      jest.spyOn(secureStorage, 'getAccessToken').mockResolvedValue('fake-jwt-token');
      jest.spyOn(favoriteService, 'toggleFavorite').mockResolvedValueOnce({
        success: true,
        productId: 'tomato',
        isFavourite: true,
        message: 'Saved to favourites',
      });

      await useShop.getState().toggleFavourite('tomato', sampleProduct);

      expect(useShop.getState().favourites).toContain('tomato');
      expect(favoriteService.toggleFavorite).toHaveBeenCalledWith('tomato');
    });

    it('rolls back to previous state on server error', async () => {
      useShop.setState({
        favourites: ['banana'],
        favouriteProducts: [sampleBanana],
      });

      jest.spyOn(secureStorage, 'getAccessToken').mockResolvedValue('fake-jwt-token');
      jest
        .spyOn(favoriteService, 'toggleFavorite')
        .mockRejectedValueOnce(new Error('Internal server error'));

      await useShop.getState().toggleFavourite('tomato', sampleProduct);

      // Should be rolled back to only banana
      const state = useShop.getState();
      expect(state.favourites).toEqual(['banana']);
      expect(state.favouriteProducts).toEqual([sampleBanana]);
      expect(state.favouriteError).toBe('Internal server error');
    });
  });

  describe('resetFavourites', () => {
    it('wipes favourites, products, and errors on logout', () => {
      useShop.setState({
        favourites: ['tomato'],
        favouriteProducts: [sampleProduct],
        favouriteError: 'Some error',
      });

      useShop.getState().resetFavourites();

      const state = useShop.getState();
      expect(state.favourites).toEqual([]);
      expect(state.favouriteProducts).toEqual([]);
      expect(state.favouriteError).toBeNull();
    });
  });
});


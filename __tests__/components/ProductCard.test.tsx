import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProductCard } from '../../components/ProductCard';
import { router } from 'expo-router';
import { useShop } from '../../store/useShop';
import { Product } from '../../types/product';

const mockProduct: Product = {
  id: 'tomato',
  name: 'Fresh red tomatoes',
  weight: '500 g',
  price: 28,
  original: 36,
  photo: 0,
  category: 'vegetables',
  popular: true,
  description: 'Firm, juicy tomatoes.',
};

describe('ProductCard component', () => {
  beforeEach(() => {
    useShop.setState({
      cart: [],
      summary: null,
    });
    jest.clearAllMocks();
  });

  it('renders product details and discount badge correctly', async () => {
    await render(<ProductCard product={mockProduct} width={180} />);

    expect(screen.getByText('Fresh red tomatoes')).toBeTruthy();
    expect(screen.getByText('500 g')).toBeTruthy();
    expect(screen.getByText('₹28')).toBeTruthy();
    expect(screen.getByText('₹36')).toBeTruthy();
    // 36 - 28 = 8, 8 / 36 ~ 22%
    expect(screen.getByText('22% off')).toBeTruthy();
  });

  it('navigates to product detail screen when card is clicked', async () => {
    await render(<ProductCard product={mockProduct} width={180} />);

    const card = screen.getByLabelText('View Fresh red tomatoes');
    fireEvent.press(card);

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/product/[id]',
      params: { id: 'tomato' },
    });
  });

  it('shows Add button and adds item to cart when not in cart', async () => {
    const addSpy = jest.spyOn(useShop.getState(), 'add');
    await render(<ProductCard product={mockProduct} width={180} />);

    const addButton = screen.getByLabelText('Add Fresh red tomatoes');
    expect(addButton).toBeTruthy();

    fireEvent.press(addButton);
    expect(addSpy).toHaveBeenCalledWith('tomato');
  });

  it('renders QuantityControl when product is already in cart', async () => {
    useShop.setState({
      cart: [
        {
          key: 'tomato:regular',
          productId: 'tomato',
          quantity: 3,
          large: false,
        },
      ],
    });

    const changeSpy = jest.spyOn(useShop.getState(), 'change');
    await render(<ProductCard product={mockProduct} width={180} />);

    // Add button should not be present
    expect(screen.queryByLabelText('Add Fresh red tomatoes')).toBeNull();

    // Quantity should be rendered
    expect(screen.getByText('3')).toBeTruthy();

    // Test increase quantity
    const plusButton = screen.getByLabelText('Increase quantity');
    fireEvent.press(plusButton);
    expect(changeSpy).toHaveBeenCalledWith('tomato:regular', 1);

    // Test decrease quantity
    const minusButton = screen.getByLabelText('Decrease quantity');
    fireEvent.press(minusButton);
    expect(changeSpy).toHaveBeenCalledWith('tomato:regular', -1);
  });
});

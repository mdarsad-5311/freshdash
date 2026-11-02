import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QuantityControl } from '../../components/QuantityControl';

describe('QuantityControl component', () => {
  it('renders current quantity correctly', async () => {
    await render(<QuantityControl quantity={3} onMinus={jest.fn()} onPlus={jest.fn()} />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('calls onMinus when decrease button is pressed', async () => {
    const onMinusMock = jest.fn();
    await render(<QuantityControl quantity={5} onMinus={onMinusMock} onPlus={jest.fn()} />);

    const minusButton = screen.getByLabelText('Decrease quantity');
    fireEvent.press(minusButton);

    expect(onMinusMock).toHaveBeenCalledTimes(1);
  });

  it('calls onPlus when increase button is pressed', async () => {
    const onPlusMock = jest.fn();
    await render(<QuantityControl quantity={5} onMinus={jest.fn()} onPlus={onPlusMock} />);

    const plusButton = screen.getByLabelText('Increase quantity');
    fireEvent.press(plusButton);

    expect(onPlusMock).toHaveBeenCalledTimes(1);
  });

  it('renders 0 correctly when quantity is zero', async () => {
    await render(<QuantityControl quantity={0} onMinus={jest.fn()} onPlus={jest.fn()} />);
    expect(screen.getByText('0')).toBeTruthy();
  });
});

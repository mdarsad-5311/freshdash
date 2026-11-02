import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../../components/EmptyState';

describe('EmptyState component', () => {
  it('renders title, message, and action button text', async () => {
    await render(
      <EmptyState
        title="Your cart is empty"
        message="Looks like you have not added anything yet."
        action="Start Shopping"
        onPress={jest.fn()}
      />
    );

    expect(screen.getByText('Your cart is empty')).toBeTruthy();
    expect(screen.getByText('Looks like you have not added anything yet.')).toBeTruthy();
    expect(screen.getByText('Start Shopping')).toBeTruthy();
  });

  it('triggers onPress callback when the action button is pressed', async () => {
    const onPressMock = jest.fn();
    await render(
      <EmptyState
        title="No Orders Yet"
        message="You haven't placed any orders."
        action="Browse Products"
        onPress={onPressMock}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders smoothly without onPress handler', async () => {
    await render(
      <EmptyState
        title="Empty"
        message="Nothing here"
        action="Ok"
      />
    );

    expect(screen.getByText('Empty')).toBeTruthy();
    expect(screen.getByText('Ok')).toBeTruthy();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActionButton } from '../../components/ActionButton';
import { colors } from '../../constants/theme';

describe('ActionButton component', () => {
  it('renders children text correctly', async () => {
    await render(<ActionButton>Click Me</ActionButton>);
    expect(screen.getByText('Click Me')).toBeTruthy();
  });

  it('triggers onPress callback when pressed', async () => {
    const onPressMock = jest.fn();
    await render(<ActionButton onPress={onPressMock}>Pressable Action</ActionButton>);

    const button = screen.getByRole('button');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onPress callback when disabled', async () => {
    const onPressMock = jest.fn();
    await render(
      <ActionButton disabled onPress={onPressMock}>
        Disabled Button
      </ActionButton>
    );

    const button = screen.getByRole('button');
    fireEvent.press(button);

    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders with secondary styling when secondary prop is true', async () => {
    await render(<ActionButton secondary>Secondary Action</ActionButton>);

    const textElement = screen.getByText('Secondary Action');
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: colors.green,
        }),
      ])
    );
  });

  it('renders with primary white text color by default', async () => {
    await render(<ActionButton>Primary Action</ActionButton>);

    const textElement = screen.getByText('Primary Action');
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: colors.white,
        }),
      ])
    );
  });
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProducePhoto } from '../../components/ProducePhoto';

describe('ProducePhoto component', () => {
  it('renders sprite atlas image when imageUrl is omitted', async () => {
    const { getByTestId, queryByTestId } = await render(
      <ProducePhoto index={0} size={100} />
    );

    expect(getByTestId('produce-photo-atlas')).toBeTruthy();
    expect(queryByTestId('produce-photo-remote')).toBeNull();
  });

  it('renders remote image when valid imageUrl is provided', async () => {
    const remoteUrl = 'https://cdn.freshdash.com/products/alphonso.png';
    const { getByTestId, queryByTestId } = await render(
      <ProducePhoto index={6} size={100} imageUrl={remoteUrl} />
    );

    const remoteImage = getByTestId('produce-photo-remote');
    expect(remoteImage).toBeTruthy();
    expect(remoteImage.props.source).toEqual({ uri: remoteUrl });
    expect(queryByTestId('produce-photo-atlas')).toBeNull();
  });

  it('resolves relative media path and renders remote image', async () => {
    const relativeUrl = '/media/products/tomato.png';
    const { getByTestId } = await render(
      <ProducePhoto index={0} size={100} imageUrl={relativeUrl} />
    );

    const remoteImage = getByTestId('produce-photo-remote');
    expect(remoteImage).toBeTruthy();
    expect(remoteImage.props.source.uri).toContain('/media/products/tomato.png');
  });

  it('gracefully falls back to sprite atlas when remote image errors out', async () => {
    const brokenUrl = 'https://invalid.domain/broken.png';
    const { getByTestId, queryByTestId } = await render(
      <ProducePhoto index={2} size={100} imageUrl={brokenUrl} />
    );

    const remoteImage = getByTestId('produce-photo-remote');
    expect(remoteImage).toBeTruthy();

    // Trigger image error
    fireEvent(remoteImage, 'error', { nativeEvent: { error: 'Failed to load image' } });

    // Should now display sprite atlas fallback
    await waitFor(() => {
      expect(getByTestId('produce-photo-atlas')).toBeTruthy();
      expect(queryByTestId('produce-photo-remote')).toBeNull();
    });
  });
});

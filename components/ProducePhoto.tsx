import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';
import { resolveMediaUrl } from '../utils/image';

export interface ProducePhotoProps {
  index: number;
  size?: number;
  imageUrl?: string | null;
}

const ATLAS_IMAGE = require('../assets/images/produce-atlas.png');
const ATLAS_COLUMNS = 4;

/**
 * Renders produce items:
 * - If an uploaded remote/media image URL is provided and valid, renders the remote image.
 * - If the remote image fails to load or is missing, gracefully falls back to the 4x3 sprite atlas.
 * - Preserves exact tile dimensions to avoid broken placeholders and layout shifts.
 */
export function ProducePhoto({ index, size = 100, imageUrl }: ProducePhotoProps) {
  // Each tile in the atlas has an 8:9 aspect ratio
  const tileWidth = size;
  const tileHeight = (8 * size) / 9;

  // The complete sheet is 4 columns wide and 3 rows high
  const sheetWidth = tileWidth * ATLAS_COLUMNS;
  const sheetHeight = (8 * size) / 3;

  const col = index % ATLAS_COLUMNS;
  const row = Math.floor(index / ATLAS_COLUMNS);

  const offsetX = -(col * tileWidth);
  const offsetY = -(row * tileHeight);

  const resolvedUrl = resolveMediaUrl(imageUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const isImageFailed = Boolean(resolvedUrl && failedUrl === resolvedUrl);

  return (
    <View style={[styles.outer, { width: tileWidth, height: tileWidth }]}>
      <View style={[styles.viewport, { width: tileWidth, height: tileHeight }]}>
        {resolvedUrl && !isImageFailed ? (
          <Image
            testID="produce-photo-remote"
            source={{ uri: resolvedUrl }}
            resizeMode="contain"
            onError={() => setFailedUrl(resolvedUrl)}
            style={{ width: tileWidth, height: tileHeight }}
          />
        ) : (
          <Image
            testID="produce-photo-atlas"
            source={ATLAS_IMAGE}
            resizeMode="stretch"
            style={[
              styles.spriteSheet,
              {
                width: sheetWidth,
                height: sheetHeight,
                left: offsetX,
                top: offsetY,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  viewport: {
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spriteSheet: {
    position: 'absolute',
  },
});

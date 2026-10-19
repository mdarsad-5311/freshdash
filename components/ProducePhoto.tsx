import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export interface ProducePhotoProps {
  index: number;
  size?: number;
}

const ATLAS_IMAGE = require('../assets/images/produce-atlas.png');
const ATLAS_COLUMNS = 4;

/**
 * Renders individual produce items from the 4x3 sprite atlas asset.
 */
export function ProducePhoto({ index, size = 100 }: ProducePhotoProps) {
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

  return (
    <View style={[styles.outer, { width: tileWidth, height: tileWidth }]}>
      <View style={[styles.viewport, { width: tileWidth, height: tileHeight }]}>
        <Image
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
  },
  spriteSheet: {
    position: 'absolute',
  },
});

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Category } from '../constants/products';
import { Txt } from './Txt';
import { ProducePhoto } from './ProducePhoto';

export interface CategoryCardProps {
  category: Category;
  width: number;
}

export function CategoryCard({ category, width }: CategoryCardProps) {
  const boxHeight = 0.86 * width;
  const photoSize = 0.78 * width;

  const handlePress = () => {
    router.push({
      pathname: '/listing',
      params: { category: category.id },
    });
  };

  return (
    <Pressable
      style={[styles.container, { width }]}
      onPress={handlePress}
    >
      <View
        style={[
          styles.categoryPhoto,
          { width, height: boxHeight, backgroundColor: category.tint },
        ]}
      >
        <View style={styles.photoCrop}>
          <ProducePhoto index={category.photo} size={photoSize} />
        </View>
      </View>
      <Txt weight="medium" style={styles.name} numberOfLines={2}>
        {category.name}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  categoryPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  photoCrop: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  name: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});

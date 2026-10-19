import React from 'react';
import { View, FlatList, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/theme';
import { categories } from '../../constants/products';
import { Txt } from '../../components/Txt';
import { Screen } from '../../components/Screen';
import { SearchBar } from '../../components/SearchBar';
import { CategoryCard } from '../../components/CategoryCard';

export default function CategoriesScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 56) / 2;

  const handleSearchPress = () => {
    router.push({
      pathname: '/listing',
      params: { category: 'all' },
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Txt weight="bold" style={styles.title}>
          Shop by category
        </Txt>
        <SearchBar onPress={handleSearchPress} />
      </View>

      <FlatList
        data={categories}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            <CategoryCard category={item} width={cardWidth} />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Txt weight="semibold" style={styles.footerText}>
              A fresh pick for every plate.
            </Txt>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 25,
    letterSpacing: -0.7,
  },
  columnWrapper: {
    gap: 16,
  },
  itemWrapper: {
    marginBottom: 25,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 25,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    color: colors.darkGreen,
  },
});

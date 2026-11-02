import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/theme';
import { categories as fallbackCategories } from '../../constants/products';
import { Category } from '../../types/product';
import { categoryService } from '../../services/categoryService';
import { Txt } from '../../components/Txt';
import { Screen } from '../../components/Screen';
import { SearchBar } from '../../components/SearchBar';
import { CategoryCard } from '../../components/CategoryCard';
import { EmptyState } from '../../components/EmptyState';

export default function CategoriesScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 56) / 2;

  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async (isRefresh = false) => {
    let isMounted = true;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await categoryService.getAllCategories();
      if (isMounted) {
        if (data && data.length > 0) {
          setCategories(data);
        }
      }
    } catch (err: any) {
      if (isMounted) {
        setError(err?.message || 'Failed to load categories');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await categoryService.getAllCategories();
        if (active && data && data.length > 0) {
          setCategories(data);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || 'Failed to load categories');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

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

      {loading && categories.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Txt style={styles.statusText}>Loading fresh categories...</Txt>
        </View>
      ) : error && categories.length === 0 ? (
        <EmptyState
          title="Couldn't load categories"
          message={error}
          action="Try again"
          onPress={() => loadCategories(false)}
        />
      ) : (
        <FlatList
          data={categories}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadCategories(true)}
              tintColor={colors.green}
              colors={[colors.green]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.itemWrapper}>
              <CategoryCard category={item} width={cardWidth} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No categories found"
              message="Check back soon for fresh arrivals."
              action="Refresh"
              onPress={() => loadCategories(false)}
            />
          }
          ListFooterComponent={
            categories.length > 0 ? (
              <View style={styles.footer}>
                <Txt weight="semibold" style={styles.footerText}>
                  A fresh pick for every plate.
                </Txt>
              </View>
            ) : null
          }
        />
      )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  statusText: {
    color: colors.muted,
    fontSize: 14,
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

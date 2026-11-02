import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { categories as fallbackCategories, categoryProducts } from '../constants/products';
import { Product, Category } from '../types/product';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { haptics } from '../utils/haptics';
import { Txt } from '../components/Txt';
import { SearchBar } from '../components/SearchBar';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';

const FILTER_TAGS = ['All', 'Popular', 'Organic', 'Offers'] as const;
type FilterTag = (typeof FILTER_TAGS)[number];

const SORT_OPTIONS = [
  'Recommended',
  'Price: low to high',
  'Price: high to low',
  'Biggest discount',
] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export default function ListingScreen() {
  const { category = 'all', search: initialSearch = '' } = useLocalSearchParams<{
    category?: string;
    search?: string;
  }>();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 52) / 2;

  const [categoriesList, setCategoriesList] = useState<Category[]>(fallbackCategories);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [filter, setFilter] = useState<FilterTag>('All');
  const [sort, setSort] = useState<SortOption>('Recommended');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Initial seed from local fallback to prevent jarring empty flicker
  const [products, setProducts] = useState<Product[]>(() => categoryProducts(category));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input by 300ms
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Load category title from dynamic categories if available
  const categoryName = useMemo(() => {
    if (category === 'all') return 'Fresh produce';
    if (category === 'vegetables') return 'Fresh vegetables';
    if (category === 'fruits') return 'Fresh fruits';
    if (category === 'organic') return 'Organic produce';
    const match = categoriesList.find((c) => c.id === category);
    return match ? match.name : 'Fresh produce';
  }, [category, categoriesList]);

  // Fetch dynamic categories once for accurate titles
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cats = await categoryService.getAllCategories();
        if (active && cats.length > 0) {
          setCategoriesList(cats);
        }
      } catch {
        // Fallback remains active
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Map sort option to backend ordering field
  const backendOrdering = useMemo(() => {
    switch (sort) {
      case 'Price: low to high':
        return 'price';
      case 'Price: high to low':
        return '-price';
      case 'Recommended':
      default:
        return 'name';
    }
  }, [sort]);

  const fetchProducts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const queryParams = {
          category: category === 'all' ? undefined : category,
          search: debouncedSearch.trim() || undefined,
          popular: filter === 'Popular' ? true : undefined,
          organic: filter === 'Organic' ? true : undefined,
          offers: filter === 'Offers' ? true : undefined,
          ordering: backendOrdering,
          page_size: 50,
        };

        const res = await productService.getProducts(queryParams);
        let results = res.results;

        // Apply client-side discount sorting if selected
        if (sort === 'Biggest discount') {
          results = [...results].sort((a, b) => {
            const discA = a.original > a.price ? (a.original - a.price) / a.original : 0;
            const discB = b.original > b.price ? (b.original - b.price) / b.original : 0;
            return discB - discA;
          });
        }

        setProducts(results);
      } catch (err: any) {
        setError(err?.message || 'Failed to load products');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, debouncedSearch, filter, backendOrdering, sort]
  );

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const queryParams = {
          category: category === 'all' ? undefined : category,
          search: debouncedSearch.trim() || undefined,
          popular: filter === 'Popular' ? true : undefined,
          organic: filter === 'Organic' ? true : undefined,
          offers: filter === 'Offers' ? true : undefined,
          ordering: backendOrdering,
          page_size: 50,
        };

        const res = await productService.getProducts(queryParams);
        if (!isCancelled) {
          let results = res.results;
          if (sort === 'Biggest discount') {
            results = [...results].sort((a, b) => {
              const discA = a.original > a.price ? (a.original - a.price) / a.original : 0;
              const discB = b.original > b.price ? (b.original - b.price) / b.original : 0;
              return discB - discA;
            });
          }
          setProducts(results);
          setError(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err?.message || 'Failed to load products');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [category, debouncedSearch, filter, backendOrdering, sort]);

  const productCountText = `${products.length} ${products.length === 1 ? 'product' : 'products'}`;

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: categoryName,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Txt style={styles.countText}>{productCountText}</Txt>
          <Pressable style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
            <Txt weight="medium" style={styles.sortButtonText}>
              Sort by: {sort}
            </Txt>
            <ChevronDown size={15} color={colors.ink} />
          </Pressable>
        </View>

        <SearchBar
          value={search}
          onChange={setSearch}
          filter
          onFilter={() => setSortModalVisible(true)}
        />

        <View style={styles.filters}>
          {FILTER_TAGS.map((tag) => {
            const isActive = filter === tag;
            return (
              <Pressable
                key={tag}
                onPress={() => {
                  setFilter(tag);
                  haptics.selection();
                }}
                style={[styles.filterPill, isActive && styles.activeFilterPill]}
              >
                <Txt
                  weight="medium"
                  style={{
                    color: isActive ? colors.white : colors.muted,
                    fontSize: 12,
                  }}
                  numberOfLines={1}
                >
                  {tag}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Txt style={styles.statusText}>Searching for fresh produce...</Txt>
        </View>
      ) : error && products.length === 0 ? (
        <EmptyState
          title="Couldn't load products"
          message={error}
          action="Try again"
          onPress={() => fetchProducts(false)}
        />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchProducts(true)}
              tintColor={colors.green}
              colors={[colors.green]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} width={cardWidth} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No fresh finds here"
              message="Try another search or filter."
              action="Clear filters"
              onPress={() => {
                setSearch('');
                setFilter('All');
                setSort('Recommended');
                haptics.selection();
              }}
            />
          }
          ListFooterComponent={
            products.length > 0 ? (
              <Pressable
                style={styles.browseFooter}
                onPress={() => router.push('/categories')}
              >
                <Txt weight="medium" style={styles.browseText}>
                  Explore more categories
                </Txt>
              </Pressable>
            ) : undefined
          }
        />
      )}

      <Modal
        transparent
        visible={sortModalVisible}
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Txt weight="bold" style={styles.modalTitle}>
                Sort products
              </Txt>
              <Pressable
                accessibilityLabel="Close sorting"
                hitSlop={12}
                onPress={() => setSortModalVisible(false)}
              >
                <X size={22} color={colors.ink} />
              </Pressable>
            </View>

            {SORT_OPTIONS.map((opt) => {
              const isSelected = sort === opt;
              return (
                <Pressable
                  key={opt}
                  style={styles.sortOption}
                  onPress={() => {
                    setSort(opt);
                    setSortModalVisible(false);
                    haptics.selection();
                  }}
                >
                  <Txt weight={isSelected ? 'semibold' : 'regular'}>{opt}</Txt>
                  {isSelected && <Check size={20} color={colors.green} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 18,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: {
    fontSize: 13,
    color: colors.muted,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
  },
  sortButtonText: {
    fontSize: 12,
    color: colors.ink,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterPill: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  grid: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  columnWrapper: {
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 16,
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
  browseFooter: {
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  browseText: {
    color: colors.darkGreen,
    fontSize: 13,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});

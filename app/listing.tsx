import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  Pressable,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { categories, categoryProducts, Product } from '../constants/products';
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
  const { category = 'all' } = useLocalSearchParams<{ category?: string }>();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 52) / 2;

  const categoryName =
    categories.find((c) => c.id === category)?.name ?? 'Fresh produce';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTag>('All');
  const [sort, setSort] = useState<SortOption>('Recommended');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const rawProducts = useMemo(() => categoryProducts(category), [category]);

  const filteredProducts = useMemo(() => {
    return rawProducts
      .filter((p) => {
        const query = search.trim().toLowerCase();
        const matchesQuery = !query || p.name.toLowerCase().includes(query);

        if (!matchesQuery) return false;

        switch (filter) {
          case 'Popular':
            return Boolean(p.popular);
          case 'Organic':
            return Boolean(p.organic);
          case 'Offers':
            return (p.original - p.price) / p.original >= 0.2;
          case 'All':
          default:
            return true;
        }
      })
      .sort((a, b) => {
        if (sort === 'Price: low to high') return a.price - b.price;
        if (sort === 'Price: high to low') return b.price - a.price;
        if (sort === 'Biggest discount') {
          const discountRatioA = (a.original - a.price) / a.original;
          const discountRatioB = (b.original - b.price) / b.original;
          return discountRatioB - discountRatioA;
        }
        return 0;
      });
  }, [rawProducts, search, filter, sort]);

  const productCountText = `${filteredProducts.length} ${
    filteredProducts.length === 1 ? 'product' : 'products'
  }`;

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
          <Pressable
            style={styles.sortButton}
            onPress={() => setSortModalVisible(true)}
          >
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

      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.grid}
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
              haptics.selection();
            }}
          />
        }
        ListFooterComponent={
          filteredProducts.length > 0 ? (
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
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
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
    paddingBottom: 26,
  },
  columnWrapper: {
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  browseFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  browseText: {
    color: colors.green,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modal: {
    backgroundColor: colors.white,
    padding: 24,
    paddingBottom: 35,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
  },
  sortOption: {
    paddingVertical: 19,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  CheckCircle2,
  Clock3,
  Truck,
  XCircle,
  Package,
  MapPin,
  ShoppingBag,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
import { formatCurrency } from '../../constants/products';
import { Order, OrderStatus } from '../../types/order';
import { orderService } from '../../services/orderService';
import { haptics } from '../../utils/haptics';
import { Txt } from '../../components/Txt';
import { ActionButton } from '../../components/ActionButton';
import { EmptyState } from '../../components/EmptyState';

export default function OrderDetailScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(
    async (isRefresh = false) => {
      if (!orderNumber) return;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await orderService.getOrder(orderNumber);
        setOrder(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderNumber]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      if (!orderNumber) return;
      try {
        const data = await orderService.getOrder(orderNumber);
        if (active) {
          setOrder(data);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || 'Failed to load order details');
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
  }, [orderNumber]);

  const handleCancelOrder = () => {
    if (!order) return;
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const updated = await orderService.cancelOrder(order.order_number);
              setOrder(updated);
              haptics.success();
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
            } catch (err: any) {
              haptics.selection();
              Alert.alert(
                'Cancellation Notice',
                err?.message || 'Could not cancel this order.'
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return {
          label: 'Order Placed',
          desc: 'Fresh produce is being handpicked & packed.',
          color: colors.green,
          bg: colors.softGreen,
          icon: <Package size={22} color={colors.green} />,
        };
      case 'confirmed':
        return {
          label: 'Order Confirmed',
          desc: 'Your harvest basket is verified and ready for pickup.',
          color: colors.darkGreen,
          bg: colors.softGreen,
          icon: <CheckCircle2 size={22} color={colors.darkGreen} />,
        };
      case 'out_for_delivery':
        return {
          label: 'Out for Delivery',
          desc: 'Delivery partner is en route. Arriving in 10–15 mins.',
          color: colors.orange,
          bg: '#FFF6E8',
          icon: <Truck size={22} color={colors.orange} />,
        };
      case 'delivered':
        return {
          label: 'Delivered',
          desc: 'Enjoy your fresh produce!',
          color: colors.green,
          bg: colors.softGreen,
          icon: <CheckCircle2 size={22} color={colors.green} />,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          desc: 'This order was cancelled.',
          color: colors.red,
          bg: '#FDEEE9',
          icon: <XCircle size={22} color={colors.red} />,
        };
      default:
        return {
          label: status,
          desc: '',
          color: colors.muted,
          bg: colors.white,
          icon: <Clock3 size={22} color={colors.muted} />,
        };
    }
  };

  if (loading && !order) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <Stack.Screen
          options={{
            title: orderNumber ? `Order #${orderNumber}` : 'Order details',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Txt style={styles.statusText}>Fetching order details...</Txt>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <Stack.Screen
          options={{
            title: 'Order details',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <EmptyState
          title="Order not found"
          message={error || 'Could not find details for this order.'}
          action="Back to shopping"
          onPress={() => router.replace('/categories')}
        />
      </SafeAreaView>
    );
  }

  const badge = getStatusBadge(order.status);
  const addressSnapshot = order.delivery_address_snapshot || {};
  const canCancel = order.status === 'placed' || order.status === 'confirmed';

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <Stack.Screen
        options={{
          title: `Order #${order.order_number}`,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrder(true)}
            tintColor={colors.green}
            colors={[colors.green]}
          />
        }
      >
        {/* Status banner */}
        <View style={[styles.statusCard, { backgroundColor: badge.bg }]}>
          <View style={styles.statusIconWrap}>{badge.icon}</View>
          <View style={styles.statusTextWrap}>
            <Txt weight="bold" style={[styles.statusTitle, { color: badge.color }]}>
              {badge.label}
            </Txt>
            <Txt style={styles.statusSubtitle}>{badge.desc}</Txt>
          </View>
        </View>

        {/* Order Info & Delivery Address */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin size={18} color={colors.green} />
            <Txt weight="bold" style={styles.cardTitle}>
              Delivery Destination
            </Txt>
          </View>
          <Txt weight="semibold" style={styles.addressName}>
            {addressSnapshot.name || 'Delivery Address'}
          </Txt>
          {addressSnapshot.line ? (
            <Txt style={styles.addressLine}>{addressSnapshot.line}</Txt>
          ) : null}
          {addressSnapshot.area ? (
            <Txt style={styles.addressArea}>{addressSnapshot.area}</Txt>
          ) : null}
          <View style={styles.cardDivider} />
          <View style={styles.infoMetaRow}>
            <Txt style={styles.infoMetaLabel}>Order placed</Txt>
            <Txt weight="medium" style={styles.infoMetaVal}>
              {formattedDate}
            </Txt>
          </View>
        </View>

        {/* Items Breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ShoppingBag size={18} color={colors.green} />
            <Txt weight="bold" style={styles.cardTitle}>
              Items Ordered ({order.items.length})
            </Txt>
          </View>

          {order.items.map((item, idx) => (
            <View key={item.id || idx} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Txt weight="semibold" style={styles.itemName}>
                  {item.product_name}
                </Txt>
                <Txt style={styles.itemWeight}>
                  {item.weight} · Qty: {item.quantity}
                </Txt>
              </View>
              <Txt weight="bold" style={styles.itemPrice}>
                {formatCurrency(item.total_price)}
              </Txt>
            </View>
          ))}
        </View>

        {/* Bill Breakdown */}
        <View style={styles.card}>
          <Txt weight="bold" style={[styles.cardTitle, { marginBottom: 14 }]}>
            Bill Summary
          </Txt>

          <View style={styles.billRow}>
            <Txt style={styles.billLabel}>Item total</Txt>
            <Txt weight="medium">{formatCurrency(order.item_total)}</Txt>
          </View>

          <View style={styles.billRow}>
            <Txt style={styles.billLabel}>Delivery fee</Txt>
            <Txt
              weight="medium"
              style={{ color: order.delivery_fee === 0 ? colors.green : colors.ink }}
            >
              {order.delivery_fee === 0
                ? 'Free'
                : formatCurrency(order.delivery_fee)}
            </Txt>
          </View>

          {order.discount_amount > 0 && (
            <View style={styles.billRow}>
              <Txt style={[styles.billLabel, { color: colors.green }]}>
                Coupon discount {order.coupon_code ? `(${order.coupon_code})` : ''}
              </Txt>
              <Txt weight="medium" style={{ color: colors.green }}>
                −{formatCurrency(order.discount_amount)}
              </Txt>
            </View>
          )}

          <View style={styles.cardDivider} />

          <View style={styles.billRow}>
            <Txt weight="bold" style={{ fontSize: 16 }}>
              Total paid
            </Txt>
            <Txt weight="bold" style={styles.grandTotal}>
              {formatCurrency(order.grand_total)}
            </Txt>
          </View>
        </View>

        {/* Cancel button if cancellable */}
        {canCancel && (
          <Pressable
            style={styles.cancelButton}
            onPress={handleCancelOrder}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={colors.red} />
            ) : (
              <Txt weight="semibold" style={styles.cancelButtonText}>
                Cancel order
              </Txt>
            )}
          </Pressable>
        )}
      </ScrollView>

      {/* Bottom Action Footer */}
      <View style={styles.footer}>
        <ActionButton
          style={styles.continueButton}
          onPress={() => router.replace('/categories')}
        >
          Explore more produce
        </ActionButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    marginBottom: 3,
  },
  statusSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.white,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
  },
  addressName: {
    fontSize: 14,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    color: colors.muted,
  },
  addressArea: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  infoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoMetaLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  infoMetaVal: {
    fontSize: 12,
    color: colors.ink,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemWeight: {
    fontSize: 12,
    color: colors.muted,
  },
  itemPrice: {
    fontSize: 14,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  grandTotal: {
    fontSize: 18,
    color: colors.ink,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FDEEE9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F6B7A8',
  },
  cancelButtonText: {
    color: colors.red,
    fontSize: 13,
  },
  footer: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    width: '100%',
  },
});

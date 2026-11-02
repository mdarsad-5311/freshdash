import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import {
  Clock3,
  Trash2,
  ChevronRight,
  Tag,
  MapPin,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { colors, fonts } from '../../constants/theme';
import { products, formatCurrency } from '../../constants/products';
import { useShop } from '../../store/useShop';
import { useAuth } from '../../contexts/AuthContext';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import { addressService } from '../../services/addressService';
import { Address } from '../../types/order';
import { haptics } from '../../utils/haptics';
import { Txt } from '../../components/Txt';
import { Screen } from '../../components/Screen';
import { ActionButton } from '../../components/ActionButton';
import { QuantityControl } from '../../components/QuantityControl';
import { ProducePhoto } from '../../components/ProducePhoto';
import { EmptyState } from '../../components/EmptyState';

const FREE_DELIVERY_THRESHOLD = 199;
const STANDARD_DELIVERY_FEE = 20;
const PROMO_CODE_OFFER = 'FRESH20';
const PROMO_DISCOUNT_RATE = 0.2;
const MAX_PROMO_DISCOUNT = 50;

export default function CartScreen() {
  const { width, height } = useWindowDimensions();
  const cart = useShop((s) => s.cart);
  const summary = useShop((s) => s.summary);
  const syncCartWithBackend = useShop((s) => s.syncCartWithBackend);
  const address = useShop((s) => s.address);
  const change = useShop((s) => s.change);
  const remove = useShop((s) => s.remove);

  const [refreshing, setRefreshing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);
  const [promoErrorMessage, setPromoErrorMessage] = useState('');
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const isPlacingRef = useRef(false);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      void syncCartWithBackend();
    }
  }, [isAuthenticated, syncCartWithBackend]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncCartWithBackend();
    setRefreshing(false);
  }, [syncCartWithBackend]);

  const loadAddresses = useCallback(async () => {
    try {
      const addrs = await addressService.getAddresses();
      setAddresses(addrs);
      if (addrs.length > 0) {
        const def = addrs.find((a) => a.is_default) || addrs[0];
        setSelectedAddressId(def.id);
      }
    } catch {
      // Fallback to local default
    }
  }, []);

  const handleCheckoutPress = async () => {
    haptics.selection();
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    setOrderError(null);
    setCheckoutVisible(true);
    await loadAddresses();
  };

  const handlePlaceOrder = async () => {
    if (isPlacingRef.current || isPlacingOrder) return;
    if (cart.length === 0) {
      setOrderError('Your basket is empty. Please add items to place an order.');
      return;
    }

    try {
      isPlacingRef.current = true;
      setIsPlacingOrder(true);
      setOrderError(null);

      const createdOrder = await orderService.createOrder({
        delivery_address_id: selectedAddressId,
        coupon_code: promoApplied ? promoCode.trim().toUpperCase() : undefined,
      });

      setCheckoutVisible(false);
      haptics.success();

      // Refresh basket to reflect backend state (empty)
      await syncCartWithBackend();

      // Navigate to order details screen
      router.push({
        pathname: '/order/[orderNumber]' as any,
        params: { orderNumber: createdOrder.order_number },
      });
    } catch (err: any) {
      setOrderError(err?.message || 'Failed to place order. Please try again.');
      haptics.selection();
    } finally {
      isPlacingRef.current = false;
      setIsPlacingOrder(false);
    }
  };

  const computedItemTotal = cart.reduce((sum, item) => {
    if (typeof item.totalPrice === 'number') return sum + item.totalPrice;
    const p = item.product || products.find((prod) => prod.id === item.productId);
    return sum + (p ? p.price : 0) * (item.large ? 2 : 1) * item.quantity;
  }, 0);

  const itemTotal = summary ? summary.itemTotal : computedItemTotal;

  const computedSavings = cart.reduce((sum, item) => {
    if (typeof item.totalSavings === 'number') return sum + item.totalSavings;
    const p = item.product || products.find((prod) => prod.id === item.productId);
    return sum + (p ? p.original - p.price : 0) * (item.large ? 2 : 1) * item.quantity;
  }, 0);

  const savingsTotal = summary ? summary.savingsTotal : computedSavings;
  const totalItems = summary
    ? summary.totalItems
    : cart.reduce((sum, item) => sum + item.quantity, 0);

  const deliveryFee = summary
    ? summary.deliveryFee
    : itemTotal >= FREE_DELIVERY_THRESHOLD || totalItems === 0
    ? 0
    : STANDARD_DELIVERY_FEE;

  const promoDiscount = promoApplied ? promoDiscountAmount : 0;
  const grandTotal = Math.max(0, itemTotal + deliveryFee - promoDiscount);

  const handleApplyPromo = async () => {
    if (promoApplied) {
      setPromoApplied(false);
      setPromoDiscountAmount(0);
      setPromoError(false);
      haptics.success();
      return;
    }

    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await cartService.applyCoupon(code, itemTotal);
      if (res.valid) {
        setPromoDiscountAmount(res.discount);
        setPromoApplied(true);
        setPromoError(false);
        haptics.success();
      } else {
        setPromoError(true);
        setPromoErrorMessage(res.message || 'Invalid promo code');
      }
    } catch (err: any) {
      if (code === PROMO_CODE_OFFER) {
        const fallbackDiscount = Math.min(
          MAX_PROMO_DISCOUNT,
          Math.round(PROMO_DISCOUNT_RATE * itemTotal)
        );
        setPromoDiscountAmount(fallbackDiscount);
        setPromoApplied(true);
        setPromoError(false);
        haptics.success();
      } else {
        setPromoError(true);
        setPromoErrorMessage(err?.message || 'Use FRESH20 to preview this offer.');
      }
    }
  };

  const renderBillRow = (label: string, value: string, isGreen = false) => (
    <View style={styles.billRow} key={label}>
      <Txt style={{ color: isGreen ? colors.green : colors.muted, fontSize: 13 }}>
        {label}
      </Txt>
      <Txt
        weight="medium"
        style={{ color: isGreen ? colors.green : colors.ink, fontSize: 13 }}
      >
        {value}
      </Txt>
    </View>
  );

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Txt weight="bold" style={styles.title}>
            Your basket
          </Txt>
          <Txt style={styles.headerItems}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Txt>
        </View>

        {cart.length === 0 ? (
          <EmptyState
            title="Your basket feels a little empty"
            message="Fill it with fresh favourites for your next meal."
            action="Start shopping"
            onPress={() => router.push('/categories')}
          />
        ) : (
          <>
            <FlatList
              data={cart}
              keyExtractor={(item) => item.key}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.green}
                  colors={[colors.green]}
                />
              }
              ListHeaderComponent={
                <View style={styles.delivery}>
                  <Clock3 size={23} color={colors.green} strokeWidth={1.8} />
                  <View style={styles.deliveryCopy}>
                    <Txt weight="semibold" style={styles.deliveryTitle}>
                      Fresh at your door in 10–15 minutes
                    </Txt>
                    <Txt style={styles.deliverySubtitle}>
                      Handpicked, packed and on the way.
                    </Txt>
                  </View>
                </View>
              }
              renderItem={({ item }) => {
                const prod = item.product || products.find((p) => p.id === item.productId);
                if (!prod) return null;
                const itemPrice =
                  typeof item.totalPrice === 'number'
                    ? item.totalPrice
                    : prod.price * (item.large ? 2 : 1) * item.quantity;
                const photoSize = width < 360 ? 56 : 68;

                return (
                  <View style={styles.item}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/product/[id]',
                          params: { id: prod.id },
                        })
                      }
                    >
                      <ProducePhoto index={prod.photo} size={photoSize} />
                    </Pressable>

                    <View style={styles.itemInfo}>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/product/[id]',
                            params: { id: prod.id },
                          })
                        }
                      >
                        <Txt
                          weight="semibold"
                          style={styles.itemName}
                          numberOfLines={2}
                        >
                          {prod.name}
                        </Txt>
                        <Txt style={styles.itemWeight}>
                          {item.large ? 'Double pack' : prod.weight}
                        </Txt>
                      </Pressable>

                      <View style={styles.itemPriceRow}>
                        <Txt weight="bold" style={styles.itemPrice}>
                          {formatCurrency(itemPrice)}
                        </Txt>
                        <Pressable
                          accessibilityLabel={`Remove ${prod.name}`}
                          onPress={() => remove(item.key)}
                          hitSlop={8}
                        >
                          <Trash2 size={15} color={colors.muted} strokeWidth={1.8} />
                        </Pressable>
                      </View>
                    </View>

                    <QuantityControl
                      compact
                      quantity={item.quantity}
                      onMinus={() => change(item.key, -1)}
                      onPlus={() => change(item.key, 1)}
                    />
                  </View>
                );
              }}
              ListFooterComponent={
                <>
                  <Pressable
                    style={styles.addMore}
                    onPress={() => router.push('/categories')}
                  >
                    <Txt weight="semibold" style={styles.addMoreText}>
                      Add more fresh picks
                    </Txt>
                    <ChevronRight size={16} color={colors.green} strokeWidth={1.8} />
                  </Pressable>

                  <View style={styles.savings}>
                    <Tag size={17} color={colors.green} strokeWidth={1.8} />
                    <Txt weight="medium" style={styles.savingsText}>
                      You’re saving {formatCurrency(savingsTotal + promoDiscount)} on this basket
                    </Txt>
                  </View>

                  <View style={styles.promo}>
                    <View style={styles.promoHeading}>
                      <Tag size={17} color={colors.green} strokeWidth={1.8} />
                      <Txt weight="semibold" style={styles.promoTitle}>
                        Have a promo code?
                      </Txt>
                    </View>
                    <View style={styles.promoInputRow}>
                      <TextInput
                        value={promoCode}
                        onChangeText={(text) => {
                          setPromoCode(text);
                          setPromoError(false);
                        }}
                        placeholder="Try FRESH20"
                        placeholderTextColor={colors.muted}
                        accessibilityLabel="Promo code"
                        autoCapitalize="characters"
                        style={styles.promoInput}
                      />
                      <Pressable
                        onPress={handleApplyPromo}
                        style={styles.apply}
                      >
                        <Txt weight="semibold" style={styles.applyText}>
                          {promoApplied ? 'Remove' : 'Apply'}
                        </Txt>
                      </Pressable>
                    </View>
                    {promoApplied && (
                      <Txt style={styles.promoSuccessText}>
                        20% off applied, up to ₹50.
                      </Txt>
                    )}
                    {promoError && (
                      <Txt style={styles.promoErrorText}>
                        {promoErrorMessage || 'Use FRESH20 to preview this offer.'}
                      </Txt>
                    )}
                  </View>

                  <View style={styles.bill}>
                    <Txt weight="bold" style={styles.billTitle}>
                      Bill summary
                    </Txt>
                    {renderBillRow('Item total', formatCurrency(itemTotal))}
                    {renderBillRow(
                      'Delivery fee',
                      deliveryFee ? formatCurrency(deliveryFee) : 'Free',
                      !deliveryFee
                    )}
                    {promoApplied &&
                      renderBillRow('Promo savings', `−${formatCurrency(promoDiscount)}`, true)}
                    <View style={styles.total}>
                      <Txt weight="bold">Grand total</Txt>
                      <Txt weight="bold" style={styles.grandTotalText}>
                        {formatCurrency(grandTotal)}
                      </Txt>
                    </View>
                  </View>

                  <Pressable
                    style={styles.address}
                    onPress={() =>
                      router.push({
                        pathname: '/profile-section',
                        params: { section: 'Saved addresses' },
                      })
                    }
                  >
                    <MapPin size={20} color={colors.green} strokeWidth={1.8} />
                    <View style={styles.addressInfo}>
                      <Txt weight="semibold" style={styles.addressTitle}>
                        Deliver to {address}
                      </Txt>
                      <Txt style={styles.addressSub}>
                        {address === 'Home'
                          ? 'HSR Layout, Bengaluru'
                          : 'Indiranagar, Bengaluru'}
                      </Txt>
                    </View>
                    <ChevronRight size={18} color={colors.muted} />
                  </Pressable>
                </>
              }
            />

            <View style={styles.checkout}>
              <View>
                <Txt weight="bold" style={styles.checkoutAmount}>
                  {formatCurrency(grandTotal)}
                </Txt>
                <Txt style={styles.checkoutSubtitle}>Including all charges</Txt>
              </View>
              <ActionButton
                style={styles.checkoutButton}
                onPress={handleCheckoutPress}
              >
                Checkout
              </ActionButton>
            </View>
          </>
        )}

        <Modal
          transparent
          visible={checkoutVisible}
          animationType="fade"
          onRequestClose={() => {
            if (!isPlacingOrder) setCheckoutVisible(false);
          }}
        >
          <View style={styles.backdrop}>
            <View style={styles.modal}>
              <View style={styles.modalHeading}>
                <Txt weight="bold" style={styles.modalTitle}>
                  Checkout & Place Order
                </Txt>
                <Pressable
                  accessibilityLabel="Close checkout"
                  hitSlop={12}
                  disabled={isPlacingOrder}
                  onPress={() => setCheckoutVisible(false)}
                >
                  <X size={22} color={colors.ink} />
                </Pressable>
              </View>

              <ScrollView
                style={{ maxHeight: height * 0.55 }}
                contentContainerStyle={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Delivery destination */}
                <View style={styles.checkoutSection}>
                  <View style={styles.checkoutSectionHeader}>
                    <MapPin size={17} color={colors.green} />
                    <Txt weight="semibold" style={styles.checkoutSectionTitle}>
                      Delivery address
                    </Txt>
                  </View>
                  {addresses.length > 0 ? (
                    <View style={styles.addressPillsRow}>
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <Pressable
                            key={addr.id}
                            style={[
                              styles.addressOptionPill,
                              isSelected && styles.addressOptionSelected,
                            ]}
                            onPress={() => {
                              setSelectedAddressId(addr.id);
                              haptics.selection();
                            }}
                          >
                            <Txt
                              weight={isSelected ? 'bold' : 'medium'}
                              style={{
                                color: isSelected ? colors.green : colors.ink,
                                fontSize: 13,
                              }}
                            >
                              {addr.name}
                            </Txt>
                            <Txt
                              numberOfLines={1}
                              style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}
                            >
                              {addr.line}
                            </Txt>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Txt style={styles.defaultAddressFallback}>
                      Deliver to {address} · HSR Layout, Bengaluru
                    </Txt>
                  )}
                </View>

                {/* Delivery timeframe */}
                <View style={styles.checkoutTimeframe}>
                  <Clock3 size={16} color={colors.darkGreen} />
                  <Txt weight="medium" style={styles.checkoutTimeframeText}>
                    Instant delivery in 10–15 minutes
                  </Txt>
                </View>

                {/* Items & Charges summary */}
                <View style={styles.checkoutSummaryCard}>
                  <Txt weight="semibold" style={styles.checkoutSummaryTitle}>
                    Order Summary ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                  </Txt>
                  <View style={styles.modalBillRow}>
                    <Txt style={styles.modalBillLabel}>Item total</Txt>
                    <Txt weight="medium">{formatCurrency(itemTotal)}</Txt>
                  </View>
                  <View style={styles.modalBillRow}>
                    <Txt style={styles.modalBillLabel}>Delivery fee</Txt>
                    <Txt
                      weight="medium"
                      style={{ color: !deliveryFee ? colors.green : colors.ink }}
                    >
                      {deliveryFee ? formatCurrency(deliveryFee) : 'Free'}
                    </Txt>
                  </View>
                  {promoApplied && (
                    <View style={styles.modalBillRow}>
                      <Txt style={[styles.modalBillLabel, { color: colors.green }]}>
                        Promo savings ({promoCode.trim().toUpperCase()})
                      </Txt>
                      <Txt weight="medium" style={{ color: colors.green }}>
                        −{formatCurrency(promoDiscount)}
                      </Txt>
                    </View>
                  )}
                  <View style={styles.modalTotalDivider} />
                  <View style={styles.modalTotalRow}>
                    <Txt weight="bold" style={{ fontSize: 15 }}>
                      Grand total
                    </Txt>
                    <Txt weight="bold" style={styles.modalGrandTotal}>
                      {formatCurrency(grandTotal)}
                    </Txt>
                  </View>
                </View>

                {orderError ? (
                  <View style={styles.orderErrorBanner}>
                    <AlertCircle size={16} color={colors.red} />
                    <Txt style={styles.orderErrorText}>{orderError}</Txt>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.modalFooterActions}>
                <ActionButton
                  onPress={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  style={styles.modalPlaceButton}
                >
                  {isPlacingOrder
                    ? 'Placing your order...'
                    : `Pay ${formatCurrency(grandTotal)} · Place Order`}
                </ActionButton>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 25,
    letterSpacing: -0.7,
  },
  headerItems: {
    color: colors.muted,
    fontSize: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  delivery: {
    backgroundColor: colors.softGreen,
    padding: 16,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 17,
  },
  deliveryCopy: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 14,
  },
  deliverySubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 5,
  },
  item: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 12,
    lineHeight: 18,
  },
  itemWeight: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 13,
  },
  addMore: {
    backgroundColor: colors.white,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  addMoreText: {
    color: colors.green,
    fontSize: 12,
  },
  savings: {
    backgroundColor: colors.softGreen,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 13,
    borderRadius: 10,
    marginTop: 18,
  },
  savingsText: {
    color: colors.darkGreen,
    fontSize: 12,
  },
  promo: {
    marginTop: 20,
    padding: 16,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  promoHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  promoTitle: {
    fontSize: 14,
  },
  promoInputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
  },
  promoInput: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.ink,
  },
  apply: {
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  applyText: {
    color: colors.green,
    fontSize: 12,
  },
  promoSuccessText: {
    color: colors.green,
    fontSize: 11,
    marginTop: 9,
  },
  promoErrorText: {
    color: colors.red,
    fontSize: 11,
    marginTop: 9,
  },
  bill: {
    padding: 17,
    backgroundColor: colors.white,
    borderRadius: 13,
    marginTop: 18,
  },
  billTitle: {
    fontSize: 16,
    marginBottom: 15,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandTotalText: {
    fontSize: 18,
  },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 13,
    backgroundColor: colors.white,
    marginTop: 18,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 13,
  },
  addressSub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 5,
  },
  checkout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    padding: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutAmount: {
    fontSize: 19,
  },
  checkoutSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  checkoutButton: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background,
    padding: 24,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 21,
  },
  modalScroll: {
    paddingVertical: 24,
  },
  modalReadyTitle: {
    fontSize: 17,
    marginTop: 15,
  },
  modalDemoNotice: {
    lineHeight: 22,
    color: colors.muted,
    fontSize: 13,
    marginTop: 8,
  },
  modalGrandTotal: {
    fontSize: 20,
    color: colors.ink,
  },
  checkoutSection: {
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkoutSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  checkoutSectionTitle: {
    fontSize: 13,
  },
  addressPillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  addressOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minWidth: 110,
  },
  addressOptionSelected: {
    borderColor: colors.green,
    backgroundColor: colors.softGreen,
  },
  defaultAddressFallback: {
    fontSize: 12,
    color: colors.muted,
  },
  checkoutTimeframe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.softGreen,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  checkoutTimeframeText: {
    fontSize: 12,
    color: colors.darkGreen,
  },
  checkoutSummaryCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  checkoutSummaryTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  modalBillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBillLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  modalTotalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEEE9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F6B7A8',
  },
  orderErrorText: {
    fontSize: 12,
    color: colors.red,
    flex: 1,
  },
  modalFooterActions: {
    marginTop: 8,
  },
  modalPlaceButton: {
    width: '100%',
  },
});

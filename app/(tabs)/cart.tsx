import React, { useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
  ShoppingBasket,
} from 'lucide-react-native';
import { colors, fonts } from '../../constants/theme';
import { products, formatCurrency } from '../../constants/products';
import { useShop } from '../../store/useShop';
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
  const address = useShop((s) => s.address);
  const change = useShop((s) => s.change);
  const remove = useShop((s) => s.remove);

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  const itemTotal = cart.reduce((sum, item) => {
    const p = products.find((prod) => prod.id === item.productId);
    return sum + (p ? p.price : 0) * (item.large ? 2 : 1) * item.quantity;
  }, 0);

  const savingsTotal = cart.reduce((sum, item) => {
    const p = products.find((prod) => prod.id === item.productId);
    return sum + (p ? p.original - p.price : 0) * (item.large ? 2 : 1) * item.quantity;
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = itemTotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  const promoDiscount = promoApplied
    ? Math.min(MAX_PROMO_DISCOUNT, Math.round(PROMO_DISCOUNT_RATE * itemTotal))
    : 0;
  const grandTotal = itemTotal + deliveryFee - promoDiscount;

  const handleApplyPromo = () => {
    if (promoApplied) {
      setPromoApplied(false);
      haptics.success();
    } else if (promoCode.trim().toUpperCase() === PROMO_CODE_OFFER) {
      setPromoApplied(true);
      setPromoError(false);
      haptics.success();
    } else {
      setPromoError(true);
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
                const prod = products.find((p) => p.id === item.productId);
                if (!prod) return null;
                const itemPrice = prod.price * (item.large ? 2 : 1) * item.quantity;
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
                        Use FRESH20 to preview this offer.
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
                onPress={() => setCheckoutVisible(true)}
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
          onRequestClose={() => setCheckoutVisible(false)}
        >
          <View style={styles.backdrop}>
            <View style={styles.modal}>
              <View style={styles.modalHeading}>
                <Txt weight="bold" style={styles.modalTitle}>
                  Checkout preview
                </Txt>
                <Pressable
                  accessibilityLabel="Close checkout"
                  hitSlop={12}
                  onPress={() => setCheckoutVisible(false)}
                >
                  <X size={22} color={colors.ink} />
                </Pressable>
              </View>

              <ScrollView
                style={{ maxHeight: height * 0.45 }}
                contentContainerStyle={styles.modalScroll}
              >
                <ShoppingBasket
                  size={38}
                  color={colors.green}
                  strokeWidth={1.5}
                />
                <Txt weight="semibold" style={styles.modalReadyTitle}>
                  Your fresh picks are ready
                </Txt>
                <Txt style={styles.modalDemoNotice}>
                  This is a shopping UI demo. No payment is taken and no order is placed.
                </Txt>
                <View style={[styles.total, { marginTop: 24 }]}>
                  <Txt weight="medium">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </Txt>
                  <Txt weight="bold" style={styles.modalGrandTotal}>
                    {formatCurrency(grandTotal)}
                  </Txt>
                </View>
              </ScrollView>

              <ActionButton onPress={() => setCheckoutVisible(false)}>
                Back to basket
              </ActionButton>
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
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  PackageCheck,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
  Check,
  TicketPercent,
  ChevronDown,
  ChevronRight,
  Clock3,
  UserRound,
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  X,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react-native';
import { colors } from '../constants/theme';
import { products, formatCurrency } from '../constants/products';
import { useShop } from '../store/useShop';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import { addressService } from '../services/addressService';
import { profileService } from '../services/profileService';
import { Order, OrderStatus, Address } from '../types/order';
import { haptics } from '../utils/haptics';
import { Txt } from '../components/Txt';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import { ActionButton } from '../components/ActionButton';

const ADDRESS_LABEL_OPTIONS = ['Home', 'Work', 'Other'] as const;

const FAQS = [
  {
    q: 'How does FreshDash work?',
    a: 'Browse farm-fresh fruits, vegetables and greens. Add items to your basket and experience instant delivery in 10–15 minutes.',
  },
  {
    q: 'Will checking out place a real order?',
    a: 'Yes, checkout places an order with our verified farm-fresh inventory system and gives you live tracking.',
  },
  {
    q: 'Can I change my delivery address?',
    a: 'Yes, switch between your saved Home and Work addresses from the address selector on the Home screen or in this section.',
  },
];

export default function ProfileSectionScreen() {
  const { section = 'My orders' } = useLocalSearchParams<{ section?: string }>();
  const { width } = useWindowDimensions();

  const favourites = useShop((s) => s.favourites);
  const currentAddress = useShop((s) => s.address);
  const setShopAddress = useShop((s) => s.setAddress);
  const { user, isAuthenticated, isLoading: authLoading, updateProfile, refreshProfile } = useAuth();

  // Profile Edit State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.profile?.phone_number || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [refreshingProfile, setRefreshingProfile] = useState(false);

  // Settings State
  const [orderUpdates, setOrderUpdates] = useState(user?.profile?.order_updates ?? true);
  const [offersNotif, setOffersNotif] = useState(user?.profile?.offers_notifications ?? false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [refreshingAddresses, setRefreshingAddresses] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Add / Edit Address Modal State
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addrName, setAddrName] = useState<string>('Home');
  const [addrLine, setAddrLine] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressModalError, setAddressModalError] = useState<string | null>(null);

  const favProducts = products.filter((p) => favourites.includes(p.id));
  const cardWidth = (width - 52) / 2;

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshingOrders(true);
    } else {
      setLoadingOrders(true);
    }
    setOrdersError(null);

    try {
      const response = await orderService.getOrders({ page_size: 50 });
      setOrders(response.results);
    } catch (err: any) {
      setOrdersError(err?.message || 'Failed to load order history.');
    } finally {
      setLoadingOrders(false);
      setRefreshingOrders(false);
    }
  }, []);

  const fetchAddresses = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshingAddresses(true);
    } else {
      setLoadingAddresses(true);
    }

    try {
      const list = await addressService.getAddresses();
      setAddresses(list || []);
    } catch {
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
      setRefreshingAddresses(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (section === 'My orders' && isAuthenticated) {
      (async () => {
        try {
          const response = await orderService.getOrders({ page_size: 50 });
          if (active) {
            setOrders(response.results);
            setOrdersError(null);
          }
        } catch (err: any) {
          if (active) {
            setOrdersError(err?.message || 'Failed to load order history.');
          }
        } finally {
          if (active) {
            setLoadingOrders(false);
          }
        }
      })();
    } else if (section === 'Saved addresses' && isAuthenticated) {
      (async () => {
        try {
          const list = await addressService.getAddresses();
          if (active) {
            setAddresses(list || []);
          }
        } catch {
          if (active) {
            setAddresses([]);
          }
        } finally {
          if (active) {
            setLoadingAddresses(false);
          }
        }
      })();
    } else if (section === 'Profile details' && isAuthenticated) {
      (async () => {
        try {
          const fresh = await profileService.getProfile();
          if (active) {
            setFirstName(fresh.first_name || '');
            setLastName(fresh.last_name || '');
            setEmail(fresh.email || '');
            setPhoneNumber(fresh.profile?.phone_number || '');
            if (typeof fresh.profile?.order_updates === 'boolean') {
              setOrderUpdates(fresh.profile.order_updates);
            }
            if (typeof fresh.profile?.offers_notifications === 'boolean') {
              setOffersNotif(fresh.profile.offers_notifications);
            }
          }
        } catch {
          // Keep current values
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [section, isAuthenticated]);

  // Profile Save
  const handleSaveProfile = async () => {
    haptics.selection();
    setProfileError(null);
    setProfileMessage(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedFirst) {
      setProfileError('First name is required.');
      return;
    }

    if (!trimmedEmail) {
      setProfileError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    if (trimmedPhone && !/^\+?[0-9]{7,15}$/.test(trimmedPhone.replace(/[\s-]/g, ''))) {
      setProfileError('Please enter a valid phone number (e.g. 9876543210).');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateProfile({
        first_name: trimmedFirst,
        last_name: trimmedLast,
        email: trimmedEmail.toLowerCase(),
        phone_number: trimmedPhone,
      });
      setProfileMessage('Profile details updated successfully.');
      haptics.success();
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
      haptics.selection();
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRefreshProfile = async () => {
    setRefreshingProfile(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      await refreshProfile();
    } finally {
      setRefreshingProfile(false);
    }
  };

  // Settings Toggles
  const handleToggleOrderUpdates = async (val: boolean) => {
    setOrderUpdates(val);
    haptics.selection();
    if (isAuthenticated) {
      try {
        await updateProfile({ order_updates: val });
      } catch {
        // Rollback on failure
        setOrderUpdates(!val);
      }
    }
  };

  const handleToggleOffers = async (val: boolean) => {
    setOffersNotif(val);
    haptics.selection();
    if (isAuthenticated) {
      try {
        await updateProfile({ offers_notifications: val });
      } catch {
        setOffersNotif(!val);
      }
    }
  };

  // Address Actions
  const handleSelectAddress = async (item: Address) => {
    haptics.selection();
    setShopAddress(item.name);

    if (item.id > 0 && !item.is_default) {
      try {
        setSettingDefaultId(item.id);
        await addressService.setDefaultAddress(item.id);
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            is_default: a.id === item.id,
          }))
        );
      } catch {
        // Ignored
      } finally {
        setSettingDefaultId(null);
      }
    }
  };

  const handleOpenAddAddress = () => {
    haptics.selection();
    setEditingAddress(null);
    setAddrName('Home');
    setAddrLine('');
    setAddrArea('');
    setAddrIsDefault(addresses.length === 0);
    setAddressModalError(null);
    setAddressModalVisible(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    haptics.selection();
    setEditingAddress(addr);
    setAddrName(addr.name);
    setAddrLine(addr.line);
    setAddrArea(addr.area);
    setAddrIsDefault(Boolean(addr.is_default));
    setAddressModalError(null);
    setAddressModalVisible(true);
  };

  const handleDeleteAddress = (id: number) => {
    haptics.selection();
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this delivery address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(id);
              await addressService.deleteAddress(id);
              setAddresses((prev) => prev.filter((a) => a.id !== id));
              haptics.success();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not delete address.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleSaveAddressModal = async () => {
    haptics.selection();
    setAddressModalError(null);

    const name = addrName.trim();
    const line = addrLine.trim();
    const area = addrArea.trim();

    if (!name) {
      setAddressModalError('Please select or specify an address label.');
      return;
    }
    if (!line) {
      setAddressModalError('Please enter house/flat and street details.');
      return;
    }
    if (!area) {
      setAddressModalError('Please enter locality, city, and postal code.');
      return;
    }

    try {
      setSavingAddress(true);
      if (editingAddress) {
        const updated = await addressService.updateAddress(editingAddress.id, {
          name,
          line,
          area,
          is_default: addrIsDefault,
        });
        setAddresses((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : addrIsDefault ? { ...a, is_default: false } : a))
        );
        if (addrIsDefault) {
          setShopAddress(updated.name);
        }
      } else {
        const created = await addressService.createAddress({
          name,
          line,
          area,
          is_default: addrIsDefault,
        });
        setAddresses((prev) => (addrIsDefault ? [created, ...prev.map((a) => ({ ...a, is_default: false }))] : [created, ...prev]));
        if (addrIsDefault) {
          setShopAddress(created.name);
        }
      }

      setAddressModalVisible(false);
      haptics.success();
    } catch (err: any) {
      setAddressModalError(err?.message || 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const getOrderStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return {
          label: 'Order Placed',
          color: colors.green,
          icon: <Package size={20} color={colors.green} />,
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          color: colors.darkGreen,
          icon: <CheckCircle2 size={20} color={colors.darkGreen} />,
        };
      case 'out_for_delivery':
        return {
          label: 'Out for Delivery',
          color: colors.orange,
          icon: <Truck size={20} color={colors.orange} />,
        };
      case 'delivered':
        return {
          label: 'Delivered',
          color: colors.green,
          icon: <PackageCheck size={20} color={colors.green} />,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: colors.red,
          icon: <XCircle size={20} color={colors.red} />,
        };
      default:
        return {
          label: status,
          color: colors.muted,
          icon: <Clock3 size={20} color={colors.muted} />,
        };
    }
  };

  const formatOrderDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: section,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      {section === 'Favourite products' ? (
        <FlatList
          data={favProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.favColumnWrapper}
          contentContainerStyle={styles.favListContent}
          renderItem={({ item }) => (
            <View style={styles.favCardWrapper}>
              <ProductCard product={item} width={cardWidth} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="Save your fresh favourites"
              message="Tap the heart on a product to find it here."
              action="Explore produce"
              onPress={() => router.push('/categories')}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            (section === 'My orders' || section === 'Saved addresses' || section === 'Profile details') &&
            isAuthenticated ? (
              <RefreshControl
                refreshing={
                  section === 'My orders'
                    ? refreshingOrders
                    : section === 'Saved addresses'
                    ? refreshingAddresses
                    : refreshingProfile
                }
                onRefresh={() => {
                  if (section === 'My orders') void fetchOrders(true);
                  else if (section === 'Saved addresses') void fetchAddresses(true);
                  else if (section === 'Profile details') void handleRefreshProfile();
                }}
                tintColor={colors.green}
                colors={[colors.green]}
              />
            ) : undefined
          }
        >
          {(section === 'My orders' || section === 'Saved addresses' || section === 'Profile details') &&
          authLoading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.green} />
            </View>
          ) : (section === 'My orders' || section === 'Saved addresses' || section === 'Profile details') &&
            !isAuthenticated ? (
            <EmptyState
              title={`Sign in to view ${section.toLowerCase()}`}
              message="Log in or create a FreshDash account to securely access this information."
              action="Log in / Sign up"
              onPress={() => router.push('/(auth)/login')}
            />
          ) : null}

          {/* ========================================================= */}
          {/* PROFILE DETAILS SECTION                                   */}
          {/* ========================================================= */}
          {section === 'Profile details' && isAuthenticated && (
            <View>
              {/* Profile Card Summary Banner */}
              <View style={styles.profileHeaderCard}>
                <View style={styles.avatarCircle}>
                  <UserRound size={32} color={colors.darkGreen} />
                </View>
                <View style={styles.profileHeaderMeta}>
                  <Txt weight="bold" style={styles.profileHeaderName}>
                    {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}
                  </Txt>
                  <Txt style={styles.profileHeaderEmail}>{user?.email}</Txt>
                  <View style={styles.memberTag}>
                    <ShieldCheck size={12} color={colors.green} />
                    <Txt weight="medium" style={styles.memberTagText}>
                      FreshDash Member
                    </Txt>
                  </View>
                </View>
              </View>

              {/* Status Alerts */}
              {profileMessage ? (
                <View style={styles.successBanner}>
                  <CheckCircle size={18} color={colors.green} />
                  <Txt style={styles.successText}>{profileMessage}</Txt>
                </View>
              ) : null}

              {profileError ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={18} color={colors.red} />
                  <Txt style={styles.errorText}>{profileError}</Txt>
                </View>
              ) : null}

              {/* Edit Form */}
              <View style={styles.card}>
                <Txt weight="bold" style={styles.cardTitle}>
                  Personal Information
                </Txt>

                <View style={styles.fieldGroup}>
                  <Txt style={styles.fieldLabel}>First name</Txt>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter your first name"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Txt style={styles.fieldLabel}>Last name</Txt>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter your last name"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Txt style={styles.fieldLabel}>Email address</Txt>
                  <View style={styles.inputWithIcon}>
                    <Mail size={16} color={colors.muted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your.email@example.com"
                      placeholderTextColor={colors.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Txt style={styles.fieldLabel}>Phone number</Txt>
                  <View style={styles.inputWithIcon}>
                    <Phone size={16} color={colors.muted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="10-digit mobile number"
                      placeholderTextColor={colors.muted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Txt style={styles.metaLabel}>Username</Txt>
                  <Txt weight="medium" style={styles.metaValue}>
                    @{user?.username}
                  </Txt>
                </View>

                <ActionButton
                  style={styles.saveProfileButton}
                  onPress={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? <ActivityIndicator size="small" color={colors.white} /> : 'Save changes'}
                </ActionButton>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* MY ORDERS SECTION                                         */}
          {/* ========================================================= */}
          {section === 'My orders' && isAuthenticated && (
            <>
              {loadingOrders && !refreshingOrders ? (
                <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color={colors.green} />
                </View>
              ) : ordersError ? (
                <View style={[styles.card, { alignItems: 'center', padding: 24 }]}>
                  <Txt style={{ color: colors.red, textAlign: 'center', marginBottom: 12 }}>
                    {ordersError}
                  </Txt>
                  <ActionButton secondary onPress={() => void fetchOrders(false)}>
                    Try again
                  </ActionButton>
                </View>
              ) : orders.length === 0 ? (
                <EmptyState
                  title="No orders yet"
                  message="Your placed orders and delivery status will appear here once you checkout."
                  action="Explore produce"
                  onPress={() => router.push('/categories')}
                />
              ) : (
                <>
                  <View style={styles.note}>
                    <Txt style={styles.noteText}>Recent order history ({orders.length})</Txt>
                  </View>
                  {orders.map((item) => {
                    const statusConfig = getOrderStatusConfig(item.status);
                    const formattedDate = formatOrderDate(item.created_at);
                    const itemsSummary =
                      item.items && item.items.length > 0
                        ? item.items
                            .map((i) =>
                              i.quantity > 1 ? `${i.product_name} ×${i.quantity}` : i.product_name
                            )
                            .join(', ')
                        : 'Produce items';

                    return (
                      <Pressable
                        key={item.id}
                        style={styles.card}
                        onPress={() => {
                          haptics.selection();
                          router.push({
                            pathname: '/order/[orderNumber]' as any,
                            params: { orderNumber: item.order_number },
                          });
                        }}
                      >
                        <View style={styles.row}>
                          {statusConfig.icon}
                          <Txt weight="semibold" style={[styles.flex1, { color: statusConfig.color }]}>
                            {statusConfig.label}
                          </Txt>
                          <Txt weight="bold">{formatCurrency(item.grand_total)}</Txt>
                        </View>

                        <Txt style={styles.orderDate}>
                          {formattedDate} · {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
                        </Txt>

                        <View style={styles.divider} />

                        <Txt style={styles.orderItems} numberOfLines={2}>
                          {itemsSummary}
                        </Txt>

                        <View style={[styles.row, { marginTop: 12, justifyContent: 'space-between' }]}>
                          <Txt style={styles.orderNumber}>Order #{item.order_number}</Txt>
                          <View style={styles.viewDetailsRow}>
                            <Txt weight="medium" style={styles.viewDetailsText}>
                              View details
                            </Txt>
                            <ChevronRight size={16} color={colors.green} />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* SAVED ADDRESSES SECTION (FULL CRUD)                       */}
          {/* ========================================================= */}
          {section === 'Saved addresses' && isAuthenticated && (
            <>
              <View style={styles.addressHeaderRow}>
                <Txt style={styles.subNote}>Delivery destinations</Txt>
                <Pressable style={styles.addAddressPill} onPress={handleOpenAddAddress}>
                  <Plus size={15} color={colors.green} />
                  <Txt weight="semibold" style={styles.addAddressPillText}>
                    Add address
                  </Txt>
                </Pressable>
              </View>

              {loadingAddresses && !refreshingAddresses ? (
                <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color={colors.green} />
                </View>
              ) : addresses.length === 0 ? (
                <EmptyState
                  title="No saved addresses"
                  message="Add your delivery address for instant 10–15 minute checkout."
                  action="Add delivery address"
                  onPress={handleOpenAddAddress}
                />
              ) : (
                <>
                  {addresses.map((item) => {
                    const isSelected =
                      currentAddress === item.name || (item.is_default && !currentAddress);
                    return (
                      <View
                        key={item.id}
                        style={[styles.card, isSelected && styles.selectedAddressCard]}
                      >
                        {/* Header: Name + Default Badge */}
                        <Pressable
                          style={styles.addressCardTop}
                          onPress={() => void handleSelectAddress(item)}
                        >
                          <View style={styles.row}>
                            <MapPin size={20} color={colors.green} />
                            <Txt weight="bold" style={styles.flex1}>
                              {item.name}
                            </Txt>
                            {item.is_default && (
                              <View style={styles.defaultBadge}>
                                <Txt weight="semibold" style={styles.defaultBadgeText}>
                                  Default
                                </Txt>
                              </View>
                            )}
                            {isSelected && <Check size={19} color={colors.green} />}
                            {settingDefaultId === item.id && (
                              <ActivityIndicator size="small" color={colors.green} />
                            )}
                          </View>
                          <Txt style={styles.addressLine}>{item.line}</Txt>
                          <Txt style={styles.addressArea}>{item.area}</Txt>
                        </Pressable>

                        <View style={styles.addressCardDivider} />

                        {/* Actions: Set Default, Edit, Delete */}
                        <View style={styles.addressCardActions}>
                          {!item.is_default && (
                            <Pressable
                              style={styles.addressActionBtn}
                              onPress={() => void handleSelectAddress(item)}
                            >
                              <Txt weight="semibold" style={styles.addressActionText}>
                                Set as default
                              </Txt>
                            </Pressable>
                          )}

                          <View style={styles.actionRightButtons}>
                            <Pressable
                              style={styles.iconActionBtn}
                              onPress={() => handleOpenEditAddress(item)}
                            >
                              <Pencil size={15} color={colors.darkGreen} />
                              <Txt weight="medium" style={styles.iconActionText}>
                                Edit
                              </Txt>
                            </Pressable>

                            <Pressable
                              style={styles.iconActionBtn}
                              onPress={() => handleDeleteAddress(item.id)}
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? (
                                <ActivityIndicator size="small" color={colors.red} />
                              ) : (
                                <>
                                  <Trash2 size={15} color={colors.red} />
                                  <Txt weight="medium" style={[styles.iconActionText, { color: colors.red }]}>
                                    Delete
                                  </Txt>
                                </>
                              )}
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* OFFERS AND COUPONS                                        */}
          {/* ========================================================= */}
          {section === 'Offers and coupons' && (
            <View style={[styles.card, styles.offersCard]}>
              <TicketPercent
                size={32}
                color={colors.darkGreen}
                strokeWidth={1.5}
              />
              <Txt weight="bold" style={styles.offerTitle}>
                A fresh little saving.
              </Txt>
              <Txt style={styles.offerSubtitle}>
                Get 20% off your basket, up to ₹50.
              </Txt>
              <View style={styles.couponBox}>
                <Txt weight="bold" style={styles.couponCode}>
                  FRESH20
                </Txt>
                <Pressable
                  onPress={() => {
                    setCodeCopied(true);
                    haptics.success();
                  }}
                >
                  <Txt weight="semibold" style={styles.couponAction}>
                    {codeCopied ? 'Ready to use' : 'Use code'}
                  </Txt>
                </Pressable>
              </View>
              <ActionButton onPress={() => router.push('/cart')}>
                Open basket
              </ActionButton>
            </View>
          )}

          {/* ========================================================= */}
          {/* HELP AND SUPPORT                                          */}
          {/* ========================================================= */}
          {section === 'Help and support' && (
            <>
              <Txt weight="bold" style={styles.faqTitle}>
                Frequently Asked Questions
              </Txt>
              {FAQS.map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <Pressable
                    key={faq.q}
                    style={styles.faq}
                    onPress={() => {
                      setExpandedFaq(isExpanded ? null : index);
                      haptics.selection();
                    }}
                  >
                    <View style={styles.row}>
                      <Txt weight="semibold" style={styles.faqQ}>
                        {faq.q}
                      </Txt>
                      <ChevronDown
                        size={18}
                        color={colors.muted}
                        style={{
                          transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                        }}
                      />
                    </View>
                    {isExpanded && <Txt style={styles.faqA}>{faq.a}</Txt>}
                  </Pressable>
                );
              })}
            </>
          )}

          {/* ========================================================= */}
          {/* SETTINGS SECTION (CONNECTED TO USERPROFILE BACKEND)       */}
          {/* ========================================================= */}
          {section === 'Settings' && (
            <View style={styles.card}>
              <View style={styles.setting}>
                <Txt weight="medium" style={styles.flex1}>
                  Order updates
                </Txt>
                <Switch
                  accessibilityLabel="Order updates"
                  value={orderUpdates}
                  onValueChange={handleToggleOrderUpdates}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.white}
                />
              </View>

              <View style={styles.setting}>
                <Txt weight="medium" style={styles.flex1}>
                  Offers and fresh finds
                </Txt>
                <Switch
                  accessibilityLabel="Offers and fresh finds"
                  value={offersNotif}
                  onValueChange={handleToggleOffers}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.white}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Txt style={styles.flex1}>Language</Txt>
                <Txt style={styles.settingMuted}>English</Txt>
              </View>

              <View style={[styles.row, { marginTop: 22 }]}>
                <Txt style={styles.flex1}>App version</Txt>
                <Txt style={styles.settingMuted}>1.0.0</Txt>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT ADDRESS MODAL                                  */}
      {/* ========================================================= */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Txt weight="bold" style={styles.modalTitle}>
                {editingAddress ? 'Edit address' : 'Add delivery address'}
              </Txt>
              <Pressable
                onPress={() => setAddressModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color={colors.ink} />
              </Pressable>
            </View>

            {addressModalError ? (
              <View style={styles.modalErrorBanner}>
                <AlertCircle size={16} color={colors.red} />
                <Txt style={styles.modalErrorText}>{addressModalError}</Txt>
              </View>
            ) : null}

            {/* Address Type Chips */}
            <Txt style={styles.modalLabel}>Address label</Txt>
            <View style={styles.chipsRow}>
              {ADDRESS_LABEL_OPTIONS.map((opt) => {
                const selected = addrName === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      setAddrName(opt);
                      haptics.selection();
                    }}
                    style={[styles.chip, selected && styles.selectedChip]}
                  >
                    <Txt
                      weight={selected ? 'bold' : 'medium'}
                      style={[styles.chipText, selected && styles.selectedChipText]}
                    >
                      {opt}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>

            {/* Address Line Input */}
            <Txt style={styles.modalLabel}>House / Flat / Street line</Txt>
            <TextInput
              style={styles.modalInput}
              value={addrLine}
              onChangeText={setAddrLine}
              placeholder="e.g. 24, 18th Main Road, Sector 2"
              placeholderTextColor={colors.muted}
            />

            {/* Area / City Input */}
            <Txt style={styles.modalLabel}>Locality / Area / City / PIN</Txt>
            <TextInput
              style={styles.modalInput}
              value={addrArea}
              onChangeText={setAddrArea}
              placeholder="e.g. HSR Layout, Bengaluru · 560102"
              placeholderTextColor={colors.muted}
            />

            {/* Default Switch */}
            <View style={styles.modalSwitchRow}>
              <Txt weight="medium" style={styles.flex1}>
                Set as default delivery address
              </Txt>
              <Switch
                value={addrIsDefault}
                onValueChange={(val) => {
                  setAddrIsDefault(val);
                  haptics.selection();
                }}
                trackColor={{ false: colors.border, true: colors.green }}
                thumbColor={colors.white}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <ActionButton
                secondary
                style={styles.modalCancelBtn}
                onPress={() => setAddressModalVisible(false)}
              >
                Cancel
              </ActionButton>
              <ActionButton
                style={styles.modalSaveBtn}
                onPress={handleSaveAddressModal}
                disabled={savingAddress}
              >
                {savingAddress ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : editingAddress ? (
                  'Update'
                ) : (
                  'Save address'
                )}
              </ActionButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  card: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 17,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 18,
  },
  selectedAddressCard: {
    borderColor: colors.green,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  note: {
    marginBottom: 17,
  },
  noteText: {
    fontSize: 12,
    color: colors.muted,
  },
  subNote: {
    fontSize: 12,
    color: colors.muted,
  },
  orderDate: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 14,
  },
  orderItems: {
    fontSize: 13,
    lineHeight: 22,
  },
  orderNumber: {
    fontSize: 11,
    color: colors.muted,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    color: colors.green,
  },
  addressLine: {
    fontSize: 13,
    marginTop: 10,
  },
  addressArea: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addAddressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.softGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addAddressPillText: {
    color: colors.green,
    fontSize: 12,
  },
  addressCardTop: {
    // Pressable card content
  },
  defaultBadge: {
    backgroundColor: colors.softGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    color: colors.green,
    fontSize: 11,
  },
  addressCardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  addressCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressActionBtn: {
    paddingVertical: 4,
  },
  addressActionText: {
    color: colors.green,
    fontSize: 12,
  },
  actionRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginLeft: 'auto',
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  iconActionText: {
    fontSize: 12,
    color: colors.darkGreen,
  },
  // Profile Header Card
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.white,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.paleYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderMeta: {
    flex: 1,
  },
  profileHeaderName: {
    fontSize: 18,
  },
  profileHeaderEmail: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.softGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  memberTagText: {
    color: colors.green,
    fontSize: 10,
  },
  // Banners
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.softGreen,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7E8D2',
  },
  successText: {
    color: colors.darkGreen,
    fontSize: 13,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEEE9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F6B7A8',
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    flex: 1,
  },
  // Form Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  inputIcon: {
    marginLeft: 14,
  },
  inputFlex: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  metaValue: {
    fontSize: 12,
    color: colors.ink,
  },
  saveProfileButton: {
    marginTop: 4,
  },
  // Offers Card
  offersCard: {
    backgroundColor: colors.paleYellow,
  },
  offerTitle: {
    fontSize: 24,
    marginTop: 19,
  },
  offerSubtitle: {
    color: colors.darkGreen,
    lineHeight: 21,
    fontSize: 13,
    marginTop: 10,
  },
  couponBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 17,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderStyle: 'dashed',
    borderRadius: 10,
    marginVertical: 23,
  },
  couponCode: {
    color: colors.darkGreen,
    fontSize: 19,
  },
  couponAction: {
    color: colors.green,
    fontSize: 12,
  },
  faqTitle: {
    fontSize: 22,
    marginBottom: 24,
  },
  faq: {
    backgroundColor: colors.white,
    padding: 19,
    borderRadius: 13,
    marginBottom: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  faqA: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 22,
    marginTop: 14,
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  settingMuted: {
    color: colors.muted,
  },
  favColumnWrapper: {
    gap: 12,
  },
  favListContent: {
    padding: 20,
  },
  favCardWrapper: {
    marginBottom: 12,
  },
  // Address Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
  },
  modalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEEE9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  modalErrorText: {
    color: colors.red,
    fontSize: 12,
    flex: 1,
  },
  modalLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selectedChip: {
    borderColor: colors.green,
    backgroundColor: colors.softGreen,
  },
  chipText: {
    fontSize: 13,
    color: colors.ink,
  },
  selectedChipText: {
    color: colors.green,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 16,
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 18,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
  },
  modalSaveBtn: {
    flex: 2,
  },
});

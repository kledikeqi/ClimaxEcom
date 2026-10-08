import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../AuthContext';
import { ApiError, createCheckout, createOrder, demoPay, fetchPaymentConfig } from '../api';
import { useToast } from '../ToastContext';
import { colors, radius } from '../theme';
import { CartItem, OrderPayload, PaymentConfig } from '../types';
import { cartTotal, formatCardNumber, formatExpiry, validateCard } from '../utils/checkout';
import { formatLek, parsePrice } from '../utils/format';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  onCartChange: (items: CartItem[]) => void;
  onAuthRequired: () => void;
}

export default function CartModal({
  visible,
  onClose,
  cart,
  onCartChange,
  onAuthRequired,
}: CartModalProps) {
  const showToast = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [card, setCard] = useState({ number: '', exp: '', cvc: '' });

  useEffect(() => {
    if (!visible) setStep(1);
  }, [visible]);

  useEffect(() => {
    if (step !== 3 || paymentConfig) return;
    fetchPaymentConfig()
      .then(setPaymentConfig)
      .catch(() => setPaymentConfig({ mode: 'demo', currency: 'all' }));
  }, [step, paymentConfig]);

  const total = cartTotal(cart);

  const updateField = (key: 'name' | 'address' | 'phone') => (value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const buildPayload = (): OrderPayload => ({
    customer_name: form.name.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    total_price: total,
    items: cart.map((item) => ({
      product_id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      unit_price: parsePrice(item.price),
      size: item.selectedSize,
      qty: item.qty || 1,
    })),
  });

  const finish = (message: string) => {
    showToast(message);
    onCartChange([]);
    setForm({ name: '', address: '', phone: '' });
    setCard({ number: '', exp: '', cvc: '' });
    setPaymentConfig(null);
    setStep(1);
    onClose();
  };

  const handleFailure = (error: unknown, fallback: string) => {
    showToast(error instanceof ApiError ? error.message : fallback, 'error');
  };

  const continueToPayment = () => {
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    if (!user) {
      showToast('Log in to continue to payment.', 'error');
      onAuthRequired();
      return;
    }
    setStep(3);
  };

  const payWithCard = async () => {
    const cardError = validateCard(card);
    if (cardError) {
      showToast(cardError, 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await demoPay({ ...buildPayload(), card });
      finish(`Order #${result.order_id} paid. Thank you!`);
    } catch (error) {
      handleFailure(error, 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const payWithStripe = async () => {
    setSubmitting(true);
    try {
      const result = await createCheckout(buildPayload());
      if (result.mode === 'stripe' && result.url) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.assign(result.url);
        } else {
          await Linking.openURL(result.url);
        }
        return;
      }
      // Key removed between config load and checkout — fall back to COD path.
      const order = await createOrder(buildPayload());
      finish(`Order #${order.order_id} confirmed. Thank you!`);
    } catch (error) {
      handleFailure(error, 'Could not start checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  const payWithCash = async () => {
    setSubmitting(true);
    try {
      const result = await createOrder(buildPayload());
      finish(`Order #${result.order_id} confirmed. Pay on delivery.`);
    } catch (error) {
      handleFailure(error, 'Could not place the order.');
    } finally {
      setSubmitting(false);
    }
  };

  const stripeMode = paymentConfig?.mode === 'stripe';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 1 ? 'YOUR CART' : step === 2 ? 'CHECKOUT' : 'PAYMENT'}
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close cart">
              <Ionicons name="close" size={30} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.steps}>
            {['CART', 'DETAILS', 'PAYMENT'].map((label, index) => (
              <Text
                key={label}
                style={[styles.stepLabel, step === index + 1 && styles.stepLabelActive]}
              >
                {index + 1}. {label}
              </Text>
            ))}
          </View>

          {step === 1 && (
            <>
              <ScrollView style={styles.body}>
                {cart.length === 0 ? (
                  <Text style={styles.empty}>Your cart is empty.</Text>
                ) : (
                  cart.map((item, index) => (
                    <View key={`${item.id}-${index}`} style={styles.cartItem}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemMeta}>
                          Size {item.selectedSize} · Qty {item.qty || 1}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>{item.price}</Text>
                    </View>
                  ))
                )}
              </ScrollView>

              {cart.length > 0 && (
                <View style={styles.footer}>
                  <Text style={styles.total}>Total: {formatLek(total)}</Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
                    <Text style={styles.primaryButtonText}>PROCEED TO ORDER</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {step === 2 && (
            <ScrollView style={styles.body}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Kledi Keqi"
                placeholderTextColor="#555"
                value={form.name}
                onChangeText={updateField('name')}
              />
              <Text style={styles.label}>ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="Tirana, Albania"
                placeholderTextColor="#555"
                value={form.address}
                onChangeText={updateField('address')}
              />
              <Text style={styles.label}>PHONE</Text>
              <TextInput
                style={styles.input}
                placeholder="+355 69..."
                placeholderTextColor="#555"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={updateField('phone')}
              />
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>ORDER TOTAL</Text>
                <Text style={styles.total}>{formatLek(total)}</Text>
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={continueToPayment}>
                <Text style={styles.primaryButtonText}>CONTINUE TO PAYMENT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backText}>Back to cart</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {step === 3 && (
            <ScrollView style={styles.body}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>AMOUNT DUE</Text>
                <Text style={styles.total}>{formatLek(total)}</Text>
                <Text style={styles.summaryMeta}>
                  Shipping to {form.name || '—'}, {form.address || '—'}
                </Text>
              </View>

              {!stripeMode && (
                <>
                  <Text style={styles.label}>CARD NUMBER</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="4242 4242 4242 4242"
                    placeholderTextColor="#555"
                    keyboardType="number-pad"
                    value={card.number}
                    onChangeText={(value) =>
                      setCard((previous) => ({ ...previous, number: formatCardNumber(value) }))
                    }
                  />
                  <View style={styles.cardRow}>
                    <View style={styles.cardHalf}>
                      <Text style={styles.label}>EXPIRY</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        placeholderTextColor="#555"
                        keyboardType="number-pad"
                        value={card.exp}
                        onChangeText={(value) =>
                          setCard((previous) => ({ ...previous, exp: formatExpiry(value) }))
                        }
                      />
                    </View>
                    <View style={styles.cardHalf}>
                      <Text style={styles.label}>CVC</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        placeholderTextColor="#555"
                        keyboardType="number-pad"
                        secureTextEntry
                        value={card.cvc}
                        onChangeText={(value) =>
                          setCard((previous) => ({
                            ...previous,
                            cvc: value.replace(/[^0-9]/g, '').slice(0, 4),
                          }))
                        }
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryButton, submitting && styles.buttonDisabled]}
                    onPress={payWithCard}
                    disabled={submitting}
                  >
                    <Text style={styles.primaryButtonText}>
                      {submitting ? 'PROCESSING...' : `PAY ${formatLek(total)}`}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.demoNote}>
                    Demo payment mode — no real charge. Set STRIPE_SECRET_KEY on the API to enable
                    live Stripe checkout.
                  </Text>
                </>
              )}

              {stripeMode && (
                <>
                  <TouchableOpacity
                    style={[styles.primaryButton, submitting && styles.buttonDisabled]}
                    onPress={payWithStripe}
                    disabled={submitting}
                  >
                    <Text style={styles.primaryButtonText}>
                      {submitting ? 'STARTING CHECKOUT...' : `PAY ${formatLek(total)} WITH CARD`}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.demoNote}>
                    Secured by Stripe — you will be redirected to Stripe's hosted checkout page.
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={[styles.secondaryButton, submitting && styles.buttonDisabled]}
                onPress={payWithCash}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>CASH ON DELIVERY</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                <Text style={styles.backText}>Back to details</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  safeArea: { flex: 1 },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: colors.borderStrong,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  steps: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  stepLabel: { color: colors.textMuted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  stepLabelActive: { color: colors.primary },
  body: { padding: 20 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 50 },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#222',
    borderRadius: radius.md,
    marginBottom: 10,
  },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { color: colors.text, fontWeight: 'bold' },
  itemMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  itemPrice: { color: colors.primary, fontWeight: 'bold' },
  footer: { padding: 20, borderTopWidth: 1, borderColor: colors.borderStrong },
  total: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: colors.text, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  secondaryButtonText: { color: colors.textSoft, fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  demoNote: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
  label: {
    color: colors.textMuted,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    fontSize: 12,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#222',
    color: colors.text,
    padding: 15,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    fontSize: 16,
  },
  cardRow: { flexDirection: 'row', gap: 12 },
  cardHalf: { flex: 1 },
  summaryBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  summaryMeta: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  backButton: { marginTop: 20, alignSelf: 'center', marginBottom: 40 },
  backText: { color: colors.textMuted },
});

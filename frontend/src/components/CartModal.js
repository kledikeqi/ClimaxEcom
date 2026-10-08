import React, { useEffect, useState } from 'react';
import {
  Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createOrder } from '../api';
import { colors, radius } from '../theme';
import { formatLek, parsePrice } from '../utils/format';
import { useToast } from '../ToastContext';

export default function CartModal({ visible, onClose, cart, onCartChange }) {
  const showToast = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) setStep(1);
  }, [visible]);

  const total = cart.reduce((sum, item) => sum + parsePrice(item.price) * (item.qty || 1), 0);

  const updateField = (key) => (value) => setForm((previous) => ({ ...previous, [key]: value }));

  const submitOrder = async () => {
    if (!form.name || !form.address || !form.phone) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createOrder({
        customer_name: form.name,
        address: form.address,
        phone: form.phone,
        total_price: total,
        items: cart,
      });
      showToast(`Order #${result.order_id} confirmed. Thank you!`);
      onCartChange([]);
      setForm({ name: '', address: '', phone: '' });
      setStep(1);
      onClose();
    } catch (error) {
      showToast('Server connection failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>{step === 1 ? 'YOUR CART' : 'CHECKOUT'}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close cart">
              <Ionicons name="close" size={30} color={colors.text} />
            </TouchableOpacity>
          </View>

          {step === 1 ? (
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
          ) : (
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
              <TouchableOpacity
                style={[styles.primaryButton, submitting && styles.buttonDisabled]}
                onPress={submitOrder}
                disabled={submitting}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting ? 'PLACING ORDER...' : 'CONFIRM ORDER'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backText}>Back to cart</Text>
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
  summaryBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  backButton: { marginTop: 20, alignSelf: 'center', marginBottom: 40 },
  backText: { color: colors.textMuted },
});

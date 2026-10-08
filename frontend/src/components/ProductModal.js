import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { useToast } from '../ToastContext';

export default function ProductModal({ product, onClose, onAddToCart }) {
  const showToast = useToast();
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    setSelectedSize(null);
  }, [product]);

  const addToCart = () => {
    if (!selectedSize) {
      showToast('Please select a size first.', 'error');
      return;
    }
    onAddToCart(product, selectedSize);
  };

  return (
    <Modal visible={product !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {product && (
            <>
              <TouchableOpacity style={styles.close} onPress={onClose} accessibilityLabel="Close">
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>

              <LinearGradient colors={product.colors || ['#333', '#444']} style={styles.image} />

              <ScrollView style={styles.content}>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.price}>{product.price}</Text>
                <Text style={styles.description}>{product.description}</Text>

                <View style={styles.stockRow}>
                  <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.stockText}>
                    {product.stock} in stock · {product.category}
                  </Text>
                </View>

                <Text style={styles.section}>SELECT SIZE</Text>
                <View style={styles.sizeRow}>
                  {product.sizes.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[styles.sizeButton, selectedSize === size && styles.sizeButtonActive]}
                      onPress={() => setSelectedSize(size)}
                    >
                      <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextActive]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.addButton} onPress={addToCart}>
                  <Text style={styles.addButtonText}>ADD TO CART</Text>
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modal: {
    height: '78%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  close: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    padding: 6,
  },
  image: { width: '100%', height: 230 },
  content: { padding: 24 },
  name: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  price: { color: colors.primary, fontSize: 20, fontWeight: 'bold', marginTop: 6 },
  description: { color: '#ccc', marginTop: 14, lineHeight: 21 },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  stockText: { color: colors.textMuted, fontSize: 12, marginLeft: 6 },
  section: {
    color: colors.textMuted,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 1,
    fontSize: 12,
  },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sizeButton: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeText: { color: colors.textMuted, fontWeight: 'bold' },
  sizeTextActive: { color: colors.text },
  addButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 32,
  },
  addButtonText: { color: colors.text, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});

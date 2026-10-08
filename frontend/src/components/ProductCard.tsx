import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, toGradient } from '../theme';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  wishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onOpen: () => void;
}

export default function ProductCard({
  product,
  wishlisted,
  onToggleWishlist,
  onOpen,
}: ProductCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onOpen} activeOpacity={0.9}>
      <LinearGradient colors={[colors.cardTop, colors.cardBottom]} style={styles.card}>
        {product.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.heart} onPress={() => onToggleWishlist(product)}>
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={22}
            color={wishlisted ? colors.primary : colors.text}
          />
        </TouchableOpacity>

        <LinearGradient colors={toGradient(product.colors)} style={styles.image} />

        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price}</Text>
            <Text style={[styles.stock, product.stock <= 5 && styles.stockLow]}>
              {product.stock <= 5 ? `ONLY ${product.stock}` : `${product.stock} in stock`}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, margin: 6 },
  card: {
    borderRadius: radius.lg,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: 'bold' },
  heart: { position: 'absolute', top: 8, right: 8, zIndex: 20, padding: 4 },
  image: { width: '100%', height: 150, borderRadius: radius.md, marginBottom: 10 },
  meta: { width: '100%', paddingHorizontal: 5, paddingBottom: 4 },
  name: { color: colors.text, fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: colors.primary, fontSize: 13, fontWeight: 'bold' },
  stock: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  stockLow: { color: colors.warning },
});

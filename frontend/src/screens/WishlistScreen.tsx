import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import ProductCard from '../components/ProductCard';
import { colors } from '../theme';
import { Product } from '../types';

interface WishlistScreenProps {
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
  onOpenProduct: (product: Product) => void;
}

export default function WishlistScreen({
  wishlist,
  onToggleWishlist,
  onOpenProduct,
}: WishlistScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MY WISHLIST ({wishlist.length})</Text>
      {wishlist.length === 0 ? (
        <Text style={styles.empty}>No items saved yet. Tap the heart on any product.</Text>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              wishlisted
              onToggleWishlist={onToggleWishlist}
              onOpen={() => onOpenProduct(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 10 },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 50, paddingHorizontal: 30 },
  content: { paddingBottom: 100 },
});

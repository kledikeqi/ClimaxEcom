import React, { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProductCard from '../components/ProductCard';
import { ErrorView, LoadingView } from '../components/StateViews';
import { colors } from '../theme';

export default function ShopScreen({
  status,
  products,
  category,
  onCategoryChange,
  wishlist,
  onToggleWishlist,
  onOpenProduct,
  onRetry,
}) {
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.category)))],
    [products]
  );

  const visible = useMemo(
    () => (category === 'All' ? products : products.filter((product) => product.category === category)),
    [products, category]
  );

  if (status === 'loading') return <LoadingView label="Loading the collection..." />;
  if (status === 'error') {
    return (
      <ErrorView
        message="Could not reach the Climax API. Make sure the backend is running on port 8000."
        onRetry={onRetry}
      />
    );
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View>
          <LinearGradient colors={[colors.bgTint, colors.bg]} style={styles.hero}>
            <Text style={styles.heroTitle}>
              REDEFINE <Text style={{ color: colors.primary }}>DARKNESS</Text>
            </Text>
            <Text style={styles.heroSubtitle}>Premium Gothic & Streetwear from Tirana.</Text>
            <View style={styles.heroStats}>
              <Text style={styles.heroStat}>{products.length} PRODUCTS</Text>
              <Text style={styles.heroStat}>· {categories.length - 1} CATEGORIES</Text>
            </View>
          </LinearGradient>

          <View style={styles.categoriesWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
            >
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.category, category === item && styles.categoryActive]}
                  onPress={() => onCategoryChange(item)}
                >
                  <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No products in this category yet.</Text>}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          wishlisted={Boolean(wishlist.find((entry) => entry.id === item.id))}
          onToggleWishlist={onToggleWishlist}
          onOpen={() => onOpenProduct(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 10, paddingBottom: 100 },
  hero: { padding: 25, borderBottomWidth: 1, borderColor: colors.border },
  heroTitle: { color: colors.text, fontSize: 30, fontWeight: '900', fontStyle: 'italic' },
  heroSubtitle: { color: colors.textSoft, marginTop: 6 },
  heroStats: { flexDirection: 'row', marginTop: 14 },
  heroStat: { color: colors.textMuted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginRight: 6 },
  categoriesWrap: { backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 12 },
  categories: { paddingHorizontal: 12 },
  category: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  categoryActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.textMuted, fontWeight: 'bold' },
  categoryTextActive: { color: colors.text },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 60 },
});

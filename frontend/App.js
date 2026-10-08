import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchProducts } from './src/api';
import CartModal from './src/components/CartModal';
import Header from './src/components/Header';
import MenuSidebar from './src/components/MenuSidebar';
import ProductModal from './src/components/ProductModal';
import ContactScreen from './src/screens/ContactScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ShopScreen from './src/screens/ShopScreen';
import TeamScreen from './src/screens/TeamScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import ToastProvider, { useToast } from './src/ToastContext';
import { colors } from './src/theme';

function ClimaxApp() {
  const showToast = useToast();

  const [products, setProducts] = useState({ status: 'loading', data: [] });
  const [category, setCategory] = useState('All');
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);

  const [view, setView] = useState('shop');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadProducts = useCallback(async () => {
    setProducts((previous) => ({ ...previous, status: 'loading' }));
    try {
      const data = await fetchProducts();
      setProducts({ status: 'ready', data });
    } catch (error) {
      setProducts({ status: 'error', data: [] });
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const navigateTo = (nextView) => {
    setView(nextView);
    setMenuOpen(false);
  };

  const toggleWishlist = (product) => {
    setWishlist((previous) => {
      const exists = previous.find((entry) => entry.id === product.id);
      return exists
        ? previous.filter((entry) => entry.id !== product.id)
        : [...previous, product];
    });
    showToast(
      wishlist.find((entry) => entry.id === product.id) ? 'Removed from wishlist.' : 'Saved to wishlist.'
    );
  };

  const addToCart = (product, size) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.id === product.id && item.selectedSize === size);
      if (existing) {
        return previous.map((item) =>
          item === existing ? { ...item, qty: (item.qty || 1) + 1 } : item
        );
      }
      return [...previous, { ...product, selectedSize: size, qty: 1 }];
    });
    setSelectedProduct(null);
    showToast(`${product.name} added to cart.`);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[colors.bg, colors.bgTint]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        <Header
          cartCount={cart.reduce((sum, item) => sum + (item.qty || 1), 0)}
          onMenuPress={() => setMenuOpen(true)}
          onCartPress={() => setCartOpen(true)}
        />

        <View style={styles.content}>
          {view === 'shop' && (
            <ShopScreen
              status={products.status}
              products={products.data}
              category={category}
              onCategoryChange={setCategory}
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              onOpenProduct={(product) => setSelectedProduct(product)}
              onRetry={loadProducts}
            />
          )}
          {view === 'wishlist' && (
            <WishlistScreen
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              onOpenProduct={(product) => setSelectedProduct(product)}
            />
          )}
          {view === 'dashboard' && <DashboardScreen />}
          {view === 'creators' && <TeamScreen />}
          {view === 'contact' && <ContactScreen />}
        </View>
      </SafeAreaView>

      <MenuSidebar
        visible={menuOpen}
        currentView={view}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigateTo}
        onCart={() => {
          setMenuOpen(false);
          setCartOpen(true);
        }}
      />

      <CartModal
        visible={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onCartChange={setCart}
      />

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </View>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ClimaxApp />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  content: { flex: 1 },
});

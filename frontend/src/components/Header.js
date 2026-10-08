import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function Header({ cartCount = 0, onMenuPress, onCartPress }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onMenuPress} style={styles.iconButton} accessibilityLabel="Open menu">
        <Ionicons name="menu" size={30} color={colors.text} />
      </TouchableOpacity>

      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />

      <TouchableOpacity style={styles.cartButton} onPress={onCartPress} accessibilityLabel="Open cart">
        <Ionicons name="cart" size={28} color={colors.text} />
        {cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: { padding: 5 },
  logo: { width: 120, height: 40 },
  cartButton: { position: 'relative', padding: 5 },
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: 'bold' },
});

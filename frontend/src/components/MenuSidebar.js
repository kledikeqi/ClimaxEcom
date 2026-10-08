import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const MENU_ITEMS = [
  { view: 'shop', icon: 'shirt-outline', label: 'SHOP COLLECTION' },
  { view: 'wishlist', icon: 'heart-outline', label: 'MY WISHLIST' },
  { view: 'dashboard', icon: 'stats-chart-outline', label: 'ANALYTICS' },
  { view: 'creators', icon: 'people-outline', label: 'CREATORS' },
  { view: 'contact', icon: 'call-outline', label: 'CONTACT US' },
];

export default function MenuSidebar({ visible, currentView, onClose, onNavigate, onCart }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sidebar}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Close menu">
            <Ionicons name="close" size={30} color={colors.text} />
          </TouchableOpacity>

          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />

          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.view}
              style={[styles.item, currentView === item.view && styles.itemActive]}
              onPress={() => onNavigate(item.view)}
            >
              <Ionicons name={item.icon} size={20} color={colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>{item.label}</Text>
              {currentView === item.view && <View style={styles.activeDot} />}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.item} onPress={onCart}>
            <Ionicons name="cart-outline" size={20} color={colors.text} style={styles.itemIcon} />
            <Text style={styles.itemLabel}>MY CART</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.scrim} onPress={onClose} activeOpacity={1} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.8)' },
  sidebar: {
    width: '78%',
    maxWidth: 340,
    backgroundColor: '#050505',
    padding: 20,
    paddingTop: 50,
    borderRightWidth: 1,
    borderColor: colors.borderStrong,
  },
  scrim: { flex: 1 },
  closeButton: { alignSelf: 'flex-end', marginBottom: 20 },
  logo: { width: 150, height: 50, alignSelf: 'center', marginBottom: 40 },
  item: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  itemActive: { borderLeftColor: colors.primary, backgroundColor: 'rgba(211,47,47,0.08)' },
  itemIcon: { marginRight: 12 },
  itemLabel: { color: colors.text, fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 'auto' },
});

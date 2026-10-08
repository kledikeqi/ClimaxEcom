import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

const CONTACTS = [
  { icon: 'call', value: '+355 69 981 0385', url: 'tel:+355699810385' },
  { icon: 'mail', value: 'climax.store.al@gmail.com', url: 'mailto:climax.store.al@gmail.com' },
  { icon: 'logo-instagram', value: '@climax.store.al', url: 'https://instagram.com/climax.store.al' },
];

export default function ContactScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>CONTACT</Text>
      <Text style={styles.subtitle}>Questions about an order or a collab? Reach out.</Text>
      <View style={styles.card}>
        {CONTACTS.map((contact) => (
          <TouchableOpacity key={contact.value} style={styles.row} onPress={() => Linking.openURL(contact.url)}>
            <Ionicons name={contact.icon} size={22} color={colors.primary} />
            <Text style={styles.value}>{contact.value}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: 2 },
  subtitle: { color: colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  card: { backgroundColor: colors.surface, padding: 20, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  value: { color: colors.text, fontSize: 15, marginLeft: 16, fontWeight: 'bold' },
});

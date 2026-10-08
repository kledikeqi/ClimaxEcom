import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  accent?: string;
}

export default function StatCard({ label, value, caption, accent }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[styles.value, accent ? { color: accent } : null]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    width: '48%',
    marginBottom: 12,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  value: { color: colors.text, fontSize: 22, fontWeight: '900' },
  caption: { color: colors.textSoft, fontSize: 11, marginTop: 6 },
});

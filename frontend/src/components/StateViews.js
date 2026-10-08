import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export function LoadingView({ label = 'Loading...' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={42} color={colors.primary} />
      <Text style={styles.errorTitle}>Connection problem</Text>
      <Text style={styles.label}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retry} onPress={onRetry}>
          <Ionicons name="refresh" size={16} color={colors.text} />
          <Text style={styles.retryText}>TRY AGAIN</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  label: { color: colors.textMuted, marginTop: 14, textAlign: 'center', lineHeight: 20 },
  errorTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  retryText: { color: colors.text, fontWeight: 'bold', letterSpacing: 1, fontSize: 13 },
});

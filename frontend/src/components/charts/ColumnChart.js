import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';

/**
 * Vertical column chart (dependency free).
 * points: [{ label, value }]
 */
export default function ColumnChart({ points = [], height = 140, formatValue = (value) => String(value) }) {
  if (!points.length) {
    return <Text style={styles.empty}>No data yet.</Text>;
  }

  const max = Math.max(...points.map((point) => point.value), 1);
  const peakIndex = points.reduce(
    (best, point, index) => (point.value > points[best].value ? index : best),
    0
  );
  const labelEvery = Math.max(Math.ceil(points.length / 5), 1);

  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {points.map((point, index) => (
          <View key={`${point.label}-${index}`} style={styles.column}>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max((point.value / max) * 100, point.value > 0 ? 4 : 0)}%`,
                    backgroundColor: index === peakIndex ? colors.primary : '#5a5a63',
                  },
                ]}
              />
            </View>
            <Text style={styles.axisLabel} numberOfLines={1}>
              {index % labelEvery === 0 || index === points.length - 1 ? point.label.slice(5) : ''}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Peak: {formatValue(points[peakIndex].value)}</Text>
        </View>
        <Text style={styles.legendText}>
          {points[0].label} → {points[points.length - 1].label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderColor: colors.borderStrong,
    paddingBottom: 4,
  },
  column: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  track: { width: '62%', flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
  axisLabel: { color: colors.textMuted, fontSize: 9, marginTop: 6, height: 12 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  swatch: { width: 10, height: 10, borderRadius: 2, marginRight: 6 },
  legendText: { color: colors.textMuted, fontSize: 11 },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
});

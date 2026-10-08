import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';

export interface BarDatum {
  label: string;
  value: number;
  caption?: string;
}

interface BarChartProps {
  data?: BarDatum[];
  formatValue?: (value: number) => string;
}

export default function BarChart({ data = [], formatValue = (value) => String(value) }: BarChartProps) {
  const max = Math.max(...data.map((row) => row.value), 1);

  if (!data.length) {
    return <Text style={styles.empty}>No data yet.</Text>;
  }

  return (
    <View>
      {data.map((row) => (
        <View key={row.label} style={styles.row}>
          <View style={styles.labelBlock}>
            <Text style={styles.label} numberOfLines={1}>
              {row.label}
            </Text>
            {row.caption ? <Text style={styles.caption}>{row.caption}</Text> : null}
          </View>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max((row.value / max) * 100, 3)}%` }]} />
          </View>

          <Text style={styles.value}>{formatValue(row.value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  labelBlock: { width: 96 },
  label: { color: colors.text, fontSize: 12, fontWeight: '700' },
  caption: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  track: {
    flex: 1,
    height: 12,
    backgroundColor: colors.chartTrack,
    borderRadius: radius.pill,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  value: { color: colors.textSoft, fontSize: 11, fontWeight: '700', width: 62, textAlign: 'right' },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
});

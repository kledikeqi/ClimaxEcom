import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  fetchCategories,
  fetchStockAlerts,
  fetchSummary,
  fetchTimeline,
  fetchTopProducts,
  ORDERS_CSV_URL,
  PRODUCTS_CSV_URL,
} from '../api';
import BarChart from '../components/charts/BarChart';
import ColumnChart from '../components/charts/ColumnChart';
import StatCard from '../components/StatCard';
import { ErrorView, LoadingView } from '../components/StateViews';
import { useToast } from '../ToastContext';
import { colors, radius } from '../theme';
import {
  CategoryStat,
  LoadStatus,
  StockAlert,
  Summary,
  TimelinePoint,
  TopProduct,
} from '../types';
import { formatCompact, formatGrowth, formatLek, formatNumber } from '../utils/format';

interface DashboardState {
  status: LoadStatus;
  summary: Summary | null;
  timeline: TimelinePoint[];
  categories: CategoryStat[];
  top: TopProduct[];
  alerts: StockAlert[];
}

const EMPTY: Omit<DashboardState, 'status'> = {
  summary: null,
  timeline: [],
  categories: [],
  top: [],
  alerts: [],
};

interface DashboardStateAction extends DashboardState {}

export default function DashboardScreen() {
  const showToast = useToast();
  const [state, setState] = useState<DashboardState>({ status: 'loading', ...EMPTY });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [summary, timeline, categories, top, alerts] = await Promise.all([
        fetchSummary(),
        fetchTimeline(30),
        fetchCategories(),
        fetchTopProducts(5),
        fetchStockAlerts(),
      ]);
      setState({
        status: 'ready',
        summary,
        timeline: timeline.points,
        categories,
        top,
        alerts,
      });
    } catch {
      setState((previous): DashboardStateAction =>
        previous.summary
          ? { ...previous, status: 'ready' }
          : { status: 'error', ...EMPTY }
      );
      showToast('Could not reach the analytics API.', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === 'loading') return <LoadingView label="Crunching the numbers..." />;
  if (state.status === 'error' || !state.summary) {
    return (
      <ErrorView
        message="Analytics could not be loaded. Make sure the backend is running on port 8000."
        onRetry={load}
      />
    );
  }

  const { summary, timeline, categories, top, alerts } = state;
  const growth = summary.revenue_growth_pct;
  const growthColor =
    growth === null ? colors.text : growth >= 0 ? colors.success : colors.primary;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>ANALYTICS</Text>
        <TouchableOpacity onPress={load} style={styles.refresh} accessibilityLabel="Refresh data">
          <Ionicons name="refresh" size={18} color={refreshing ? colors.primary : colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.engineRow}>
        {['Python', 'pandas', 'FastAPI', 'SQLAlchemy', 'Postgres'].map((label) => (
          <View key={label} style={styles.enginePill}>
            <Text style={styles.engineText}>{label}</Text>
          </View>
        ))}
      </View>

      {summary.has_demo_data && (
        <View style={styles.demoBanner}>
          <Ionicons name="flask-outline" size={14} color={colors.warning} />
          <Text style={styles.demoText}>
            Demo dataset — synthetic orders are flagged with is_demo in the database and CSV export.
          </Text>
        </View>
      )}

      <View style={styles.grid}>
        <StatCard
          label="Total revenue"
          value={formatCompact(summary.total_revenue)}
          caption={formatLek(summary.total_revenue)}
        />
        <StatCard
          label="Orders"
          value={formatNumber(summary.total_orders)}
          caption={`${summary.orders_last_7d} in the last 7 days`}
        />
        <StatCard
          label="Avg. order"
          value={formatCompact(summary.average_order_value)}
          caption={formatLek(summary.average_order_value)}
        />
        <StatCard
          label="Units sold"
          value={formatNumber(summary.units_sold)}
          caption={`${summary.unique_customers} customers`}
        />
        <StatCard
          label="Revenue 7d"
          value={formatCompact(summary.revenue_last_7d)}
          caption={`vs prev. week ${formatGrowth(growth)}`}
          accent={growthColor}
        />
        <StatCard
          label="Inventory"
          value={formatCompact(summary.inventory_value)}
          caption={`${summary.low_stock_products} low stock items`}
          accent={summary.low_stock_products > 0 ? colors.warning : colors.success}
        />
      </View>

      <Section
        title="REVENUE — LAST 30 DAYS"
        meta={`${formatNumber(
          timeline.reduce((sum, point) => sum + point.revenue, 0)
        )} LEK`}
      >
        <ColumnChart
          points={timeline.map((point) => ({ label: point.date, value: point.revenue }))}
          formatValue={formatCompact}
        />
      </Section>

      <Section title="REVENUE BY CATEGORY" meta={`${categories.length} categories`}>
        <BarChart
          data={categories.map((row) => ({
            label: row.category,
            value: row.revenue,
            caption: `${row.units} units · ${row.share_pct}%`,
          }))}
          formatValue={formatCompact}
        />
      </Section>

      <Section title="TOP PRODUCTS" meta="by revenue">
        {top.map((product, index) => (
          <View key={product.product_id} style={styles.rankRow}>
            <View style={styles.rank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.rankMeta}>
                {product.units} units · {product.orders} orders
              </Text>
            </View>
            <Text style={styles.rankValue}>{formatCompact(product.revenue)} LEK</Text>
          </View>
        ))}
      </Section>

      <Section title="STOCK ALERTS" meta="threshold ≤ 5">
        {alerts.length === 0 ? (
          <Text style={styles.sectionEmpty}>All products are well stocked.</Text>
        ) : (
          alerts.map((product) => (
            <View key={product.id} style={styles.alertRow}>
              <View style={styles.alertInfo}>
                <Text style={styles.rankName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.rankMeta}>
                  {product.category} · {product.units_sold} units sold
                </Text>
              </View>
              <View style={styles.stockPill}>
                <Text style={styles.stockPillText}>{product.stock} LEFT</Text>
              </View>
            </View>
          ))
        )}
      </Section>

      <Section title="DATA EXPORT" meta="Power BI ready">
        <Text style={styles.exportHint}>
          Flat CSV generated by pandas — connect it in Power BI via Get data → Web.
        </Text>
        <View style={styles.exportRow}>
          <TouchableOpacity style={styles.exportButton} onPress={() => Linking.openURL(ORDERS_CSV_URL)}>
            <Ionicons name="download-outline" size={16} color={colors.text} />
            <Text style={styles.exportText}>orders.csv</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={() => Linking.openURL(PRODUCTS_CSV_URL)}>
            <Ionicons name="download-outline" size={16} color={colors.text} />
            <Text style={styles.exportText}>products.csv</Text>
          </TouchableOpacity>
        </View>
      </Section>

      <Text style={styles.footer}>
        Aggregated server-side with pandas · last generated{' '}
        {new Date(summary.generated_at).toLocaleString()}
      </Text>
    </ScrollView>
  );
}

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 100 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  refresh: {
    padding: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  engineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  enginePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: colors.border,
  },
  engineText: { color: colors.textMuted, fontSize: 11, fontWeight: 'bold' },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(241,196,15,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(241,196,15,0.35)',
  },
  demoText: { color: colors.textSoft, fontSize: 11, flex: 1, lineHeight: 15 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  section: {
    marginTop: 22,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  sectionMeta: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  sectionEmpty: { color: colors.textMuted, fontSize: 13 },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: { color: colors.text, fontSize: 12, fontWeight: 'bold' },
  rankInfo: { flex: 1, paddingRight: 10 },
  rankName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rankMeta: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  rankValue: { color: colors.primary, fontSize: 13, fontWeight: 'bold' },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  alertInfo: { flex: 1, paddingRight: 10 },
  stockPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(241,196,15,0.12)',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  stockPillText: { color: colors.warning, fontSize: 11, fontWeight: 'bold' },
  exportHint: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  exportRow: { flexDirection: 'row', gap: 12 },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  exportText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  footer: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 22,
    lineHeight: 16,
  },
});

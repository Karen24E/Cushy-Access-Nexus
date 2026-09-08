import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, API_BASE } from '../../src/constants/theme';
import { formatNumber, formatCurrency, formatTime } from '../../src/utils/format';

export default function OpsOverviewScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any>(null);
  const [orders, setOrders] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [nextRefresh, setNextRefresh] = useState(30);

  const load = async () => {
    try {
      const [p, o, c] = await Promise.all([
        fetch(`${API_BASE}/monitoring/operations/products`),
        fetch(`${API_BASE}/monitoring/operations/orders`),
        fetch(`${API_BASE}/monitoring/operations/products/categories`),
      ]);
      if (p.ok) setProducts(await p.json());
      if (o.ok) setOrders(await o.json());
      if (c.ok) {
        const data = await c.json();
        setCategories(Array.isArray(data) ? data.sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0)) : []);
      }
      setLastUpdated(new Date());
      setNextRefresh(30);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    const countdown = setInterval(() => setNextRefresh((n) => (n > 0 ? n - 1 : 30)), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>REAL-TIME</Text>
        <Text style={styles.title}>Operations Pulse</Text>
        <View style={styles.refreshRow}>
          <Text style={styles.refreshText}>Updated {formatTime(lastUpdated)}</Text>
          <Text style={styles.countdown}>↻ {nextRefresh}s</Text>
        </View>
      </View>

      {loading && !products ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Connection issue</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <View style={[styles.card, styles.accentYellow]}>
              <Text style={styles.cardLabel}>Total Products</Text>
              <Text style={styles.cardValue}>{formatNumber(products?.allTime?.total)}</Text>
            </View>
            <View style={[styles.card, styles.accentPurple]}>
              <Text style={styles.cardLabel}>Available</Text>
              <Text style={styles.cardValue}>{formatNumber(products?.allTime?.available)}</Text>
            </View>
            <View style={[styles.card, styles.accentPurple]}>
              <Text style={styles.cardLabel}>Total Orders</Text>
              <Text style={styles.cardValue}>{formatNumber(orders?.allTime?.total)}</Text>
            </View>
            <View style={[styles.card, styles.accentYellow]}>
              <Text style={styles.cardLabel}>Completed</Text>
              <Text style={styles.cardValue}>{formatNumber(orders?.allTime?.completed)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Pipeline</Text>
            <View style={styles.pipeline}>
              {[
                { label: 'Pending', value: orders?.allTime?.pending, color: Colors.warning },
                { label: 'In Progress', value: orders?.allTime?.inProgress, color: Colors.primaryLight },
                { label: 'Completed', value: orders?.allTime?.completed, color: Colors.success },
                { label: 'Cancelled', value: orders?.allTime?.cancelled, color: Colors.error },
              ].map((item) => (
                <View key={item.label} style={styles.pipeItem}>
                  <View style={[styles.pipeDot, { backgroundColor: item.color }]} />
                  <Text style={styles.pipeLabel}>{item.label}</Text>
                  <Text style={styles.pipeValue}>{formatNumber(item.value)}</Text>
                </View>
              ))}
            </View>
          </View>

          {categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Categories</Text>
              {categories.slice(0, 5).map((cat, i) => (
                <View key={cat.category || i} style={styles.catRow}>
                  <Text style={styles.catRank}>#{i + 1}</Text>
                  <Text style={styles.catName} numberOfLines={1}>{cat.category || 'Unknown'}</Text>
                  <Text style={styles.catRev}>{formatCurrency(cat.revenue)}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.cta} onPress={() => router.push('/operations')}>
            <Text style={styles.ctaText}>Open Full Command Center →</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 40 },
  header: { marginBottom: 20 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentDark,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  refreshRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  refreshText: { fontSize: 11, color: Colors.textMuted },
  countdown: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  center: { padding: 40, alignItems: 'center' },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: { color: Colors.error, fontWeight: '700', marginBottom: 4 },
  errorText: { color: '#991B1B', fontSize: 13 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 2,
  },
  accentYellow: { borderColor: Colors.accent },
  accentPurple: { borderColor: Colors.primaryLight },
  cardLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 4 },
  section: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
  },
  pipeline: { gap: 10 },
  pipeItem: { flexDirection: 'row', alignItems: 'center' },
  pipeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  pipeLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  pipeValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  catRank: {
    width: 28,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  catName: { flex: 1, fontSize: 13, color: Colors.text },
  catRev: { fontSize: 13, fontWeight: '700', color: Colors.success },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});

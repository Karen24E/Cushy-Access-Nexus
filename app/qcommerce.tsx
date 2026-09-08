import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, Radius, API_BASE } from '../src/constants/theme';
import { formatNumber, formatCurrency } from '../src/utils/format';

export default function QCommerceScreen() {
  const [products, setProducts] = useState<any>(null);
  const [orders, setOrders] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pulse = useRef(new Animated.Value(1)).current;

  const load = async () => {
    try {
      const [p, o] = await Promise.all([
        fetch(`${API_BASE}/monitoring/operations/products`),
        fetch(`${API_BASE}/monitoring/operations/orders`),
      ]);
      if (p.ok) setProducts(await p.json());
      if (o.ok) setOrders(await o.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const todaySold = products?.today?.sold ?? 0;
  const todayRevenue = products?.today?.revenue ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
    >
      <Animated.View style={[styles.heroCard, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.heroKicker}>Q-COMMERCE</Text>
        <Text style={styles.heroTitle}>Instant Commerce Engine</Text>
        <Text style={styles.heroSub}>Ultra-fast order fulfillment & inventory pulse</Text>
      </Animated.View>

      {loading && !products ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.grid}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatNumber(todaySold)}</Text>
              <Text style={styles.statLbl}>Sold Today</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatCurrency(todayRevenue)}</Text>
              <Text style={styles.statLbl}>Revenue Today</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatNumber(products?.allTime?.available)}</Text>
              <Text style={styles.statLbl}>In Stock</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatNumber(orders?.allTime?.pending)}</Text>
              <Text style={styles.statLbl}>Pending Orders</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Commerce Pipeline</Text>
            <Text style={styles.cardBody}>
              Q-Commerce focuses on sub-hour delivery windows, dynamic pricing, and high-velocity SKU turnover.
              Live product & order feeds power this module from the Cushy Access backend.
            </Text>
            <View style={styles.tags}>
              {['Flash Deals', 'Dark Stores', 'Hyperlocal', 'Auto-replenish'].map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Inventory Health</Text>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Available</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(
                        100,
                        ((products?.allTime?.available || 0) / Math.max(products?.allTime?.total || 1, 1)) * 100
                      )}%`,
                      backgroundColor: Colors.success,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Unavailable</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(
                        100,
                        ((products?.allTime?.unavailable || 0) / Math.max(products?.allTime?.total || 1, 1)) * 100
                      )}%`,
                      backgroundColor: Colors.error,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 20,
  },
  heroKicker: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: { color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  stat: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  statLbl: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  cardBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: {
    backgroundColor: Colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  barRow: { marginBottom: 10 },
  barLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  barTrack: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
});

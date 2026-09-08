import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, Radius, API_BASE } from '../src/constants/theme';
import { formatNumber, formatCurrency } from '../src/utils/format';

export default function FoodTechScreen() {
  const [products, setProducts] = useState<any>(null);
  const [orders, setOrders] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>FOODTECH</Text>
        <Text style={styles.heroTitle}>Kitchen & Supply Intelligence</Text>
        <Text style={styles.heroSub}>Cold-chain, menus & fulfillment orchestration</Text>
      </View>

      {loading && !products ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.grid}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatNumber(products?.today?.sold)}</Text>
              <Text style={styles.statLbl}>Items Sold Today</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatCurrency(products?.today?.revenue)}</Text>
              <Text style={styles.statLbl}>Food Revenue</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatNumber(orders?.allTime?.completed)}</Text>
              <Text style={styles.statLbl}>Completed Orders</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatNumber(products?.allTime?.discounted)}</Text>
              <Text style={styles.statLbl}>Discounted SKUs</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Food Ops Focus Areas</Text>
            {[
              'Menu engineering & dynamic pricing',
              'Cold-chain temperature monitoring hooks',
              'Kitchen load balancing across dark kitchens',
              'Waste reduction & surplus redistribution',
            ].map((t) => (
              <View key={t} style={styles.row}>
                <Text style={styles.emoji}>🍽️</Text>
                <Text style={styles.rowText}>{t}</Text>
              </View>
            ))}
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
    backgroundColor: '#6D28D9',
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 20,
  },
  heroKicker: { color: Colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
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
  statVal: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  statLbl: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emoji: { fontSize: 18, marginRight: 10 },
  rowText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },
});

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
import { formatNumber } from '../src/utils/format';

export default function LogisticsScreen() {
  const [orders, setOrders] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/operations/orders`);
      if (res.ok) setOrders(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pipeline = [
    { label: 'Pending', value: orders?.allTime?.pending, color: Colors.warning },
    { label: 'In Progress', value: orders?.allTime?.inProgress, color: Colors.primaryLight },
    { label: 'Completed', value: orders?.allTime?.completed, color: Colors.success },
    { label: 'Cancelled', value: orders?.allTime?.cancelled, color: Colors.error },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>LOGISTICS</Text>
        <Text style={styles.heroTitle}>Fleet & Last-Mile Command</Text>
        <Text style={styles.heroSub}>Routing, capacity & delivery SLAs</Text>
      </View>

      {loading && !orders ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>All-time Orders</Text>
            <Text style={styles.totalValue}>{formatNumber(orders?.allTime?.total)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Pipeline</Text>
            {pipeline.map((p) => (
              <View key={p.label} style={styles.pipeRow}>
                <View style={[styles.dot, { backgroundColor: p.color }]} />
                <Text style={styles.pipeLabel}>{p.label}</Text>
                <Text style={styles.pipeVal}>{formatNumber(p.value)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Logistics Capabilities</Text>
            {[
              { icon: '🗺️', t: 'Smart Routing', d: 'Multi-stop optimization & ETA engine' },
              { icon: '📦', t: 'Capacity Planning', d: 'Driver & vehicle utilization' },
              { icon: '⏱️', t: 'SLA Tracking', d: 'On-time delivery & exception alerts' },
              { icon: '📍', t: 'Live Tracking', d: 'GPS-ready delivery status feeds' },
            ].map((item) => (
              <View key={item.t} style={styles.capRow}>
                <Text style={styles.capIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.capTitle}>{item.t}</Text>
                  <Text style={styles.capDesc}>{item.d}</Text>
                </View>
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
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 20,
  },
  heroKicker: { color: Colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  heroTitle: { color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 },
  totalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  totalLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  totalValue: { fontSize: 36, fontWeight: '900', color: Colors.primary, marginTop: 4 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
  pipeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  pipeLabel: { flex: 1, fontSize: 14, color: Colors.text },
  pipeVal: { fontSize: 16, fontWeight: '800', color: Colors.text },
  capRow: { flexDirection: 'row', marginBottom: 14 },
  capIcon: { fontSize: 22, marginRight: 12 },
  capTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  capDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

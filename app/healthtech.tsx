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

export default function HealthTechScreen() {
  const [products, setProducts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/operations/products`);
      if (res.ok) setProducts(await res.json());
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
        <Text style={styles.heroKicker}>HEALTHTECH</Text>
        <Text style={styles.heroTitle}>Care Delivery Hub</Text>
        <Text style={styles.heroSub}>Diagnostics, pharmacy & telehealth coordination</Text>
      </View>

      {loading && !products ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.grid}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatNumber(products?.allTime?.total)}</Text>
              <Text style={styles.statLbl}>Catalog SKUs</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatNumber(products?.allTime?.available)}</Text>
              <Text style={styles.statLbl}>Ready to Dispense</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Module Capabilities</Text>
            {[
              { t: 'Diagnostic Routing', d: 'Route samples & results to labs and patients' },
              { t: 'Pharmacy Fulfillment', d: 'Prescription-aware inventory & delivery' },
              { t: 'Care Coordination', d: 'Track appointments & follow-ups' },
              { t: 'Compliance Logs', d: 'Audit-ready health data trails' },
            ].map((item) => (
              <View key={item.t} style={styles.listItem}>
                <View style={styles.bullet} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.t}</Text>
                  <Text style={styles.listDesc}>{item.d}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Live Feed Status</Text>
            <Text style={styles.cardBody}>
              Connected to Cushy Access product operations endpoint. Health-specific catalogs
              surface through the same monitoring layer used by other Nexus modules.
            </Text>
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
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 20,
  },
  heroKicker: { color: Colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  heroTitle: { color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stat: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  statVal: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLbl: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
  cardBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  listItem: { flexDirection: 'row', marginBottom: 14 },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginTop: 6,
    marginRight: 12,
  },
  listTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  listDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

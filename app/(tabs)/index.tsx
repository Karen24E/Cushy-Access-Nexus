import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/src/components/Header';
import { VerticalFilter } from '@/src/components/VerticalFilter';
import { MetricCard } from '@/src/components/MetricCard';
import { AlertRow } from '@/src/components/AlertRow';
import { LogisticsMap } from '@/src/components/LogisticsMap';
import { ServiceStatus } from '@/src/components/ServiceStatus';
import { fetchDashboard, fetchRiders } from '@/src/services/api';
import { connectSocket } from '@/src/services/socket';
import { DashboardPayload, Rider, Vertical } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/auth/AuthProvider';

const emptyDashboard: DashboardPayload = { metrics: [], slaHealth: 0, alerts: [], services: [] };

export default function CommandCenterScreen() {
  const { session, loading } = useAuth();
  const [vertical, setVertical] = useState<Vertical>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardPayload>(emptyDashboard);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const [nextDashboard, nextRiders] = await Promise.all([fetchDashboard(vertical), fetchRiders()]);
      setDashboard(nextDashboard);
      setRiders(nextRiders);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect to the Nexus API.');
    }
  };

  useEffect(() => {
    if (!session) return;
    void load();
    const socket = connectSocket();
    const refreshEvents = ['order.created', 'order.updated', 'order.assigned', 'alert.updated', 'alert.created', 'service.updated'];
    const onRiderLocation = (rider: Rider) => setRiders((current) => current.map((r) => r.id === rider.id ? { ...r, ...rider } : r));
    refreshEvents.forEach((event) => socket.on(event, load));
    socket.on('rider.location', onRiderLocation);
    return () => {
      refreshEvents.forEach((event) => socket.off(event, load));
      socket.off('rider.location', onRiderLocation);
    };
  }, [vertical, session]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const visibleAlerts = useMemo(() => dashboard.alerts.slice(0, 4), [dashboard.alerts]);
  const atRisk = useMemo(() => dashboard.metrics.find((m) => m.label.toLowerCase().includes('at risk'))?.value ?? '—', [dashboard.metrics]);
  if (!loading && !session) return <Redirect href="/login" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header />
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.eyebrowRow}><View style={styles.yellowLine} /><Text style={styles.eyebrow}>UNIFIED OPERATIONS</Text></View>
            <Text style={styles.heroTitle}>Everything moving, at a glance.</Text>
            <Text style={styles.heroBody}>Monitor every Cushy Access vertical from one independent command layer.</Text>
          </View>
          <View style={styles.heroOrb}><Ionicons name="pulse" size={28} color={colors.purple900} /></View>
        </View>

        <VerticalFilter selected={vertical} onChange={setVertical} />
        {error && <View style={styles.error}><Ionicons name="cloud-offline-outline" size={17} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View>}

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Live command metrics</Text><Text style={styles.sectionSub}>Real-time snapshot across the selected scope</Text></View><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRow}>
          {dashboard.metrics.map((metric, index) => <MetricCard key={metric.label} metric={metric} featured={index === 0} />)}
        </ScrollView>

        <View style={styles.insightGrid}>
          <View style={styles.insightCard}>
            <View style={styles.insightTop}><Text style={styles.insightLabel}>DELIVERY SLA</Text><Ionicons name="timer-outline" size={17} color={colors.yellowDeep} /></View>
            <Text style={styles.insightValue}>{dashboard.slaHealth.toFixed(1)}%</Text>
            <Text style={styles.insightMeta}>within target window</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(0, Math.min(100, dashboard.slaHealth))}%` }]} /></View>
          </View>
          <View style={[styles.insightCard, styles.riskCard]}>
            <View style={styles.insightTop}><Text style={styles.insightLabel}>AT RISK</Text><Ionicons name="warning-outline" size={17} color={colors.yellow} /></View>
            <Text style={[styles.insightValue, styles.lightValue]}>{atRisk}</Text>
            <Text style={styles.lightMeta}>orders needing attention</Text>
            <View style={styles.riskFooter}><View style={styles.warningDot} /><Text style={styles.riskText}>Prioritize before SLA breach</Text></View>
          </View>
        </View>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Fleet visibility</Text><Text style={styles.sectionSub}>Live location and delivery movement</Text></View><Text style={styles.link}>{riders.length} tracked</Text></View>
        <LogisticsMap riders={riders} />

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Active alerts</Text><Text style={styles.sectionSub}>Issues requiring operator attention</Text></View><Text style={styles.link}>{dashboard.alerts.length} open</Text></View>
        <View style={styles.alertCard}>
          {visibleAlerts.map((alert) => <AlertRow key={alert.id} alert={{ ...alert, time: alert.time ?? `${Math.round(alert.age_minutes ?? 0)}m ago` }} />)}
          {visibleAlerts.length === 0 && <View style={styles.empty}><Text style={styles.emptyText}>No active alerts.</Text></View>}
        </View>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Infrastructure health</Text><Text style={styles.sectionSub}>Core systems monitored by Nexus</Text></View><Text style={styles.link}>Live</Text></View>
        <ServiceStatus services={dashboard.services} />

        <View style={styles.footnote}><Ionicons name="shield-checkmark-outline" size={16} color={colors.purple600} /><Text style={styles.footnoteText}>Nexus operates independently and receives normalized events from Cushy Access systems and approved external integrations.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 16, paddingTop: 9, paddingBottom: 34 },
  hero: { minHeight: 160, borderRadius: 24, backgroundColor: colors.purple900, padding: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  heroCopy: { flex: 1, paddingRight: 8 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  yellowLine: { width: 18, height: 3, borderRadius: 2, backgroundColor: colors.yellow },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.25, color: colors.yellow },
  heroTitle: { marginTop: 10, fontSize: 27, lineHeight: 31, fontWeight: '900', color: colors.surface },
  heroBody: { marginTop: 9, maxWidth: 265, fontSize: 11, lineHeight: 17, color: '#E8DDF4' },
  heroOrb: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  sectionHeader: { marginTop: 18, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: colors.ink },
  sectionSub: { marginTop: 2, fontSize: 9, fontWeight: '600', color: colors.muted },
  livePill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.successSoft, flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  liveText: { fontSize: 8, fontWeight: '900', color: colors.success, letterSpacing: 0.7 },
  metricsRow: { gap: 10, paddingBottom: 3 },
  insightGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  insightCard: { flex: 1, minHeight: 140, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14 },
  riskCard: { backgroundColor: colors.purple800, borderColor: colors.purple800 },
  insightTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insightLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9, color: colors.slate },
  insightValue: { marginTop: 10, fontSize: 29, fontWeight: '900', color: colors.ink },
  lightValue: { color: colors.surface },
  insightMeta: { marginTop: 1, fontSize: 9, fontWeight: '600', color: colors.muted },
  lightMeta: { color: '#DCCFE9' },
  track: { marginTop: 13, height: 7, borderRadius: 4, backgroundColor: colors.purple100, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.purple600 },
  riskFooter: { marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 5 },
  warningDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.yellow },
  riskText: { fontSize: 8, fontWeight: '700', color: '#E6DBF2' },
  link: { fontSize: 10, fontWeight: '900', color: colors.purple600 },
  alertCard: { backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border },
  error: { marginTop: 3, padding: 11, borderRadius: 12, backgroundColor: colors.dangerSoft, flexDirection: 'row', gap: 8, alignItems: 'center' },
  errorText: { flex: 1, color: colors.danger, fontSize: 10, fontWeight: '700' },
  empty: { padding: 25, alignItems: 'center' },
  emptyText: { fontSize: 11, color: colors.slate },
  footnote: { marginTop: 16, padding: 12, borderRadius: 14, backgroundColor: colors.purple50, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  footnoteText: { flex: 1, fontSize: 9, lineHeight: 14, color: colors.slate, fontWeight: '600' },
});

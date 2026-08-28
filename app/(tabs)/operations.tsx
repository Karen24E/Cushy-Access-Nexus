import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VerticalWorkspace } from '@/src/components/operations/VerticalWorkspace';
import { colors } from '@/src/theme/colors';
import { fetchDashboard, fetchOrders } from '@/src/services/api';
import { connectSocket } from '@/src/services/socket';
import type { DashboardPayload, Order, Vertical } from '@/src/types/operations';

const verticals: Exclude<Vertical, 'All'>[] = ['Q-Commerce', 'Healthtech', 'Foodtech', 'Logistics'];
const emptyDashboard: DashboardPayload = { metrics: [], slaHealth: 0, alerts: [], services: [] };

export default function OperationsScreen() {
  const [vertical, setVertical] = useState<Exclude<Vertical, 'All'>>('Q-Commerce');
  const [dashboard, setDashboard] = useState<DashboardPayload>(emptyDashboard);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    try {
      setError(null);
      const [nextDashboard, nextOrders] = await Promise.all([fetchDashboard(vertical), fetchOrders({ vertical })]);
      setDashboard(nextDashboard);
      setOrders(nextOrders);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the operations workspace.');
    }
  };

  useEffect(() => {
    void load();
    const socket = connectSocket();
    const events = ['order.created', 'order.updated', 'order.assigned', 'alert.created', 'alert.updated', 'service.updated'];
    events.forEach((event) => socket.on(event, load));
    return () => events.forEach((event) => socket.off(event, load));
  }, [vertical]);

  const workspace = useMemo(() => <VerticalWorkspace vertical={vertical} dashboard={dashboard} orders={orders} onOpenOrders={() => router.push('/orders')} />, [vertical, dashboard, orders]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>CUSHY ACCESS NEXUS</Text><Text style={styles.title}>Operations</Text><Text style={styles.subtitle}>Independent workspaces, one event and monitoring fabric.</Text></View>
          <View style={styles.commandBadge}><Ionicons name="pulse" size={18} color={colors.yellow} /><Text style={styles.badgeText}>LIVE</Text></View>
        </View>

        <View style={styles.switcherCard}>
          <View style={styles.switcherHeader}><View><Text style={styles.switcherTitle}>Choose workspace</Text><Text style={styles.switcherSub}>Shared alerts, SLA and event streams stay connected.</Text></View><Ionicons name="git-network-outline" size={22} color={colors.primary} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {verticals.map((item) => (
              <Pressable key={item} onPress={() => setVertical(item)} style={[styles.chip, vertical === item && styles.chipActive]}>
                <Text style={[styles.chipText, vertical === item && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {error && <View style={styles.error}><Ionicons name="cloud-offline-outline" size={17} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View>}

        {workspace}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', marginTop: 3 },
  subtitle: { color: colors.slate, fontSize: 11, lineHeight: 17, marginTop: 5, maxWidth: 280 },
  commandBadge: { backgroundColor: colors.primaryDark, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: colors.yellow, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  switcherCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 14 },
  switcherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  switcherTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' }, switcherSub: { color: colors.slate, fontSize: 10, marginTop: 4, lineHeight: 15, maxWidth: 300 },
  chips: { gap: 8, paddingTop: 13 }, chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999 }, chipActive: { backgroundColor: colors.primary, borderColor: colors.primary }, chipText: { color: colors.slate, fontSize: 10, fontWeight: '800' }, chipTextActive: { color: colors.surface },
  error: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: colors.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 8 }, errorText: { flex: 1, color: colors.danger, fontSize: 10, fontWeight: '700' },
});

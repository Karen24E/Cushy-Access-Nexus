import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DashboardPayload, Order, Vertical } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';

const verticalMeta: Record<Exclude<Vertical, 'All'>, { icon: any; subtitle: string; hero: string; actions: string[] }> = {
  'Q-Commerce': { icon: 'flash-outline', subtitle: 'Instant commerce, stores & fulfillment', hero: 'Keep every dark store, order queue and delivery SLA under control.', actions: ['Store health', 'Inventory risk', 'Fulfillment queue'] },
  Healthtech: { icon: 'medkit-outline', subtitle: 'Care delivery, pharmacy & diagnostics', hero: 'Monitor care queues, pharmacy fulfillment and healthcare delivery events.', actions: ['Care queue', 'Prescription risk', 'Pharmacy health'] },
  Foodtech: { icon: 'restaurant-outline', subtitle: 'Restaurants, kitchens & food delivery', hero: 'Watch preparation queues, kitchen capacity and delivery performance.', actions: ['Kitchen queue', 'Prep delays', 'Restaurant health'] },
  Logistics: { icon: 'navigate-outline', subtitle: 'Fleet, dispatch & last-mile execution', hero: 'Control dispatch, rider availability, route risk and delivery SLAs.', actions: ['Dispatch board', 'Fleet health', 'Route risk'] },
};

const orderLabel: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Ready', assigned: 'Assigned', picked_up: 'Picked up', delivered: 'Delivered', cancelled: 'Cancelled', failed: 'Failed',
};

export function VerticalWorkspace({ vertical, dashboard, orders, onOpenOrders }: { vertical: Exclude<Vertical, 'All'>; dashboard: DashboardPayload; orders: Order[]; onOpenOrders: () => void }) {
  const meta = verticalMeta[vertical];
  const active = orders.filter((order) => !['delivered', 'cancelled', 'failed'].includes(order.status));
  const atRisk = active.filter((order) => (Date.now() - new Date(order.created_at).getTime()) / 60000 > order.sla_minutes);
  const delivered = orders.filter((order) => order.status === 'delivered').length;
  const failed = orders.filter((order) => order.status === 'failed').length;
  const topOrders = [...orders].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 4);

  return (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}><Ionicons name={meta.icon} size={24} color={colors.yellow} /></View>
          <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
        </View>
        <Text style={styles.eyebrow}>{vertical.toUpperCase()}</Text>
        <Text style={styles.heroTitle}>{vertical} Operations</Text>
        <Text style={styles.heroSubtitle}>{meta.subtitle}</Text>
        <Text style={styles.heroBody}>{meta.hero}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
        {meta.actions.map((label, index) => (
          <Pressable key={label} onPress={index === 0 ? onOpenOrders : undefined} style={styles.actionCard}>
            <View style={styles.actionIcon}><Ionicons name={index === 1 ? 'warning-outline' : index === 2 ? 'pulse-outline' : 'arrow-forward-outline'} size={16} color={colors.primary} /></View>
            <Text style={styles.actionText}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Workspace health</Text><Text style={styles.sectionMeta}>{dashboard.metrics.length} live metrics</Text></View>
      <View style={styles.healthGrid}>
        <StatCard icon="layers-outline" label="Active work" value={String(active.length)} tone="purple" />
        <StatCard icon="warning-outline" label="At risk" value={String(atRisk.length)} tone="yellow" />
        <StatCard icon="checkmark-circle-outline" label="Delivered" value={String(delivered)} tone="green" />
        <StatCard icon="close-circle-outline" label="Failed" value={String(failed)} tone="red" />
      </View>

      <View style={styles.slaCard}>
        <View style={styles.slaLeft}><View style={styles.slaIcon}><Ionicons name="speedometer-outline" size={18} color={colors.yellow} /></View><View><Text style={styles.slaLabel}>Shared SLA health</Text><Text style={styles.slaValue}>{dashboard.slaHealth.toFixed(1)}%</Text></View></View>
        <View style={styles.slaTrack}><View style={[styles.slaFill, { width: `${Math.max(4, Math.min(100, dashboard.slaHealth))}%` }]} /></View>
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Live metrics</Text><Text style={styles.sectionMeta}>From Nexus API</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricRow}>
        {dashboard.metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <View style={styles.metricIcon}><Ionicons name={metric.icon as any} size={15} color={colors.primary} /></View>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={[styles.metricDelta, !metric.positive && styles.metricNegative]}>{metric.delta}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Live queue</Text><Pressable onPress={onOpenOrders}><Text style={styles.link}>Open dispatch</Text></Pressable></View>
      <View style={styles.queueCard}>
        {topOrders.map((order) => (
          <View key={order.id} style={styles.queueRow}>
            <View style={styles.queueMain}><View style={[styles.priorityDot, { backgroundColor: order.priority === 'critical' ? colors.danger : order.priority === 'high' ? colors.yellow : colors.primary }]} /><View style={{ flex: 1 }}><Text style={styles.ref}>{order.reference}</Text><Text style={styles.queueText}>{order.pickup_name} → {order.dropoff_address}</Text></View></View>
            <View style={styles.queueRight}><Text style={styles.status}>{orderLabel[order.status] ?? order.status}</Text><Text style={styles.time}>{timeAgo(order.updated_at)}</Text></View>
          </View>
        ))}
        {topOrders.length === 0 && <View style={styles.empty}><Text style={styles.emptyText}>No live work in this workspace.</Text></View>}
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Shared alerts</Text><Text style={styles.sectionMeta}>{dashboard.alerts.length} open</Text></View>
      <View style={styles.alertStrip}>
        {dashboard.alerts.slice(0, 3).map((alert) => (
          <View key={alert.id} style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: alert.severity === 'critical' ? colors.danger : alert.severity === 'warning' ? colors.yellow : colors.primary }]} />
            <View style={{ flex: 1 }}><Text style={styles.alertTitle}>{alert.title}</Text><Text style={styles.alertDescription} numberOfLines={2}>{alert.description}</Text></View>
          </View>
        ))}
        {dashboard.alerts.length === 0 && <Text style={styles.emptyText}>No active alerts.</Text>}
      </View>
    </View>
  );
}

function StatCard({ icon, label, value, tone }: { icon: any; label: string; value: string; tone: 'purple' | 'yellow' | 'green' | 'red' }) {
  const toneMap = { purple: { bg: colors.primarySoft, icon: colors.primary }, yellow: { bg: colors.yellowSoft, icon: colors.yellowDark }, green: { bg: colors.successSoft, icon: colors.success }, red: { bg: colors.dangerSoft, icon: colors.danger } };
  return <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: toneMap[tone].bg }]}><Ionicons name={icon} size={17} color={toneMap[tone].icon} /></View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;
}

function timeAgo(date: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primaryDark, borderRadius: 24, padding: 18, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  heroIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#32145F', alignItems: 'center', justifyContent: 'center' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#32145F', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.yellow }, liveText: { fontSize: 9, fontWeight: '900', color: colors.yellow, letterSpacing: 1 },
  eyebrow: { color: '#C9B7EA', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, heroTitle: { marginTop: 4, color: colors.surface, fontSize: 27, fontWeight: '900' },
  heroSubtitle: { marginTop: 6, color: '#E8DFFD', fontSize: 12, fontWeight: '700' }, heroBody: { marginTop: 14, color: '#CFC3E5', fontSize: 12, lineHeight: 19, maxWidth: 330 },
  actionRow: { gap: 10, paddingVertical: 14 }, actionCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, width: 128 }, actionIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }, actionText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 9 }, sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' }, sectionMeta: { color: colors.muted, fontSize: 10, fontWeight: '800' }, link: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, statCard: { width: '47.7%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 13 }, statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, statLabel: { color: colors.slate, fontSize: 10, fontWeight: '700' }, statValue: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: 3 },
  metricRow: { gap: 10, paddingBottom: 2 }, metricCard: { width: 142, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12 }, metricIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, metricLabel: { color: colors.slate, fontSize: 9, fontWeight: '700' }, metricValue: { color: colors.ink, fontSize: 19, fontWeight: '900', marginTop: 3 }, metricDelta: { color: colors.success, fontSize: 9, fontWeight: '800', marginTop: 4 }, metricNegative: { color: colors.danger },
  slaCard: { marginTop: 10, backgroundColor: colors.ink, borderRadius: 18, padding: 14 }, slaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 }, slaIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#39235C', alignItems: 'center', justifyContent: 'center' }, slaLabel: { color: '#CFC3E5', fontSize: 10, fontWeight: '700' }, slaValue: { color: colors.surface, fontSize: 20, fontWeight: '900', marginTop: 2 }, slaTrack: { height: 7, backgroundColor: '#3C2B54', borderRadius: 7, overflow: 'hidden', marginTop: 12 }, slaFill: { height: 7, backgroundColor: colors.yellow, borderRadius: 7 },
  queueCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 14 }, queueRow: { minHeight: 72, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, queueMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingRight: 10 }, priorityDot: { width: 8, height: 8, borderRadius: 4 }, ref: { color: colors.ink, fontSize: 11, fontWeight: '900' }, queueText: { color: colors.slate, fontSize: 10, marginTop: 3 }, queueRight: { alignItems: 'flex-end' }, status: { color: colors.primary, fontSize: 9, fontWeight: '900' }, time: { color: colors.muted, fontSize: 9, marginTop: 4 }, empty: { padding: 24, alignItems: 'center' }, emptyText: { color: colors.slate, fontSize: 11, fontWeight: '600' },
  alertStrip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 14 }, alertRow: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', gap: 9 }, alertDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 }, alertTitle: { color: colors.ink, fontSize: 11, fontWeight: '900' }, alertDescription: { color: colors.slate, fontSize: 10, marginTop: 3, lineHeight: 15 },
});

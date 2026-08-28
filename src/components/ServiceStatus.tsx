import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { ServiceHealth } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';

export function ServiceStatus({ services = [] }: { services?: ServiceHealth[] }) {
  return (
    <View style={styles.card}>
      {services.map((service) => {
        const healthy = service.status === 'operational';
        return (
          <View key={service.name} style={styles.row}>
            <View style={[styles.statusIcon, { backgroundColor: healthy ? colors.successSoft : colors.warningSoft }]}>
              <Ionicons name={healthy ? 'checkmark-circle' : 'warning'} size={16} color={healthy ? colors.success : colors.warning} />
            </View>
            <Text style={styles.name}>{service.name}</Text>
            <Text style={styles.meta}>{service.latency_ms}ms</Text>
            <View style={[styles.badge, { backgroundColor: healthy ? colors.successSoft : colors.warningSoft }]}><Text style={[styles.badgeText, { color: healthy ? colors.success : colors.warning }]}>{healthy ? 'Healthy' : 'Degraded'}</Text></View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  row: { minHeight: 54, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontSize: 11, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 9, fontWeight: '700', color: colors.muted },
  badge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 8, fontWeight: '900' },
});

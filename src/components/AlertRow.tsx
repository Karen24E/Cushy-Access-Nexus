import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AlertItem } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';

const severityMap = {
  critical: { icon: 'alert-circle', bg: colors.dangerSoft, color: colors.danger, label: 'CRITICAL' },
  warning: { icon: 'warning', bg: colors.warningSoft, color: colors.warning, label: 'WARNING' },
  info: { icon: 'information-circle', bg: colors.purple100, color: colors.purple600, label: 'INFO' },
} as const;

export function AlertRow({ alert }: { alert: AlertItem }) {
  const visual = severityMap[alert.severity];
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: visual.bg }]}><Ionicons name={visual.icon as any} size={17} color={visual.color} /></View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.severity, { backgroundColor: visual.bg }]}><Text style={[styles.severityText, { color: visual.color }]}>{visual.label}</Text></View>
          <Text style={styles.time}>{alert.time}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>{alert.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{alert.description}</Text>
        <Text style={styles.vertical}>{alert.vertical}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 11, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  severity: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  severityText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  time: { fontSize: 9, color: colors.muted, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '900', color: colors.ink },
  description: { marginTop: 3, fontSize: 10, lineHeight: 15, color: colors.slate },
  vertical: { marginTop: 5, fontSize: 9, fontWeight: '800', color: colors.purple600 },
});

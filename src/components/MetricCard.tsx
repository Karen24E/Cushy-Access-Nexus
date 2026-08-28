import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Metric } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';

const iconColors: Record<string, string> = {
  'cube-outline': colors.purple600,
  'checkmark-circle-outline': colors.success,
  'bicycle-outline': colors.purple600,
  'time-outline': colors.warning,
};

export function MetricCard({ metric, featured = false }: { metric: Metric; featured?: boolean }) {
  const iconColor = iconColors[metric.icon] ?? colors.purple600;
  return (
    <View style={[styles.card, featured && styles.featured]}>
      <View style={[styles.iconWrap, featured && styles.featuredIcon]}>
        <Ionicons name={metric.icon as any} size={18} color={featured ? colors.purple900 : iconColor} />
      </View>
      <Text style={[styles.label, featured && styles.featuredLabel]}>{metric.label}</Text>
      <Text style={[styles.value, featured && styles.featuredValue]}>{metric.value}</Text>
      <View style={styles.deltaRow}>
        <Ionicons name={metric.positive ? 'trending-up-outline' : 'trending-down-outline'} size={12} color={metric.positive ? colors.success : colors.danger} />
        <Text style={[styles.delta, !metric.positive && styles.negative]}>{metric.delta}</Text>
        <Text style={[styles.vs, featured && styles.featuredLabel]}>vs yesterday</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 168, backgroundColor: colors.surface, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: colors.border },
  featured: { backgroundColor: colors.purple900, borderColor: colors.purple900 },
  iconWrap: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.purple100, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  featuredIcon: { backgroundColor: colors.yellow },
  label: { fontSize: 11, fontWeight: '700', color: colors.slate, marginBottom: 6 },
  featuredLabel: { color: '#EBDFFF' },
  value: { fontSize: 24, fontWeight: '900', color: colors.ink },
  featuredValue: { color: colors.surface },
  deltaRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  delta: { fontSize: 10, fontWeight: '800', color: colors.success },
  negative: { color: colors.danger },
  vs: { fontSize: 9, fontWeight: '600', color: colors.muted },
});

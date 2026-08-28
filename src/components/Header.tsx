import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme/colors';

export function Header() {
  return (
    <View style={styles.row}>
      <View style={styles.brandRow}>
        <View style={styles.logo}><Ionicons name="pulse" size={18} color={colors.purple900} /></View>
        <View>
          <Text style={styles.brand}>Cushy Access</Text>
          <Text style={styles.kicker}>NEXUS · COMMAND CENTER</Text>
        </View>
      </View>
      <Pressable style={styles.notification} accessibilityLabel="Open notifications">
        <Ionicons name="notifications-outline" size={20} color={colors.ink} />
        <View style={styles.dot} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 16, fontWeight: '900', color: colors.ink },
  kicker: { marginTop: 2, fontSize: 9, fontWeight: '800', letterSpacing: 1.25, color: colors.purple600 },
  notification: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  dot: { position: 'absolute', right: 8, top: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.yellow, borderWidth: 2, borderColor: colors.surface },
});

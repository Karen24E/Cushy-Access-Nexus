import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Vertical } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';

const items: Array<{ label: Vertical; icon: keyof typeof Ionicons.glyphMap }> = [
  { label: 'All', icon: 'apps-outline' },
  { label: 'Q-Commerce', icon: 'bag-handle-outline' },
  { label: 'Healthtech', icon: 'heart-outline' },
  { label: 'Foodtech', icon: 'restaurant-outline' },
  { label: 'Logistics', icon: 'bicycle-outline' },
];

export function VerticalFilter({ selected, onChange }: { selected: Vertical; onChange: (v: Vertical) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {items.map((item) => {
        const active = selected === item.label;
        return (
          <TouchableOpacity key={item.label} onPress={() => onChange(item.label)} style={[styles.chip, active && styles.chipActive]}>
            <Ionicons name={item.icon} size={14} color={active ? colors.purple900 : colors.slate} />
            <Text style={[styles.text, active && styles.textActive]}>{item.label}</Text>
            {active && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 12, gap: 8 },
  chip: { paddingHorizontal: 12, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 7 },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  text: { fontSize: 11, fontWeight: '800', color: colors.slate },
  textActive: { color: colors.purple900 },
  activeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.purple900 },
});

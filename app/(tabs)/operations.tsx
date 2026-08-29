import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/src/theme/colors';
import { fetchOverview, fetchCategories } from '@/src/services/api';
import type { OverviewData, CategoryData, Vertical } from '@/src/types/operations';

const verticals: Exclude<Vertical, 'All'>[] = ['Q-Commerce', 'Healthtech', 'Foodtech', 'Logistics'];

export default function OperationsScreen() {
  const [vertical, setVertical] = useState<Exclude<Vertical, 'All'>>('Q-Commerce');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    try {
      setError(null);
      const [nextOverview, nextCategories] = await Promise.all([fetchOverview(), fetchCategories()]);
      setOverview(nextOverview);
      setCategories(nextCategories);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the operations workspace.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const displayedCategories = useMemo(() => categoriesExpanded ? categories : categories.slice(0, 10), [categories, categoriesExpanded]);

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

        {overview && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ORDERS TODAY</Text>
              <Text style={styles.statValue}>{overview.orders.totalToday}</Text>
              <Text style={styles.statSub}>{overview.orders.pending} pending · {overview.orders.inProgress} in progress</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>RIDERS</Text>
              <Text style={styles.statValue}>{overview.riders.total}</Text>
              <Text style={styles.statSub}>{overview.riders.online} online · {overview.riders.active} active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>STORES</Text>
              <Text style={styles.statValue}>{overview.stores.total}</Text>
              <Text style={styles.statSub}>{overview.stores.active} active · {overview.stores.suspended} suspended</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>API RESPONSE</Text>
              <Text style={styles.statValue}>{overview.system.apiResponseTime}ms</Text>
              <Text style={styles.statSub}>Error rate: {overview.system.errorRate}%</Text>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Categories</Text><Text style={styles.sectionSub}>Revenue by product category (tap for details)</Text></View></View>
        <View style={styles.categoryCard}>
          {displayedCategories.map((cat, index) => (
            <Pressable key={cat.category} onPress={() => setSelectedCategory(cat)} style={[styles.categoryRow, index > 0 && styles.categoryRowBorder]}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{cat.category}</Text>
                <Text style={styles.categoryMeta}>{cat.itemsSold} items · {cat.uniqueProducts} products</Text>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryRevenue}>₦{cat.revenue.toLocaleString()}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
            </Pressable>
          ))}
          {categories.length === 0 && <View style={styles.empty}><Text style={styles.emptyText}>No category data available.</Text></View>}
          {categories.length > 10 && (
            <Pressable onPress={() => setCategoriesExpanded(!categoriesExpanded)} style={styles.expandButton}>
              <Text style={styles.expandButtonText}>{categoriesExpanded ? 'Show Less' : `Show All (${categories.length})`}</Text>
              <Ionicons name={categoriesExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.purple600} />
            </Pressable>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedCategory}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCategory(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedCategory(null)}>
          <SafeAreaView style={styles.modalContent} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCategory?.category}</Text>
              <Pressable onPress={() => setSelectedCategory(null)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>
            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Ionicons name="cash-outline" size={24} color={colors.purple600} />
                <Text style={styles.modalStatLabel}>Revenue</Text>
                <Text style={styles.modalStatValue}>₦{selectedCategory?.revenue.toLocaleString()}</Text>
              </View>
              <View style={styles.modalStat}>
                <Ionicons name="cart-outline" size={24} color={colors.yellowDeep} />
                <Text style={styles.modalStatLabel}>Items Sold</Text>
                <Text style={styles.modalStatValue}>{selectedCategory?.itemsSold}</Text>
              </View>
              <View style={styles.modalStat}>
                <Ionicons name="grid-outline" size={24} color={colors.success} />
                <Text style={styles.modalStatLabel}>Products</Text>
                <Text style={styles.modalStatValue}>{selectedCategory?.uniqueProducts}</Text>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>Category performance metrics</Text>
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  statCard: { width: '48%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginBottom: 4 },
  statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9, color: colors.slate },
  statValue: { marginTop: 8, fontSize: 24, fontWeight: '900', color: colors.ink },
  statSub: { marginTop: 4, fontSize: 9, fontWeight: '600', color: colors.muted },
  sectionHeader: { marginTop: 18, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: colors.ink },
  sectionSub: { marginTop: 2, fontSize: 9, fontWeight: '600', color: colors.muted },
  categoryCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  categoryRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 13, fontWeight: '800', color: colors.ink },
  categoryMeta: { fontSize: 10, fontWeight: '600', color: colors.muted, marginTop: 2 },
  categoryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryRevenue: { fontSize: 14, fontWeight: '900', color: colors.purple600 },
  expandButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  expandButtonText: { fontSize: 11, fontWeight: '800', color: colors.purple600 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.ink },
  closeButton: { padding: 4 },
  modalStats: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingBottom: 20 },
  modalStat: { flex: 1, alignItems: 'center', backgroundColor: colors.purple50, borderRadius: 16, padding: 16 },
  modalStatLabel: { fontSize: 10, fontWeight: '700', color: colors.slate, marginTop: 8 },
  modalStatValue: { fontSize: 18, fontWeight: '900', color: colors.ink, marginTop: 4 },
  modalFooter: { alignItems: 'center' },
  modalFooterText: { fontSize: 10, fontWeight: '600', color: colors.muted },
  error: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: colors.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 8 }, errorText: { flex: 1, color: colors.danger, fontSize: 10, fontWeight: '700' },
  empty: { padding: 25, alignItems: 'center' },
  emptyText: { fontSize: 11, color: colors.slate },
});

import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/src/components/Header';
import { VerticalFilter } from '@/src/components/VerticalFilter';
import { MetricCard } from '@/src/components/MetricCard';
import { AlertRow } from '@/src/components/AlertRow';
import { LogisticsMap } from '@/src/components/LogisticsMap';
import { ServiceStatus } from '@/src/components/ServiceStatus';
import { fetchOverview, fetchCategories, fetchProducts } from '@/src/services/api';
import { connectSocket } from '@/src/services/socket';
import { OverviewData, CategoryData, ProductsData, Vertical } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/auth/AuthProvider';

export default function CommandCenterScreen() {
  const { session, loading } = useAuth();
  const [vertical, setVertical] = useState<Vertical>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductsData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const [nextOverview, nextCategories, nextProducts] = await Promise.all([
        fetchOverview(),
        fetchCategories(),
        fetchProducts()
      ]);
      setOverview(nextOverview);
      setCategories(nextCategories);
      setProducts(nextProducts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect to the Nexus API.');
    }
  };

  useEffect(() => {
    if (!session) return;
    void load();
  }, [session]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const displayedCategories = useMemo(() => categoriesExpanded ? categories : categories.slice(0, 5), [categories, categoriesExpanded]);
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

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Operations Overview</Text><Text style={styles.sectionSub}>Real-time operational metrics</Text></View><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View></View>
        
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

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Top Categories</Text><Text style={styles.sectionSub}>Revenue by product category (tap for details)</Text></View></View>
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
          {categories.length > 5 && (
            <Pressable onPress={() => setCategoriesExpanded(!categoriesExpanded)} style={styles.expandButton}>
              <Text style={styles.expandButtonText}>{categoriesExpanded ? 'Show Less' : `Show All (${categories.length})`}</Text>
              <Ionicons name={categoriesExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.purple600} />
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Product Statistics</Text><Text style={styles.sectionSub}>All-time and today's performance</Text></View></View>
        {products && (
          <View style={styles.insightGrid}>
            <View style={styles.insightCard}>
              <View style={styles.insightTop}><Text style={styles.insightLabel}>TOTAL PRODUCTS</Text><Ionicons name="cube-outline" size={17} color={colors.purple600} /></View>
              <Text style={styles.insightValue}>{products.allTime.total}</Text>
              <Text style={styles.insightMeta}>{products.allTime.available} available · {products.allTime.unavailable} unavailable</Text>
            </View>
            <View style={styles.insightCard}>
              <View style={styles.insightTop}><Text style={styles.insightLabel}>TODAY'S SALES</Text><Ionicons name="cart-outline" size={17} color={colors.yellowDeep} /></View>
              <Text style={styles.insightValue}>₦{products.today.revenue.toLocaleString()}</Text>
              <Text style={styles.insightMeta}>{products.today.sold} sold · {products.today.uniqueSold} unique</Text>
            </View>
          </View>
        )}

        <View style={styles.footnote}><Ionicons name="shield-checkmark-outline" size={16} color={colors.purple600} /><Text style={styles.footnoteText}>Nexus operates independently and receives normalized events from Cushy Access systems and approved external integrations.</Text></View>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginBottom: 4 },
  statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9, color: colors.slate },
  statValue: { marginTop: 8, fontSize: 24, fontWeight: '900', color: colors.ink },
  statSub: { marginTop: 4, fontSize: 9, fontWeight: '600', color: colors.muted },
  insightGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  insightCard: { flex: 1, minHeight: 140, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14 },
  insightTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insightLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9, color: colors.slate },
  insightValue: { marginTop: 10, fontSize: 29, fontWeight: '900', color: colors.ink },
  insightMeta: { marginTop: 1, fontSize: 9, fontWeight: '600', color: colors.muted },
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
  error: { marginTop: 3, padding: 11, borderRadius: 12, backgroundColor: colors.dangerSoft, flexDirection: 'row', gap: 8, alignItems: 'center' },
  errorText: { flex: 1, color: colors.danger, fontSize: 10, fontWeight: '700' },
  empty: { padding: 25, alignItems: 'center' },
  emptyText: { fontSize: 11, color: colors.slate },
  footnote: { marginTop: 16, padding: 12, borderRadius: 14, backgroundColor: colors.purple50, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  footnoteText: { flex: 1, fontSize: 9, lineHeight: 14, color: colors.slate, fontWeight: '600' },
});

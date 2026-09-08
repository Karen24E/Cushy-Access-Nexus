import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { Link } from 'expo-router';
import { Colors, Spacing, Radius, API_BASE } from '../src/constants/theme';
import { formatNumber, formatCurrency, formatTime } from '../src/utils/format';

type CategoryRevenue = {
  category?: string;
  revenue?: number;
  itemsSold?: number;
  uniqueProducts?: number;
};

export default function OperationsScreen() {
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [productStats, setProductStats] = useState<any>(null);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextRefreshIn, setNextRefreshIn] = useState(30);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDashboard = async () => {
    try {
      const [categoriesResponse, productsResponse, ordersResponse] = await Promise.all([
        fetch(`${API_BASE}/monitoring/operations/products/categories`),
        fetch(`${API_BASE}/monitoring/operations/products`),
        fetch(`${API_BASE}/monitoring/operations/orders`),
      ]);

      if (!categoriesResponse.ok) {
        throw new Error(`Failed to load data. Status: ${categoriesResponse.status}`);
      }

      const categoriesData = (await categoriesResponse.json()) as CategoryRevenue[];
      const sortedData = (Array.isArray(categoriesData) ? categoriesData : []).sort(
        (a, b) => (b.revenue || 0) - (a.revenue || 0)
      );
      setCategoryRevenue(sortedData);

      if (productsResponse.ok) setProductStats(await productsResponse.json());
      if (ordersResponse.ok) setOrderStats(await ordersResponse.json());

      setLastUpdated(new Date());
      setNextRefreshIn(30);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    refreshIntervalRef.current = setInterval(loadDashboard, 30000);
    countdownIntervalRef.current = setInterval(() => {
      setNextRefreshIn((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const totalRevenue = categoryRevenue.reduce((sum, cat) => sum + (cat.revenue || 0), 0);
  const totalItemsSold = categoryRevenue.reduce((sum, cat) => sum + (cat.itemsSold || 0), 0);
  const topCategory = categoryRevenue[0];
  const topCategories = categoryRevenue.slice(0, 10);
  const remainingCategories = categoryRevenue.slice(10);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDashboard} tintColor={Colors.primary} />
        }
      >
        <View style={styles.headerWrap}>
          <Text style={styles.kicker}>COMMAND CENTER</Text>
          <Text style={styles.heading}>Cushy Access Nexus</Text>
          <Text style={styles.subheading}>Product & order performance overview</Text>
          <View style={styles.refreshInfo}>
            <Text style={styles.refreshTime}>Updated: {formatTime(lastUpdated)}</Text>
            <Text style={styles.refreshCountdown}>Next refresh: {nextRefreshIn}s</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Link href="/email-test" asChild>
            <TouchableOpacity style={styles.emailTestButton}>
              <Text style={styles.emailTestButtonText}>📧 Email Testing & Logs</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {loading && categoryRevenue.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading command center...</Text>
          </View>
        ) : error ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Connection issue</Text>
            <Text style={styles.warningText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, styles.accentPurple]}>
                <Text style={styles.summaryLabel}>Total Revenue</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
              </View>
              <View style={[styles.summaryCard, styles.accentYellow]}>
                <Text style={styles.summaryLabel}>Top Category</Text>
                <Text style={styles.summaryValueSmall}>{topCategory?.category || 'N/A'}</Text>
                <Text style={styles.summarySubtext}>{formatCurrency(topCategory?.revenue)}</Text>
              </View>
              <View style={[styles.summaryCard, styles.accentPurple]}>
                <Text style={styles.summaryLabel}>Items Sold</Text>
                <Text style={styles.summaryValue}>{formatNumber(totalItemsSold)}</Text>
              </View>
              <View style={[styles.summaryCard, styles.accentYellow]}>
                <Text style={styles.summaryLabel}>Categories</Text>
                <Text style={styles.summaryValue}>{categoryRevenue.length}</Text>
              </View>
            </View>

            {(productStats || orderStats) && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Live Backend Metrics</Text>
                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricVal}>{formatNumber(productStats?.allTime?.total)}</Text>
                    <Text style={styles.metricLbl}>Products</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricVal}>{formatNumber(orderStats?.allTime?.total)}</Text>
                    <Text style={styles.metricLbl}>Orders</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricVal}>{formatNumber(orderStats?.allTime?.pending)}</Text>
                    <Text style={styles.metricLbl}>Pending</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Top Performing Categories</Text>
              {topCategories.length === 0 ? (
                <Text style={styles.emptyText}>No category data yet</Text>
              ) : (
                topCategories.map((category, index) => {
                  const revenuePercentage = topCategory?.revenue
                    ? ((category.revenue || 0) / topCategory.revenue) * 100
                    : 0;
                  return (
                    <View key={category.category || index} style={styles.categoryCard}>
                      <View style={styles.categoryHeader}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankNumber}>#{index + 1}</Text>
                        </View>
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryName}>{category.category || 'Unknown'}</Text>
                          <Text style={styles.categoryStats}>
                            {formatNumber(category.itemsSold)} items • {category.uniqueProducts} products
                          </Text>
                        </View>
                        <View style={styles.categoryRevenue}>
                          <Text style={styles.revenueAmount}>{formatCurrency(category.revenue)}</Text>
                        </View>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${Math.min(revenuePercentage, 100)}%` }]} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {remainingCategories.length > 0 && (
              <View style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.expandableHeader}
                  onPress={() => setShowAllCategories(!showAllCategories)}
                >
                  <Text style={styles.sectionTitle}>
                    Other Categories ({remainingCategories.length})
                  </Text>
                  <Text style={styles.expandIcon}>{showAllCategories ? '▼' : '▶'}</Text>
                </TouchableOpacity>
                {showAllCategories && (
                  <View style={styles.expandedContent}>
                    {remainingCategories.map((category, index) => (
                      <View key={category.category || index} style={styles.compactCategoryCard}>
                        <View style={styles.compactCategoryInfo}>
                          <Text style={styles.compactCategoryName}>{category.category || 'Unknown'}</Text>
                          <Text style={styles.compactCategoryStats}>
                            {formatNumber(category.itemsSold)} items
                          </Text>
                        </View>
                        <Text style={styles.compactRevenue}>{formatCurrency(category.revenue)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 32 },
  headerWrap: { marginBottom: 20 },
  refreshInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  refreshTime: { color: Colors.textSecondary, fontSize: 11, fontWeight: '500' },
  refreshCountdown: { color: Colors.primary, fontSize: 11, fontWeight: '600' },
  kicker: {
    color: Colors.accentDark,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heading: { color: Colors.primary, fontSize: 26, fontWeight: '800', marginTop: 4 },
  subheading: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  emailTestButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emailTestButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    minHeight: 90,
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
  },
  accentPurple: { borderColor: Colors.primaryLight },
  accentYellow: { borderColor: Colors.accent },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginBottom: 6 },
  summaryValue: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  summaryValueSmall: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  summarySubtext: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: { color: Colors.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metric: { alignItems: 'center' },
  metricVal: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  metricLbl: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  categoryCard: {
    backgroundColor: Colors.offWhite,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  categoryInfo: { flex: 1 },
  categoryName: { color: Colors.text, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  categoryStats: { color: Colors.textSecondary, fontSize: 12 },
  categoryRevenue: { alignItems: 'flex-end' },
  revenueAmount: { color: Colors.success, fontSize: 16, fontWeight: '700' },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  expandableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expandIcon: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  expandedContent: { marginTop: 12 },
  compactCategoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  compactCategoryInfo: { flex: 1 },
  compactCategoryName: { color: Colors.text, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  compactCategoryStats: { color: Colors.textSecondary, fontSize: 11 },
  compactRevenue: { color: Colors.success, fontSize: 14, fontWeight: '600' },
  loadingBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14 },
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningTitle: { color: Colors.error, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  warningText: { color: '#991B1B', fontSize: 13 },
  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', padding: 12 },
});

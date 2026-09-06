import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';

const API_BASE = 'https://cushyaccessbackend-1.onrender.com';

type CategoryRevenue = {
  category?: string;
  revenue?: number;
  itemsSold?: number;
  uniqueProducts?: number;
};

const formatNumber = (value: unknown) => {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue.toLocaleString() : '0';
};

const formatCurrency = (value: unknown) => {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? `₦${numberValue.toLocaleString()}` : '₦0';
};

export default function Dashboard() {
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextRefreshIn, setNextRefreshIn] = useState(30);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const refreshIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const loadDashboard = async () => {
    try {
      console.log('Loading dashboard from:', API_BASE);
      
      const categoriesResponse = await fetch(
        `${API_BASE}/monitoring/operations/products/categories`
      );

      console.log('Response status:', categoriesResponse.status);

      if (!categoriesResponse.ok) {
        throw new Error(`Failed to load data. Status: ${categoriesResponse.status}`);
      }

      const categoriesData = (await categoriesResponse.json()) as CategoryRevenue[];

      console.log('Data loaded successfully');

      // Sort by revenue (highest to lowest)
      const sortedData = categoriesData.sort((a, b) => 
        (b.revenue || 0) - (a.revenue || 0)
      );

      setCategoryRevenue(sortedData);
      setLastUpdated(new Date());
      setNextRefreshIn(30);
      setError(null);
    } catch (loadError) {
      console.error('Load error:', loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    refreshIntervalRef.current = setInterval(() => {
      loadDashboard();
    }, 30000);

    countdownIntervalRef.current = setInterval(() => {
      setNextRefreshIn((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Calculate summary statistics
  const totalRevenue = categoryRevenue.reduce((sum, cat) => sum + (cat.revenue || 0), 0);
  const totalItemsSold = categoryRevenue.reduce((sum, cat) => sum + (cat.itemsSold || 0), 0);
  const topCategory = categoryRevenue[0];
  const topCategories = categoryRevenue.slice(0, 10);
  const remainingCategories = categoryRevenue.slice(10);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerWrap}>
          <Text style={styles.kicker}>Category Revenue</Text>
          <Text style={styles.heading}>Cushy Diagnostics</Text>
          <Text style={styles.subheading}>Product category performance overview</Text>
          <View style={styles.refreshInfo}>
            <Text style={styles.refreshTime}>
              Updated: {formatTime(lastUpdated)}
            </Text>
            <Text style={styles.refreshCountdown}>
              Next refresh: {nextRefreshIn}s
            </Text>
          </View>
        </View>

        {/* Email Testing Link */}
        <View style={styles.sectionCard}>
          <Link href="/email-test" asChild>
            <TouchableOpacity style={styles.emailTestButton}>
              <Text style={styles.emailTestButtonText}>📧 Email Testing & Logs</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : error ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Connection issue</Text>
            <Text style={styles.warningText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Summary Statistics */}
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, styles.accentBlue]}>
                <Text style={styles.summaryLabel}>Total Revenue</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
              </View>

              <View style={[styles.summaryCard, styles.accentGreen]}>
                <Text style={styles.summaryLabel}>Top Category</Text>
                <Text style={styles.summaryValueSmall}>{topCategory?.category || 'N/A'}</Text>
                <Text style={styles.summarySubtext}>{formatCurrency(topCategory?.revenue)}</Text>
              </View>

              <View style={[styles.summaryCard, styles.accentPurple]}>
                <Text style={styles.summaryLabel}>Total Items Sold</Text>
                <Text style={styles.summaryValue}>{formatNumber(totalItemsSold)}</Text>
              </View>

              <View style={[styles.summaryCard, styles.accentOrange]}>
                <Text style={styles.summaryLabel}>Total Categories</Text>
                <Text style={styles.summaryValue}>{categoryRevenue.length}</Text>
              </View>
            </View>

            {/* Top 10 Categories */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Top Performing Categories</Text>
              {topCategories.map((category, index) => {
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
                      <View style={[styles.progressBar, { width: `${revenuePercentage}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Remaining Categories */}
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerWrap: {
    marginBottom: 20,
  },
  refreshInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  refreshTime: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  refreshCountdown: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '600',
  },
  kicker: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heading: {
    color: '#1e293b',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  subheading: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  emailTestButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emailTestButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBlue: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  accentGreen: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  accentPurple: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  accentOrange: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 6,
  },
  summaryValue: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
  },
  summaryValueSmall: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '700',
  },
  summarySubtext: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryStats: {
    color: '#64748b',
    fontSize: 12,
  },
  categoryRevenue: {
    alignItems: 'flex-end',
  },
  revenueAmount: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 12,
  },
  compactCategoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  compactCategoryInfo: {
    flex: 1,
  },
  compactCategoryName: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactCategoryStats: {
    color: '#64748b',
    fontSize: 11,
  },
  compactRevenue: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 14,
  },
  warningCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  warningTitle: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  warningText: {
    color: '#991b1b',
    fontSize: 13,
  },
});
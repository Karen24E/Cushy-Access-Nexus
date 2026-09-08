import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import Logo from '../../src/components/Logo';
import { Colors, Spacing, Radius, API_BASE } from '../../src/constants/theme';
import { formatCurrency, formatNumber } from '../../src/utils/format';

const modules = [
  {
    id: 'qcommerce',
    title: 'Q-Commerce',
    subtitle: 'Instant commerce engine',
    icon: '⚡',
    route: '/qcommerce',
    color: '#7C3AED',
  },
  {
    id: 'healthtech',
    title: 'HealthTech',
    subtitle: 'Care delivery & diagnostics',
    icon: '🏥',
    route: '/healthtech',
    color: '#5B21B6',
  },
  {
    id: 'foodtech',
    title: 'FoodTech',
    subtitle: 'Supply & kitchen ops',
    icon: '🍽️',
    route: '/foodtech',
    color: '#6D28D9',
  },
  {
    id: 'logistics',
    title: 'Logistics',
    subtitle: 'Fleet & last-mile',
    icon: '🚚',
    route: '/logistics',
    color: '#4C1D95',
  },
  {
    id: 'operations',
    title: 'Command & Ops',
    subtitle: 'Live command center',
    icon: '🎯',
    route: '/operations',
    color: '#5B21B6',
  },
  {
    id: 'email',
    title: 'Email Monitoring',
    subtitle: 'Test & logs',
    icon: '📧',
    route: '/email-test',
    color: '#7C3AED',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [productStats, setProductStats] = useState<any>(null);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scaleAnims = useRef(modules.map(() => new Animated.Value(0.9))).current;
  const opacityAnims = useRef(modules.map(() => new Animated.Value(0))).current;

  const loadQuickStats = async () => {
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch(`${API_BASE}/monitoring/operations/products`),
        fetch(`${API_BASE}/monitoring/operations/orders`),
      ]);
      if (prodRes.ok) setProductStats(await prodRes.json());
      if (orderRes.ok) setOrderStats(await orderRes.json());
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadQuickStats();
    const anims = modules.map((_, i) =>
      Animated.parallel([
        Animated.timing(scaleAnims[i], {
          toValue: 1,
          duration: 450,
          delay: i * 80,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnims[i], {
          toValue: 1,
          duration: 400,
          delay: i * 80,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(60, anims).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuickStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <View style={styles.welcome}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'Operator'}</Text>
          <Text style={styles.subGreeting}>Command your modules</Text>
        </View>
        <Logo size="sm" showText={false} animated />
      </View>

      {/* Live pulse strip */}
      <View style={styles.pulseStrip}>
        <View style={styles.pulseDot} />
        <Text style={styles.pulseText}>LIVE · Connected to Cushy Access Backend</Text>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: Colors.accent }]}>
          <Text style={styles.statLabel}>Products</Text>
          <Text style={styles.statValue}>
            {formatNumber(productStats?.allTime?.total ?? '—')}
          </Text>
          <Text style={styles.statSub}>
            {formatNumber(productStats?.allTime?.available ?? 0)} available
          </Text>
        </View>
        <View style={[styles.statCard, { borderColor: Colors.primaryLight }]}>
          <Text style={styles.statLabel}>Orders</Text>
          <Text style={styles.statValue}>
            {formatNumber(orderStats?.allTime?.total ?? '—')}
          </Text>
          <Text style={styles.statSub}>
            {formatNumber(orderStats?.allTime?.completed ?? 0)} completed
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Modules</Text>
      <View style={styles.grid}>
        {modules.map((m, i) => (
          <Animated.View
            key={m.id}
            style={{
              width: '48%',
              opacity: opacityAnims[i],
              transform: [{ scale: scaleAnims[i] }],
            }}
          >
            <TouchableOpacity
              style={styles.moduleCard}
              activeOpacity={0.85}
              onPress={() => router.push(m.route as any)}
            >
              <View style={[styles.moduleIcon, { backgroundColor: m.color + '18' }]}>
                <Text style={styles.moduleEmoji}>{m.icon}</Text>
              </View>
              <Text style={styles.moduleTitle}>{m.title}</Text>
              <Text style={styles.moduleSub}>{m.subtitle}</Text>
              <View style={[styles.moduleAccent, { backgroundColor: m.color }]} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  welcome: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  subGreeting: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pulseStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 8,
  },
  pulseText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  statSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  moduleCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  moduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  moduleEmoji: {
    fontSize: 22,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  moduleSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  moduleAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
});

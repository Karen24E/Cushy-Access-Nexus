import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Logo from '../src/components/Logo';
import { Colors, Spacing, Radius } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const features = [
  { icon: '⚡', title: 'Q-Commerce', desc: 'Ultra-fast commerce operations' },
  { icon: '🏥', title: 'HealthTech', desc: 'Healthcare delivery & monitoring' },
  { icon: '🍽️', title: 'FoodTech', desc: 'Food supply chain intelligence' },
  { icon: '🚚', title: 'Logistics', desc: 'Fleet & delivery command center' },
  { icon: '🎯', title: 'Operations', desc: 'Real-time command & control' },
];

export default function LandingScreen() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const featureAnims = useRef(features.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const staggered = featureAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 400 + i * 120,
        useNativeDriver: true,
      })
    );
    Animated.stagger(80, staggered).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          <Logo size="xl" animated />
          <Text style={styles.tagline}>
            Unified Command Platform for Commerce, Health, Food & Logistics
          </Text>
        </Animated.View>
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Power Modules</Text>
        {features.map((f, i) => (
          <Animated.View
            key={f.title}
            style={[
              styles.featureCard,
              {
                opacity: featureAnims[i],
                transform: [
                  {
                    translateY: featureAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>{f.icon}</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </Animated.View>
        ))}

        <View style={styles.ctaBlock}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 Cushy Access Nexus · Secure Operations</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  hero: {
    paddingTop: 72,
    paddingBottom: 28,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  tagline: {
    marginTop: 16,
    color: Colors.white,
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    padding: Spacing.lg,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ctaBlock: {
    marginTop: 24,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 28,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 11,
  },
});

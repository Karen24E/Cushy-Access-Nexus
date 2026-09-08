import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import Logo from '../../src/components/Logo';
import { Colors, Spacing, Radius } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/landing');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Logo size="lg" showText={false} />
        <Text style={styles.name}>{user?.name || 'Operator'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{(user?.role || 'operator').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>User ID</Text>
          <Text style={styles.rowValue}>{user?.id?.slice(0, 12)}…</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Platform</Text>
          <Text style={styles.rowValue}>Cushy Access Nexus</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Backend</Text>
          <Text style={styles.rowValue}>Live · Render</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 12,
  },
  name: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  email: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  badge: {
    marginTop: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowLabel: { fontSize: 13, color: Colors.textSecondary },
  rowValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  logoutBtn: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 15,
  },
});

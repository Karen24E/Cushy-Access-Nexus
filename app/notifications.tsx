import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Radius, Spacing, API_BASE } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';

export default function NotificationsScreen() {
  const { user, expoPushToken, refreshExpoPushToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleRefreshToken = async () => {
    setRefreshing(true);
    setStatus(null);
    try {
      const token = await refreshExpoPushToken();
      setStatus(token ? 'Token generated and registered with the backend.' : 'Token was not generated.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not register this device.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendTest = async () => {
    if (!user?.accessToken) {
      Alert.alert('Sign in required', 'Sign in before sending a test push notification.');
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/notifications/send-me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cushy-access-key': `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          title: 'Cushy Access Nexus test',
          body: 'Remote push notification reached your device.',
          data: { type: 'PUSH_TEST' },
        }),
      });
      const result = await response.json().catch(() => ({})) as { sent?: number; message?: string };
      if (!response.ok) throw new Error(result.message || `Push request failed (HTTP ${response.status}).`);
      setStatus(result.sent
        ? `Backend accepted the push for ${result.sent} registered device(s).`
        : result.message || 'No registered Expo push token was found for this account.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send the test push.');
    } finally {
      setSending(false);
    }
  };

  const handleViewToken = () => {
    if (!expoPushToken) {
      Alert.alert('Token not available', 'Refresh the token first. This requires a signed-in user and an Android development build with notification permission.');
      return;
    }
    Alert.alert('Expo Push Token', expoPushToken, [{ text: 'Close' }]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.title}>Remote Push Test</Text>
        <Text style={styles.subtitle}>
          Signed in as {user?.email || 'no user'}. The backend sends Expo push tokens through Expo’s push service.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Registered Expo push token</Text>
        <Text selectable style={styles.token}>
          {expoPushToken || 'No token yet. Sign in and allow notifications, or tap Refresh Token.'}
        </Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleViewToken}>
          <Text style={styles.secondaryButtonText}>View token</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRefreshToken} disabled={refreshing}>
          {refreshing ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.secondaryButtonText}>Refresh and register token</Text>}
        </TouchableOpacity>
      </View>

      <View style={[styles.card, styles.testCard]}>
        <Text style={styles.label}>Send a test push</Text>
        <Text style={styles.note}>
          Sends to the devices registered to this signed-in account. This does not broadcast to other users.
        </Text>
        <TouchableOpacity style={[styles.primaryButton, sending && styles.disabled]} onPress={handleSendTest} disabled={sending}>
          {sending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryButtonText}>Send remote push to this device</Text>}
        </TouchableOpacity>
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>

      <Text style={styles.footnote}>
        Remote notification tokens are supported in a development/production build, not Android Expo Go. Install the development build and enable notification permission to test.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  intro: { marginBottom: Spacing.md },
  title: { color: Colors.text, fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight },
  testCard: { marginTop: Spacing.md },
  label: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  token: { color: Colors.text, backgroundColor: Colors.offWhite, borderRadius: Radius.sm, padding: 12, fontSize: 12, lineHeight: 18 },
  secondaryButton: { minHeight: 44, marginTop: 10, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12 },
  secondaryButtonText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  note: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  primaryButton: { minHeight: 48, marginTop: 14, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.primary, paddingHorizontal: 12 },
  disabled: { opacity: 0.65 },
  primaryButtonText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  status: { marginTop: 12, color: Colors.text, fontSize: 13, lineHeight: 18 },
  footnote: { marginTop: Spacing.md, color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
});

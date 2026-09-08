import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Spacing, Radius, API_BASE } from '../src/constants/theme';

type EmailLog = {
  id?: string;
  timestamp?: string;
  recipient?: string;
  status?: string;
  subject?: string;
  error?: string;
  [key: string]: unknown;
};

type FilterOptions = {
  status?: string;
  email?: string;
  dateFrom?: string;
  dateTo?: string;
};

export default function EmailTestScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);

  const sendTestEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/monitoring/email/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send test email. Status: ${response.status}`);
      }

      await response.json();
      setSendSuccess(true);
      setEmail('');
      loadEmailLogs();
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  const loadEmailLogs = async () => {
    setLoadingLogs(true);
    setLogsError(null);

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.email) params.append('email', filters.email);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const queryString = params.toString();
      const url = `${API_BASE}/monitoring/email/logs${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load email logs. Status: ${response.status}`);
      }

      const data = await response.json();
      const logsArray = Array.isArray(data) ? data : data.data || [];
      setLogs(logsArray);
    } catch (error) {
      setLogsError(error instanceof Error ? error.message : 'Failed to load email logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
      case 'delivered':
        return Colors.success;
      case 'failed':
      case 'error':
        return Colors.error;
      case 'pending':
      case 'queued':
        return Colors.warning;
      default:
        return Colors.textMuted;
    }
  };

  const clearFilters = () => {
    setFilters({});
    loadEmailLogs();
  };

  React.useEffect(() => {
    loadEmailLogs();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Send Test Email</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {sendError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{sendError}</Text>
            </View>
          )}

          {sendSuccess && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✓ Test email sent successfully!</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, sending && styles.buttonDisabled]}
            onPress={sendTestEmail}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Send Test Email</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Email Logs</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadEmailLogs} disabled={loadingLogs}>
              {loadingLogs ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.refreshButtonText}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
            <Text style={styles.filterToggleText}>
              {showFilters ? '▼ Hide Filters' : '▶ Show Filters'}
            </Text>
          </TouchableOpacity>

          {showFilters && (
            <View style={styles.filtersContainer}>
              <Text style={styles.filterLabel}>Filter by Status</Text>
              <View style={styles.filterOptions}>
                {['All', 'Sent', 'Failed', 'Pending'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      (filters.status === status.toLowerCase() ||
                        (status === 'All' && !filters.status)) &&
                        styles.filterChipActive,
                    ]}
                    onPress={() => {
                      const newStatus = status === 'All' ? undefined : status.toLowerCase();
                      setFilters({ ...filters, status: newStatus });
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        (filters.status === status.toLowerCase() ||
                          (status === 'All' && !filters.status)) &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Filter by Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email to filter"
                placeholderTextColor={Colors.textMuted}
                value={filters.email || ''}
                onChangeText={(text) => setFilters({ ...filters, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.filterActions}>
                <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={clearFilters}>
                  <Text style={styles.buttonTextSecondary}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={loadEmailLogs}>
                  <Text style={styles.buttonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {logsError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{logsError}</Text>
            </View>
          )}

          {loadingLogs && logs.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading email logs...</Text>
            </View>
          ) : logs.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No email logs found</Text>
            </View>
          ) : (
            <View style={styles.logsContainer}>
              {logs.map((log, index) => (
                <View key={log.id || index} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logRecipient}>{log.recipient || 'Unknown'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(log.status) }]}>
                      <Text style={styles.statusText}>{log.status || 'Unknown'}</Text>
                    </View>
                  </View>
                  <Text style={styles.logTimestamp}>{formatTimestamp(log.timestamp)}</Text>
                  {log.subject && <Text style={styles.logSubject}>Subject: {log.subject}</Text>}
                  {log.error && <Text style={styles.logError}>Error: {log.error}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: Colors.textMuted },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  buttonSecondary: { backgroundColor: Colors.borderLight, flex: 1, marginRight: 8 },
  buttonTextSecondary: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { color: Colors.error, fontSize: 13 },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successText: { color: Colors.success, fontSize: 13, fontWeight: '500' },
  refreshButton: { paddingHorizontal: 12, paddingVertical: 6 },
  refreshButtonText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  filterToggle: { paddingVertical: 8 },
  filterToggleText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  filtersContainer: {
    backgroundColor: Colors.offWhite,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  filterLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 8,
  },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  filterChip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  filterChipTextActive: { color: Colors.white },
  filterActions: { flexDirection: 'row', marginTop: 12 },
  loadingBox: { padding: 24, alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14 },
  emptyBox: { padding: 24, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  logsContainer: { gap: 8 },
  logCard: {
    backgroundColor: Colors.offWhite,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logRecipient: { color: Colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  logTimestamp: { color: Colors.textSecondary, fontSize: 11, marginBottom: 4 },
  logSubject: { color: Colors.textSecondary, fontSize: 12, marginBottom: 2 },
  logError: { color: Colors.error, fontSize: 12 },
});

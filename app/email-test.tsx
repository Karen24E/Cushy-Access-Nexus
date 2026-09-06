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
import { useRouter } from 'expo-router';

const API_BASE = 'https://cushyaccessbackend-1.onrender.com';

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
  const router = useRouter();
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send test email. Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Test email sent:', result);
      setSendSuccess(true);
      setEmail('');
      
      // Refresh logs after sending
      loadEmailLogs();
      
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.error('Error sending test email:', error);
      setSendError(
        error instanceof Error ? error.message : 'Failed to send test email'
      );
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
      console.log('Email logs loaded:', data);
      
      // Handle different response formats
      const logsArray = Array.isArray(data) ? data : data.data || [];
      setLogs(logsArray);
    } catch (error) {
      console.error('Error loading email logs:', error);
      setLogsError(
        error instanceof Error ? error.message : 'Failed to load email logs'
      );
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
      case 'delivered':
        return '#10b981';
      case 'failed':
      case 'error':
        return '#ef4444';
      case 'pending':
      case 'queued':
        return '#f59e0b';
      default:
        return '#64748b';
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
        {/* Send Test Email Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Send Test Email</Text>
          
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
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
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Send Test Email</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Email Logs Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Email Logs</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadEmailLogs}
              disabled={loadingLogs}
            >
              {loadingLogs ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text style={styles.refreshButtonText}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Filter Toggle */}
          <TouchableOpacity
            style={styles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterToggleText}>
              {showFilters ? '▼ Hide Filters' : '▶ Show Filters'}
            </Text>
          </TouchableOpacity>

          {/* Filters */}
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
                       (status === 'All' && !filters.status)) && styles.filterChipActive
                    ]}
                    onPress={() => {
                      const newStatus = status === 'All' ? undefined : status.toLowerCase();
                      setFilters({ ...filters, status: newStatus });
                    }}
                  >
                    <Text style={[
                      styles.filterChipText,
                      (filters.status === status.toLowerCase() || 
                       (status === 'All' && !filters.status)) && styles.filterChipTextActive
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Filter by Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email to filter"
                value={filters.email || ''}
                onChangeText={(text) => setFilters({ ...filters, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={clearFilters}
                >
                  <Text style={styles.buttonTextSecondary}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={loadEmailLogs}
                >
                  <Text style={styles.buttonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Logs List */}
          {logsError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{logsError}</Text>
            </View>
          )}

          {loadingLogs && logs.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#3b82f6" />
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
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(log.status) }
                    ]}>
                      <Text style={styles.statusText}>{log.status || 'Unknown'}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.logTimestamp}>{formatTimestamp(log.timestamp)}</Text>
                  
                  {log.subject && (
                    <Text style={styles.logSubject}>Subject: {log.subject}</Text>
                  )}
                  
                  {log.error && (
                    <Text style={styles.logError}>Error: {log.error}</Text>
                  )}
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#e2e8f0',
    flex: 1,
    marginRight: 8,
  },
  buttonTextSecondary: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '500',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  filterToggle: {
    paddingVertical: 8,
  },
  filterToggleText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  filterLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 14,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  logsContainer: {
    gap: 8,
  },
  logCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logRecipient: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  logTimestamp: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
  logSubject: {
    color: '#475569',
    fontSize: 12,
    marginBottom: 2,
  },
  logError: {
    color: '#dc2626',
    fontSize: 12,
  },
});
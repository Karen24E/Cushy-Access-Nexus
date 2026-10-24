import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  requestPermission,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import * as BackgroundTask from 'expo-background-task';
import * as Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { API_BASE, Colors } from '../constants/theme';
import { useAuth } from './AuthContext';

const CONFIG_KEY = '@cushy_nexus_endpoint_monitor';
const LAST_HEALTH_KEY = '@cushy_nexus_endpoint_monitor_last_health';
const LAST_RESULT_KEY = '@cushy_nexus_endpoint_monitor_last_result';
const PUSH_TOKEN_KEY = '@cushy_nexus_push_token';
const BACKGROUND_TASK_NAME = 'cushy-endpoint-health-check';
const EMAIL_SCHEDULE_KEY = '@cushy_nexus_email_schedule';
const EMAIL_BACKGROUND_TASK_NAME = 'cushy-email-schedule';
const EMAIL_TEST_ENDPOINT = 'https://cushyaccessbackend.onrender.com/monitoring/email/test';
const REQUEST_TIMEOUT_MS = 12_000;

try {
  setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    console.log('Background FCM push received:', remoteMessage);
  });
} catch {
  // Ignored on unsupported platforms or when messaging is uninitialized
}

export type MonitorConfig = {
  endpoint: string;
  intervalMinutes: number;
  enabled: boolean;
};

export type EndpointCheckResult = {
  healthy: boolean;
  statusCode?: number;
  error?: string;
  overallStatus?: string;
  services: Record<string, ServiceHealth>;
  checkedAt: number;
};

export type ServiceHealth = {
  status: string;
  responseTime?: number;
  provider?: string;
  check?: string;
};

export type EmailScheduleConfig = {
  recipient: string;
  intervalMinutes: number;
  enabled: boolean;
  lastRunAt: number;
};

type MonitorContextValue = {
  config: MonitorConfig;
  result: EndpointCheckResult | null;
  pushToken: string | null;
  isChecking: boolean;
  isReady: boolean;
  checkEndpointNow: (endpoint?: string) => Promise<EndpointCheckResult>;
  enableMonitoring: (endpoint: string, intervalMinutes: number) => Promise<void>;
  disableMonitoring: () => Promise<void>;
  refreshPushToken: () => Promise<string | null>;
  simulateAlert: (type: 'outage' | 'recovery') => Promise<void>;
  emailSchedule: EmailScheduleConfig | null;
  scheduleEmail: (recipient: string, intervalMinutes: number) => Promise<void>;
  stopEmailSchedule: () => Promise<void>;
};

const DEFAULT_CONFIG: MonitorConfig = {
  endpoint: `${API_BASE}/monitoring/health`,
  intervalMinutes: 15,
  enabled: false,
};

const MonitorContext = createContext<MonitorContextValue | undefined>(undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function prepareNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('endpoint-monitor', {
      name: 'Endpoint monitoring',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5B21B6',
    });
  }
}

async function requestNotificationPermission() {
  if (Platform.OS === 'web') {
    throw new Error('Endpoint notifications are available in the iOS and Android app.');
  }
  await prepareNotificationChannel();
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Enable notifications in your device settings to receive endpoint alerts.');
  }
}

function validateEndpoint(endpoint: string) {
  let parsed: URL;
  try {
    parsed = new URL(endpoint.trim());
  } catch {
    throw new Error('Enter a valid endpoint URL, including https://.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('The endpoint must use HTTP or HTTPS.');
  }
  return parsed.toString();
}

async function probeEndpoint(endpoint: string): Promise<EndpointCheckResult> {
  const checkedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, { method: 'GET', signal: controller.signal });
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const body = payload && typeof payload === 'object'
      ? payload as { status?: unknown; services?: unknown }
      : null;
    const parsedServices: Record<string, ServiceHealth> = {};
    if (body?.services && typeof body.services === 'object' && !Array.isArray(body.services)) {
      for (const [name, rawService] of Object.entries(body.services)) {
        if (typeof rawService === 'string') {
          parsedServices[name] = { status: rawService.toLowerCase() };
        } else if (rawService && typeof rawService === 'object') {
          const service = rawService as Record<string, unknown>;
          if (typeof service.status === 'string') {
            parsedServices[name] = {
              status: service.status.toLowerCase(),
              ...(typeof service.responseTime === 'number' ? { responseTime: service.responseTime } : {}),
              ...(typeof service.provider === 'string' ? { provider: service.provider } : {}),
              ...(typeof service.check === 'string' ? { check: service.check } : {}),
            };
          }
        }
      }
    }

    if (!Object.keys(parsedServices).length) {
      parsedServices.endpoint = { status: response.ok ? 'up' : 'down' };
    } else if (!response.ok) {
      parsedServices.endpoint = { status: 'down' };
    }

    const hasIssue = Object.values(parsedServices).some(({ status }) =>
      status === 'down' || status === 'not_configured'
    );
    return {
      healthy: response.ok && !hasIssue,
      statusCode: response.status,
      ...(typeof body?.status === 'string' ? { overallStatus: body.status } : {}),
      services: parsedServices,
      checkedAt,
    };
  } catch (error) {
    return {
      healthy: false,
      services: { endpoint: { status: 'down' } },
      error: error instanceof Error && error.name === 'AbortError'
        ? 'Request timed out'
        : error instanceof Error
          ? error.message
          : 'Network request failed',
      checkedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function notify(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: Platform.OS === 'android' ? { channelId: 'endpoint-monitor' } : null,
  });
}

async function registerFirebasePushToken(userId?: string) {
  if (Platform.OS === 'web') return null;

  try {
    const messaging = getMessaging();
    const permission = await requestPermission(messaging);
    const enabled = permission === AuthorizationStatus.AUTHORIZED || permission === AuthorizationStatus.PROVISIONAL;
    if (!enabled) {
      throw new Error('Push permission was not granted.');
    }

    const expoConfig = ((Constants as any).expoConfig ?? (Constants as any).default?.expoConfig ?? null) as any;
    const projectId = typeof expoConfig?.extra?.eas?.projectId === 'string'
      ? expoConfig.extra.eas.projectId
      : undefined;

    const pushToken = await getToken(messaging);
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);

    if (projectId) {
      console.log('Firebase push token registered for project:', projectId);
    }

    if (!userId) return pushToken;

    try {
      const response = await fetch(`${API_BASE}/notifications/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pushToken, platform: Platform.OS, provider: 'firebase' }),
      });

      if (!response.ok) {
        console.warn('Push registration rejected by backend:', response.status);
      }
    } catch (error) {
      console.warn('Could not register Firebase push token with backend:', error);
    }

    return pushToken;
  } catch (error) {
    console.warn('Unable to register Firebase push token:', error);
    return null;
  }
}

async function checkAndNotify(endpoint: string): Promise<EndpointCheckResult> {
  const result = await probeEndpoint(endpoint);
  const previousRaw = await AsyncStorage.getItem(LAST_HEALTH_KEY);
  let previousServices: Record<string, string> = {};
  if (previousRaw) {
    try {
      const previous = JSON.parse(previousRaw) as { endpoint?: string; services?: Record<string, string> };
      if (previous.endpoint === endpoint && previous.services) previousServices = previous.services;
    } catch {
      // Ignore a health value saved by an older app version.
    }
  }
  const currentServices = Object.fromEntries(
    Object.entries(result.services).map(([name, service]) => [name, service.status]),
  );
  await AsyncStorage.setItem(LAST_HEALTH_KEY, JSON.stringify({ endpoint, services: currentServices }));
  await AsyncStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));

  const newIssues = Object.entries(currentServices)
    .filter(([name, status]) =>
      (status === 'down' || status === 'not_configured') && previousServices[name] !== status,
    )
    .map(([name, status]) => `${name}: ${status.replace('_', ' ')}`);
  const recoveredServices = Object.entries(currentServices)
    .filter(([name, status]) =>
      status === 'up' && (previousServices[name] === 'down' || previousServices[name] === 'not_configured'),
    )
    .map(([name]) => name);

  if (newIssues.length) {
    const overall = result.overallStatus ? `Overall status: ${result.overallStatus}.\n` : '';
    await notify('Service health issue', `${overall}${newIssues.join('\n')}`);
  }
  if (recoveredServices.length) {
    await notify('Service recovered', `${recoveredServices.join(', ')} ${recoveredServices.length === 1 ? 'is' : 'are'} responding again.`);
  }
  return result;
}

async function readStoredConfig(): Promise<MonitorConfig> {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const stored = JSON.parse(raw) as Partial<MonitorConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...stored,
      endpoint: stored.endpoint === `${API_BASE}/monitoring/operations/products`
        ? DEFAULT_CONFIG.endpoint
        : stored.endpoint || DEFAULT_CONFIG.endpoint,
      intervalMinutes: Math.max(1, Number(stored.intervalMinutes) || DEFAULT_CONFIG.intervalMinutes),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

if (!TaskManager.isTaskDefined(BACKGROUND_TASK_NAME)) {
  TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
    try {
      const config = await readStoredConfig();
      if (config.enabled) await checkAndNotify(config.endpoint);
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

async function registerBackgroundMonitor(intervalMinutes: number) {
  if (Platform.OS === 'web') return;
  const taskStatus = await BackgroundTask.getStatusAsync();
  if (taskStatus !== BackgroundTask.BackgroundTaskStatus.Available) return;
  if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME)) {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
  }
  await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
    minimumInterval: Math.max(15, intervalMinutes),
  });
}

async function unregisterBackgroundMonitor() {
  if (Platform.OS !== 'web' && await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME)) {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
  }
}

export function EndpointMonitorProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<MonitorConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<EndpointCheckResult | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [emailSchedule, setEmailSchedule] = useState<EmailScheduleConfig | null>(null);
  const [startupEmail, setStartupEmail] = useState('');
  const [startupEmailError, setStartupEmailError] = useState<string | null>(null);
  const [savingStartupEmail, setSavingStartupEmail] = useState(false);
  const [startupEmailDismissed, setStartupEmailDismissed] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const configRef = useRef(config);
  const checkInProgress = useRef(false);
  const emailRunInProgress = useRef(false);
  const emailScheduleRef = useRef<EmailScheduleConfig | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Local notification received:', notification);
    });
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Local notification tapped:', response.notification.request.content.title);
    });
    const foregroundMessageListener = onMessage(getMessaging(), async (remoteMessage: any) => {
      console.log('Firebase foreground message received:', remoteMessage);
      const title = remoteMessage?.notification?.title || remoteMessage?.data?.title || 'Push Notification Alert';
      const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || 'New health status alert received.';
      await notify(title, body);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
      foregroundMessageListener();
    };
  }, []);

  const refreshPushToken = useCallback(async () => {
    const token = await registerFirebasePushToken(user?.id);
    if (token) setPushToken(token);
    return token;
  }, [user?.id]);

  useEffect(() => {
    if (!isReady) return;
    void refreshPushToken().catch((error) => {
      console.warn('Unable to register Firebase push token:', error);
    });
  }, [isReady, refreshPushToken]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const [storedConfig, lastResult, storedPushToken, storedEmailSchedule] = await Promise.all([
        readStoredConfig(),
        AsyncStorage.getItem(LAST_RESULT_KEY),
        AsyncStorage.getItem(PUSH_TOKEN_KEY),
        readEmailSchedule(),
      ]);
      if (!mounted) return;
      configRef.current = storedConfig;
      setConfig(storedConfig);
      emailScheduleRef.current = storedEmailSchedule;
      setEmailSchedule(storedEmailSchedule);
      if (storedPushToken) setPushToken(storedPushToken);
      if (lastResult) {
        try {
          const stored = JSON.parse(lastResult) as Partial<EndpointCheckResult>;
          setResult({
            healthy: stored.healthy ?? false,
            checkedAt: stored.checkedAt ?? Date.now(),
            services: stored.services ?? {},
            ...stored,
          });
        } catch {
          // Ignore malformed cached results.
        }
      }
      setIsReady(true);
    })();
    return () => { mounted = false; };
  }, []);

  const checkEndpointNow = useCallback(async (endpoint?: string) => {
    const target = validateEndpoint(endpoint || configRef.current.endpoint);
    setIsChecking(true);
    checkInProgress.current = true;
    try {
      const nextResult = await probeEndpoint(target);
      await AsyncStorage.setItem(LAST_RESULT_KEY, JSON.stringify(nextResult));
      setResult(nextResult);
      return nextResult;
    } finally {
      setIsChecking(false);
      checkInProgress.current = false;
    }
  }, []);

  const runScheduledCheck = useCallback(async (endpoint = configRef.current.endpoint) => {
    if (checkInProgress.current) return;
    setIsChecking(true);
    checkInProgress.current = true;
    try {
      const nextResult = await checkAndNotify(endpoint);
      setResult(nextResult);
    } finally {
      setIsChecking(false);
      checkInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isReady || !config.enabled) return;
    void runScheduledCheck().catch(() => undefined);
    const interval = setInterval(() => {
      if (appState.current === 'active' && !checkInProgress.current) {
        void runScheduledCheck().catch(() => undefined);
      }
    }, config.intervalMinutes * 60_000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackgrounded = appState.current.match(/inactive|background/);
      appState.current = nextState;
      if (wasBackgrounded && nextState === 'active' && !checkInProgress.current) {
        void runScheduledCheck().catch(() => undefined);
      }
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [config.enabled, config.intervalMinutes, isReady, runScheduledCheck]);

  const runScheduledEmail = useCallback(async () => {
    if (emailRunInProgress.current) return;
    emailRunInProgress.current = true;
    try {
      await runEmailScheduleIfDue();
      const latestSchedule = await readEmailSchedule();
      emailScheduleRef.current = latestSchedule;
      setEmailSchedule(latestSchedule);
    } finally {
      emailRunInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isReady || !emailSchedule?.enabled) return;
    const interval = setInterval(() => {
      if (appState.current === 'active') void runScheduledEmail();
    }, emailSchedule.intervalMinutes * 60_000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackgrounded = appState.current.match(/inactive|background/);
      appState.current = nextState;
      if (wasBackgrounded && nextState === 'active') void runScheduledEmail();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [emailSchedule?.enabled, emailSchedule?.intervalMinutes, isReady, runScheduledEmail]);

  const scheduleEmail = useCallback(async (recipient: string, intervalMinutes: number) => {
    const normalizedRecipient = recipient.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRecipient)) {
      throw new Error('Enter a valid recipient email address.');
    }
    if (!Number.isFinite(intervalMinutes) || intervalMinutes < 1) {
      throw new Error('Choose an interval of at least 1 minute.');
    }

    await requestNotificationPermission();
    const nextSchedule: EmailScheduleConfig = {
      recipient: normalizedRecipient,
      intervalMinutes: Math.floor(intervalMinutes),
      enabled: true,
      lastRunAt: Date.now(),
    };
    await AsyncStorage.setItem(EMAIL_SCHEDULE_KEY, JSON.stringify(nextSchedule));
    emailScheduleRef.current = nextSchedule;
    setEmailSchedule(nextSchedule);
    try {
      await registerEmailBackgroundTask(nextSchedule.intervalMinutes);
    } catch {
      // Foreground scheduling remains available if the OS background scheduler is unavailable.
    }
  }, []);

  const stopEmailSchedule = useCallback(async () => {
    const current = emailScheduleRef.current;
    if (current) {
      const stoppedSchedule = { ...current, enabled: false };
      await AsyncStorage.setItem(EMAIL_SCHEDULE_KEY, JSON.stringify(stoppedSchedule));
      emailScheduleRef.current = stoppedSchedule;
      setEmailSchedule(stoppedSchedule);
    }
    await unregisterEmailBackgroundTask();
  }, []);

  const saveStartupEmail = useCallback(async () => {
    setSavingStartupEmail(true);
    setStartupEmailError(null);
    try {
      await scheduleEmail(startupEmail, 60);
    } catch (error) {
      setStartupEmailError(error instanceof Error ? error.message : 'Could not save this email address.');
    } finally {
      setSavingStartupEmail(false);
    }
  }, [scheduleEmail, startupEmail]);

  const enableMonitoring = useCallback(async (endpoint: string, intervalMinutes: number) => {
    const validEndpoint = validateEndpoint(endpoint);
    const safeInterval = Math.max(1, Math.floor(intervalMinutes));
    await requestNotificationPermission();
    const nextConfig = { endpoint: validEndpoint, intervalMinutes: safeInterval, enabled: true };
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(nextConfig));
    configRef.current = nextConfig;
    setConfig(nextConfig);
    try {
      await registerBackgroundMonitor(safeInterval);
    } catch {
      // Foreground monitoring remains useful if the OS background scheduler is unavailable.
    }
  }, [runScheduledCheck]);

  const disableMonitoring = useCallback(async () => {
    const nextConfig = { ...configRef.current, enabled: false };
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(nextConfig));
    configRef.current = nextConfig;
    setConfig(nextConfig);
    await unregisterBackgroundMonitor();
  }, []);

  const simulateAlert = useCallback(async (type: 'outage' | 'recovery') => {
    await requestNotificationPermission();
    if (type === 'outage') {
      await notify('Service health issue [Simulated]', 'database: down\nemail: down');
    } else {
      await notify('Service recovered [Simulated]', 'database, email are responding again.');
    }
  }, []);

  return (
    <MonitorContext.Provider value={{
      config,
      result,
      pushToken,
      isChecking,
      isReady,
      checkEndpointNow,
      enableMonitoring,
      disableMonitoring,
      refreshPushToken,
      simulateAlert,
      emailSchedule,
      scheduleEmail,
      stopEmailSchedule,
    }}>
      {children}
      <Modal
        visible={isReady && !emailSchedule && !startupEmailDismissed}
        transparent
        animationType="fade"
        onRequestClose={() => setStartupEmailDismissed(true)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(17, 24, 39, 0.55)' }}>
          <View style={{ backgroundColor: Colors.white, borderRadius: 20, padding: 22 }}>
            <Text style={{ color: Colors.text, fontSize: 21, fontWeight: '700', marginBottom: 8 }}>
              Set up email notifications
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
              Enter the address that should receive a scheduled email. We’ll save it on this device and send an email every 60 minutes.
            </Text>
            <TextInput
              value={startupEmail}
              onChangeText={setStartupEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!savingStartupEmail}
              style={{ backgroundColor: Colors.offWhite, borderColor: Colors.border, borderWidth: 1, borderRadius: 10, padding: 13, color: Colors.text, marginBottom: 10 }}
            />
            {startupEmailError ? (
              <Text style={{ color: Colors.error, fontSize: 13, marginBottom: 10 }}>{startupEmailError}</Text>
            ) : null}
            <TouchableOpacity
              onPress={saveStartupEmail}
              disabled={savingStartupEmail}
              style={{ backgroundColor: Colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', opacity: savingStartupEmail ? 0.65 : 1 }}
            >
              <Text style={{ color: Colors.white, fontSize: 15, fontWeight: '700' }}>
                {savingStartupEmail ? 'Saving…' : 'Save and start notifications'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStartupEmailDismissed(true)}
              disabled={savingStartupEmail}
              style={{ padding: 12, alignItems: 'center', marginTop: 4 }}
            >
              <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </MonitorContext.Provider>
  );
}

export function useEndpointMonitor() {
  const context = useContext(MonitorContext);
  if (!context) throw new Error('useEndpointMonitor must be used within EndpointMonitorProvider');
  return context;
}

export async function sendNotificationTest() {
  await requestNotificationPermission();
  await notify('Notifications are working', 'Cushy Access Nexus can send endpoint alerts to this device.');
}

export async function sendEmailTestRequest(recipient: string) {
  const response = await fetch(EMAIL_TEST_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: recipient.trim() }),
  });

  if (!response.ok) {
    throw new Error(`Email request failed (HTTP ${response.status}).`);
  }

  return response.json().catch(() => null);
}

async function readEmailSchedule(): Promise<EmailScheduleConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(EMAIL_SCHEDULE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<EmailScheduleConfig>;
    if (typeof value.recipient !== 'string' || !value.recipient.trim()) return null;
    return {
      recipient: value.recipient,
      intervalMinutes: Math.max(1, Number(value.intervalMinutes) || 15),
      enabled: value.enabled === true,
      lastRunAt: Number(value.lastRunAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

async function runEmailScheduleIfDue(): Promise<boolean> {
  const schedule = await readEmailSchedule();
  if (!schedule?.enabled || Date.now() - schedule.lastRunAt < schedule.intervalMinutes * 60_000) {
    return true;
  }

  // Record the attempt first so a failed request does not trigger repeated sends.
  const attempted = { ...schedule, lastRunAt: Date.now() };
  await AsyncStorage.setItem(EMAIL_SCHEDULE_KEY, JSON.stringify(attempted));
  try {
    await sendEmailTestRequest(schedule.recipient);
    await notify('Scheduled email sent', `The email test was sent to ${schedule.recipient}.`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The email request failed.';
    await notify('Scheduled email failed', `${schedule.recipient}: ${message}`);
    return false;
  }
}

if (!TaskManager.isTaskDefined(EMAIL_BACKGROUND_TASK_NAME)) {
  TaskManager.defineTask(EMAIL_BACKGROUND_TASK_NAME, async () => {
    try {
      const succeeded = await runEmailScheduleIfDue();
      return succeeded ? BackgroundTask.BackgroundTaskResult.Success : BackgroundTask.BackgroundTaskResult.Failed;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

async function registerEmailBackgroundTask(intervalMinutes: number) {
  if (Platform.OS === 'web') return;
  const taskStatus = await BackgroundTask.getStatusAsync();
  if (taskStatus !== BackgroundTask.BackgroundTaskStatus.Available) return;
  if (await TaskManager.isTaskRegisteredAsync(EMAIL_BACKGROUND_TASK_NAME)) {
    await BackgroundTask.unregisterTaskAsync(EMAIL_BACKGROUND_TASK_NAME);
  }
  await BackgroundTask.registerTaskAsync(EMAIL_BACKGROUND_TASK_NAME, {
    minimumInterval: Math.max(15, intervalMinutes),
  });
}

async function unregisterEmailBackgroundTask() {
  if (Platform.OS !== 'web' && await TaskManager.isTaskRegisteredAsync(EMAIL_BACKGROUND_TASK_NAME)) {
    await BackgroundTask.unregisterTaskAsync(EMAIL_BACKGROUND_TASK_NAME);
  }
}
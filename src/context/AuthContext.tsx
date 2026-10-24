import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE } from '../constants/theme';

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  accessToken: string;
};

type AuthContextType = {
  user: User | null;
  expoPushToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshExpoPushToken: () => Promise<string | null>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, mobile: string, callingCode: string, countryCode: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@cushy_nexus_user';
const EXPO_PUSH_TOKEN_KEY = '@cushy_nexus_expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type AuthApiResponse = {
  error?: boolean;
  message?: string;
  data?: {
    user?: {
      id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      userRole?: string;
    };
    access_token?: string;
  };
};

async function parseAuthResponse(response: Response): Promise<AuthApiResponse> {
  const payload = await response.json().catch(() => ({})) as AuthApiResponse;
  if (!response.ok || payload.error || !payload.data?.access_token || !payload.data.user) {
    throw new Error(payload.message || `Authentication failed (HTTP ${response.status}).`);
  }
  return payload;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setUser(JSON.parse(raw));
        }
        const savedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
        if (savedToken) setExpoPushToken(savedToken);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const registerPushToken = async (accessToken: string): Promise<string | null> => {
    if (Platform.OS === 'web') return null;

    const currentPermission = await Notifications.getPermissionsAsync();
    const permission = currentPermission.granted
      ? currentPermission
      : await Notifications.requestPermissionsAsync();
    if (!permission.granted) throw new Error('Notification permission was not granted.');

    const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('Cannot create an Expo push token because the EAS project ID is missing.');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo push token generated:', token);
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
    setExpoPushToken(token);

    console.log('Registering Expo push token with backend:', {
      url: `${API_BASE}/api/v1/fcm-token/create`,
      token,
      deviceName: `Cushy Access Nexus (${Platform.OS})`,
    });

    const response = await fetch(`${API_BASE}/api/v1/fcm-token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cushy-access-key': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token,
        deviceName: `Cushy Access Nexus (${Platform.OS})`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Device token registration failed (HTTP ${response.status}): ${error}`);
    }

    return token;
  };

  const refreshExpoPushToken = async () => {
    if (!user?.accessToken) throw new Error('Sign in before registering this device for push notifications.');
    return registerPushToken(user.accessToken);
  };

  useEffect(() => {
    if (isLoading || !user?.accessToken) return;
    void registerPushToken(user.accessToken).catch((error) => {
      console.warn('Could not register the device for push notifications:', error);
    });
  }, [isLoading, user?.accessToken]);

  const login = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      return { ok: false, error: 'Email and password are required' };
    }
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/mobile-app/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrMobile: email.trim().toLowerCase(), password }),
      });
      const payload = await parseAuthResponse(response);
      const profile = payload.data!.user!;
      const authenticatedUser: User = {
        id: profile.id || '',
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || email.split('@')[0],
        email: profile.email || email.trim().toLowerCase(),
        role: profile.userRole,
        accessToken: payload.data!.access_token!,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Sign in failed.' };
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    mobile: string,
    callingCode: string,
    countryCode: string,
  ) => {
    if (!name.trim() || !email.trim() || !password.trim() || !mobile.trim() || !callingCode.trim() || !countryCode.trim()) {
      return { ok: false, error: 'Name, email, phone, calling code, country code, and password are required.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters' };
    }
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/signup/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          callingCode: callingCode.trim(),
          countryCode: countryCode.trim().toUpperCase(),
          password,
        }),
      });
      const payload = await parseAuthResponse(response);
      const profile = payload.data!.user!;
      const authenticatedUser: User = {
        id: profile.id || '',
        name: `${profile.firstName || firstName} ${profile.lastName || lastName}`.trim(),
        email: profile.email || email.trim().toLowerCase(),
        role: profile.userRole,
        accessToken: payload.data!.access_token!,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Sign up failed.' };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        expoPushToken,
        isLoading,
        isAuthenticated: !!user,
        refreshExpoPushToken,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

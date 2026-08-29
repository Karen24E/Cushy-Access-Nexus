import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser, Role, Session } from '@/src/types/auth';

type AuthContextValue = { loading: boolean; session: Session | null; signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void>; can: (roles: Role[]) => boolean; };
const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'cushy_nexus_session';

const HARDCODED_EMAIL = 'admin@cushyaccess.com';
const HARDCODED_PASSWORD = '12345';

function generateMockToken(): string {
  return `mock_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Session;
          setSession(parsed);
        }
      } catch {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    session,
    signIn: async (email, password) => {
      if (email !== HARDCODED_EMAIL || password !== HARDCODED_PASSWORD) {
        throw new Error('Invalid credentials');
      }
      
      const user: AuthUser = {
        id: '1',
        email: HARDCODED_EMAIL,
        name: 'Admin User',
        role: 'super_admin',
        organization_id: 'org_1'
      };
      
      const next: Session = {
        token: generateMockToken(),
        user
      };
      
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
    },
    signOut: async () => {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      setSession(null);
    },
    can: (roles) => !!session && roles.includes(session.user.role)
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

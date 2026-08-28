import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser, Role, Session } from '@/src/types/auth';
import { login as apiLogin, fetchMe, setAuthToken } from '@/src/services/api';

type AuthContextValue = { loading: boolean; session: Session | null; signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void>; can: (roles: Role[]) => boolean; };
const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'cushy_nexus_session';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const raw = await SecureStore.getItemAsync(STORAGE_KEY); if (raw) { const parsed = JSON.parse(raw) as Session; const user = await fetchMe(parsed.token); const next = { ...parsed, user }; setAuthToken(next.token); setSession(next); } } catch { await SecureStore.deleteItemAsync(STORAGE_KEY); } finally { setLoading(false); } })(); }, []);
  const value = useMemo<AuthContextValue>(() => ({ loading, session, signIn: async (email, password) => { const next = await apiLogin(email, password); await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next)); setAuthToken(next.token); setSession(next); }, signOut: async () => { await SecureStore.deleteItemAsync(STORAGE_KEY); setAuthToken(null); setSession(null); }, can: (roles) => !!session && roles.includes(session.user.role) }), [loading, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be used inside AuthProvider'); return ctx; }

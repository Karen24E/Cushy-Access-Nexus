import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/src/auth/AuthProvider';
import { colors } from '@/src/theme/colors';

export default function RootIndex() {
  const { session, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}><ActivityIndicator color={colors.purple600} /></View>;
  return <Redirect href={session ? '/(tabs)' : '/login'} />;
}

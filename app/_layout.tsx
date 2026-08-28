import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/auth/AuthProvider';
import { colors } from '@/src/theme/colors';

export default function RootLayout() {
  return <AuthProvider><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} /></AuthProvider>;
}

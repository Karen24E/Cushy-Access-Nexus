import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Dashboard',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="email-test" 
          options={{ 
            title: 'Email Testing',
            headerStyle: { backgroundColor: '#3b82f6' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '600' }
          }} 
        />
      </Stack>
    </>
  );
}